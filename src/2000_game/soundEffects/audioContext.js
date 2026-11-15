let audioContext = null;
let soundEffectsMaster = null;
let soundEffectsVolume = 1;

export function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

export function createNoiseBuffer(context, duration) {
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function getSoundEffectsMaster(context) {
  if (!soundEffectsMaster) {
    soundEffectsMaster = context.createGain();
    soundEffectsMaster.gain.setValueAtTime(soundEffectsVolume, context.currentTime);
    soundEffectsMaster.connect(context.destination);
  }

  return soundEffectsMaster;
}

export function connectSoundEffect(context, node) {
  node.connect(getSoundEffectsMaster(context));
}

export function setSoundEffectsVolume(value) {
  soundEffectsVolume = Math.min(1, Math.max(0, Number(value) || 0));
  if (!soundEffectsMaster || !audioContext) return;

  const now = audioContext.currentTime;
  soundEffectsMaster.gain.cancelScheduledValues(now);
  soundEffectsMaster.gain.setTargetAtTime(soundEffectsVolume, now, 0.025);
}
