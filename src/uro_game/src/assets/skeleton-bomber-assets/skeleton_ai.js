// Breadth-first search for reachable cover. Planning never destroys ditches.
export function findEscapePath({ start, walkable, dangerous, maxDistance, step = 0.3, maxNodes = 600 }) {
  const queue = [{ x: start.x, z: start.z, path: [] }];
  const visited = new Set(["0,0"]);
  for (let index = 0; index < queue.length && index < maxNodes; index++) {
    const node = queue[index];
    if (node.path.length && !dangerous(node.x, node.z)) return node.path;
    if ((node.path.length + 1) * step > maxDistance) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = node.x + dx * step, z = node.z + dz * step;
      const key = `${Math.round((x - start.x) / step)},${Math.round((z - start.z) / step)}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (!walkable(node, { x, z }, (node.path.length + 1) * step)) continue;
      queue.push({ x, z, path: [...node.path, { x, z }] });
    }
  }
  return null;
}

export function createSkeletonAI({ skeleton, settings, collision, bombs, boxes, pickups, firePickups, getOpponent = () => null, random = Math.random }) {
  let cooldown = 7 + random() * 6;
  let nextPlacementAt = 0;
  let path = [];
  let escapeUntil = 0;
  let elapsed = 0;
  let pickupTarget = null;
  let pickupCheck = 0;
  let dangerAt = () => false;
  let escaping = false;
  let timeUntilRest = 4 + random() * 3;
  let restRemaining = 0;
  let escapeRoute = false;
  function update(delta) {
    elapsed += delta;
    if (!skeleton.root.visible || skeleton.canAct === false || !collision.loaded) return;
    const position = skeleton.root.position;
    if (bombs.isFireAt(position.x, position.z)) { skeleton.die(); return; }
    if (!settings.autoMove) return;
    const active = bombs.getBombs();
    // Propagate earlier fuse times through chain reactions, including revealed
    // explosive rewards. A nearby three-second bomb may actually fire sooner.
    const threats = active.map((bomb) => ({ ...bomb, tiles: bombs.predictBlast(bomb.position, bomb.range) }));
    for (const pickup of pickups?.getRevealedBombs() ?? []) {
      const p = pickup.getWorldPosition(pickup.position.clone());
      threats.push({ position: p, remaining: Infinity, tiles: bombs.predictBlast(p, 22) });
    }
    for (let pass = 0; pass < threats.length; pass++) {
      for (const source of threats) for (const target of threats) {
        if (source.tiles.some((tile) => Math.abs(tile.x - target.position.x) < 0.16 && Math.abs(tile.z - target.position.z) < 0.16))
          target.remaining = Math.min(target.remaining, source.remaining);
      }
    }
    const dangerTiles = threats.filter((bomb) => Number.isFinite(bomb.remaining)).flatMap((bomb) => bomb.tiles);
    const danger = (x, z) => bombs.isFireAt(x, z) || dangerTiles.some((tile) => Math.abs(tile.x - x) < 0.22 && Math.abs(tile.z - z) < 0.22);
    // Collect just outside the reward's blocking radius, including the
    // character's own footprint. Otherwise larger skeletons cannot reach it.
    const pickupRange = Math.max(0.16, 0.1 + settings.height * 0.16 + 0.025);
    dangerAt = danger;
    escaping = danger(position.x, position.z);
    if (escaping) restRemaining = 0;
    skeleton.setEscapeMode?.(escaping || escapeRoute);
    const moveSpeed = skeleton.getMoveSpeed?.(settings) ?? settings.speed;
    // Enemy/player bombs must interrupt approaches as well as pickup hunts.
    if (escaping && !escapeRoute) { path = []; pickupTarget = null; }
    if (!danger(position.x, position.z)) {
      const collected = pickups?.collectAt(position, pickupRange) ?? 0;
      for (let i = 0; i < collected; i++) skeleton.collectBomb();
      const fires = firePickups?.collectAt(position, pickupRange) ?? 0;
      for (let i = 0; i < fires; i++) skeleton.collectFire();
    }
    if (pickupTarget && (danger(position.x, position.z) ||
        ![...(pickups?.getRevealedBombs() ?? []), ...(firePickups?.getRevealed() ?? [])].includes(pickupTarget))) {
      path = [];
      pickupTarget = null;
    }
    const walkable = (from, to, travelDistance = 0) => {
      if (!boxes.getTileAt(to)) return false;
      const floor = collision.groundAt(from.x, from.z);
      // Follow the same X-then-Z alignment used by the character controller.
      for (let i = 1; i <= 12; i++) {
        const x = i <= 6 ? from.x + (to.x - from.x) * i / 6 : to.x;
        const z = i <= 6 ? from.z : from.z + (to.z - from.z) * (i - 6) / 6;
        const y = collision.groundAt(x, z);
        if (bombs.isFireAt(x, z) || !bombs.canWalkAt(x, z, settings.height * 0.16, position, skeleton)) return false;
        if (travelDistance && threats.some((bomb) => bomb.remaining <= travelDistance / Math.max(moveSpeed, 0.01) + 0.12 &&
            bomb.tiles.some((tile) => Math.abs(tile.x - x) < 0.22 && Math.abs(tile.z - z) < 0.22))) return false;
        if (pickups?.canWalkAt && !pickups.canWalkAt(x, z, settings.height * 0.16)) return false;
        if (floor === null || y === null || Math.abs(y - floor) > 0.1 || !collision.canOccupy(x, z, y, settings.height * 0.16, settings.height, true)) return false;
      }
      return true;
    };
    // Rest applies to pursuit and pickup routes too, not only random roaming.
    // Never delay an escape or resume an interrupted rest under threat.
    if (!escaping && !escapeRoute) {
      const tick = Math.min(delta, 0.1);
      if (restRemaining > 0) {
        restRemaining = Math.max(0, restRemaining - tick);
        skeleton.setAiTarget(null, true);
        return;
      }
      timeUntilRest -= tick;
      if (timeUntilRest <= 0) {
        restRemaining = 2 + random();
        timeUntilRest = 4 + random() * 3;
        skeleton.setAiTarget(null, true);
        return;
      }
    }
    if (path.length && Math.hypot(position.x - path[0].x, position.z - path[0].z) < 0.0001) path.shift();
    if (path.length) {
      let from = position, distance = 0;
      for (const waypoint of path) {
        distance += Math.abs(waypoint.x - from.x) + Math.abs(waypoint.z - from.z);
        if (!walkable(from, waypoint, distance)) { path = []; break; }
        from = waypoint;
      }
    }
    if (path.length && danger(path[path.length - 1].x, path[path.length - 1].z)) path = [];
    if (path.length && !escapeRoute && path.some((point) => danger(point.x, point.z))) {
      path = []; pickupTarget = null;
    }
    if (!path.length && danger(position.x, position.z)) {
      // Use the earliest chain-adjusted fuse threatening THIS skeleton, not
      // an unrelated bomb elsewhere on the map.
      const nearby = threats.filter((bomb) => bomb.tiles.some((tile) =>
        Math.abs(tile.x - position.x) < 0.22 && Math.abs(tile.z - position.z) < 0.22));
      const timeLeft = Math.max(0, Math.min(3, ...nearby.map((bomb) => bomb.remaining)) - 0.15);
      // Smaller emergency steps find turns between tile centers instead of
      // declaring an off-grid character trapped and stopping in the blast.
      path = findEscapePath({ start: position, walkable, dangerous: danger, step: 0.1,
        maxDistance: moveSpeed * timeLeft }) ?? [];
      escapeRoute = path.length > 0;
    }
    if (path.length) { escaping = escapeRoute; skeleton.setEscapeMode?.(escapeRoute); skeleton.setAiTarget(path[0]); return; }
    escapeRoute = false;
    skeleton.setEscapeMode?.(false);
    pickupTarget = null;
    // Once outside every predicted blast, allow safe navigation and another
    // tactical placement. An active bomb elsewhere is not a global lock.
    if (elapsed < escapeUntil || danger(position.x, position.z)) { skeleton.setAiTarget(null, true); return; }
    // Occasionally seek a revealed reward. Escape always takes priority.
    pickupCheck -= delta;
    if (pickupCheck <= 0 && settings.speed > 0) {
      pickupCheck = 1 + random();
      {
        const rewards = [
          ...(pickups?.getRevealedBombs() ?? []).map((bomb) => ({ bomb,
            position: bomb.getWorldPosition(bomb.position.clone()) })),
          ...[...(firePickups?.getRevealed() ?? [])].map((entry) => ({ bomb: entry,
            position: entry.mesh.getWorldPosition(entry.mesh.position.clone()) })),
        ];
        const route = rewards.length ? findEscapePath({ start: position,
          walkable: (from, to) => !danger(to.x, to.z) && walkable(from, to),
          dangerous: (x, z) => !rewards.some((reward) => Math.hypot(x - reward.position.x, z - reward.position.z) <= pickupRange),
          maxDistance: 3, step: 0.1 }) : null;
        if (route) {
          const end = route[route.length - 1];
          pickupTarget = rewards.find((reward) => Math.hypot(end.x - reward.position.x, end.z - reward.position.z) <= pickupRange).bomb;
          path = route;
          skeleton.setAiTarget(path[0]);
          return;
        }
      }
    }
    skeleton.setAiTarget(null);
    cooldown -= delta;
    if (cooldown > 0 || elapsed < nextPlacementAt || skeleton.availableBombs <= 0 || settings.speed <= 0) return;
    cooldown = 0.8 + random() * 0.4;
    const tile = boxes.getTileAt(position);
    if (!tile || !walkable(position, tile)) return;
    const range = skeleton.fireRange ?? 1;
    const usefulness = (origin) => {
      const blast = bombs.predictBlast(origin, range);
      const opponent = getOpponent();
      let score = 0;
      for (const point of blast) {
        if (collision.obstacleAt?.(point.x, point.z)?.name.toLowerCase().includes("field_ditch")) score += 2;
        if (opponent && Math.abs(point.x - opponent.x) < 0.22 && Math.abs(point.z - opponent.z) < 0.22) score += 4;
      }
      return score;
    };
    const planCover = (origin) => {
      const blast = bombs.predictBlast(origin, range);
      // A revealed reward hit by our planned bomb explodes too. Include its
      // entire chain before deciding that a hiding spot is safe.
      const rewards = [...(pickups?.getRevealedBombs() ?? [])];
      const triggered = new Set();
      for (let pass = 0; pass < rewards.length; pass++) {
        for (const reward of rewards) {
          if (triggered.has(reward)) continue;
          const p = reward.getWorldPosition(reward.position.clone());
          if (!blast.some((tile) => Math.abs(tile.x - p.x) < 0.16 && Math.abs(tile.z - p.z) < 0.16)) continue;
          triggered.add(reward);
          blast.push(...bombs.predictBlast(p, 22));
        }
      }
      const threatened = (x, z) => danger(x, z) || blast.some((point) => Math.abs(point.x - x) < 0.25 && Math.abs(point.z - z) < 0.25);
      const canEscape = (from, to, distance) => {
        if (!walkable(from, to, distance)) return false;
        // Simulate the newly placed bomb's footprint, not just its center.
        // After stepping off it, the route may never cut back through it.
        const radius = settings.height * 0.16;
        const overlaps = (p) => Math.hypot(Math.max(0, Math.abs(p.x - origin.x) - 0.14),
          Math.max(0, Math.abs(p.z - origin.z) - 0.14)) < radius;
        for (let i = 1; i <= 6; i++) {
          const p = { x: from.x + (to.x - from.x) * i / 6, z: from.z + (to.z - from.z) * i / 6 };
          if (overlaps(p) && (!overlaps(from) ||
              Math.hypot(p.x - origin.x, p.z - origin.z) + 1e-8 < Math.hypot(from.x - origin.x, from.z - origin.z))) return false;
        }
        return true;
      };
      const hasExit = (x, z) => [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].some(([dx, dz]) =>
        !threatened(x + dx, z + dz) && walkable({ x, z }, { x: x + dx, z: z + dz }));
      return findEscapePath({ start: origin, walkable: canEscape,
        dangerous: (x, z) => threatened(x, z) || !hasExit(x, z), maxDistance: settings.speed * 1.8 });
    };
    const opponent = getOpponent();
    const threatensOpponent = (origin) => opponent && bombs.predictBlast(origin, range).some((point) =>
      Math.abs(point.x - opponent.x) < 0.22 && Math.abs(point.z - opponent.z) < 0.22);
    // Prefer a reachable firing lane to the female over unrelated ditch
    // destruction. Follow a short part of the route, then track her again.
    if (opponent && !threatensOpponent(tile)) {
      const attackRoute = findEscapePath({ start: position, maxDistance: 8,
        walkable: (from, to, distance) => !danger(to.x, to.z) && walkable(from, to, distance),
        dangerous: (x, z) => {
          const candidate = boxes.getTileAt({ x, z });
          return !candidate || !threatensOpponent(candidate) || !walkable({ x, z }, candidate) || !planCover(candidate);
        } });
      if (attackRoute) {
        path = attackRoute.slice(0, 2);
        cooldown = 0.5;
        skeleton.setAiTarget(path[0]);
        return;
      }
      // If ditches seal off the firing lane, the existing useful-bomb search
      // below clears an opening without bypassing walls or crater boundaries.
    }
    // Do not waste bombs in empty corridors. Seek a useful cell that already
    // has reachable cover, then recheck everything on arrival.
    if (!usefulness(tile) || !planCover(tile)) {
      const approach = findEscapePath({ start: position,
        walkable: (from, to, distance) => !danger(to.x, to.z) && walkable(from, to, distance),
        dangerous: (x, z) => {
          const candidate = boxes.getTileAt({ x, z });
          return !candidate || !walkable({ x, z }, candidate) || !usefulness(candidate) || !planCover(candidate);
        }, maxDistance: 1.8 });
      if (approach) { path = approach; cooldown = 0; skeleton.setAiTarget(path[0]); }
      return;
    }
    // Align BEFORE spawning: walking toward an off-center bomb after placing
    // conflicts with the outward-only exit rule and wastes escape time.
    if (Math.hypot(tile.x - position.x, tile.z - position.z) >= 0.0001) {
      cooldown = 0;
      path = [{ x: tile.x, z: tile.z }];
      skeleton.setAiTarget(path[0]);
      return;
    }
    const route = planCover(tile);
    if (!route || !bombs.placeAt(position, skeleton, range)) return;
    // A real placement limit, independent of approach/alignment replanning.
    nextPlacementAt = elapsed + 7 + random() * 6;
    path = route;
    escapeRoute = true;
    skeleton.setEscapeMode?.(true);
    escaping = true;
    escapeUntil = elapsed + 0.25;
    cooldown = 7 + random() * 6;
    skeleton.setAiTarget(path[0]);
  }
  return { update, canMoveAt: (x, z) => !bombs.isFireAt(x, z) && (escaping || !dangerAt(x, z)) };
}
