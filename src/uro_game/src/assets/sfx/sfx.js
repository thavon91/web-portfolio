import { privateAssetUrl } from "../../privateAssets.js";
import introMusicUrl from '../../public-audio/music-intro.mp3?url';
import startClickUrl from '../../public-audio/epic_stock_media-ui-button-heavy-button-press-metallic.mp3?url';






import { manageAudio, isAudioPaused, onAudioPauseChange, isGameAudioMuted, onGameAudioMuteChange } from "./audio_pause.js";
export { setGameAudioPaused, setGameAudioMuted, isGameAudioMuted, onGameAudioMuteChange } from "./audio_pause.js";

function createAudio(url) { return manageAudio(new Audio(url)); }

export function createGameOverSound(onEnded) {
  const sound = createAudio(privateAssetUrl("sfx/game-over.mp3"));
  sound.preload = "auto";
  sound.volume = 0.75;
  sound.load();
  sound.addEventListener("ended", onEnded);
  return () => {
    sound.currentTime = 0;
    sound.play().catch(() => onEnded());
  };
}

export function createVictorySound() {
  const sound = createAudio(privateAssetUrl("sfx/goodresult.mp3"));
  sound.preload = "auto";
  sound.volume = 0.4;
  sound.load();
  return () => {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

















export function createRespawnSound() {
  const context = new AudioContext({ latencyHint: "interactive" });
  const gain = context.createGain();
  gain.gain.value = 0.75;
  onGameAudioMuteChange((muted) => { gain.gain.value = muted ? 0 : 0.75; });
  gain.gain.value = isGameAudioMuted() ? 0 : 0.75;
  gain.connect(context.destination);
  let buffer;
  let offset = 0;
  let source;
  const unlock = () => {
    if (!isAudioPaused() && !document.hidden) context.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  onAudioPauseChange((paused) => {
    if (paused) context.suspend().catch(() => {});
    else unlock();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) context.suspend().catch(() => {});
    else unlock();
  });
  // Decode before a respawn and skip leading silence in the source clip.
  fetch(privateAssetUrl("sfx/character-game-respawn.mp3")).then((response) => {
    if (!response.ok) throw new Error(`Respawn sound: ${response.status}`);
    return response.arrayBuffer();
  }).then((data) => context.decodeAudioData(data)).then((decoded) => {
    buffer = decoded;
    let first = decoded.length;
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const samples = decoded.getChannelData(channel);
      for (let i = 0; i < first; i++) {
        if (Math.abs(samples[i]) > 0.015) { first = i; break; }
      }
    }
    offset = first === decoded.length ? 0 : Math.max(0, first / decoded.sampleRate - 0.005);
  }).catch((error) => console.warn("Respawn sound could not load:", error));
  return () => {
    if (!buffer || isAudioPaused() || document.hidden) return;
    unlock();
    source?.stop();
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(0, offset);
    const playingSource = source;
    const stop = () => {
      playingSource.stop();
      playingSource.disconnect();
      if (source === playingSource) source = null;
    };
    return { duration: buffer.duration - offset, stop };
  };
}

export function createDeathSounds(skeleton = false) {
  const makeSound = (url, volume = 0.75) => {
    const sound = createAudio(url);
    sound.preload = "auto";
    sound.volume = volume;
    sound.load();
    return () => { sound.currentTime = 0; sound.play().catch(() => {}); };
  };
  return {
    onDeath: makeSound(skeleton ? privateAssetUrl("sfx/skeletons-dying.mp3") : privateAssetUrl("sfx/character-die.mp3"), skeleton ? 0.75 : 0.4),
    onFall: makeSound(skeleton ? privateAssetUrl("sfx/skeletons-bone-snap.mp3") : privateAssetUrl("sfx/character-fall.mp3")),
  };
}

export function createPickupCollectionSound(type) {
  const sounds = Array.from({ length: 5 }, () => {
    const sound = createAudio(type === "fire" ? privateAssetUrl("sfx/achievement-fires.mp3") : privateAssetUrl("sfx/achievement-bombs.mp3"));
    sound.preload = "auto";
    sound.volume = 0.35;
    return sound;
  });
  let next = 0;
  return () => {
    const sound = sounds[next++ % sounds.length];
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

export function createPickupRevealSound() {
  const sounds = Array.from({ length: 6 }, () => {
    const sound = createAudio(privateAssetUrl("sfx/bombs-and-fires-pop-amp-swish.mp3"));
    sound.preload = "auto";
    sound.volume = 0.35;
    return sound;
  });
  let next = 0;
  return () => {
    const sound = sounds[next++ % sounds.length];
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

export function createBombExplosionSound(skeleton = false) {
  const sounds = Array.from({ length: 6 }, () => {
    const sound = createAudio(skeleton ? privateAssetUrl("sfx/skeletons_bomb-explosion-large.mp3") : privateAssetUrl("sfx/bomb-explosion-close.mp3"));
    sound.preload = "auto";
    sound.volume = 0.8;
    return sound;
  });
  let next = 0;
  return () => {
    const sound = sounds[next++ % sounds.length];
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

export function createBombCountdownSounds() {
  const sounds = new Set();
  let paused = false;
  function sync(sound) {
    if (paused || document.hidden) sound.pause();
    else if (sound.paused) sound.play().catch(() => {});
  }
  document.addEventListener("visibilitychange", () => sounds.forEach(sync));
  return {
    start(skeleton = false) {
      const sound = createAudio(skeleton ? privateAssetUrl("sfx/skeletons-bomb-timer-beeping.mp3") : privateAssetUrl("sfx/bomb-countdown-beeps.mp3"));
      sound.volume = skeleton ? 0.2 : 0.4;
      sound.loop = true;
      sounds.add(sound);
      sync(sound);
      return () => {
        sound.pause();
        sound.currentTime = 0;
        sounds.delete(sound);
      };
    },
    setPaused(value) {
      if (paused === value) return;
      paused = value;
      sounds.forEach(sync);
    },
  };
}

export function createBombPlacementSound() {
  const sounds = Array.from({ length: 5 }, () => {
    const sound = createAudio(privateAssetUrl("sfx/put_item.mp3"));
    sound.preload = "auto";
    sound.volume = 0.7;
    return sound;
  });
  let next = 0;
  return () => {
    const sound = sounds[next++ % sounds.length];
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

export function createFootstepSounds(character = false) {
  const sound = createAudio(character ? privateAssetUrl("sfx/character-running-on-the-floor.mp3") : privateAssetUrl("sfx/running-on-concrete.mp3"));
  sound.preload = "auto";
  sound.volume = 0.4;
  sound.loop = true;
  let moving = false;
  function stop() {
    if (moving) { sound.pause(); sound.currentTime = 0; }
    moving = false;
  }
  window.addEventListener("blur", stop);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  return {
    update(distance, enabled, loudness = 1) {
      sound.volume = 0.4 * Math.max(0, Math.min(1, loudness));
      if (!enabled || document.hidden || distance < 0.00001) { stop(); return; }
      if (!moving) {
        sound.play().catch(() => {});
      }
      moving = true;
    },
  };
}

export function createStartClickSound() {
  let sound;
  return () => {
    // UI feedback must finish even when the click pauses or leaves the game.
    if (!sound) {
      sound = new Audio(startClickUrl);
      sound.preload = "auto";
      sound.volume = 0.7;
      sound.load();
    }
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };
}

export function installButtonSounds() {
  const playClick = createStartClickSound();
  function onClick(event) {
    const control = event.target.closest?.("button, [role='button'], a[href], input[type='checkbox'], input[type='radio']");
    if (!control || control.disabled || control.getAttribute("aria-disabled") === "true" || control.closest(".disabled")) return;
    if (isGameAudioMuted() && !control.classList.contains("sound-button")) return;
    playClick();
    // Let the click be heard before a same-tab link unloads the page.
    if (control.matches('a[href]') && !event.defaultPrevented &&
        !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
        !control.hasAttribute('download') && (!control.target || control.target === '_self')) {
      event.preventDefault();
      window.setTimeout(() => window.location.assign(control.href), 120);
    }
  }
  // Capture before button handlers remove the menu or disable Replay.
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}

function prepareContinuousLoop(context, audio, { fadeSeconds = 0.12, quietLevel = 0.06 } = {}) {
  const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
  const windowSize = Math.max(1, Math.floor(audio.sampleRate * 0.01));
  const levels = [];
  for (let offset = 0; offset < audio.length; offset += windowSize) {
    let sum = 0;
    let count = 0;
    for (const channel of channels) {
      for (let i = offset; i < Math.min(offset + windowSize, audio.length); i++) {
        sum += channel[i] * channel[i];
        count++;
      }
    }
    levels.push(Math.sqrt(sum / count));
  }
  const threshold = Math.max(0.008, Math.max(...levels) * quietLevel);
  const first = levels.findIndex((level) => level >= threshold);
  if (first < 0) return audio;
  let last = levels.length - 1;
  while (last > first && levels[last] < threshold) last--;
  const start = first * windowSize;
  const end = Math.min(audio.length, (last + 1) * windowSize);
  if (end - start < audio.sampleRate * 0.5) return audio;
  const overlap = Math.min(Math.floor(audio.sampleRate * fadeSeconds), Math.floor((end - start) / 4));
  const length = end - start - overlap;
  const loop = context.createBuffer(audio.numberOfChannels, length, audio.sampleRate);
  for (let channel = 0; channel < channels.length; channel++) {
    const input = channels[channel];
    const output = loop.getChannelData(channel);
    output.set(input.subarray(start + overlap, end));
    for (let i = 0; i < overlap; i++) {
      const mix = i / (overlap - 1);
      const index = length - overlap + i;
      output[index] = output[index] * Math.cos(mix * Math.PI / 2)
        + input[start + i] * Math.sin(mix * Math.PI / 2);
    }
  }
  return loop;
}

export function createMenuMusic({ home = false, gameOver = false, victory = false, autoplay = true } = {}) {
  const context = new AudioContext();
  const volume = context.createGain();
  volume.gain.value = victory ? 0.6 : 0.35;
  const musicVolume = volume.gain.value;
  volume.gain.value = isGameAudioMuted() ? 0 : musicVolume;
  const unsubscribeMute = onGameAudioMuteChange((muted) => { volume.gain.value = muted ? 0 : musicVolume; });
  volume.connect(context.destination);
  const download = new AbortController();
  let buffer = null;
  let source = null;
  let stopped = false;
  let enabled = autoplay;

  function play() {
    if (!enabled || stopped || document.hidden || isAudioPaused()) return;
    // Resume on a user gesture if the browser blocks autoplay.
    context.resume().catch(() => {});
    if (!buffer || source) return;
    source = context.createBufferSource();
    source.buffer = buffer;
    // Loop the decoded audio without restarting an HTML audio element.
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(volume);
    source.start();
  }
  function onVisibilityChange() {
    if (document.hidden) context.suspend().catch(() => {});
    else play();
  }
  const unsubscribePause = onAudioPauseChange((paused) => {
    if (stopped) return;
    if (paused) context.suspend().catch(() => {});
    else play();
  });

  window.addEventListener("pointerdown", play);
  window.addEventListener("keydown", play);
  document.addEventListener("visibilitychange", onVisibilityChange);
  fetch(victory ? privateAssetUrl("sfx/victory-cool-hip-hop-loop.mp3") : gameOver ? privateAssetUrl("sfx/game-music-loop.mp3") : home ? introMusicUrl : privateAssetUrl("sfx/darren_hirst-gamer-music-140-bpm.mp3"), { signal: download.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`Menu music: ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => stopped ? null : context.decodeAudioData(data))
    .then((decoded) => {
      if (stopped || !decoded) return;
      buffer = home
        ? prepareContinuousLoop(context, decoded, { fadeSeconds: 0.2, quietLevel: 0.12 })
        : gameOver || victory ? prepareContinuousLoop(context, decoded) : decoded;
      play();
    })
    .catch((error) => {
      if (!stopped) console.warn("Menu music could not load:", error);
    });

  return {
    start() { enabled = true; play(); },
    stop() {
      if (stopped) return;
      stopped = true;
      unsubscribePause();
      unsubscribeMute();
      download.abort();
      source?.stop();
      source?.disconnect();
      volume.disconnect();
      context.close().catch(() => {});
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}

let introMusic = null;

export function startIntroMusic() {
  if (!introMusic) introMusic = createMenuMusic({ home: true });
  return introMusic;
}

export function stopIntroMusic() {
  introMusic?.stop();
  introMusic = null;
}
