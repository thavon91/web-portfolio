export function createPlayerRespawn({ player, settings, spawn, collision, isSafe, getLife, setLife, onGameOver = () => {}, onRespawn = () => {} }) {
  let state = "alive";
  let remaining = 0;
  let stopRespawnSound;
  let protectionDuration = 2;
  function hit() {
    if (state !== "alive" || player.damageProtected) return false;
    setLife(Math.max(0, getLife() - 1));
    remaining = player.die();
    state = "dying";
    return true;
  }
  function safeSpawn() {
    const candidates = [{ x: spawn.x, z: spawn.z }];
    for (let ring = 1; ring <= 24; ring++) {
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dz = -ring; dz <= ring; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
          candidates.push({ x: spawn.x + dx * 0.3, z: spawn.z + dz * 0.3 });
        }
      }
    }
    for (const point of candidates) {
      const y = collision.groundAt(point.x, point.z);
      if (y !== null && collision.canOccupy(point.x, point.z, y, settings.height * 0.16, settings.height, true) && isSafe(point.x, point.z)) return { ...point, y };
    }
    return null;
  }
  function update(delta) {
    if (state === "alive" || state === "gameover") return;
    remaining -= delta;
    if (state === "protected") {
      // Start visibly on the respawn frame before the protection blink begins.
      player.setBlinkVisible(Math.floor((protectionDuration - remaining) * 8) % 2 === 0);
      if (remaining <= 0) {
        stopRespawnSound?.();
        stopRespawnSound = null;
        player.setBlinkVisible(true); player.setProtection(false); state = "alive";
      }
      return;
    }
    if (remaining > 0) return;
    if (state === "dying") {
      player.root.visible = false;
      if (getLife() <= 0) { state = "gameover"; onGameOver(); return; }
      state = "waiting"; remaining = 0.5; return;
    }
    const point = safeSpawn();
    if (!point) { remaining = 0.25; return; }
    player.respawn(point.x, point.z, point.y, settings);
    player.setProtection(true);
    const sound = onRespawn();
    protectionDuration = Number.isFinite(sound?.duration) && sound.duration > 0 ? sound.duration : 2;
    stopRespawnSound = sound?.stop;
    state = "protected"; remaining = protectionDuration;
  }
  return { hit, update, get state() { return state; } };
}
