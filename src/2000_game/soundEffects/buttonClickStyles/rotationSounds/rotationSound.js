import { connectSoundEffect, getAudioContext } from '../../audioContext.js';

const ROTATION_VOLUME = 0.18;

export function playRotationSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(ROTATION_VOLUME, now);
  output.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  connectSoundEffect(context, output);

  const firstTone = context.createOscillator();
  firstTone.type = 'square';
  firstTone.frequency.setValueAtTime(440, now);
  firstTone.frequency.exponentialRampToValueAtTime(660, now + 0.055);

  const secondTone = context.createOscillator();
  secondTone.type = 'triangle';
  secondTone.frequency.setValueAtTime(660, now + 0.055);
  secondTone.frequency.exponentialRampToValueAtTime(960, now + 0.13);

  const bassTone = context.createOscillator();
  bassTone.type = 'sine';
  bassTone.frequency.setValueAtTime(185, now);
  bassTone.frequency.exponentialRampToValueAtTime(95, now + 0.13);

  const firstGain = context.createGain();
  firstGain.gain.setValueAtTime(0.5, now);
  firstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  const secondGain = context.createGain();
  secondGain.gain.setValueAtTime(0.001, now + 0.045);
  secondGain.gain.exponentialRampToValueAtTime(0.48, now + 0.065);
  secondGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  const bassGain = context.createGain();
  bassGain.gain.setValueAtTime(0.42, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  firstTone.connect(firstGain);
  firstGain.connect(output);
  secondTone.connect(secondGain);
  secondGain.connect(output);
  bassTone.connect(bassGain);
  bassGain.connect(output);

  firstTone.start(now);
  firstTone.stop(now + 0.07);
  secondTone.start(now + 0.045);
  secondTone.stop(now + 0.15);
  bassTone.start(now);
  bassTone.stop(now + 0.15);
}
