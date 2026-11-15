import * as THREE from "three";
import { consumeReplayRequest } from "./replay.js";
import { createMenuMusic, startIntroMusic, stopIntroMusic, createGameOverSound, createVictorySound } from "../sfx/sfx.js";

function makeBombPortrait(model, renderer, environment) {
  let source;
  model.traverse((object) => {
    if ((object.userData.name ?? object.name).toLowerCase() === "bomb_0.002") source = object;
  });
  if (!source) return null;
  source.updateWorldMatrix(true, false);
  const bomb = source.clone(true);
  source.matrixWorld.decompose(bomb.position, bomb.quaternion, bomb.scale);
  bomb.visible = true;
  const scene = new THREE.Scene();
  scene.environment = environment;
  const facing = new THREE.Group();
  scene.add(facing);
  facing.add(bomb);
  let bounds = new THREE.Box3().setFromObject(bomb);
  bomb.position.sub(bounds.getCenter(new THREE.Vector3()));
  // Tilt around the portrait center, not the imported mesh's offset origin.
  facing.rotation.x = THREE.MathUtils.degToRad(-15);
  const size = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  const camera = new THREE.PerspectiveCamera(35, 1, size * 0.01, size * 10);
  camera.position.set(0, 0, -size * 2.15);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x59647b, 2));
  const light = new THREE.DirectionalLight(0xffefd9, 3);
  light.position.set(-2, 3, -4); scene.add(light);
  const portrait = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  portrait.setSize(256, 256);
  portrait.setClearColor(0x000000, 0);
  portrait.toneMapping = renderer.toneMapping;
  portrait.toneMappingExposure = renderer.toneMappingExposure;
  let url;
  try {
    portrait.render(scene, camera);
    url = portrait.domElement.toDataURL("image/png");
  } finally {
    portrait.dispose();
    portrait.forceContextLoss();
  }
  return url;
}

export function createHomeScreen({ onStart }) {
  const screen = document.querySelector("#home-screen");
  const button = document.querySelector("#start-game");
  const status = document.querySelector("#home-status");
  const autoStart = consumeReplayRequest(window.location.href, (url) => window.history.replaceState(window.history.state, "", url));
  if (autoStart) document.documentElement.classList.add("replaying");
  let menuMusic = null;
  const gameOverMusic = createMenuMusic({ gameOver: true, autoplay: false });
  const playGameOver = createGameOverSound(() => {});
  const victoryMusic = createMenuMusic({ victory: true, autoplay: false });
  const playVictory = createVictorySound();
  const portraitCacheKey = "bombom-home-smile-portrait-v2";
  function showPortrait(url) {
    const image = document.createElement("img");
    image.src = url; image.alt = "Smiling blue bomb";
    image.width = image.height = 140;
    const container = screen.querySelector(".home-bomb");
    container.removeAttribute("aria-hidden");
    container.replaceChildren(image);
  }
  try {
    const cached = localStorage.getItem(portraitCacheKey);
    if (cached?.startsWith("data:image/png;base64,")) showPortrait(cached);
  } catch { /* Storage may be unavailable; the model portrait loads normally. */ }
  let ready = false, started = false;
  function start() {
    if (!ready || started) return;
    started = true;
    stopIntroMusic();
    menuMusic?.stop();
    menuMusic = createMenuMusic();
    document.querySelector("#replay-screen")?.remove();
    document.documentElement.classList.remove("replaying");
    try { sessionStorage.removeItem("uro-replay-result"); } catch { /* Optional cache. */ }
    document.body.classList.remove("home-active");
    screen.remove();
    button.blur();
    onStart();
  }
  button.addEventListener("click", start);
  return { playGameOver() {
    menuMusic?.stop();
    menuMusic = gameOverMusic;
    gameOverMusic.start();
    playGameOver();
  }, playVictory() {
    menuMusic?.stop();
    menuMusic = victoryMusic;
    victoryMusic.start();
    playVictory();
  }, setBombModel(model, renderer, environment) {
    if (started || autoStart) return;
    const url = makeBombPortrait(model, renderer, environment);
    if (!url) return;
    showPortrait(url);
    try { localStorage.setItem(portraitCacheKey, url); } catch { /* Optional cache. */ }
  }, setReady(value) {
    if (started || ready === value) return;
    ready = value;
    if (value && !autoStart) startIntroMusic();
    button.disabled = !value;
    button.textContent = value ? "Start Game" : "Loading Realm…";
    status.textContent = value ? "The Realm is ready. Your adventure starts here." : "Preparing the map and characters.";
    if (value && (autoStart || screen.dataset.startRequested === "true")) start();
  } };
}
