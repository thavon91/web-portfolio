import { connectSoundEffect, getAudioContext } from '../../audioContext.js';

const DIRECTION_SOUND_BY_NAME = {
  left: {
    type: 'square',
    startFrequency: 420,
    endFrequency: 250,
    duration: 0.075,
    pan: -0.45,
  },
  right: {
    type: 'square',
    startFrequency: 420,
    endFrequency: 700,
    duration: 0.075,
    pan: 0.45,
  },
  up: {
    type: 'triangle',
    startFrequency: 560,
    endFrequency: 980,
    duration: 0.09,
    pan: 0,
    volume: 0.50,
  },
  down: {
    type: 'triangle',
    startFrequency: 1320,
    endFrequency: 130,
    duration: 0.58,
    pan: 0,
  },
};

let activeDownHoldSound = null;
let lastDownHoldStartTime = -Infinity;
const DOWN_HOLD_RETRIGGER_DELAY = 0.18;

export function playDirectionButtonSound(direction) {
  const sound = DIRECTION_SOUND_BY_NAME[direction];
  if (!sound) return;

  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(sound.volume ?? 0.14, now);
  output.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

  const panner = typeof context.createStereoPanner === 'function'
    ? context.createStereoPanner()
    : null;
  if (panner) {
    panner.pan.setValueAtTime(sound.pan, now);
    output.connect(panner);
    connectSoundEffect(context, panner);
  } else {
    connectSoundEffect(context, output);
  }

  const tone = context.createOscillator();
  tone.type = sound.type;
  tone.frequency.setValueAtTime(sound.startFrequency, now);
  tone.frequency.exponentialRampToValueAtTime(sound.endFrequency, now + sound.duration);

  tone.connect(output);
  tone.start(now);
  tone.stop(now + sound.duration);
}

export function playDownPressSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.1, now);
  output.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  connectSoundEffect(context, output);

  const tone = context.createOscillator();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(520, now);
  tone.frequency.exponentialRampToValueAtTime(350, now + 0.06);
  tone.connect(output);
  tone.start(now);
  tone.stop(now + 0.07);
}

export function startDownHoldSound() {
  if (activeDownHoldSound) return;

  const context = getAudioContext();
  if (!context) return;

  const sound = DIRECTION_SOUND_BY_NAME.down;
  const now = context.currentTime;
  if (now - lastDownHoldStartTime < DOWN_HOLD_RETRIGGER_DELAY) return;
  lastDownHoldStartTime = now;
  const output = context.createGain();
  output.gain.setValueAtTime(0.001, now);
  output.gain.exponentialRampToValueAtTime(0.1, now + 0.025);
  output.gain.exponentialRampToValueAtTime(0.018, now + sound.duration);
  connectSoundEffect(context, output);

  const tone = context.createOscillator();
  tone.type = sound.type;
  tone.frequency.setValueAtTime(sound.startFrequency, now);
  tone.frequency.exponentialRampToValueAtTime(sound.endFrequency, now + sound.duration);
  tone.connect(output);
  tone.start(now);

  const activeSound = { context, output, tone, isStopping: false };
  tone.addEventListener('ended', () => {
    if (activeDownHoldSound === activeSound) activeDownHoldSound = null;
  });
  activeDownHoldSound = activeSound;
}

export function stopDownHoldSound() {
  if (!activeDownHoldSound) return;

  const { context, output, tone, isStopping } = activeDownHoldSound;
  if (isStopping) return;
  activeDownHoldSound.isStopping = true;
  const now = context.currentTime;
  output.gain.cancelScheduledValues(now);
  output.gain.setTargetAtTime(0.001, now, 0.025);
  tone.stop(now + 0.05);
}
