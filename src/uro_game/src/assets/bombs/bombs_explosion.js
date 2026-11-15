import * as THREE from "three";

export function getExplosionTiles(origin, range, collision, ditches) {
  const tiles = [origin.clone()];
  const length = Math.max(0, Math.floor(Number(range) || 0));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let step = 1; step <= length; step++) {
      const point = origin.clone().add(new THREE.Vector3(dx * step * 0.3, 0, dz * step * 0.3));
      const floor = collision.groundAt(point.x, point.z);
      const obstacle = collision.obstacleAt?.(point.x, point.z);
      if (obstacle) {
        if (obstacle.name.toLowerCase().includes("field_ditch") && ditches?.destroy(obstacle.name)) tiles.push(point);
        break;
      }
      if (floor === null || !collision.canOccupy(point.x, point.z, floor, 0.08, 0.3, true)) break;
      tiles.push(point);
    }
  }
  return tiles;
}

export function createBombExplosions({ scene, collision, ditches, getRange = () => 1, player, skeletonVfx, femaleVfx, onDamage = () => {}, onFireTile = () => {}, onBlastStart = () => undefined }) {
  const geometry = new THREE.SphereGeometry(0.145, 12, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffa51f });
  const fires = [];
  let immunity = 0;
  const playerPosition = new THREE.Vector3();
  function explode(origin, range = getRange(), isSkeleton = false) {
    const context = onBlastStart(isSkeleton);
    const tiles = getExplosionTiles(origin, range, collision, ditches);
    const visual = isSkeleton ? skeletonVfx : femaleVfx;
    // Never revive the legacy spheres when Quarks is loading or at capacity.
    // Visual availability must not affect the independent damage tiles.
    const customVisual = Boolean(visual);
    visual?.explode(origin, tiles);
    const root = new THREE.Group();
    root.name = "BombExplosion";
    const glow = material.clone();
    glow.transparent = true;
    glow.depthWrite = false;
    glow.toneMapped = false;
    const coreMaterial = glow.clone();
    coreMaterial.color.set(0xfff3a1);
    for (const [index, point] of (customVisual ? [] : tiles).entries()) {
      const flame = new THREE.Mesh(geometry, glow);
      flame.position.copy(point);
      const floor = collision.groundAt(point.x, point.z);
      if (floor !== null) flame.position.y = floor + 0.13;
      flame.userData.delay = Math.min(0.09, Math.hypot(point.x - origin.x, point.z - origin.z) * 0.025);
      flame.userData.phase = index * 1.7;
      flame.scale.set(0.25, 0.4, 0.25);
      const core = new THREE.Mesh(geometry, coreMaterial);
      core.scale.set(0.6, 0.8, 0.6);
      flame.add(core);
      root.add(flame);
    }
    scene.add(root);
    fires.push({ root, tiles, glow, coreMaterial, remaining: 0.6 });
    for (const tile of tiles) onFireTile(tile, context);
  }
  function update(delta) {
    skeletonVfx?.update(delta);
    femaleVfx?.update(delta);
    immunity = Math.max(0, immunity - delta);
    if (player?.root?.visible && !player.damageProtected && immunity === 0) {
      player.root.getWorldPosition(playerPosition);
      if (fires.some(({ tiles }) => tiles.some((tile) =>
        Math.abs(playerPosition.x - tile.x) < 0.2 && Math.abs(playerPosition.z - tile.z) < 0.2))) {
        immunity = 1;
        onDamage();
      }
    }
    for (let i = fires.length - 1; i >= 0; i--) {
      const fire = fires[i];
      fire.remaining -= delta;
      const age = 0.6 - fire.remaining;
      const fade = THREE.MathUtils.clamp(fire.remaining / 0.18, 0, 1);
      fire.glow.opacity = fade;
      fire.coreMaterial.opacity = fade;
      for (const flame of fire.root.children) {
        const growth = THREE.MathUtils.clamp((age - flame.userData.delay) / 0.08, 0.15, 1);
        const flicker = 1 + Math.sin(age * 55 + flame.userData.phase) * 0.1;
        flame.scale.setScalar(growth * fade * flicker);
        flame.scale.y *= 1.5;
      }
      if (fire.remaining <= 0) {
        fire.root.removeFromParent(); fire.glow.dispose(); fire.coreMaterial.dispose(); fires.splice(i, 1);
      }
    }
  }
  return {
    explode, update,
    hasFireAt(x, z, radius = 0.01) {
      return fires.some(({ tiles }) => tiles.some((tile) => Math.abs(tile.x - x) < radius && Math.abs(tile.z - z) < radius));
    },
    dispose() {
      skeletonVfx?.dispose();
      femaleVfx?.dispose();
      for (const fire of fires) { fire.root.removeFromParent(); fire.glow.dispose(); fire.coreMaterial.dispose(); }
      fires.length = 0;
      geometry.dispose(); material.dispose();
    },
  };
}
