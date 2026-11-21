import { privateAssetUrl } from "../../privateAssets.js";
import * as THREE from "three";
import { upgradeFireRange } from "../fires/fire_pickups.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
const modelUrl = privateAssetUrl("skeleton-bomber-assets/skeletonRig.glb");
const idleUrl = privateAssetUrl("skeleton-bomber-assets/skeletonStandingIdle.fbx");
const walkUrl = privateAssetUrl("skeleton-bomber-assets/skeletonSlowRun.fbx");
const deathUrl = privateAssetUrl("skeleton-bomber-assets/skeletonDeath.fbx");

// Keep GLB materials; animate its existing skeleton with the Mixamo idle.
export function createBomber({ targetHeight = 0.09, modelSource = modelUrl, idleSource = idleUrl, walkSource = walkUrl, deathSource = deathUrl, name = "SkeletonBomber", onDeath = () => {}, onFall = () => {} } = {}) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  let pendingLoad;
  let mixer;
  let idleAction;
  let walkAction;
  let deathAction;
  let dying = false;
  let deathRemaining = 0;
  let activeAction;
  let world;
  let direction = new THREE.Vector3(0, 0, 1);
  let turnTime = 0;
  let groundY = 0;
  let footOffset = 0;
  let aiTarget = null;
  let aiWaiting = false;
  let emergencyEscape = false;
  const getMoveSpeed = (settings) => settings.speed * (emergencyEscape ? 1.6 : 1);
  let availableBombs = 1;
  let bombCapacity = 1;
  let fireRange = 1;
  const corridorDirections = [
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  ];
  function chooseOpenDirection(radius, height, blocked = false) {
    // Check a short stretch of corridor, not just a single nearby point.
    const clearance = Math.max(radius * 3, 0.12);
    const open = corridorDirections.filter((candidate) => {
      for (let sample = 1; sample <= 3; sample++) {
        const x = root.position.x + candidate.x * clearance * sample / 3;
        const z = root.position.z + candidate.z * clearance * sample / 3;
        const y = world.groundAt(x, z);
        if (y === null || Math.abs(y - groundY) > 0.1 ||
            !world.canOccupy(x, z, y, radius, height)) return false;
      }
      return true;
    });
    if (!open.length) { turnTime = 0.3; return; }
    // Prefer a new corridor; reverse when the current corridor is a dead end.
    const turns = open.filter((candidate) => Math.abs(candidate.dot(direction)) < 0.5);
    const forward = open.filter((candidate) => candidate.dot(direction) > 0.5);
    const options = turns.length ? turns : (!blocked && forward.length ? forward : open);
    direction.copy(options[Math.floor(Math.random() * options.length)]);
    turnTime = 1.5 + Math.random() * 2;
  }
  function setAction(action) {
    if (!action || action === activeAction) return;
    action.reset().play();
    activeAction?.crossFadeTo(action, 0.15, false);
    activeAction = action;
  }
  function update(delta, settings) {
    mixer?.update(delta);
    if (dying) {
      deathRemaining = Math.max(0, deathRemaining - delta);
      if (deathRemaining === 0) root.visible = false;
      return;
    }
    if (!world || !mixer || !root.visible || !settings?.autoMove) {
      setAction(idleAction);
      return;
    }
    // Rest and escape priorities are controlled by the AI.
    if (aiWaiting) { setAction(idleAction); return; }
    const height = settings.height;
    const radius = height * 0.16;
    let distance = Math.min(delta, 0.1) * getMoveSpeed(settings);
    if (aiTarget) {
      const dx = aiTarget.x - root.position.x, dz = aiTarget.z - root.position.z;
      if (Math.abs(dx) > 0.00001) { direction.set(Math.sign(dx), 0, 0); distance = Math.min(distance, Math.abs(dx)); }
      else if (Math.abs(dz) > 0.00001) { direction.set(0, 0, Math.sign(dz)); distance = Math.min(distance, Math.abs(dz)); }
      else { setAction(idleAction); return; }
    }
    const steps = Math.max(1, Math.ceil(distance / Math.max(radius * 0.4, 0.005)));
    let moved = false;
    turnTime -= delta;
    if (!aiTarget && turnTime <= 0) {
      chooseOpenDirection(radius, height);
    }
    for (let step = 0; step < steps; step++) {
      const x = root.position.x + direction.x * distance / steps;
      const z = root.position.z + direction.z * distance / steps;
      const y = world.groundAt(x, z);
      if (y === null || Math.abs(y - groundY) > 0.1 ||
          !world.canOccupy(x, z, y, radius, height)) {
        if (!aiTarget) chooseOpenDirection(radius, height, true);
        break;
      }
      root.position.set(x, y + settings.groundOffset + footOffset, z);
      groundY = y;
      moved = true;
    }
    if (moved) {
      root.rotation.y = Math.atan2(direction.x, direction.z);
      settings.x = root.position.x;
      settings.z = root.position.z;
      settings.rotation = THREE.MathUtils.radToDeg(root.rotation.y);
    }
    setAction(moved ? walkAction : idleAction);
  }
  const normalizeBoneName = (name) => name.replace(/[^a-z0-9]/gi, "").toLowerCase();
  function createIdleClip(source, character, plantFeet = false) {
    const clip = source.animations[0]?.clone();
    if (!clip) throw new Error("Idle FBX contains no animation.");
    const bones = new Map();
    character.traverse((object) => {
      if (object.isBone) bones.set(normalizeBoneName(object.name), object);
    });
    const tracks = [];
    for (const track of clip.tracks) {
      const separator = track.name.lastIndexOf(".");
      const name = track.name.slice(0, separator);
      const property = track.name.slice(separator + 1);
      const bone = bones.get(normalizeBoneName(name));
      if (!bone) continue;
      // Keep boots planted during idle. The run clip still animates the legs.
      if (plantFeet && /(hips|upleg|leg|foot|toe)/.test(normalizeBoneName(bone.name))) continue;
      if (property === "position") {
        // Preserve limb lengths and lock horizontal root motion. Convert only
        // hip bobbing to the compressed rig's units, relative to its rest pose.
        if (!normalizeBoneName(bone.name).endsWith("hips")) continue;
        const baseline = track.values[1];
        const ratio = Math.abs(baseline) > 1e-8 ? Math.abs(bone.position.y / baseline) : 0.01;
        for (let i = 0; i < track.values.length; i += 3) {
          track.values[i] = bone.position.x;
          track.values[i + 1] = bone.position.y + (track.values[i + 1] - baseline) * ratio;
          track.values[i + 2] = bone.position.z;
        }
      } else if (property !== "quaternion") continue;
      track.name = `${bone.uuid}.${property}`;
      tracks.push(track);
    }
    if (!tracks.length) throw new Error("Idle animation does not match the character skeleton.");
    clip.tracks = tracks;
    clip.name = "StandingIdle";
    return clip;
  }
  function bounds() {
    root.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(root, true);
  }
  function setPosition(x, y, z) { root.position.set(x, y, z); }
  function placeFeetOnGround(y) {
    root.position.y += y - bounds().min.y;
    root.updateMatrixWorld(true);
    footOffset = root.position.y - y;
    groundY = y;
  }
  function load() {
    if (pendingLoad) return pendingLoad;
    const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    pendingLoad = loader.loadAsync(modelSource).then(async (gltf) => {
      root.add(gltf.scene);
      gltf.scene.traverse((object) => {
        if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      const height = bounds().getSize(new THREE.Vector3()).y;
      if (!Number.isFinite(height) || height <= 0) throw new Error("Invalid character height.");
      gltf.scene.scale.multiplyScalar(targetHeight / height);
      const center = bounds().getCenter(new THREE.Vector3());
      gltf.scene.position.x -= center.x - root.position.x;
      gltf.scene.position.z -= center.z - root.position.z;
      placeFeetOnGround(root.position.y);
      const source = await new FBXLoader().loadAsync(idleSource);
      const clip = createIdleClip(source, gltf.scene, true);
      const walkClip = walkSource
        ? createIdleClip(await new FBXLoader().loadAsync(walkSource), gltf.scene)
        : null;
      if (walkClip) walkClip.name = "SlowRun";
      const deathClip = deathSource
        ? createIdleClip(await new FBXLoader().loadAsync(deathSource), gltf.scene)
        : null;
      if (deathClip) deathClip.name = "Death";
      mixer = new THREE.AnimationMixer(gltf.scene);
      idleAction = mixer.clipAction(clip);
      idleAction.setLoop(THREE.LoopRepeat, Infinity).play();
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
      }
      if (deathClip) {
        deathAction = mixer.clipAction(deathClip);
        deathAction.setLoop(THREE.LoopOnce, 1);
        deathAction.clampWhenFinished = true;
      }
      activeAction = idleAction;
      mixer.update(0);
      return root;
    }).finally(() => draco.dispose());
    return pendingLoad;
  }
  return { root, load, setPosition, placeFeetOnGround,
    get canAct() { return !dying; },
    get deathAnimationFinished() {
      return dying && (!deathAction || deathAction.time >= deathAction.getClip().duration - 0.00001);
    },
    die() {
      if (dying) return;
      dying = true;
      onDeath();
      // Play the bone impact at death onset, not partway through a long clip.
      onFall();
      aiTarget = null;
      aiWaiting = true;
      deathRemaining = (deathAction?.getClip().duration ?? 0) + 3;
      setAction(deathAction);
    },
    get availableBombs() { return availableBombs; },
    consumeBomb() { if (!availableBombs) return false; availableBombs--; return true; },
    restoreBomb() { availableBombs = Math.min(bombCapacity, availableBombs + 1); },
    collectBomb() { bombCapacity++; availableBombs++; },
    get bombCapacity() { return bombCapacity; },
    get fireRange() { return fireRange; },
    collectFire() { fireRange = upgradeFireRange(fireRange); return fireRange; },
    setAiTarget(target, waiting = false) { aiTarget = target; aiWaiting = waiting; },
    setEscapeMode(value) { emergencyEscape = Boolean(value); },
    getMoveSpeed,
    update,
    setWorld: (value) => { world = value; },
    idle: () => { idleAction?.play(); },
    get animationTime() { return mixer?.time ?? 0; },
    setRotation: (radians) => { root.rotation.y = radians; },
  };
}
