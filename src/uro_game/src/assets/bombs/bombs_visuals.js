import * as THREE from "three";

// Only the visual child moves. The root remains the gameplay/collision anchor.
export function createBombVisuals(model, floorY) {
  model.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(model, true);
  // Find the fuse cap from the highest mesh vertices; imported geometry can
  // be offset from the object origin and the rope is not centered on the body.
  const fuseTip = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  let tipCount = 0;
  const tolerance = bounds.isEmpty() ? 0 : Math.max(0.00001, (bounds.max.y - bounds.min.y) * 0.015);
  model.traverse((object) => {
    const positions = object.isMesh && object.geometry.getAttribute("position");
    if (!positions) return;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
      if (vertex.y >= bounds.max.y - tolerance) { fuseTip.add(vertex); tipCount++; }
    }
  });
  if (tipCount) fuseTip.divideScalar(tipCount);
  else fuseTip.copy(model.position).add(new THREE.Vector3(0, 0.25, 0));
  const root = new THREE.Group();
  root.name = model.name;
  root.position.copy(model.position);
  const pivot = new THREE.Group();
  pivot.position.y = floorY + 0.005 - root.position.y;
  root.add(pivot);
  model.position.set(0, -pivot.position.y, 0);
  pivot.add(model);
  root.updateWorldMatrix(true, true);
  pivot.worldToLocal(fuseTip);
  const materials = [];
  model.traverse((object) => {
    if (!object.isMesh) return;
    const clone = (material) => {
      const copy = material.clone();
      materials.push({ material: copy, emissive: copy.emissive?.clone(), intensity: copy.emissiveIntensity });
      return copy;
    };
    object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
  });
  const geometry = new THREE.SphereGeometry(1, 6, 4);
  const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xffd65b, toneMapped: false });
  const spark = new THREE.Mesh(geometry, sparkMaterial);
  spark.position.copy(fuseTip);
  spark.name = "BombFuseSpark";
  pivot.add(spark);
  const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0x909090, transparent: true, opacity: 0.2, depthWrite: false });
  const smoke = Array.from({ length: 4 }, () => {
    const puff = new THREE.Mesh(geometry, smokeMaterial);
    pivot.add(puff);
    return puff;
  });
  let elapsed = 0;
  function update(delta, remaining) {
    elapsed += delta;
    const progress = THREE.MathUtils.clamp(1 - remaining / 3, 0, 1);
    const pulse = 1 + (0.015 + progress * 0.025) * Math.sin(elapsed * (7 + progress * 20));
    pivot.scale.setScalar(pulse);
    const bounce = elapsed < 0.35 ? Math.sin(elapsed / 0.35 * Math.PI) * 0.035 : 0;
    pivot.position.y = floorY + 0.005 - root.position.y + bounce;
    spark.scale.setScalar(0.012 + 0.005 * Math.sin(elapsed * 57));
    for (const [i, puff] of smoke.entries()) {
      const age = (elapsed * 1.3 + i / smoke.length) % 1;
      puff.position.set(fuseTip.x + Math.sin(elapsed * 2 + i) * age * 0.02,
        fuseTip.y + 0.008 + age * 0.12, fuseTip.z + Math.cos(i + elapsed) * age * 0.015);
      puff.scale.setScalar(0.004 + age * 0.015);
    }
    const warning = remaining <= 0.5 ? (Math.sin(elapsed * 45) > 0 ? 0.9 : 0.15) : progress * 0.08;
    for (const { material, emissive, intensity } of materials) {
      if (!emissive) continue;
      material.emissive.copy(emissive).lerp(new THREE.Color(0xff3300), warning);
      material.emissiveIntensity = Math.max(intensity ?? 1, warning * 2);
    }
  }
  update(0, 3);
  return { root, update, dispose() {
    root.removeFromParent();
    materials.forEach(({ material }) => material.dispose());
    geometry.dispose(); sparkMaterial.dispose(); smokeMaterial.dispose();
  } };
}
