import * as THREE from 'three';

export function addSceneLights(scene) {
  const hemi = new THREE.HemisphereLight(0xf8efe0, 0x252a2a, 2.2);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x87c7ff, 0.8);
  fill.position.set(-4, 2, 3);
  scene.add(fill);
}
