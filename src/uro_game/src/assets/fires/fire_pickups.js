import * as THREE from "three";
import { createFireAsset } from "./fire_asset.js";

export const MAX_FIRE_RANGE = 22; // Longest distance across the 23-column map.
export const upgradeFireRange = (range) => Math.min(MAX_FIRE_RANGE, Math.max(1, Math.floor(Number(range) || 1)) + 1);

export function createFirePickups({ scene, collision, bombs, random = Math.random, onCollect = () => {} }) {
  const asset = createFireAsset();
  const entries = new Map();
  let elapsed = 0;
  let debugVisible = null;
  function applyVisibility() {
    for (const [ditch, entry] of entries) {
      entry.mesh.visible = !entry.removed && (debugVisible ?? entry.revealed);
      if (debugVisible === true && !entry.removed && !ditch.userData.destroyed) {
        if (entry.ditchWasVisible === undefined) entry.ditchWasVisible = ditch.visible;
        ditch.visible = false;
      } else if (entry.ditchWasVisible !== undefined) {
        ditch.visible = !ditch.userData.destroyed && entry.ditchWasVisible;
        delete entry.ditchWasVisible;
      }
    }
  }
  function scatter(model, count = 12) {
    for (const entry of entries.values()) entry.mesh.removeFromParent();
    entries.clear();
    model.updateMatrixWorld(true);
    const candidates = [];
    model.traverse((object) => {
      if (/^field_ditch(?:[._]\d+)?$/i.test(object.userData.name ?? object.name) &&
          !object.userData.destroyed && !bombs.hasBombInDitch(object)) candidates.push(object);
    });
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const ditch of candidates.slice(0, count)) {
      const center = new THREE.Box3().setFromObject(ditch).getCenter(new THREE.Vector3());
      const floor = collision.groundAt(center.x, center.z);
      if (floor === null) continue;
      const mesh = asset.root.clone(true);
      mesh.position.set(center.x, floor + 0.015, center.z);
      mesh.visible = false;
      scene.add(mesh);
      entries.set(ditch, { mesh, revealed: false, removed: false, baseY: mesh.position.y });
    }
    applyVisibility();
    return entries.size;
  }
  function revealInDitch(ditch) {
    const entry = entries.get(ditch);
    if (!entry || entry.removed) return false;
    entry.revealed = true;
    applyVisibility();
    return true;
  }
  function remove(entry) { entry.removed = true; entry.mesh.removeFromParent(); }
  function collectAt(position, radius = 0.16) {
    let count = 0;
    for (const entry of entries.values()) {
      if (!entry.revealed || entry.removed) continue;
      if (Math.hypot(position.x - entry.mesh.position.x, position.z - entry.mesh.position.z) <= radius) {
        remove(entry); count++;
        onCollect();
      }
    }
    return count;
  }
  return {
    get visible() { return debugVisible === true; },
    get count() { return [...entries.values()].filter((entry) => !entry.removed).length; },
    setVisible(value) { debugVisible = Boolean(value); applyVisibility(); },
    toggle() { debugVisible = debugVisible !== true; applyVisibility(); return debugVisible; },
    scatter, revealInDitch, collectAt,
    getRevealed: () => new Set([...entries.values()].filter((entry) => entry.revealed && !entry.removed)),
    destroyAt(tile, eligible) {
      for (const entry of eligible) {
        if (!entry.removed && Math.abs(tile.x - entry.mesh.position.x) <= 0.15 && Math.abs(tile.z - entry.mesh.position.z) <= 0.15) remove(entry);
      }
    },
    update(delta) {
      elapsed += delta;
      for (const entry of entries.values()) {
        if (!entry.mesh.visible || entry.removed) continue;
        entry.mesh.rotation.y += delta;
        const flame = entry.mesh.getObjectByName("FlameVisual");
        if (flame) flame.scale.set(1 + Math.sin(elapsed * 5) * 0.025, 1 + Math.sin(elapsed * 7) * 0.04, 1);
        entry.mesh.position.y = entry.baseY + (Math.sin(elapsed * 3) + 1) * 0.015;
      }
    },
    dispose() { for (const entry of entries.values()) entry.mesh.removeFromParent(); entries.clear(); asset.dispose(); },
  };
}
