let paused = false;
let muted = false;
const resumeSounds = new Set();
const sounds = new Set();
const listeners = new Set();
const muteListeners = new Set();

export const isAudioPaused = () => paused;
export const isGameAudioMuted = () => muted;

export function manageAudio(sound) {
  sounds.add(sound);
  sound.muted = muted;
  const play = sound.play.bind(sound);
  const pause = sound.pause.bind(sound);
  sound.play = () => {
    if (paused) return Promise.resolve();
    return play();
  };
  sound.pause = () => {
    resumeSounds.delete(sound);
    pause();
  };
  sound.addEventListener("play", () => {
    if (paused) { resumeSounds.add(sound); pause(); }
  });
  return sound;
}

export function onGameAudioMuteChange(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function setGameAudioMuted(value) {
  if (muted === value) return;
  muted = value;
  for (const sound of sounds) sound.muted = muted;
  muteListeners.forEach((listener) => listener(muted));
}

export function onAudioPauseChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setGameAudioPaused(value) {
  if (paused === value) return;
  paused = value;
  if (paused) {
    for (const sound of sounds) {
      if (!sound.paused && !sound.ended) {
        sound.pause();
        resumeSounds.add(sound);
      }
    }
  } else {
    for (const sound of resumeSounds) sound.play().catch(() => {});
    resumeSounds.clear();
  }
  listeners.forEach((listener) => listener(paused));
}
