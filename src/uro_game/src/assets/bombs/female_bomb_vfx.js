import { CanvasTexture, SRGBColorSpace } from "three";
import { createSkeletonBombVfx } from "./skeleton_bomb_vfx.js";

// Same procedural five-petal Jampa texture as the reference demo.
function createJampaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  context.translate(128, 128);
  context.shadowColor = "rgba(255, 24, 48, 0.9)";
  context.shadowBlur = 18;
  for (let i = 0; i < 5; i++) {
    context.save(); context.rotate(i * Math.PI * 2 / 5);
    const petal = context.createRadialGradient(0, -48, 8, 0, -48, 62);
    petal.addColorStop(0, "#fff5e8"); petal.addColorStop(0.42, "#ff4960"); petal.addColorStop(1, "#d90028");
    context.fillStyle = petal;
    context.beginPath(); context.ellipse(0, -48, 31, 61, 0, 0, Math.PI * 2); context.fill();
    context.restore();
  }
  context.shadowBlur = 8;
  const center = context.createRadialGradient(0, 0, 2, 0, 0, 31);
  center.addColorStop(0, "#fff7a8"); center.addColorStop(0.45, "#ff9f1c"); center.addColorStop(1, "#ef2512");
  context.fillStyle = center;
  context.beginPath(); context.arc(0, 0, 29, 0, Math.PI * 2); context.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createFemaleBombVfx({ scene, collision }) {
  const texture = createJampaTexture();
  const effect = createSkeletonBombVfx({ scene, collision, flowerTexture: texture });
  return { ...effect, dispose() { effect.dispose(); texture.dispose(); } };
}
