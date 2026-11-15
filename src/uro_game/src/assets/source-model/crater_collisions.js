// Detect circular depressions in the collision terrain, rather than guessing
// centers from a screenshot. Ignore large/edge-connected terrain skirts.
export const DEFAULT_CRATERS = [
  { x: 2.37, z: -0.12, radius: 0.61 },
  { x: 0.4, z: 2.23, radius: 0.61 },
  { x: -2.2, z: -1.57, radius: 0.51 },
];

export function detectCraters(bounds, groundAt, step = 0.08) {
  const samples = new Map(), heights = [];
  const columns = Math.floor((bounds.max.x - bounds.min.x) / step);
  const rows = Math.floor((bounds.max.z - bounds.min.z) / step);
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const x = bounds.min.x + col * step, z = bounds.min.z + row * step;
    const y = groundAt(x, z);
    if (y === null) continue;
    samples.set(`${col},${row}`, { x, z, y, col, row }); heights.push(y);
  }
  heights.sort((a, b) => a - b);
  const floor = heights[Math.floor(heights.length * 0.75)];
  const low = new Map([...samples].filter(([, p]) => p.y < floor - 0.06));
  const result = [];
  while (low.size) {
    const start = low.keys().next().value, queue = [low.get(start)]; low.delete(start);
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${p.col + dx},${p.row + dz}`;
        if (low.has(key)) { queue.push(low.get(key)); low.delete(key); }
      }
    }
    if (queue.length < 12 || queue.some((p) => p.col < 2 || p.row < 2 || p.col > columns - 2 || p.row > rows - 2)) continue;
    const minX = Math.min(...queue.map((p) => p.x)), maxX = Math.max(...queue.map((p) => p.x));
    const minZ = Math.min(...queue.map((p) => p.z)), maxZ = Math.max(...queue.map((p) => p.z));
    const width = maxX - minX, depth = maxZ - minZ;
    if (Math.max(width, depth) > 2 || Math.min(width, depth) / Math.max(width, depth) < 0.65) continue;
    result.push({ x: (minX + maxX) / 2, z: (minZ + maxZ) / 2,
      radius: Math.max(width, depth) / 2 + step * 1.5, y: floor });
  }
  // This level has three main craters. Small terrain dents are not hazards.
  return result.sort((a, b) => b.radius - a.radius).slice(0, 3)
    .sort((a, b) => a.x - b.x || a.z - b.z);
}

export function overlapsCrater(craters, x, z, radius = 0) {
  return craters.some((crater) => Math.hypot(x - crater.x, z - crater.z) < crater.radius + radius);
}

// Read the already-loaded terrain vertices instead of thousands of expensive
// Octree raycasts. Sampling here is just a lookup in a small spatial grid.
export function detectCratersFromVertices(bounds, vertices, step = 0.08) {
  const heights = vertices.map((p) => p.y).sort((a, b) => a - b);
  const baseline = heights[Math.floor(heights.length * 0.75)];
  const cells = new Map();
  for (const p of vertices) {
    const key = `${Math.round((p.x - bounds.min.x) / step)},${Math.round((p.z - bounds.min.z) / step)}`;
    cells.set(key, Math.min(cells.get(key) ?? Infinity, p.y));
  }
  return detectCraters(bounds, (x, z) => cells.get(`${Math.round((x - bounds.min.x) / step)},${Math.round((z - bounds.min.z) / step)}`) ?? baseline, step);
}
