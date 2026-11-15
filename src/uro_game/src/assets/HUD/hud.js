import hudArtUrl from "./Mossy_Stone_HUD_female_reference.png?url";

const ART_WIDTH = 1920;
const ART_HEIGHT = 819;

export function createGameHud(canvas, initial = { life: 5, fire: 5, bombs: 6 }) {
  const context = canvas.getContext("2d");
  const values = { ...initial };
  const art = new Image();
  let cleanArt;

  function drawNumber(value, x, y, size, color = "white") {
    const label = String(value);
    const gold = color === "gold";
    const blue = color === "blue";
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.font = `900 ${label.length > 2 ? size * 0.65 : label.length > 1 ? size * 0.82 : size}px Impact, "Arial Black", sans-serif`;
    context.lineJoin = "round";
    context.lineWidth = gold ? 19 : 16;
    context.strokeStyle = blue ? "#123f73" : "#563019";
    context.shadowColor = "#2f1a10";
    context.shadowBlur = 7;
    context.shadowOffsetY = 9;
    context.strokeText(label, x, y, 205);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    const fill = context.createLinearGradient(0, y - size, 0, y);
    fill.addColorStop(0, blue ? "#dff6ff" : gold ? "#fff6c6" : "#ffffff");
    fill.addColorStop(0.65, blue ? "#55b8ff" : gold ? "#ffd76a" : "#f9f6ed");
    fill.addColorStop(1, blue ? "#1769c2" : gold ? "#f5a917" : "#d7c8b8");
    context.fillStyle = fill;
    context.fillText(label, x, y, 205);
    context.restore();
  }

  function render() {
    if (!cleanArt || !context) return;
    context.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    context.drawImage(cleanArt, 0, 0);
    drawNumber(values.life, 1350, 490, 148, "gold");
    drawNumber(values.fire, 1007, 690, 124);
    drawNumber(values.bombs, 1465, 690, 124, "blue");
    canvas.setAttribute(
      "aria-label",
      `Life ${values.life}, fire ${values.fire}, bombs ${values.bombs}`,
    );
  }

  function setValues(next) {
    for (const key of ["life", "fire", "bombs"]) {
      if (next[key] !== undefined && Number.isFinite(Number(next[key]))) {
        values[key] = Math.max(0, Math.floor(Number(next[key])));
      }
    }
    render();
  }

  art.onload = () => {
    const base = document.createElement("canvas");
    base.width = ART_WIDTH;
    base.height = ART_HEIGHT;
    const baseContext = base.getContext("2d", { willReadFrequently: true });
    baseContext.drawImage(art, 0, 0, ART_WIDTH, ART_HEIGHT);

    // The source PNG has a black background. Make just that background
    // transparent while retaining the art's dark outlines and shadows.
    const pixels = baseContext.getImageData(0, 0, ART_WIDTH, ART_HEIGHT);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const brightness = Math.max(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
      if (brightness < 32) {
        pixels.data[i + 3] = Math.round((brightness / 32) * 255);
      }
    }
    baseContext.putImageData(pixels, 0, 0);
    cleanArt = base;
    render();
  };
  art.onerror = () => console.error("Could not load HUD artwork.");
  art.src = hudArtUrl;

  return { values, setValues, render };
}
