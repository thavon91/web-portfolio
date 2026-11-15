import * as THREE from "three";

// Stable logical anchor. No idle glow sphere or rotation around GLB pivots.
export function createBombPickupVisuals(model, floorY = null) {
  const root = new THREE.Group();
  root.name = model.name;
  root.userData = { ...model.userData };
  root.position.copy(model.position);
  const parent = model.parent;
  const visual = new THREE.Group();
  model.position.set(0, 0, 0);
  // The hidden reward clone was invisible before its ditch was destroyed.
  // Showing its new wrapper alone does not show this child mesh.
  model.visible = true;
  visual.add(model);
  root.add(visual);
  parent?.add(root);
  const geometry = new THREE.SphereGeometry(1, 8, 6);
  const material = new THREE.MeshBasicMaterial({ color: 0x55bfff, transparent: true,
    opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  // GLB meshes can have baked-in geometry offsets, so their origin is not
  // necessarily the center. Rotate around the actual model center instead.
  root.updateWorldMatrix(true, true);
  const worldBounds = new THREE.Box3().setFromObject(model);
  const bounds = worldBounds.clone()
    .applyMatrix4(visual.matrixWorld.clone().invert());
  const center = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  if (Number.isFinite(floorY) && !worldBounds.isEmpty()) {
    // Move the visual only: fixed Y origins in the imported GLB can put the
    // mesh base below the terrain. Convert a world-up correction to local space.
    const worldOrigin = root.getWorldPosition(new THREE.Vector3());
    const lifted = worldOrigin.clone();
    lifted.y += floorY + 0.008 - worldBounds.min.y;
    const offset = root.worldToLocal(lifted).sub(root.worldToLocal(worldOrigin));
    center.add(offset);
  }
  visual.position.copy(center);
  let elapsed = 0, collecting = false, effect = null, finished = false;
  const sparkles = [];
  function dispose() {
    if (finished) return;
    finished = true;
    effect?.removeFromParent(); root.removeFromParent();
    geometry.dispose(); material.dispose();
  }
  function collect() {
    if (collecting || finished) return;
    collecting = true; elapsed = 0;
    effect = new THREE.Group();
    effect.position.copy(root.position);
    effect.quaternion.copy(root.quaternion);
    effect.scale.copy(root.scale);
    root.parent?.add(effect);
    effect.add(visual);
    root.removeFromParent();
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(geometry, material);
      spark.scale.setScalar(0.009);
      effect.add(spark); sparkles.push(spark);
    }
  }
  function update(delta) {
    if (finished) return;
    elapsed += delta;
    if (collecting) {
      const progress = Math.min(1, elapsed / 0.3);
      visual.scale.setScalar(1 - progress);
      visual.position.y = center.y + progress * 0.07;
      material.opacity = (1 - progress) * 0.65;
      sparkles.forEach((spark, i) => {
        const angle = i * Math.PI / 4;
        spark.position.copy(center).add(new THREE.Vector3(Math.cos(angle) * progress * 0.13,
          progress * 0.1, Math.sin(angle) * progress * 0.13));
      });
      if (progress === 1) dispose();
    } else {
      // Small reveal hop, then bob only. Preserve the original orientation.
      const hop = elapsed < 0.35 ? Math.sin(elapsed / 0.35 * Math.PI) * 0.025 : 0;
      visual.position.y = center.y + hop + (1 + Math.sin(elapsed * 2.5)) * 0.006;
    }
  }
  return { root, collect, update, dispose, get finished() { return finished; } };
}
