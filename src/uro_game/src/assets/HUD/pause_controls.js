import { createSoundButton } from "./sound_button.js";

export function createPauseControls({ onPause, onPlay, canPlay = () => true }) {
  let paused = false;
  const toolbar = document.createElement("div");
  toolbar.id = "game-playback-controls";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", "Game playback");
  const button = document.createElement("button");
  button.type = "button";
  const soundButton = createSoundButton();
  function render() {
    const label = paused ? "Resume game" : "Pause game";
    button.className = `playback-button ${paused ? "play" : "pause"}-button`;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = `<span aria-hidden="true" class="${paused ? "play" : "pause"}-symbol"></span>`;
  }
  button.addEventListener("click", () => {
    if (paused && !canPlay()) return;
    paused = !paused;
    setGameAudioPaused(paused);
    if (paused) onPause(); else onPlay();
    render(); button.blur();
  });
  toolbar.append(soundButton, button); document.body.append(toolbar); render();
  return { get paused() { return paused; } };
}
import { setGameAudioPaused } from "../sfx/sfx.js";

