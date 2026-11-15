import * as THREE from 'three';
import backgroundTextureUrl from './assets/backgroung_images/tetromino_bg_selected.svg?url';

const FALLBACK_COLOR = 0x303332;

export function setSceneBackground(scene) {
  scene.background = new THREE.Color(FALLBACK_COLOR);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(backgroundTextureUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  });
}
