import * as THREE from "three";
import { createBombExplosions } from "./bombs_explosion.js";
import { createBombVisuals } from "./bombs_visuals.js";

// Player bombs are independent of the seven static map/debug bombs.
export function createBombAnimations({ scene, boxes, player, collision, ditches, pickups, firePickups, skeletonVfx, femaleVfx, startCountdown = () => {}, onPlace = () => {}, onExplode = () => {}, onCountChange = () => {}, getFireRange = () => 1, onDamage = () => {} }) {
  let source;
  const active = new Map();
  const pending = new Set();
  const pendingPickups = [];
  const explosions = createBombExplosions({
    scene, collision, ditches, player, getRange: getFireRange, onDamage, skeletonVfx, femaleVfx,
    // A reward revealed by this blast survives it, giving time to collect.
    onBlastStart: (isSkeleton) => {
      onExplode(isSkeleton);
      return { bombs: new Set(pickups?.getRevealedBombs() ?? []), fires: firePickups?.getRevealed() ?? new Set() };
    },
    onFireTile(tile, eligiblePickups) {
      firePickups?.destroyAt(tile, eligiblePickups.fires);
      pendingPickups.push(...(pickups?.detonatePickupsAt(tile, eligiblePickups.bombs) ?? []));
      for (const [key, { bomb }] of active) {
        if (Math.abs(bomb.position.x - tile.x) < 0.01 && Math.abs(bomb.position.z - tile.z) < 0.01) pending.add(key);
      }
    },
  });
  function detonatePending() {
    // Iterative queue avoids recursion, cycles, and double inventory refunds.
    while (pending.size || pendingPickups.length) {
      if (!pending.size) {
        explosions.explode(pendingPickups.shift());
        continue;
      }
      const key = pending.values().next().value;
      pending.delete(key);
      const entry = active.get(key);
      if (!entry) continue;
      active.delete(key);
      entry.stopCountdown?.();
      entry.bomb.removeFromParent();
      entry.visuals.dispose();
      entry.owner.restoreBomb();
      onCountChange(player.availableBombs);
      explosions.explode(entry.bomb.position, entry.owner === player ? getFireRange() : entry.range, entry.owner !== player);
    }
  }
  function setMap(model) {
    model.traverse((object) => {
      if ((object.userData.name ?? object.name).toLowerCase() === "bomb_0.002") source = object;
    });
  }
  function placeAt(position, owner = player, range = 1) {
    if (!source || !collision.loaded || owner.canAct === false || owner.availableBombs <= 0) return false;
    // Use the player's current grid cell, including empty cells missing
    // from the hand-marked debug layout. Never select a distant box.
    const tile = boxes.getTileAt ? boxes.getTileAt(position) : boxes.getPositions().find((box) =>
      Math.abs(position.x - box.x) <= 0.15 && Math.abs(position.z - box.z) <= 0.15);
    if (!tile) return false;
    const key = `${tile.row},${tile.column}`;
    if (active.has(key)) return false;
    const y = collision.groundAt(tile.x, tile.z);
    if (y === null || !collision.canOccupy(tile.x, tile.z, y, 0.08, 0.3, true)) return false;
    const bomb = source.clone(true);
    source.updateWorldMatrix(true, false);
    source.matrixWorld.decompose(bomb.position, bomb.quaternion, bomb.scale);
    bomb.position.set(tile.x, tile.y, tile.z);
    bomb.visible = true;
    bomb.name = `${owner.root?.name ?? "Female"}Bomb_${key}`;
    if (!owner.consumeBomb()) return false;
    scene.add(bomb);
    bomb.updateWorldMatrix(true, true);
    // The GLB origin isn't at the base: align the actual mesh bottom
    // with the sampled floor instead of relying on a fixed origin height.
    const bounds = new THREE.Box3().setFromObject(bomb, true);
    if (!bounds.isEmpty()) bomb.position.y += y + 0.005 - bounds.min.y;
    const visuals = createBombVisuals(bomb, y);
    scene.add(visuals.root);
    const stopCountdown = startCountdown(owner !== player);
    active.set(key, { bomb: visuals.root, visuals, remaining: 3, exitAllowed: true, owner, range, stopCountdown });
    onPlace();
    onCountChange(player.availableBombs);
    if (explosions.hasFireAt(tile.x, tile.z)) {
      pending.add(key);
      detonatePending();
    }
    return true;
  }
  function overlapsBomb(x, z, radius, bomb) {
    const dx = x - THREE.MathUtils.clamp(x, bomb.position.x - 0.14, bomb.position.x + 0.14);
    const dz = z - THREE.MathUtils.clamp(z, bomb.position.z - 0.14, bomb.position.z + 0.14);
    return dx * dx + dz * dz < radius * radius;
  }
  function canWalkAt(x, z, radius, currentPosition, owner = player) {
    for (const entry of active.values()) {
      // Check the committed player position, never a speculative step:
      // collision checks may run several times before movement is applied.
      if (entry.owner === owner && entry.exitAllowed && currentPosition &&
          !overlapsBomb(currentPosition.x, currentPosition.z, radius, entry.bomb)) {
        entry.exitAllowed = false;
      }
      if (overlapsBomb(x, z, radius, entry.bomb)) {
        if (!(entry.owner === owner && entry.exitAllowed)) return false;
        // Allow any escape direction while the placer still overlaps. Grid
        // snapping may require stepping toward the center to get around a wall.
      }
    }
    return true;
  }
  function update(delta) {
    for (const [key, entry] of active) {
      entry.remaining -= delta;
      entry.visuals.update(delta, entry.remaining);
      if (entry.remaining <= 0) pending.add(key);
    }
    detonatePending();
    explosions.update(delta);
  }
  return {
    setMap, placeAt, update, canWalkAt,
    isFireAt: (x, z) => explosions.hasFireAt(x, z, 0.2),
    predictBlast(origin, range) {
      const tiles = [{ x: origin.x, z: origin.z }];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let i = 1; i <= range; i++) {
          const x = origin.x + dx * i * 0.3, z = origin.z + dz * i * 0.3;
          const y = collision.groundAt(x, z);
          const obstacle = collision.obstacleAt?.(x, z);
          if (obstacle) {
            if (obstacle.name.toLowerCase().includes("field_ditch")) tiles.push({ x, z });
            break;
          }
          if (y === null || !collision.canOccupy(x, z, y, 0.08, 0.3, true)) break;
          tiles.push({ x, z });
        }
      }
      return tiles;
    },
    getBombs: () => [...active.values()].map((entry) => ({ position: entry.bomb.position.clone(), remaining: entry.remaining,
      range: entry.owner === player ? getFireRange() : entry.range })),
    canRespawnAt(x, z, radius = 0.08) {
      return !explosions.hasFireAt(x, z, 0.2) && ![...active.values()].some(({ bomb }) => overlapsBomb(x, z, radius, bomb));
    },
    get count() { return active.size; },
    dispose() {
      for (const { visuals, owner, stopCountdown } of active.values()) { stopCountdown?.(); visuals.dispose(); owner.restoreBomb(); }
      active.clear();
      pending.clear();
      pendingPickups.length = 0;
      explosions.dispose();
      onCountChange(player.availableBombs);
    },
  };
}
