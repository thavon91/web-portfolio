import { createNoiseBuffer, getAudioContext } from '../audioContext.js';

let musicMaster = null;
let musicTimer = null;
let musicStep = 0;
let musicPaused = true;

const BPM = 92;
const STEPS_PER_BEAT = 4;
const MUSIC_STEP_SECONDS = 60 / BPM / STEPS_PER_BEAT;
const DEFAULT_MUSIC_VOLUME = 0.62;
const STEPS_PER_BAR = 16;
const PATTERN_LENGTH = STEPS_PER_BAR * 2;

const KICK_PATTERN = new Set([0, 6, 10, 16, 22, 24, 30]);
const SNARE_PATTERN = new Set([8, 24]);
const CLOSED_HAT_PATTERN = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
const OPEN_HAT_PATTERN = new Set([14, 30]);
const CHORD_PATTERN = new Set([0, 12, 16, 28]);

const BASS_SEQUENCE = [
  49.0, null, null, 49.0,
  null, null, 55.0, null,
  null, 58.27, null, null,
  49.0, null, 43.65, null,
  49.0, null, null, 49.0,
  null, 55.0, null, null,
  58.27, null, null, 55.0,
  null, 49.0, null, null,
];

const CHORDS = [
  [196.0, 233.08, 293.66],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
  [164.81, 196.0, 246.94],
];
const MUSIC_TYPES = [
  {
    bassPitch: 1,
    chordPitch: 1,
    closedHatStride: 1,
    useOpenHats: true,
    kickPattern: KICK_PATTERN,
    snarePattern: SNARE_PATTERN,
  },
  {
    bassPitch: 0.7,
    chordPitch: 0.82,
    closedHatStride: 4,
    useOpenHats: false,
    kickPattern: new Set([0, 8, 16, 24]),
    snarePattern: new Set([12, 28]),
  },
  {
    bassPitch: 1.45,
    chordPitch: 1.35,
    closedHatStride: 1,
    useOpenHats: true,
    kickPattern: new Set([0, 4, 8, 12, 16, 20, 24, 28]),
    snarePattern: new Set([4, 12, 20, 28]),
  },
];

let musicVolume = DEFAULT_MUSIC_VOLUME;
let musicType = 0;

function getMusicMaster(context) {
  if (!musicMaster) {
    musicMaster = context.createGain();
    musicMaster.gain.setValueAtTime(0.0001, context.currentTime);
    musicMaster.connect(context.destination);
  }

  return musicMaster;
}

function connectToMusicMaster(context, node) {
  node.connect(getMusicMaster(context));
}

function playKick(context, time) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(140, time);
  oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.11);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.9, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

  oscillator.connect(gain);
  connectToMusicMaster(context, gain);
  oscillator.start(time);
  oscillator.stop(time + 0.24);
}

function playSnare(context, time) {
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, 0.16);

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1850, time);
  filter.Q.setValueAtTime(0.9, time);

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, time);
  noiseGain.gain.linearRampToValueAtTime(0.36, time + 0.008);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

  const body = context.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(185, time);

  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0.18, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

  noise.connect(filter);
  filter.connect(noiseGain);
  connectToMusicMaster(context, noiseGain);
  body.connect(bodyGain);
  connectToMusicMaster(context, bodyGain);

  noise.start(time);
  noise.stop(time + 0.16);
  body.start(time);
  body.stop(time + 0.12);
}

function playHat(context, time, isOpen = false) {
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, isOpen ? 0.16 : 0.045);

  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isOpen ? 6200 : 7600, time);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(isOpen ? 0.16 : 0.09, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + (isOpen ? 0.15 : 0.04));

  noise.connect(filter);
  filter.connect(gain);
  connectToMusicMaster(context, gain);
  noise.start(time);
  noise.stop(time + (isOpen ? 0.18 : 0.055));
}

function playBass(context, time, frequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.985, time + 0.12);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, time);
  filter.Q.setValueAtTime(6, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.34, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

  oscillator.connect(filter);
  filter.connect(gain);
  connectToMusicMaster(context, gain);
  oscillator.start(time);
  oscillator.stop(time + 0.3);
}

function playChordStab(context, time, notes) {
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.Q.setValueAtTime(2.6, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.06 / (index + 1), time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

    oscillator.connect(filter);
    filter.connect(gain);
    connectToMusicMaster(context, gain);
    oscillator.start(time);
    oscillator.stop(time + 0.45);
  });
}

function playMusicStep() {
  if (musicPaused) return;

  const context = getAudioContext();
  if (!context) return;

  const step = musicStep % PATTERN_LENGTH;
  const now = context.currentTime;
  const style = MUSIC_TYPES[musicType];

  if (style.kickPattern.has(step)) playKick(context, now);
  if (style.snarePattern.has(step)) playSnare(context, now);
  if (style.useOpenHats && OPEN_HAT_PATTERN.has(step)) {
    playHat(context, now, true);
  } else if (CLOSED_HAT_PATTERN.has(step) && step % style.closedHatStride === 0) {
    playHat(context, now);
  }

  const bassFrequency = BASS_SEQUENCE[step];
  if (bassFrequency) playBass(context, now, bassFrequency * style.bassPitch);

  if (CHORD_PATTERN.has(step)) {
    playChordStab(
      context,
      now,
      CHORDS[Math.floor(step / 8) % CHORDS.length].map((note) => note * style.chordPitch)
    );
  }

  musicStep += 1;
}

export function startGameMusic() {
  const context = getAudioContext();
  if (!context) return;

  const master = getMusicMaster(context);
  const now = context.currentTime;
  musicPaused = false;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
  master.gain.linearRampToValueAtTime(musicVolume, now + 0.35);

  if (!musicTimer) {
    playMusicStep();
    musicTimer = window.setInterval(playMusicStep, MUSIC_STEP_SECONDS * 1000);
  }
}

export function setGameMusicPaused(isPaused) {
  if (!musicMaster) {
    musicPaused = Boolean(isPaused);
    return;
  }

  const context = getAudioContext();
  if (!context) {
    musicPaused = Boolean(isPaused);
    return;
  }

  musicPaused = Boolean(isPaused);
  const now = context.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value, 0.0001), now);
  musicMaster.gain.linearRampToValueAtTime(musicPaused ? 0.0001 : musicVolume, now + 0.25);
}

export function setGameMusicVolume(value) {
  const normalizedValue = Math.min(1, Math.max(0, Number(value) || 0));
  musicVolume = DEFAULT_MUSIC_VOLUME * normalizedValue;
  if (!musicMaster || musicPaused) return;

  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setTargetAtTime(musicVolume, now, 0.05);
}

export function setGameMusicType(value) {
  const nextType = Math.trunc(value) - 1;
  musicType = ((nextType % MUSIC_TYPES.length) + MUSIC_TYPES.length) % MUSIC_TYPES.length;
  musicStep = 0;
  if (!musicPaused) playMusicStep();
}
