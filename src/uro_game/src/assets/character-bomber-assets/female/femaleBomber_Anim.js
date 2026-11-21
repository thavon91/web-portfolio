import { privateAssetUrl } from "../../../privateAssets.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
const modelUrl = privateAssetUrl("character-bomber-assets/female/femaleRig.glb");
const idleUrl = privateAssetUrl("character-bomber-assets/female/femaleStandingIdle.fbx");
const runUrl = privateAssetUrl("character-bomber-assets/female/femaleSlowRun.fbx");
const deathUrl = privateAssetUrl("character-bomber-assets/female/femaleStandingDeathLeft.fbx");
import { upgradeFireRange } from "../../fires/fire_pickups.js";

export function createFemaleBomber({ targetHeight = 0.5, onDeath = () => {}, onFall = () => {} } = {}) {
  const root = new THREE.Group();
  root.name = "FemaleBomber";
  root.visible = false;
  let loadPromise;
  let mixer;
  let idleAction;
  let runAction;
  let activeAction;
  let world;
  let input = { x: 0, z: 0 };
  let groundY = null;
  let slideSide = 1;
  let slideAngle = 0;
  let slideTime = 0;
  let groundRootOffset = 0;
  let availableBombs = 3;
  let bombCapacity = 3;
  let fireRange = 1;
  let deathAction;
  let characterModel;
  let dying = false;
  let fallSoundPlayed = false;
  let invulnerable = false;
  let deathHip;
  let deathHipRestPosition;

  function bounds() {
    root.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(root, true);
  }

  function placeFeetOnGround(y) {
    groundY = y;
    root.position.y += y - bounds().min.y;
    groundRootOffset = root.position.y - y;
  }

  function makeClip(source, character, name, plantFeet = false) {
    const clip = source.animations[0]?.clone();
    if (!clip) throw new Error(`${name} FBX contains no animation.`);
    const normalize = (name) => name.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const bones = new Map();
    character.traverse((object) => {
      if (object.isBone) bones.set(normalize(object.name), object);
    });
    clip.tracks = clip.tracks.filter((track) => {
      const separator = track.name.lastIndexOf(".");
      const bone = bones.get(normalize(track.name.slice(0, separator)));
      const property = track.name.slice(separator + 1);
      if (!bone) return false;
      // The source idle moves the lower body without matching root movement.
      // Keep the rig's planted lower-body pose to prevent foot skating.
      if (plantFeet && /(hips|upleg|leg|foot|toe)/.test(normalize(bone.name))) return false;
      if (property === "position" && name === "StandingDeathLeft" &&
          normalize(bone.name).endsWith("hips")) {
        // Retarget vertical collapse relative to the first FBX frame rather
        // than applying centimeter-sized FBX coordinates to the GLB rig.
        const baseline = track.values[1];
        const ratio = Math.abs(baseline) > 1e-8 ? Math.abs(bone.position.y / baseline) : 0;
        deathHip = bone;
        deathHipRestPosition = bone.position.clone();
        for (let i = 0; i < track.values.length; i += 3) {
          track.values[i] = bone.position.x;
          track.values[i + 1] = bone.position.y + (track.values[i + 1] - baseline) * ratio;
          track.values[i + 2] = bone.position.z;
        }
      } else if (property !== "quaternion") return false;
      track.name = `${bone.uuid}.${property}`;
      return true;
    });
    if (!clip.tracks.length) throw new Error(`Female ${name} animation does not match the rig.`);
    clip.name = name;
    return clip;
  }

  function play(action) {
    if (!action || action === activeAction) return;
    action.reset().play();
    activeAction?.crossFadeTo(action, 0.15, false);
    activeAction = action;
  }

  function move(delta, settings) {
    if (!world || !root.visible || (!input.x && !input.z)) {
      slideTime = 0;
      return false;
    }
    const distance = Math.min(delta, 0.1) * settings.speed;
    const length = Math.hypot(input.x, input.z);
    const dx = input.x / length;
    const dz = input.z / length;
    const radius = settings.height * 0.16;
    const stepSize = Math.max(radius * 0.4, 0.005);
    const steps = Math.max(1, Math.ceil(distance / stepSize));
    let moved = false;
    slideTime = Math.max(0, slideTime - delta);
    const tryStep = (x, z) => {
      if (groundY === null) return false;
      const currentFloorY = groundY - settings.groundOffset;
      if (!world.canOccupy(x, z, currentFloorY, radius, settings.height)) return false;
      const y = world.groundAt(x, z);
      if (y === null || Math.abs(y - currentFloorY) > 0.1 ||
          !world.canOccupy(x, z, y, radius, settings.height)) return false;
      root.position.set(x, y + settings.groundOffset + groundRootOffset, z);
      groundY = y + settings.groundOffset;
      return true;
    };
    const tryAngle = (angle, stride) => {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const sx = dx * cos - dz * sin;
      const sz = dx * sin + dz * cos;
      return tryStep(root.position.x + sx * stride, root.position.z + sz * stride);
    };
    for (let i = 0; i < steps; i++) {
      const stride = distance / steps;
      let stepped = slideTime > 0 && tryAngle(slideAngle, stride);
      if (!stepped) {
        slideTime = 0;
        stepped = tryStep(root.position.x + dx * stride, root.position.z + dz * stride);
      }
      if (!stepped) {
        // Seek a nearby direction with forward progress, keeping the same
        // side of an obstacle until there is a clear path again.
        for (const degrees of [20, 40, 60, 75]) {
          for (const side of [slideSide, -slideSide]) {
            const angle = THREE.MathUtils.degToRad(degrees) * side;
            if (tryAngle(angle, stride)) {
              slideSide = side;
              slideAngle = angle;
              slideTime = 0.12;
              stepped = true;
              break;
            }
          }
          if (stepped) break;
        }
      }
      if (!stepped) break;
      moved = true;
    }
    if (moved) {
      const targetYaw = Math.atan2(dx, dz);
      const yawDifference = Math.atan2(
        Math.sin(targetYaw - root.rotation.y),
        Math.cos(targetYaw - root.rotation.y),
      );
      root.rotation.y += yawDifference * Math.min(1, delta * 12);
      settings.x = root.position.x;
      settings.z = root.position.z;
      settings.rotation = THREE.MathUtils.radToDeg(root.rotation.y);
    }
    return moved;
  }

  function load() {
    if (loadPromise) return loadPromise;
    const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
    loadPromise = (async () => {
      const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(modelUrl);
      root.add(gltf.scene);
      gltf.scene.traverse((object) => {
        if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      characterModel = gltf.scene;
      const height = bounds().getSize(new THREE.Vector3()).y;
      if (!Number.isFinite(height) || height <= 0) throw new Error("Invalid female rig height.");
      gltf.scene.scale.multiplyScalar(targetHeight / height);
      const center = bounds().getCenter(new THREE.Vector3());
      gltf.scene.position.x -= center.x - root.position.x;
      gltf.scene.position.z -= center.z - root.position.z;
      placeFeetOnGround(root.position.y);
      const source = await new FBXLoader().loadAsync(idleUrl);
      const running = await new FBXLoader().loadAsync(runUrl);
      const death = await new FBXLoader().loadAsync(deathUrl);
      mixer = new THREE.AnimationMixer(gltf.scene);
      idleAction = mixer.clipAction(makeClip(source, gltf.scene, "StandingIdle", true));
      idleAction.setLoop(THREE.LoopRepeat, Infinity).play();
      runAction = mixer.clipAction(makeClip(running, gltf.scene, "SlowRun"));
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      deathAction = mixer.clipAction(makeClip(death, gltf.scene, "StandingDeathLeft"));
      deathAction.setLoop(THREE.LoopOnce, 1);
      deathAction.clampWhenFinished = true;
      activeAction = idleAction;
      mixer.update(0);
      return root;
    })().finally(() => draco.dispose());
    return loadPromise;
  }

  return {
    get fireRange() { return fireRange; },
    collectFire(currentRange = fireRange) {
      fireRange = upgradeFireRange(currentRange);
      return fireRange;
    },
    get canAct() { return !dying; },
    get damageProtected() { return dying || invulnerable; },
    setProtection(value) { invulnerable = value; },
    setBlinkVisible(value) { if (characterModel) characterModel.visible = value; },
    die() {
      if (dying) return deathAction?.getClip().duration ?? 1;
      dying = true;
      fallSoundPlayed = false;
      onDeath();
      input = { x: 0, z: 0 };
      play(deathAction);
      return deathAction?.getClip().duration ?? 1;
    },
    respawn(x, z, floorY, settings) {
      mixer?.stopAllAction();
      if (deathHip && deathHipRestPosition) deathHip.position.copy(deathHipRestPosition);
      activeAction = null;
      dying = false;
      slideTime = 0;
      input = { x: 0, z: 0 };
      play(idleAction);
      mixer?.update(0);
      groundY = floorY + settings.groundOffset;
      root.position.set(x, groundY + groundRootOffset, z);
      root.visible = true;
      if (characterModel) characterModel.visible = true;
      settings.x = x; settings.z = z;
    },
    get availableBombs() { return availableBombs; },
    get bombCapacity() { return bombCapacity; },
    collectBomb() { bombCapacity++; availableBombs++; },
    consumeBomb() {
      if (availableBombs <= 0) return false;
      availableBombs--;
      return true;
    },
    restoreBomb() { availableBombs = Math.min(bombCapacity, availableBombs + 1); },
    root,
    load,
    setPosition: (x, y, z) => root.position.set(x, y, z),
    setRotation: (radians) => { root.rotation.y = radians; },
    placeFeetOnGround,
    idle: () => idleAction?.play(),
    setWorld: (value) => { world = value; },
    setInput: (x, z) => { input = { x, z }; },
    update: (delta, settings) => {
      if (!mixer) return;
      if (!dying) play(move(delta, settings) ? runAction : idleAction);
      mixer.update(delta);
      if (dying && !fallSoundPlayed && (!deathAction || deathAction.time >= deathAction.getClip().duration * 0.45)) {
        fallSoundPlayed = true;
        onFall();
      }
    },
    get animationTime() { return mixer?.time ?? 0; },
  };
}
