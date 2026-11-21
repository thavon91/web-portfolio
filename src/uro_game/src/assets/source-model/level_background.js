import { privateAssetUrl } from "../../privateAssets.js";
import * as THREE from "three";

export function createLevelBackground() {
  const texture = new THREE.TextureLoader().load(
    privateAssetUrl("background.jpg.png"),
    () => fitBackground(),
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  const startPosition = new THREE.Vector3();
  const startDirection = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let anchored = false;

  function fitBackground() {
    if (!texture.image) return;
    const imageAspect = texture.image.width / texture.image.height;
    const screenAspect = window.innerWidth / window.innerHeight;
    // Fill the screen without stretching the photograph.
    texture.repeat.set(Math.min(1, screenAspect / imageAspect) * 0.85, Math.min(1, imageAspect / screenAspect) * 0.85);
    texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
  }

  texture.userData.updateCamera = (camera) => {
    camera.getWorldDirection(direction);
    if (!anchored) {
      startPosition.copy(camera.position);
      startDirection.copy(direction);
      anchored = true;
    }
    const shiftX = (camera.position.x - startPosition.x) * 0.012 + (direction.x - startDirection.x) * 0.12;
    const shiftY = (camera.position.z - startPosition.z) * 0.008 + (direction.y - startDirection.y) * 0.12;
    texture.offset.set(
      THREE.MathUtils.clamp((1 - texture.repeat.x) / 2 + shiftX, 0, 1 - texture.repeat.x),
      THREE.MathUtils.clamp((1 - texture.repeat.y) / 2 + shiftY, 0, 1 - texture.repeat.y),
    );
  };

  window.addEventListener("resize", fitBackground);
  return texture;
}
