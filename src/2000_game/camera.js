import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CAMERA_TARGET = new THREE.Vector3(0.03, 2.3, 5.4);
const CAMERA_POSITION = new THREE.Vector3(7.25, 2.3, 5.4);
const CAMERA_PADDING = 0.95;
const CAMERA_VERTICAL_OFFSET = -0.1;

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.01, 200);
  camera.position.copy(CAMERA_POSITION);
  return camera;
}

export function createCameraControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  // Keep programmatic framing, but never let pointer gestures move the camera.
  controls.enabled = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.target.copy(CAMERA_TARGET);
  controls.update();
  return controls;
}

export function frameObjectWithCamera(object, camera, controls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const target = new THREE.Vector3(center.x, center.y + CAMERA_VERTICAL_OFFSET, center.z);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const verticalFitDistance = size.y / (2 * Math.tan(verticalFov / 2));
  const horizontalFitDistance = size.z / (2 * Math.tan(horizontalFov / 2));
  const padding = camera.aspect < 1 ? 1.05 : CAMERA_PADDING;
  const distance = Math.max(4.0, verticalFitDistance, horizontalFitDistance) * padding;

  controls.target.copy(target);
  camera.position.set(box.max.x + distance, target.y, target.z);
  // A tight depth range keeps thin button symbols distinct on mobile GPUs.
  camera.near = Math.max(0.1, distance * 0.1);
  camera.far = distance + size.length() * 2;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  controls.update();
}

export function resizeCamera(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
