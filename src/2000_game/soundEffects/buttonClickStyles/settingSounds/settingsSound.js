import { connectSoundEffect, getAudioContext } from '../../audioContext.js';

export function playSettingsButtonSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.1, now);
  output.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
  connectSoundEffect(context, output);

  const tone = context.createOscillator();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(430, now);
  tone.frequency.exponentialRampToValueAtTime(610, now + 0.06);
  tone.connect(output);
  tone.start(now);
  tone.stop(now + 0.08);
}
