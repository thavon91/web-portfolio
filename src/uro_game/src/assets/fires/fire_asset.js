import * as THREE from "three";

export function createFireAsset() {
  const root = new THREE.Group();
  root.name = "FireRangePickup";
  const flame = new THREE.Group();
  flame.name = "FlameVisual";
  root.add(flame);
  // Curved flame tongues with a hooked tip, not a faceted droplet.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.105, 0.005, -0.115, 0.09, -0.065, 0.15);
  shape.bezierCurveTo(-0.07, 0.105, -0.03, 0.11, -0.035, 0.16);
  shape.bezierCurveTo(-0.045, 0.22, 0.035, 0.25, 0.015, 0.3);
  shape.bezierCurveTo(0.09, 0.25, 0.035, 0.19, 0.065, 0.15);
  shape.bezierCurveTo(0.085, 0.125, 0.09, 0.17, 0.085, 0.19);
  shape.bezierCurveTo(0.15, 0.085, 0.1, 0.005, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.025, bevelEnabled: true, bevelSegments: 3,
    bevelSize: 0.006, bevelThickness: 0.006, curveSegments: 14, steps: 1,
  });
  geometry.translate(0, 0.007, -0.0125);
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xd63b08, emissive: 0x7a1600, emissiveIntensity: 0.4, roughness: 0.65 }),
    new THREE.MeshStandardMaterial({ color: 0xff8b16, emissive: 0xff6400, emissiveIntensity: 0.55, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0xffdc55, emissive: 0xffb62b, emissiveIntensity: 0.65, roughness: 0.5 }),
  ];
  flame.add(new THREE.Mesh(geometry, materials[0]));
  // Put the golden heart on both sides of the rotating 3D pickup.
  for (const side of [-1, 1]) {
    const orange = new THREE.Mesh(geometry, materials[1]);
    orange.scale.set(0.84, 0.9, 0.3);
    orange.position.set(0, 0.008, side * 0.022);
    const heart = new THREE.Mesh(geometry, materials[2]);
    heart.scale.set(0.47, 0.57, 0.2);
    heart.position.set(0.006, 0.014, side * 0.033);
    flame.add(orange, heart);
  }
  return { root, dispose() { geometry.dispose(); materials.forEach((material) => material.dispose()); } };
}
