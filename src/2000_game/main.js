import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setSceneBackground } from './background.js';
import { createCamera, createCameraControls, frameObjectWithCamera, resizeCamera } from './camera.js';
import { createGameController, createTetrominoDropController } from './gameController.js';
import { createHomePage } from './homePage.js';
import { addSceneLights } from './lights.js';
import { createScoreDisplay } from './scoreDisplay.js';
import { createSettingsOverlay } from './settingsOverlay.js';
import {
  playPlaySound,
  setGameMusicPaused,
  setGameMusicType,
  setGameMusicVolume,
  setSoundEffectsVolume,
  startGameMusic,
} from './soundEffects/index.js';
import levelUrl from './assets/level.glb?url';

const app = document.querySelector('#app');
const PLAY_MUSIC_LEAD_IN_MS = 260;

const scene = new THREE.Scene();
setSceneBackground(scene);

const camera = createCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
app.appendChild(renderer.domElement);

const controls = createCameraControls(camera, renderer.domElement);
let levelModel = null;
const clock = new THREE.Clock();
let gameControl = null;
let gameController = null;
let settingsPausedGame = false;
let playMusicTimer = null;

addSceneLights(scene);

const loader = new GLTFLoader();

const status = document.createElement('div');
status.className = 'status';
status.textContent = 'Loading level.glb';
document.body.appendChild(status);

const homePage = createHomePage({
  onStart() {
    playPlaySound();
    setGameMusicPaused(false);
    gameControl?.setPaused(false);
    gameController?.syncPauseButtonState?.();
    if (playMusicTimer !== null) window.clearTimeout(playMusicTimer);
    playMusicTimer = window.setTimeout(() => {
      playMusicTimer = null;
      if (homePage.isOpen()) return;
      startGameMusic();
    }, PLAY_MUSIC_LEAD_IN_MS);
  },
});

const settingsOverlay = createSettingsOverlay({
  onExitToHome() {
    settingsOverlay.close();
    homePage.open();
    gameControl?.setPaused(true);
    setGameMusicPaused(true);
    gameController?.syncPauseButtonState?.();
  },
  onOpenChange(isOpen) {
    if (!gameControl) return;

    if (isOpen) {
      settingsPausedGame = !gameControl.isPaused();
      gameControl.setPaused(true);
      setGameMusicPaused(true);
    } else if (settingsPausedGame) {
      gameControl.setPaused(false);
      setGameMusicPaused(false);
      settingsPausedGame = false;
    }

    gameController?.syncPauseButtonState?.();
  },
  onOptionsChange({ soundFxVolume, musicVolume, musicType }) {
    setSoundEffectsVolume(soundFxVolume / 100);
    setGameMusicVolume(musicVolume / 100);
    setGameMusicType(musicType);
  },
});

loader.load(
  levelUrl,
  (gltf) => {
    const model = gltf.scene;
    levelModel = model;
    model.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
        if (/^ControlHUB_Direction_DPad_.*_Arrow$/.test(child.name)) {
          child.material = child.material.clone();
          child.material.polygonOffset = true;
          child.material.polygonOffsetFactor = -2;
          child.material.polygonOffsetUnits = -2;
          child.renderOrder = 1;
        }
      }
    });

    scene.add(model);
    frameObjectWithCamera(model, camera, controls);
    const { setScore, setLines } = createScoreDisplay(model);
    setScore(0);
    setLines(0);
    gameControl = createTetrominoDropController(model, (score, lines) => {
      setScore(score);
      setLines(lines);
    });
    if (homePage.isOpen()) gameControl.setPaused(true);
    setGameMusicPaused(gameControl.isPaused());
    gameController?.dispose();
    gameController = createGameController({
      camera,
      domElement: renderer.domElement,
      model,
      tetrominoController: gameControl,
      onSettingsToggle: settingsOverlay.toggle,
    });
    status.remove();
  },
  undefined,
  (error) => {
    console.error(error);
    status.textContent = 'Failed to load level.glb';
    status.classList.add('error');
  }
);

function resize() {
  resizeCamera(camera);
  if (levelModel) frameObjectWithCamera(levelModel, camera, controls);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);

function tick() {
  const delta = clock.getDelta();

  if (gameControl) {
    gameControl.update(delta);
  }

  gameController?.update?.(delta);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
