import { connectSoundEffect, getAudioContext } from '../../audioContext.js';

function playTone(context, {
  type,
  frequency,
  endFrequency = frequency,
  startTime,
  duration,
  volume,
}) {
  const tone = context.createOscillator();
  const gain = context.createGain();
  tone.type = type;
  tone.frequency.setValueAtTime(frequency, startTime);
  tone.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  tone.connect(gain);
  connectSoundEffect(context, gain);
  tone.start(startTime);
  tone.stop(startTime + duration);
}

export function playPauseSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  playTone(context, {
    type: 'triangle',
    frequency: 300,
    endFrequency: 210,
    startTime: now,
    duration: 0.11,
    volume: 0.13,
  });
  playTone(context, {
    type: 'triangle',
    frequency: 240,
    endFrequency: 165,
    startTime: now + 0.08,
    duration: 0.13,
    volume: 0.11,
  });
}

export function playPlaySound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  playTone(context, {
    type: 'square',
    frequency: 440,
    endFrequency: 560,
    startTime: now,
    duration: 0.09,
    volume: 0.1,
  });
  playTone(context, {
    type: 'triangle',
    frequency: 660,
    endFrequency: 880,
    startTime: now + 0.07,
    duration: 0.14,
    volume: 0.13,
  });
}
