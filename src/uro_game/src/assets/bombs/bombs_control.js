import * as THREE from "three";
import { createBombPickupVisuals } from "./bombs_pickup_visuals.js";

// Bomb props are embedded in the map GLB. Use the largest blue bomb as the
// source and clone it into open spaces once collision data is available.
export function createBombVisibilityController({ onCollect = () => {} } = {}) {
  let visible = true;
  let sourceBomb;
  let sourceParent;
  let mapModel;
  let fieldDitches = [];
  let bombDitches = [];
  let bombs = [];
  let embeddedBombs = [];
  let originalsVisible = false;
  let pickupGroundAt;
  const pickupPosition = new THREE.Vector3();
  const animations = new Map();
  function clearAnimations() {
    for (const animation of animations.values()) animation.dispose();
    animations.clear();
  }
  function applyVisibility() {
    for (const bomb of bombs) bomb.visible = !bomb.userData.collected && (visible || Boolean(bomb.userData.revealed));
    for (const ditch of bombDitches) ditch.visible = !ditch.userData.destroyed && !visible;
  }

  return {
    update(delta) {
      for (const [bomb, animation] of animations) {
        animation.update(delta);
        if (animation.finished) animations.delete(bomb);
      }
    },
    dispose: clearAnimations,
    get originalsVisible() { return originalsVisible; },
    get originalCount() { return embeddedBombs.length; },
    setOriginalsVisible(value) {
      originalsVisible = Boolean(value);
      for (const bomb of embeddedBombs) bomb.visible = originalsVisible;
    },
    hasBombInDitch(ditch) { return bombDitches.includes(ditch); },
    getRevealedBombs() {
      return bombs.filter((bomb) => bomb.userData.revealed && !bomb.userData.collected);
    },
    canWalkAt(x, z, radius = 0.02) {
      for (const bomb of bombs) {
        if (!bomb.userData.revealed || bomb.userData.collected) continue;
        bomb.getWorldPosition(pickupPosition);
        if (Math.hypot(x - pickupPosition.x, z - pickupPosition.z) < 0.1 + radius) return false;
      }
      return true;
    },
    detonatePickupsAt(tile, eligible) {
      const origins = [];
      for (const bomb of bombs) {
        if (!eligible?.has(bomb) || !bomb.userData.revealed || bomb.userData.collected) continue;
        bomb.getWorldPosition(pickupPosition);
        if (Math.abs(tile.x - pickupPosition.x) > 0.15 || Math.abs(tile.z - pickupPosition.z) > 0.15) continue;
        // Use the existing removal flag so collected/exploded rewards cannot
        // return via debug controls. Pickup explosions do not refund inventory.
        bomb.userData.collected = true;
        bomb.userData.exploded = true;
        origins.push(pickupPosition.clone());
        bomb.visible = false;
        bomb.removeFromParent();
        animations.get(bomb)?.dispose();
      }
      return origins;
    },
    collectAt(position, radius = 0.16) {
      let collected = 0;
      for (const bomb of bombs) {
        // Debug visibility alone never makes a hidden reward collectible.
        if (!bomb.userData.revealed || bomb.userData.collected) continue;
        bomb.getWorldPosition(pickupPosition);
        if (Math.hypot(position.x - pickupPosition.x, position.z - pickupPosition.z) > radius) continue;
        bomb.userData.collected = true;
        animations.get(bomb)?.collect();
        bomb.visible = false;
        bomb.removeFromParent();
        collected++;
        onCollect();
      }
      return collected;
    },
    revealInDitch(ditch) {
      const index = bombDitches.indexOf(ditch);
      let bomb = bombs[index];
      if (!bomb || bomb.userData.collected) return false;
      if (!animations.has(bomb)) {
        bomb.getWorldPosition(pickupPosition);
        const floor = pickupGroundAt?.(pickupPosition.x, pickupPosition.z) ?? null;
        const animation = createBombPickupVisuals(bomb, floor);
        bomb = animation.root;
        bombs[index] = bomb;
        animations.set(bomb, animation);
      }
      bomb.userData.revealed = true;
      bomb.visible = true;
      return true;
    },
    get visible() {
      return visible;
    },

    get count() {
      return bombs.filter((bomb) => !bomb.userData.collected).length;
    },

    getPosition(number) {
      const bomb = bombs[Math.max(0, Math.floor(number) - 1)];
      return bomb && !bomb.userData.collected ? bomb.position : null;
    },

    setPosition(number, nextPosition) {
      const bomb = bombs[Math.max(0, Math.floor(number) - 1)];
      if (!bomb || bomb.userData.collected) return false;
      if (Number.isFinite(nextPosition.x)) bomb.position.x = nextPosition.x;
      if (Number.isFinite(nextPosition.y)) bomb.position.y = nextPosition.y;
      if (Number.isFinite(nextPosition.z)) bomb.position.z = nextPosition.z;
      return true;
    },

    setMap(model) {
      clearAnimations();
      mapModel = model;
      embeddedBombs = [];
      fieldDitches = [];
      model.updateMatrixWorld(true);

      model.traverse((object) => {
        const originalName = object.userData.name ?? object.name;
        if (/^bomb_0(?:\.\d+)?$/i.test(originalName)) {
          embeddedBombs.push(object);
          object.visible = originalsVisible;
        }
        if (/^field_ditch(?:[._]\d+)?$/i.test(originalName)) {
          fieldDitches.push(object);
        }
      });

      sourceBomb = embeddedBombs.find((object) => {
        const originalName = object.userData.name ?? object.name;
        return /^bomb_0\.002$/i.test(originalName);
      });
      sourceParent = sourceBomb?.parent;
      bombs = [];
      bombDitches = [];
      return embeddedBombs.length;
    },

    scatter({ count = 9, canOccupy: canOccupyAt, groundAt: groundAtPosition }) {
      if (!sourceBomb || !sourceParent || !mapModel || !fieldDitches.length ||
        !canOccupyAt || !groundAtPosition) return 0;
      pickupGroundAt = groundAtPosition;

      clearAnimations();
      for (const bomb of bombs) bomb.removeFromParent();
      bombs = [];
      for (const ditch of bombDitches) ditch.visible = true;
      bombDitches = [];

      mapModel.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(mapModel);
      const center = bounds.getCenter(new THREE.Vector3());
      const candidates = fieldDitches
        .map((ditch) => {
          const box = new THREE.Box3().setFromObject(ditch);
          const point = box.getCenter(new THREE.Vector3());
          return {
            ditch,
            point,
            distance: Math.hypot(point.x - center.x, point.z - center.z),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      // Start near the field center, then repeatedly select the ditch that is
      // farthest from every previously selected one. This spreads the bombs
      // over the whole map without introducing random placement.
      const targets = candidates.length ? [candidates.shift()] : [];
      while (targets.length < count && candidates.length) {
        let bestIndex = 0;
        let bestSpacing = -1;
        for (let index = 0; index < candidates.length; index++) {
          const candidate = candidates[index];
          const spacing = Math.min(...targets.map((target) =>
            Math.hypot(
              candidate.point.x - target.point.x,
              candidate.point.z - target.point.z,
            )));
          if (spacing > bestSpacing) {
            bestSpacing = spacing;
            bestIndex = index;
          }
        }
        targets.push(candidates.splice(bestIndex, 1)[0]);
      }

      // Relocate the lower-right corner reward (negative X/Z in the
      // board view) without changing the other distributed rewards.
      if (targets.length > 1 && candidates.length) {
        let cornerIndex = 0;
        for (let index = 1; index < targets.length; index++) {
          if (targets[index].point.x + targets[index].point.z <
              targets[cornerIndex].point.x + targets[cornerIndex].point.z) cornerIndex = index;
        }
        const centralDitches = candidates.slice().sort((a, b) => a.distance - b.distance)
          .slice(0, Math.min(12, candidates.length));
        targets[cornerIndex] = centralDitches[Math.floor(Math.random() * centralDitches.length)];
      }

      for (const [index, target] of targets.entries()) {
        const bomb = sourceBomb.clone(true);
        bomb.name = `GameplayBomb_${index + 1}`;
        bomb.userData.revealed = false;
        bomb.userData.collected = false;
        bomb.position.copy(sourceParent.worldToLocal(target.point.clone()));
        bomb.position.y = 0.67;
        bomb.visible = visible;
        sourceParent.add(bomb);
        bombs.push(bomb);
        bombDitches.push(target.ditch);
      }

      applyVisibility();

      return bombs.length;
    },

    toggle() {
      visible = !visible;
      applyVisibility();
      return visible;
    },

    setVisible(nextVisible) {
      visible = Boolean(nextVisible);
      applyVisibility();
      return visible;
    },
  };
}
