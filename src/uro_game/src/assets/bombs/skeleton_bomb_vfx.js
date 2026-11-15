import { Vector3, Vector4, AdditiveBlending } from "three";
import { BatchedParticleRenderer, QuarksLoader, ConstantValue, IntervalValue, ConstantColor, Gradient } from "three.quarks";

// One renderer and one loaded template shared by every skeleton explosion.
export function createSkeletonBombVfx({ scene, collision, flowerTexture = null }) {
  const renderer = new BatchedParticleRenderer();
  renderer.name = flowerTexture ? "FemaleJampaExplosionParticles" : "SkeletonExplosionParticles";
  scene.add(renderer);
  const instances = [];
  let template = null, disposed = false;
  const ready = new QuarksLoader().loadAsync(`${import.meta.env.BASE_URL}vfx/skeleton-explosion/subEmitter2.json`)
    .then((object) => {
      // ObjectLoader.loadAsync can bypass QuarksLoader's synchronous linking.
      const nodes = new Map();
      object.traverse((node) => nodes.set(node.uuid, node));
      object.traverse((node) => {
        if (node.system?.material) {
          node.system.material.toneMapped = false;
          node.system.material.depthWrite = false;
          if (flowerTexture) {
            node.system.material.map = flowerTexture;
            node.system.material.color.set(0xffffff);
            node.system.material.transparent = true;
            node.system.material.blending = AdditiveBlending;
            node.system.uTileCount = node.system.vTileCount = 1;
            node.system.blendTiles = false;
            node.system.behaviors = node.system.behaviors.filter((behavior) =>
              !["ColorOverLife", "FrameOverLife"].includes(behavior.type));
          }
        }
        for (const behavior of node.system?.behaviors ?? []) {
          if (behavior.type === "EmitSubParticleSystem" && typeof behavior.subParticleSystem === "string")
            behavior.subParticleSystem = nodes.get(behavior.subParticleSystem);
        }
      });
      if (!disposed) template = object;
    })
    .catch((error) => { console.error("Skeleton explosion VFX failed to load:", error); });

  function spawn(point, scale, density) {
    if (!template || disposed || instances.length >= 24) return false;
    const effect = template.clone(true);
    // Cloned sub-emitter behaviors still reference the template's child.
    // Rebind them to this instance so simultaneous explosions stay independent.
    const originals = [], copies = [];
    template.traverse((node) => originals.push(node));
    effect.traverse((node) => copies.push(node));
    const references = new Map(originals.map((node, i) => [node, copies[i]]));
    const systems = [];
    effect.traverse((node) => {
      if (node.type !== "ParticleEmitter") return;
      const system = node.system;
      const trail = node.name === "SmokeTrailEmitter";
      const smoke = node.name.includes("Smoke") || system.onlyUsedByOther;
      const flying = node.name === "SparksEmitter" || node.name === "FireBallEmitter";
      system.startColor = new ConstantColor(new Vector4(1, 1, 1, system.startColor.color?.w ?? 1));
      if (flowerTexture) system.startColor = new ConstantColor(new Vector4(1, 0.04, 0.01, 1));
      if (["SphereEmitter", "NovaEmitter", "NukeConeExplosionBlueEmitter"].includes(node.name)) {
        const size = system.startSize.clone();
        const generate = size.genValue.bind(size);
        size.genValue = (...args) => generate(...args) * 0.35;
        system.startSize = size;
      }
      if (smoke) {
        system.startSpeed = new IntervalValue(trail ? 0.25 : 0.03, trail ? 0.55 : 0.18);
        // Preserve the source's longer smoke lifetimes so the cloud can rise
        // and the moving parent leaves a connected trail, not scattered dots.
      }
      if (system.onlyUsedByOther) {
        system.startSize = new IntervalValue(0.04, 0.065);
        system.emissionOverDistance = new ConstantValue(40);
      }
      if (smoke) {
        const size = system.startSize.clone();
        const generate = size.genValue.bind(size);
        size.genValue = (...args) => generate(...args) * 0.8;
        system.startSize = size;
      }
      if (flying) {
        system.startSpeed = new IntervalValue(0.2, 0.65);
        system.startLife = new IntervalValue(0.15, 0.4);
      }
      for (const behavior of system.behaviors) {
        if (behavior.type === "ColorOverLife") {
          const gradient = smoke
            ? new Gradient([[new Vector3(0.3, 0.48, 0.75), 0], [new Vector3(0.15, 0.2, 0.3), 1]])
            : new Gradient([[new Vector3(1, 0.95, 0.45), 0], [new Vector3(1, 0.42, 0.05), 0.45], [new Vector3(0.85, 0.12, 0.02), 1]]);
          if (behavior.color.alpha?.clone) gradient.alpha = behavior.color.alpha.clone();
          behavior.color = gradient;
        }
        if (behavior.type === "EmitSubParticleSystem") {
          behavior.subParticleSystem = references.get(behavior.subParticleSystem) ?? behavior.subParticleSystem;
          behavior.particleSystem = system;
        }
        if (smoke && behavior.type === "ForceOverLife") {
          behavior.x = new ConstantValue(0);
          behavior.y = new ConstantValue(trail ? -0.3 : 0.2);
          behavior.z = new ConstantValue(0);
        }
        if (smoke && behavior.type === "LimitSpeedOverLife") behavior.speed = new ConstantValue(0.55);
        if (flying && behavior.type === "ForceOverLife") {
          behavior.x = new ConstantValue(0);
          behavior.y = new ConstantValue(-0.4);
          behavior.z = new ConstantValue(0);
        }
        if (flying && behavior.type === "LimitSpeedOverLife") behavior.speed = new ConstantValue(0.65);
      }
      for (const burst of system.emissionBursts ?? []) {
        if (burst.count?.value !== undefined) {
          burst.count = burst.count.clone();
          burst.count.value = Math.max(1, Math.round(burst.count.value * density));
        }
      }
      system.autoDestroy = false;
      systems.push(system);
    });
    const floor = collision.groundAt(point.x, point.z);
    effect.position.set(point.x, floor === null ? point.y : floor + 0.08, point.z);
    effect.scale.setScalar(scale);
    scene.add(effect);
    effect.updateMatrixWorld(true);
    for (const system of systems) { renderer.addSystem(system); system.restart(); }
    instances.push({ effect, systems, age: 0 });
    return true;
  }
  function remove(instance) {
    for (const system of instance.systems) { renderer.deleteSystem(system); system.dispose(); }
    instance.effect.removeFromParent();
  }
  return {
    ready,
    explode(origin, tiles) {
      if (!spawn(origin, 0.15, 1)) return false;
      // Small, sparse bursts mark valid blast cells without hiding the map.
      for (const tile of tiles.slice(1)) spawn(tile, 0.09, 0.3);
      return true;
    },
    update(delta) {
      for (let left = delta; left > 0; left -= 0.05) renderer.update(Math.min(left, 0.05));
      for (let i = instances.length - 1; i >= 0; i--) {
        instances[i].age += delta;
        if (instances[i].age >= 3.2) { remove(instances[i]); instances.splice(i, 1); }
      }
    },
    dispose() {
      disposed = true;
      instances.forEach(remove); instances.length = 0;
      renderer.removeFromParent(); renderer.dispose?.();
      const resources = new Set();
      template?.traverse((node) => {
        const system = node.system;
        if (!system) return;
        resources.add(system.instancingGeometry);
        resources.add(system.material);
        if (system.material?.map) resources.add(system.material.map);
      });
      resources.forEach((resource) => resource?.dispose());
      template = null;
    },
  };
}
