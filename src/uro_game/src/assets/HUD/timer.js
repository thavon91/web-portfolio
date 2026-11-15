
const ART_WIDTH = 1868;
const ART_HEIGHT = 842;

export function createGameTimer(canvas) {
  const context = canvas.getContext("2d");
  const art = new Image();
  let elapsedMs = 0;
  let startedAt;
  let timerId;

  function render() {
    if (!art.complete) return;

    context.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    context.drawImage(art, 0, 0, ART_WIDTH, ART_HEIGHT);

    const elapsed = Math.floor((elapsedMs + (startedAt === undefined ? 0 : performance.now() - startedAt)) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = '900 250px Impact, "Arial Black", sans-serif';
    context.lineJoin = "round";
    context.lineWidth = 30;
    context.strokeStyle = "#3a2418";
    context.shadowColor = "rgba(0, 0, 0, 0.55)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 16;
    context.strokeText(label, 1210, 435);
    context.shadowColor = "transparent";
    context.fillStyle = "#fffaf0";
    context.fillText(label, 1210, 435);
    context.restore();

    canvas.setAttribute("aria-label", `Time played ${label}`);
  }

  function start() {
    if (startedAt !== undefined) return;
    startedAt = performance.now();
    timerId = window.setInterval(render, 250);
    render();
  }

  function stop() {
    if (startedAt === undefined) return;
    elapsedMs += performance.now() - startedAt;
    startedAt = undefined;
    window.clearInterval(timerId);
    timerId = undefined;
    render();
  }

  art.onload = () => { render(); };
  art.src = timerArtUrl;

  return { render, start, stop };
}
import timerArtUrl from "./Mossy_Timer_HUD.png?url";
