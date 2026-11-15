import * as THREE from "three";
import { createFootstepSounds, createBombPlacementSound, createBombCountdownSounds, createBombExplosionSound, createPickupRevealSound, createPickupCollectionSound, createDeathSounds, createRespawnSound } from "./assets/sfx/sfx.js";
import { createLevelBackground } from "./assets/source-model/level_background.js";
import { createHomeScreen } from "./assets/HUD/home_screen.js";
import { createSkeletonAI } from "./assets/skeleton-bomber-assets/skeleton_ai.js";
import { createPauseControls } from "./assets/HUD/pause_controls.js";
import { createSkeletonBombVfx } from "./assets/bombs/skeleton_bomb_vfx.js";
import { createFemaleBombVfx } from "./assets/bombs/female_bomb_vfx.js";
import { hasVictory, showVictoryScreen, showGameOverScreen } from "./assets/HUD/victory.js";
import { createFirePickups, MAX_FIRE_RANGE } from "./assets/fires/fire_pickups.js";
import { createPlayerRespawn } from "./assets/character-bomber-assets/female/player_respawn.js";
import { createFieldDitches } from "./assets/source-model/field_ditches.js";
import { createBombAnimations } from "./assets/bombs/bombs_Anims.js";
import { createEmptyBoxForBombs } from "./assets/source-model/empty_boxForBombs.js";
import { createGameHud } from "./assets/HUD/hud.js";
import { createGameTimer } from "./assets/HUD/timer.js";

import {
  GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  DRACOLoader,
} from "three/examples/jsm/loaders/DRACOLoader.js";

import {
  RoomEnvironment,
} from "three/examples/jsm/environments/RoomEnvironment.js";

import mapSourceUrl
  from "./assets/source-model/bomber_map_source.glb?url";

import {
  createBoardCamera,
} from "./camera.js";

import {
  createMapCollision,
} from "./assets/source-model/map_collision.js";

import {
  createBomber,
} from "./assets/skeleton-bomber-assets/skeletonBomber_Anim.js";
import { createFemaleBomber } from "./assets/character-bomber-assets/female/femaleBomber_Anim.js";
import { createBombVisibilityController } from "./assets/bombs/bombs_control.js";



// ============================================================
// SETTINGS
// ============================================================

// Character height in Three.js world units.
// Change this if the character is too large/small.
const BOMBER_HEIGHT = 0.5;

// Character starting position.
// X = left/right
// Y = height
// Z = forward/back
const BOMBER_START_X = 3.67;
const BOMBER_START_Z = -1.7;
const FEMALE_START_X = 3.62;
const FEMALE_START_Z = 2.8;

// ============================================================
// DOM
// ============================================================

const canvas =
  document.querySelector("#scene");
const femaleFootsteps = createFootstepSounds(true);
const skeletonFootsteps = Array.from({ length: 4 }, () => createFootstepSounds());
const playBombPlacement = createBombPlacementSound();
const bombCountdownSounds = createBombCountdownSounds();
const playBombExplosion = createBombExplosionSound();
const playSkeletonExplosion = createBombExplosionSound(true);

const loaderEl =
  document.querySelector("#loader");

const miniMapCanvas = document.querySelector("#mini-map-canvas");
const miniMapPlayer = document.querySelector("#mini-map-player");

const gameHud = createGameHud(document.querySelector("#game-hud"), {
  life: 5,
  fire: 1,
  bombs: 3,
});

const gameTimer = createGameTimer(document.querySelector("#game-timer"));
let gameEnded = false;
let gameStarted = false;
const homeScreen = createHomeScreen({ onStart: () => {
  gameStarted = true;
  cameraSystem.setFollowEnabled(true);
  femaleKeys.clear();
  gameTimer.start();
} });
const playback = createPauseControls({
  onPause: () => { gameTimer.stop(); femaleKeys.clear(); },
  onPlay: () => {
    femaleKeys.clear();
    if (femaleDebugState.characterLoaded && femaleDebugState.collisionLoaded) gameTimer.start();
  },
  canPlay: () => gameStarted && !gameEnded,
});

if (!canvas) {
  throw new Error(
    'Canvas "#scene" was not found.'
  );
}


// ============================================================
// DEBUG STATE
// ============================================================

const debugState = {

  mapLoaded: false,

  collisionLoaded: false,

  fps: 0,

  characterLoaded: false,

  characterAnimationCount: 0,

  characterError: "",

  mapBounds: null,

  characterBounds: null,
};

window.__bomberMapDebug =
  debugState;

const femaleDebugState = {
  characterLoaded: false,
  characterError: "",
  collisionLoaded: false,
};
debugState.female = femaleDebugState;


// ============================================================
// SCENE
// ============================================================

const scene =
  new THREE.Scene();

scene.background = createLevelBackground();

// A light amber distance haze keeps the arena clear while softening its far edge.
scene.fog = new THREE.FogExp2(0xb18a60, 0.018);


// ============================================================
// RENDERER
// ============================================================

const renderer =
  new THREE.WebGLRenderer({
    canvas,

    antialias: true,

    preserveDrawingBuffer: false,

    powerPreference:
      "high-performance",
  });


renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio || 1,
    1.5
  )
);


renderer.setSize(
  window.innerWidth,
  window.innerHeight
);


renderer.outputColorSpace =
  THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const miniMapRenderer = new THREE.WebGLRenderer({
  canvas: miniMapCanvas,
  antialias: true,
});
miniMapRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
miniMapRenderer.setSize(240, 192, false);
miniMapRenderer.outputColorSpace = THREE.SRGBColorSpace;
miniMapRenderer.toneMapping = THREE.ACESFilmicToneMapping;
miniMapRenderer.toneMappingExposure = 1.05;
miniMapRenderer.setClearColor(0x17201d, 1);

const miniMapCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
miniMapCamera.up.set(0, 0, 1);
miniMapCamera.position.set(0, 30, 0);
miniMapCamera.lookAt(0, 0, 0);

function frameMiniMap(object) {
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const miniMapAspect = 5 / 4;
  const halfHeight = Math.max(size.z * 0.56, size.x * 0.56 / miniMapAspect);
  const halfWidth = halfHeight * miniMapAspect;
  miniMapCamera.left = -halfWidth;
  miniMapCamera.right = halfWidth;
  miniMapCamera.top = halfHeight;
  miniMapCamera.bottom = -halfHeight;
  miniMapCamera.position.set(center.x, bounds.max.y + 30, center.z);
  miniMapCamera.lookAt(center.x, bounds.min.y, center.z);
  miniMapCamera.updateProjectionMatrix();
}


renderer.toneMapping =
  THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
  0.88;


// ============================================================
// ENVIRONMENT
// ============================================================

const pmrem =
  new THREE.PMREMGenerator(
    renderer
  );


scene.environment =
  pmrem.fromScene(
    new RoomEnvironment(),
    0.04
  ).texture;
scene.environmentIntensity = 0.35;


// ============================================================
// MAP ROOT
// ============================================================

const mapRoot =
  new THREE.Group();

mapRoot.name =
  "BomberMapRoot";

scene.add(
  mapRoot
);


// ============================================================
// CAMERA
// ============================================================

const cameraSystem =
  createBoardCamera({

    renderer,

    getBoard: () =>
      mapRoot,

  });


const {
  camera,
} = cameraSystem;
window.addEventListener("uro:capture-replay", (event) => {
  renderer.render(scene, camera);
  event.detail.background = renderer.domElement.toDataURL("image/jpeg", 0.75);
});


// ============================================================
// LIGHTING
// ============================================================

const hemi =
  new THREE.HemisphereLight(
    0xffd6a0,
    0x493c32,
    0.65
  );

scene.add(
  hemi
);


const ambient =
  new THREE.AmbientLight(
    0xffd7ac,
    0.16
  );

scene.add(
  ambient
);


const key =
  new THREE.DirectionalLight(
    0xffbe72,
    3.2
  );

key.position.set(
  8,
  12,
  10
);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -6.5;
key.shadow.camera.right = key.shadow.camera.top = 6.5;
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 40;
key.shadow.normalBias = 0.012;
key.shadow.bias = -0.00015;
key.shadow.camera.updateProjectionMatrix();
scene.add(key.target);

scene.add(
  key
);


const fill =
  new THREE.DirectionalLight(
    0x9ca9ba,
    0.3
  );

fill.position.set(
  -8,
  5,
  -6
);

scene.add(
  fill
);


// Character fill light.
const characterFill =
  new THREE.PointLight(
    0xfff2d2,
    1.2,
    12,
    1.8
  );

characterFill.position.set(
  -8,
  3.2,
  -6.5
);

scene.add(
  characterFill
);

// The minimap uses neutral illumination instead of the level's sunset lights.
const miniMapLight = new THREE.HemisphereLight(0xffffff, 0x667066, 2.5);
miniMapLight.visible = false;
scene.add(miniMapLight);
const miniMapBackground = new THREE.Color(0x202522);
const levelLights = [hemi, ambient, key, fill, characterFill];


// ============================================================
// MATERIAL NORMALIZATION
// ============================================================

function normalizeMaterials(
  object
) {

  object.traverse(
    (child) => {

      if (!child.isMesh) {
        return;
      }
      child.castShadow = !(child.userData.name ?? child.name).toLowerCase().includes("map_level");
      child.receiveShadow = true;


      child.frustumCulled =
        true;


      const materials =
        Array.isArray(
          child.material
        )
          ? child.material
          : [child.material];


      for (
        const material
        of materials
      ) {

        if (!material) {
          continue;
        }


        if (
          "roughness"
          in material
        ) {

          material.roughness =
            Math.min(
              material.roughness ??
              0.7,
              0.85
            );
        }


        if (
          "metalness"
          in material
        ) {

          material.metalness =
            material.metalness ??
            0;
        }


        material.needsUpdate =
          true;
      }
    }
  );
}


// ============================================================
// DRACO
// ============================================================

const dracoLoader =
  new DRACOLoader();

dracoLoader.setDecoderPath(
  `${import.meta.env.BASE_URL}draco/`
);


// ============================================================
// MAIN MAP LOADER
// ============================================================

const mapLoader =
  new GLTFLoader();

mapLoader.setDRACOLoader(
  dracoLoader
);


// ============================================================
// BOMBER
// ============================================================

const bomber =
  createBomber({
    ...createDeathSounds(true),
    name: "skeletonBomber_Anim1",

    targetHeight:
      BOMBER_HEIGHT,

  });


scene.add(
  bomber.root
);

const femaleBomber = createFemaleBomber({ targetHeight: BOMBER_HEIGHT, ...createDeathSounds() });
scene.add(femaleBomber.root);
const bombVisibility = createBombVisibilityController({ onCollect: createPickupCollectionSound("bomb") });


// ============================================================
// BOMBER START POSITION
// ============================================================

bomber.setPosition(
  BOMBER_START_X,
  0,
  BOMBER_START_Z
);


bomber.setRotation(
  0
);


// ============================================================
// PLACE BOMBER ON MAP
// ============================================================

function placeBomberOnMap() {

  if (!debugState.mapLoaded) {
    return;
  }


  if (!debugState.characterLoaded) {
    return;
  }


  // ----------------------------------------------------------
  // Start at the selected X/Z position.
  // ----------------------------------------------------------

  bomber.setPosition(
    characterSettings.x,
    0,
    characterSettings.z
  );


  // ----------------------------------------------------------
  // Put character feet on Y = 0.
  // ----------------------------------------------------------

  // Use the actual map floor, rather than an assumed Y = 0.
  mapRoot.updateMatrixWorld(true);
  const floor = mapRoot.getObjectByName("map_level") ?? mapRoot;
  const mapBox = new THREE.Box3().setFromObject(mapRoot);
  const ray = new THREE.Raycaster(
    new THREE.Vector3(characterSettings.x, mapBox.max.y + 1, characterSettings.z),
    new THREE.Vector3(0, -1, 0),
  );
  const hit = ray.intersectObject(floor, true)[0];
  if (!hit) {
    debugState.characterError = "No map ground found below character spawn.";
    return;
  }
  bomber.root.scale.setScalar(characterSettings.height / BOMBER_HEIGHT);
  bomber.setRotation(THREE.MathUtils.degToRad(characterSettings.rotation));
  bomber.placeFeetOnGround(hit.point.y + characterSettings.groundOffset);
  bomber.root.visible = characterSettings.visible;
  debugState.characterError = "";
  debugState.characterGroundY = hit.point.y;


  // ----------------------------------------------------------
  // Calculate character bounds.
  // ----------------------------------------------------------

  const bounds =
    new THREE.Box3()
      .setFromObject(
        bomber.root
      );


  debugState.characterBounds = {

    min:
      bounds.min.toArray(),

    max:
      bounds.max.toArray(),

  };


  console.log(
    "================================"
  );

  console.log(
    "BOMBER PLACED"
  );

  console.log(
    "Position:",
    bomber.root.position
  );

  console.log(
    "Scale:",
    bomber.root.scale
  );

  console.log(
    "Character bounds:",
    debugState.characterBounds
  );

  console.log(
    "================================"
  );
}

function placeFemaleOnMap() {
  if (!debugState.mapLoaded || !femaleDebugState.characterLoaded) return;
  const { x, z, height, rotation, groundOffset, visible } = femaleSettings;
  femaleBomber.setPosition(x, 0, z);
  mapRoot.updateMatrixWorld(true);
  const floor = mapRoot.getObjectByName("map_level") ?? mapRoot;
  const top = new THREE.Box3().setFromObject(mapRoot).max.y + 1;
  const ray = new THREE.Raycaster(
    new THREE.Vector3(x, top, z),
    new THREE.Vector3(0, -1, 0),
  );
  const hit = ray.intersectObject(floor, true)[0];
  if (!hit) {
    femaleDebugState.characterError = "No map ground found below female spawn.";
    femaleBomber.root.visible = false;
    return;
  }
  femaleBomber.root.scale.setScalar(height / BOMBER_HEIGHT);
  femaleBomber.setRotation(THREE.MathUtils.degToRad(rotation));
  femaleBomber.placeFeetOnGround(hit.point.y + groundOffset);
  femaleBomber.root.visible = visible;
  femaleDebugState.groundY = hit.point.y;
  const femaleBounds = new THREE.Box3().setFromObject(femaleBomber.root, true);
  femaleDebugState.bounds = { min: femaleBounds.min.toArray(), max: femaleBounds.max.toArray() };
  femaleDebugState.characterError = "";
}


// ============================================================
// LOAD BOMBER
// ============================================================

const characterSettings = {
  x: BOMBER_START_X, z: BOMBER_START_Z, height: BOMBER_HEIGHT,
  visible: true, groundOffset: 0, rotation: -180, autoMove: true, speed: 0.5,
};
const femaleSettings = {
  x: FEMALE_START_X, z: FEMALE_START_Z, height: BOMBER_HEIGHT,
  visible: true, groundOffset: 0, rotation: -180, autoMove: false, speed: 1.1,
};

function loadFemaleBomber() {
  femaleBomber.load().then(() => {
    femaleDebugState.characterLoaded = true;
    if (gameStarted && femaleDebugState.collisionLoaded && !playback.paused && !gameEnded) gameTimer.start();
    femaleDebugState.activeCharacterAnimation = "StandingIdle";
    placeFemaleOnMap();
    if (femaleBomber.root.visible) cameraSystem.setFollowTarget(femaleBomber.root);
  }).catch((error) => {
    femaleDebugState.characterError = error?.message ?? String(error);
    console.error("Female Bomber failed:", error);
  });
}

function loadBomber() {
  bomber
    .load()

    .then(() => {

      debugState.characterLoaded =
        true;


      debugState.characterAnimationCount = 2;
      debugState.activeCharacterAnimation = "StandingIdle";


      console.log(
        "Skeleton Bomber loaded."
      );


      console.log(
        "Character target height:",
        BOMBER_HEIGHT
      );


      placeBomberOnMap();

    })

    .catch((error) => {

      debugState.characterLoaded =
        false;


      debugState.characterError =
        error?.message ??
        String(error);


      console.error(
        "Skeleton Bomber failed:",
        error
      );
    });


  // ============================================================
  // MAP COLLISION
  // ============================================================

}

const mapCollision =
  createMapCollision({
    scene,
  });


// Hidden initially.
mapCollision.hide();
const emptyBombBoxes = createEmptyBoxForBombs({ scene });
const firePickups = createFirePickups({ scene, collision: mapCollision, bombs: bombVisibility, onCollect: createPickupCollectionSound("fire") });
const fieldDitches = createFieldDitches({ collision: mapCollision, bombs: bombVisibility, fires: firePickups, onReveal: createPickupRevealSound() });
const skeletonBombVfx = createSkeletonBombVfx({ scene, collision: mapCollision });
const playerBombs = createBombAnimations({
  startCountdown: (isSkeleton) => bombCountdownSounds.start(isSkeleton),
  onPlace: playBombPlacement,
  onExplode: (isSkeleton) => isSkeleton ? playSkeletonExplosion() : playBombExplosion(),
  femaleVfx: createFemaleBombVfx({ scene, collision: mapCollision }),
  skeletonVfx: skeletonBombVfx,
  scene, boxes: emptyBombBoxes, player: femaleBomber, collision: mapCollision, ditches: fieldDitches, pickups: bombVisibility,
  firePickups,
  onCountChange: (bombs) => gameHud.setValues({ bombs }),
  getFireRange: () => Math.min(MAX_FIRE_RANGE, gameHud.values.fire),
  onDamage: () => playerRespawn.hit(),
});
const playerRespawn = createPlayerRespawn({
  onRespawn: createRespawnSound(),
  player: femaleBomber, settings: femaleSettings,
  spawn: { x: FEMALE_START_X, z: FEMALE_START_Z }, collision: mapCollision,
  isSafe: (x, z) => playerBombs.canRespawnAt(x, z, femaleSettings.height * 0.16),
  getLife: () => gameHud.values.life,
  setLife: (life) => gameHud.setValues({ life }),
  onGameOver: () => {
    gameEnded = true;
    homeScreen.playGameOver();
    gameTimer.stop();
    femaleKeys.clear();
    femaleBomber.setInput(0, 0);
    showGameOverScreen({ timeLabel: document.querySelector("#game-timer").getAttribute("aria-label") ?? "" });
  },
});
const skeletonAI = createSkeletonAI({ skeleton: bomber, settings: characterSettings,
  collision: mapCollision, bombs: playerBombs, boxes: emptyBombBoxes, pickups: bombVisibility, firePickups,
  getOpponent: () => femaleBomber.root.visible && femaleBomber.canAct ? femaleBomber.root.position : null });
const skeletonStarts = {
  2: { x: -0.97, z: -0.58 },
  3: { x: -1.18, z: 2.81474 },
  4: { x: 0.67, z: 0.6 },
};
const extraSkeletons = [2, 3, 4].map((number) => {
  const skeleton = createBomber({ targetHeight: BOMBER_HEIGHT, name: `skeletonBomber_Anim${number}`, ...createDeathSounds(true) });
  const state = { characterLoaded: false, collisionLoaded: false, characterError: "" };
  let settings;
  const apply = () => {
    // Called only after the model and collision map have loaded. Do not gate
    // this closure on the initially-false state object: production tree-shaking
    // can otherwise discard the placement body before the async load updates it.
    const y = mapCollision.groundAt(settings.x, settings.z);
    if (y === null) return;
    skeleton.setPosition(settings.x, y, settings.z);
    skeleton.root.scale.setScalar(settings.height / BOMBER_HEIGHT);
    skeleton.setRotation(THREE.MathUtils.degToRad(settings.rotation));
    skeleton.placeFeetOnGround(y + settings.groundOffset);
    skeleton.root.visible = settings.visible && skeleton.canAct;
  };
  settings = {
    ...skeletonStarts[number], height: BOMBER_HEIGHT, speed: 0.5,
    visible: true, groundOffset: 0, rotation: -180, autoMove: true,
  };
  scene.add(skeleton.root);
  const ai = createSkeletonAI({ skeleton, settings, collision: mapCollision,
    bombs: playerBombs, boxes: emptyBombBoxes, pickups: bombVisibility, firePickups,
    getOpponent: () => femaleBomber.root.visible && femaleBomber.canAct ? femaleBomber.root.position : null });
  return { skeleton, settings, ai, state, apply };
});
async function loadExtraSkeletons() {
  for (const entry of extraSkeletons) {
    try {
      await entry.skeleton.load();
      entry.state.characterLoaded = true;
      entry.state.collisionLoaded = true;
      if (mapCollision.groundAt(entry.settings.x, entry.settings.z) === null) throw new Error("No floor at configured skeleton start position");
      entry.apply();
      entry.skeleton.setWorld({ groundAt: mapCollision.groundAt,
        canOccupy: (x, z, y, radius, height) => mapCollision.canOccupy(x, z, y, radius, height, true) &&
          playerBombs.canWalkAt(x, z, radius, entry.skeleton.root.position, entry.skeleton) && bombVisibility.canWalkAt(x, z, radius) && entry.ai.canMoveAt(x, z) });
    } catch (error) {
      entry.state.characterError = error?.message ?? String(error);
      console.error(`${entry.skeleton.root.name} failed to load:`, error);
    }
  }
}
gameHud.setValues({ bombs: femaleBomber.availableBombs });
let collisionLoadPromise;
function loadCollision() {
  if (collisionLoadPromise) return collisionLoadPromise;
  collisionLoadPromise = mapCollision
    .load()

    .then(() => {

      debugState.collisionLoaded =
        true;
      femaleDebugState.collisionLoaded = true;
      if (gameStarted && femaleDebugState.characterLoaded && !playback.paused && !gameEnded) gameTimer.start();
      void loadExtraSkeletons();
      bomber.setWorld({
        groundAt: mapCollision.groundAt,
        canOccupy: (x, z, feetY, radius, height) =>
          mapCollision.canOccupy(x, z, feetY, radius, height) &&
          playerBombs.canWalkAt(x, z, radius, bomber.root.position, bomber) &&
          skeletonAI.canMoveAt(x, z) &&
          bombVisibility.canWalkAt(x, z, radius),
      });
      femaleBomber.setWorld({
        groundAt: mapCollision.groundAt,
        canOccupy: (x, z, feetY, radius, height) =>
          mapCollision.canOccupy(x, z, feetY, radius, height) &&
          playerBombs.canWalkAt(x, z, radius, femaleBomber.root.position),
      });
      const femaleFloor = mapCollision.groundAt(femaleSettings.x, femaleSettings.z);
      femaleDebugState.spawnWalkable = femaleFloor !== null &&
        mapCollision.canOccupy(
          femaleSettings.x,
          femaleSettings.z,
          femaleFloor,
          femaleSettings.height * 0.16,
          femaleSettings.height,
        );
      const spawnedBombs = bombVisibility.scatter({
        count: 7,
        canOccupy: mapCollision.canOccupy,
        groundAt: mapCollision.groundAt,
      });
      debugState.spawnedBombs = spawnedBombs;
      bombVisibility.setVisible(false);
      firePickups.scatter(mapRoot, 12);


      console.log(
        "Map collision loaded."
      );


      console.log(
        "Press V to show/hide collision."
      );
    })

    .catch((error) => {

      debugState.collisionLoaded =
        false;
      femaleDebugState.collisionLoaded = false;


      console.error(
        "Map collision failed:",
        error
      );
    });


  // ============================================================
  // KEYBOARD CONTROLS
  // ============================================================

  return collisionLoadPromise;
}

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.ctrlKey || event.metaKey || event.altKey ||
      event.target?.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target?.tagName ?? "")) return;
  event.preventDefault();
  if (gameStarted && !playback.paused && !gameEnded && !event.repeat &&
      femaleDebugState.characterLoaded && femaleBomber.root.visible) {
    playerBombs.placeAt(femaleBomber.root.getWorldPosition(new THREE.Vector3()));
  }
});

const femaleKeys = new Set();
const movementKeys = new Map([
  ["KeyW", "w"],
  ["KeyA", "a"],
  ["KeyS", "s"],
  ["KeyD", "d"],
]);
window.addEventListener("keydown", (event) => {
  const key = movementKeys.get(event.code);
  if (!key || event.ctrlKey || event.metaKey || event.altKey ||
    event.target?.isContentEditable ||
    /^(TEXTAREA|SELECT)$/.test(event.target?.tagName ?? "") ||
    (event.target?.tagName === "INPUT" && event.target.type !== "number")) return;
  femaleKeys.add(key);
  event.preventDefault();
}, true);
window.addEventListener("keyup", (event) => {
  const key = movementKeys.get(event.code);
  if (key) femaleKeys.delete(key);
}, true);
window.addEventListener("blur", () => femaleKeys.clear());


// ============================================================
// LOAD MAIN MAP
// ============================================================

mapLoader.load(

  mapSourceUrl,


  // ==========================================================
  // SUCCESS
  // ==========================================================

  (gltf) => {

    const model =
      gltf.scene;


    model.name =
      "BomberMap";


    normalizeMaterials(
      model
    );


    mapRoot.add(
      model
    );
    frameMiniMap(model);
    bombVisibility.setMap(model);
    fieldDitches.setMap(model);
    emptyBombBoxes.build();
    playerBombs.setMap(model);
    homeScreen.setBombModel(model, renderer, scene.environment);


    // --------------------------------------------------------
    // Calculate map bounds
    // --------------------------------------------------------

    const mapBounds =
      new THREE.Box3()
        .setFromObject(
          model
        );
    const lightCenter = mapBounds.getCenter(new THREE.Vector3());
    const lightSize = mapBounds.getSize(new THREE.Vector3());
    const shadowExtent = Math.max(lightSize.x, lightSize.z) * 0.75 + 0.5;
    key.target.position.copy(lightCenter);
    key.position.copy(lightCenter).add(new THREE.Vector3(8, 6, 10));
    key.shadow.camera.left = key.shadow.camera.bottom = -shadowExtent;
    key.shadow.camera.right = key.shadow.camera.top = shadowExtent;
    key.shadow.camera.updateProjectionMatrix();


    debugState.mapBounds = {

      min:
        mapBounds.min.toArray(),

      max:
        mapBounds.max.toArray(),

    };


    // --------------------------------------------------------
    // Camera
    // --------------------------------------------------------

    cameraSystem.frameBoard(
      model
    );


    // --------------------------------------------------------
    // Map loaded
    // --------------------------------------------------------

    debugState.mapLoaded =
      true;

    debugState.mapReadyMs = performance.now();
    // Draw the map before downloading/parsing the much larger character.
    renderer.render(scene, camera);
    setTimeout(() => { loadBomber(); loadFemaleBomber(); loadCollision(); }, 0);


    console.log(
      "================================"
    );

    console.log(
      "BOMBER MAP LOADED"
    );

    console.log(
      "Map bounds:",
      debugState.mapBounds
    );

    console.log(
      "================================"
    );


    // --------------------------------------------------------
    // Character may already be loaded.
    // --------------------------------------------------------

    placeBomberOnMap();
    placeFemaleOnMap();


    // --------------------------------------------------------
    // Hide loader
    // --------------------------------------------------------

    if (loaderEl) {

      loaderEl.classList.add(
        "is-hidden"
      );
    }
  },


  // ==========================================================
  // PROGRESS
  // ==========================================================

  (progress) => {

    if (!loaderEl) {
      return;
    }


    if (
      progress.total > 0
    ) {

      const percent =
        (
          progress.loaded /
          progress.total
        ) * 100;


      loaderEl.setAttribute("aria-label", `Loading map ${percent.toFixed(0)}%`);

    } else {

      loaderEl.setAttribute("aria-label", "Loading map...");
    }
  },


  // ==========================================================
  // ERROR
  // ==========================================================

  (error) => {

    debugState.mapLoaded =
      false;


    console.error(
      "Failed to load bomber map:",
      error
    );


    if (loaderEl) {

      loaderEl.textContent =
        "Failed to load map";


      loaderEl.classList.remove(
        "is-hidden"
      );
    }
  }
);


// ============================================================
// RESIZE
// ============================================================

function handleResize() {

  const width =
    window.innerWidth;

  const height =
    window.innerHeight;


  renderer.setSize(
    width,
    height
  );


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      1.5
    )
  );


  if (
    camera &&
    camera.isPerspectiveCamera
  ) {

    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();
  }
}


window.addEventListener(
  "resize",
  handleResize
);


// ============================================================
// GAME LOOP
// ============================================================

let lastTime = 0;
let fpsStart = 0;
let fpsFrames = 0;


function animate() {

  requestAnimationFrame(
    animate
  );


  const now =
    performance.now();


  const delta =
    lastTime === 0
      ? 0
      : Math.min(
        (now - lastTime) / 1000,
        0.1
      );


  lastTime =
    now;

  if (!fpsStart) fpsStart = now;
  fpsFrames++;
  if (now - fpsStart >= 500) {
    debugState.fps = Math.round(fpsFrames * 1000 / (now - fpsStart));
    fpsStart = now;
    fpsFrames = 0;
  }


  // Character animation
  homeScreen.setReady(Boolean(debugState.mapLoaded && debugState.characterLoaded && debugState.collisionLoaded &&
    femaleDebugState.characterLoaded && extraSkeletons.every(({ state }) => state.characterLoaded && !state.characterError)));
  let femaleTravelDistance = 0;
  const skeletonActors = [bomber, ...extraSkeletons.map(({ skeleton }) => skeleton)];
  const skeletonPrevious = skeletonActors.map(({ root }) => ({ x: root.position.x, z: root.position.z }));
  if (gameStarted && !playback.paused && !gameEnded) {
  skeletonAI.update(delta);
  bomber.update(delta, characterSettings);
  for (const { skeleton, settings, ai } of extraSkeletons) {
    ai.update(delta);
    skeleton.update(delta, settings);
  }
  femaleBomber.setInput(
    Number(femaleKeys.has("a")) - Number(femaleKeys.has("d")),
    Number(femaleKeys.has("w")) - Number(femaleKeys.has("s")),
  );
  const femalePreviousX = femaleBomber.root.position.x;
  const femalePreviousZ = femaleBomber.root.position.z;
  femaleBomber.update(delta, femaleSettings);
  femaleTravelDistance = Math.hypot(femaleBomber.root.position.x - femalePreviousX, femaleBomber.root.position.z - femalePreviousZ);
  playerBombs.update(delta);
  playerRespawn.update(delta);
  firePickups.update(delta);
  bombVisibility.update(delta);
  if (femaleDebugState.characterLoaded && femaleBomber.root.visible && femaleBomber.canAct) {
    const collectedFire = firePickups.collectAt(femaleBomber.root.getWorldPosition(new THREE.Vector3()));
    for (let i = 0; i < collectedFire; i++) gameHud.setValues({ fire: femaleBomber.collectFire(gameHud.values.fire) });
    const pickups = bombVisibility.collectAt(femaleBomber.root.getWorldPosition(new THREE.Vector3()));
    if (pickups) {
      for (let i = 0; i < pickups; i++) femaleBomber.collectBomb();
      gameHud.setValues({ bombs: femaleBomber.availableBombs });
    }
  }
  debugState.characterAnimationTime = bomber.animationTime;
  if (!gameEnded && hasVictory({
    ready: debugState.characterLoaded && debugState.collisionLoaded &&
      extraSkeletons.every(({ state }) => state.characterLoaded && state.collisionLoaded && !state.characterError),
    skeletons: [bomber, ...extraSkeletons.map(({ skeleton }) => skeleton)],
    playerAlive: gameHud.values.life > 0 && femaleBomber.canAct,
  })) {
    gameEnded = true;
    femaleKeys.clear();
    femaleBomber.setInput(0, 0);
    gameTimer.stop();
    homeScreen.playVictory();
    showVictoryScreen({ timeLabel: document.querySelector("#game-timer").getAttribute("aria-label") ?? "" });
  }
  }

  // Follow the female's position after her movement is applied.
  femaleFootsteps.update(femaleTravelDistance, gameStarted && !playback.paused && !gameEnded && femaleBomber.canAct && femaleBomber.root.visible && femaleKeys.size > 0);
  skeletonActors.forEach((skeleton, index) => {
    const previous = skeletonPrevious[index];
    const distance = Math.hypot(skeleton.root.position.x - previous.x, skeleton.root.position.z - previous.z);
    const listenerDistance = Math.hypot(skeleton.root.position.x - femaleBomber.root.position.x, skeleton.root.position.z - femaleBomber.root.position.z);
    // Full volume within one tile; fade to silence beyond ten tiles.
    const loudness = Math.pow(1 - THREE.MathUtils.smoothstep(listenerDistance, 0.3, 3), 2);
    skeletonFootsteps[index].update(distance, gameStarted && !playback.paused && !gameEnded && skeleton.canAct && skeleton.root.visible, loudness);
  });
  bombCountdownSounds.setPaused(playback.paused || gameEnded || !gameStarted);
  cameraSystem.update(delta);
  scene.background?.userData?.updateCamera?.(camera);


  // Render
  renderer.render(
    scene,
    camera
  );

  // The mini-map uses a clean icon for the active player. Temporarily hide
  // both full-size character models so they do not obscure the map.
  const bomberWasVisible = bomber.root.visible;
  const extraVisibility = extraSkeletons.map(({ skeleton }) => skeleton.root.visible);
  const femaleWasVisible = femaleBomber.root.visible;
  bomber.root.visible = false;
  extraSkeletons.forEach(({ skeleton }) => { skeleton.root.visible = false; });
  femaleBomber.root.visible = false;
  const levelFog = scene.fog;
  const levelBackground = scene.background;
  const levelEnvironmentIntensity = scene.environmentIntensity;
  const levelLightVisibility = levelLights.map((light) => light.visible);
  scene.fog = null;
  scene.background = miniMapBackground;
  scene.environmentIntensity = 1;
  levelLights.forEach((light) => { light.visible = false; });
  miniMapLight.visible = true;
  miniMapRenderer.render(scene, miniMapCamera);
  miniMapLight.visible = false;
  levelLights.forEach((light, index) => { light.visible = levelLightVisibility[index]; });
  scene.environmentIntensity = levelEnvironmentIntensity;
  scene.background = levelBackground;
  scene.fog = levelFog;
  bomber.root.visible = bomberWasVisible;
  extraSkeletons.forEach(({ skeleton }, index) => { skeleton.root.visible = extraVisibility[index]; });
  femaleBomber.root.visible = femaleWasVisible;

  if (miniMapPlayer) {
    const markerPosition = femaleBomber.root.getWorldPosition(new THREE.Vector3())
      .project(miniMapCamera);
    miniMapPlayer.style.left = `${(markerPosition.x * 0.5 + 0.5) * 100}%`;
    miniMapPlayer.style.top = `${(-markerPosition.y * 0.5 + 0.5) * 100}%`;
    const markerAngle = -THREE.MathUtils.radToDeg(femaleBomber.root.rotation.y);
    miniMapPlayer.style.transform =
      `translate(-50%, -58%) rotate(${markerAngle}deg)`;
  }
}


// ============================================================
// START
// ============================================================

animate();
