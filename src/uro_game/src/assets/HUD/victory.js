export function hasVictory({ ready, skeletons, playerAlive }) {
  // Wait for the death clip itself, not the additional corpse display delay.
  return Boolean(ready && playerAlive && skeletons.length === 4 &&
    skeletons.every((skeleton) => skeleton.canAct === false && skeleton.deathAnimationFinished === true));
}

export function showVictoryScreen({ timeLabel = "", onReplay = replayGame } = {}) {
  showResultScreen({ won: true, timeLabel, onReplay });
}

export function showGameOverScreen({ timeLabel = "", onReplay = replayGame } = {}) {
  showResultScreen({ won: false, timeLabel, onReplay });
}

function showResultScreen({ won, timeLabel, onReplay }) {
  if (document.querySelector("#victory-screen, #game-over")) return;
  const id = won ? "victory" : "game-over";
  const overlay = document.createElement("div");
  overlay.id = won ? "victory-screen" : "game-over";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", `${id}-title`);
  const card = document.createElement("div"); card.className = `victory-card${won ? "" : " defeat-card"}`;
  const title = document.createElement("h1"); title.id = `${id}-title`; title.textContent = won ? "VICTORY!" : "GAME OVER";
  const description = document.createElement("p"); description.textContent = won ? "All skeletons defeated." : "Out of lives. Ready for another round?";
  const time = document.createElement("p"); time.className = "victory-time"; time.textContent = timeLabel;
  const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "Replay";
  replay.addEventListener("click", () => {
    if (replay.disabled) return;
    replay.disabled = true;
    replay.textContent = "Loading Realm…";
    replay.setAttribute("aria-busy", "true");
    // Paint feedback before navigation starts loading the fresh round.
    requestAnimationFrame(() => setTimeout(onReplay, 180));
  });
  card.append(title, description, time, replay); overlay.append(card); document.body.append(overlay);
  replay.focus();
}
import { replayGame } from "./replay.js";
