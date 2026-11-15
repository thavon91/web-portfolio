import * as THREE from "three";

// Rows run top-to-bottom and columns left-to-right in the reference image.
// Editable layout of the red-marked empty spaces; never used as obstacles.
export const EMPTY_BOMB_ROWS = [
  [0, 1, 2, 3, 4, 16],
  [0, 6, 16],
  [0, 1, 5, 6, 16, 17, 18],
  [0, 6, 16],
  [2, 3, 4, 6],
  [0, 8, 15],
  [3, 6, 10, 11, 12, 15],
  [10],
  [0, 9, 10, 12, 14],
  [8, 10, 14, 16],
  [1, 10, 12, 14],
  [14, 15, 16],
  [0, 10, 15],
  [6, 8, 16],
  [0, 1, 2, 3, 4, 7, 10, 13, 15],
  [0, 6, 16],
  [2, 4, 5, 6, 7, 14],
];

export function createEmptyBoxForBombs({ scene }) {
  const originX = 3.624159526824951;
  const originZ = Number('2.7428091049194336');
  function getTileAt(position) {
    const column = Math.round((originX - position.x) / 0.3);
    const row = Math.round((originZ - position.z) / 0.3);
    if (column < 0 || column > 22 || row < 0 || row > 16) return null;
    return { row, column, x: originX - column * 0.3, y: 0.66798, z: originZ - row * 0.3 };
  }
  const root = new THREE.Group();
  root.name = "EmptyBoxForBombs";
  root.visible = false;
  scene.add(root);
  const settings = { visible: false, color: "#ff3333", opacity: 1 };
  const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.28, 0.28, 0.28));
  const material = new THREE.LineBasicMaterial({
    color: settings.color, transparent: true, opacity: 1, depthTest: false, depthWrite: false,
  });
  const positions = [];
  function apply() {
    root.visible = settings.visible;
    material.color.set(settings.color);
    material.opacity = settings.opacity;
  }
  function build() {
    root.clear();
    positions.length = 0;
    // The map's regular tile lattice, independent of debug wireframe visibility.
    for (const [row, columns] of EMPTY_BOMB_ROWS.entries()) {
      for (const column of columns) {
        const position = new THREE.Vector3(originX - column * 0.3, 0.66798, originZ - row * 0.3);
        const box = new THREE.LineSegments(geometry, material);
        box.name = `EmptyBombBox_${row}_${column}`;
        box.position.copy(position);
        box.userData = { row, column, nonBlocking: true };
        box.renderOrder = 10000;
        root.add(box);
        positions.push({ row, column, x: position.x, y: position.y, z: position.z });
      }
    }
    apply();
  }
  return {
    root, settings, build, apply, getTileAt,
    get count() { return positions.length; },
    getPositions: () => positions.map((position) => ({ ...position })),
    dispose() { root.removeFromParent(); geometry.dispose(); material.dispose(); },
  };
}
