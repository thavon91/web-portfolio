import { isGameAudioMuted, onGameAudioMuteChange, setGameAudioMuted } from "../sfx/audio_pause.js";

export function createSoundButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "playback-button sound-button";
  const render = (muted = isGameAudioMuted()) => {
    const label = muted ? "Unmute game sound" : "Mute game sound";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(muted));
    button.title = label;
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h6l7-6v20l-7-6H5z"/>${muted ? '<path d="m23 12 6 8m0-8-6 8"/>' : '<path d="M23 11a7 7 0 0 1 0 10M26 7a12 12 0 0 1 0 18"/>'}</svg>`;
  };
  button.addEventListener("click", () => { setGameAudioMuted(!isGameAudioMuted()); button.blur(); });
  const unsubscribe = onGameAudioMuteChange(render);
  button.dispose = () => { unsubscribe(); button.remove(); };
  render();
  return button;
}
