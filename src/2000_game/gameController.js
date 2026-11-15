import * as THREE from 'three';
import {
  playDirectionButtonSound,
  playDownPressSound,
  playPauseSound,
  playPlaySound,
  playRotationSound,
  setGameMusicPaused,
  startDownHoldSound,
  stopDownHoldSound,
} from './soundEffects/index.js';

const TEMPLATE_PARENT_NAME = 'ControlHUB_TT';
const TEMPLATE_NAME_PREFIX = 'TT_';

const PLAYFIELD_CENTER = new THREE.Vector3(0.32, 3.75, 5.42);
const PLAYFIELD_BOTTOM_Y = 0.35;
const PLAYFIELD_TOP_Y = 4;
const PLAYFIELD_COLUMNS = 11;
const CELL_SIZE = 0.148;
const DROP_INTERVALS_BY_LEVEL = [2, 1.55, 1.15, 0.8, 0.5]; // seconds between automatic grid steps
const LINES_PER_LEVEL = 5;
const LOCK_DELAY = 0.1;
const RESPAWN_DELAY = 0.35;
const FIRST_PREVIEW_HOLD_TIME = 1.2;
const HOLD_INDICATOR_DIM = 0.15;
const LEVEL_INDICATOR_DIM = 0.22;
const MAX_HEALTH = 5;
const HEALTH_INDICATOR_DIM = 0.18;
const NEXT_PREVIEW_CENTER = new THREE.Vector3(0.35, 4.39, 5.42);
const SCORE_BY_CLEAR_COUNT = [0, 100, 300, 500, 800];

const scratchBox = new THREE.Box3();
const scratchCenter = new THREE.Vector3();
const scratchTarget = new THREE.Vector3();
const scratchCurrent = new THREE.Vector3();
const scratchMatrix = new THREE.Matrix4();
const PLAYFIELD_LEFT_Z = PLAYFIELD_CENTER.z - (PLAYFIELD_COLUMNS * CELL_SIZE) / 2;
const PLAYFIELD_ROWS = Math.floor((PLAYFIELD_TOP_Y - PLAYFIELD_BOTTOM_Y) / CELL_SIZE);

const SHAPE_CELLS = {
  TT_J_Orange: [[0, 0], [1, 0], [2, 0], [2, 1]],
  TT_L_Green: [[0, 0], [1, 0], [2, 0], [0, 1]],
  TT_Skew_Lime: [[1, 0], [2, 0], [0, 1], [1, 1]],
  TT_Square_Purple: [[0, 0], [1, 0], [0, 1], [1, 1]],
  TT_Straight_Cyan: [[0, 0], [1, 0], [2, 0], [3, 0]],
  TT_T_RosePink: [[0, 1], [1, 1], [2, 1], [1, 0]],
  TT_Z_Blue: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

function collectTetrominoTemplates(model) {
  const parent = model.getObjectByName(TEMPLATE_PARENT_NAME);

  if (!parent) {
    console.warn(`Missing ${TEMPLATE_PARENT_NAME}; tetromino drop is disabled.`);
    return [];
  }

  const templates = [];
  parent.traverse((object) => {
    if (object.isMesh && object.name.startsWith(TEMPLATE_NAME_PREFIX)) templates.push(object);
  });
  return templates;
}

function moveWorldPointTo(object, from, target) {
  if (object.parent) {
    scratchTarget.copy(target);
    scratchCurrent.copy(from);
    object.parent.worldToLocal(scratchTarget);
    object.parent.worldToLocal(scratchCurrent);
    object.position.add(scratchTarget.sub(scratchCurrent));
    return;
  }
  object.position.add(scratchTarget.copy(target).sub(from));
}

function moveObjectCenterTo(object, target) {
  scratchBox.setFromObject(object).getCenter(scratchCenter);
  moveWorldPointTo(object, scratchCenter, target);
}

function moveObjectBottomTo(object, targetY) {
  scratchBox.setFromObject(object);
  scratchBox.getCenter(scratchCenter);
  scratchCurrent.set(scratchCenter.x, scratchBox.min.y, scratchCenter.z);
  scratchTarget.set(scratchCenter.x, targetY, scratchCenter.z);
  moveWorldPointTo(object, scratchCurrent, scratchTarget);
}

function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getShapeCells(name) {
  return SHAPE_CELLS[name.replace(/^(Falling_|Settled_)/, '')];
}

function getBaseShapeName(name) {
  return name.replace(/^(Next_|Falling_|Settled_)/, '');
}

function getShapeSize(cells) {
  const size = { width: 0, height: 0 };
  for (const [col, row] of cells) {
    size.width = Math.max(size.width, col + 1);
    size.height = Math.max(size.height, row + 1);
  }
  return size;
}

function rotateCellsClockwise(cells) {
  const { height } = getShapeSize(cells);

  return cells.map(([col, row]) => [height - 1 - row, col]);
}

function getCellKey(col, row) {
  return `${col}:${row}`;
}

function getPieceCenter(col, row, cells) {
  const size = getShapeSize(cells);

  return new THREE.Vector3(
    PLAYFIELD_CENTER.x,
    PLAYFIELD_BOTTOM_Y + (row + size.height / 2) * CELL_SIZE,
    PLAYFIELD_LEFT_Z + (col + size.width / 2) * CELL_SIZE
  );
}

function getCellCenter(col, row) {
  return new THREE.Vector3(
    PLAYFIELD_CENTER.x,
    PLAYFIELD_BOTTOM_Y + (row + 0.5) * CELL_SIZE,
    PLAYFIELD_LEFT_Z + (col + 0.5) * CELL_SIZE
  );
}

function extractBlockGeometry(template) {
  const source = template.geometry;
  const vertexCount = source.attributes.position.count / 4;
  const block = new THREE.BufferGeometry();

  Object.entries(source.attributes).forEach(([name, attribute]) => {
    const values = attribute.array.slice(0, vertexCount * attribute.itemSize);
    block.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  });

  const indices = [];
  for (let index = 0; index < source.index.count; index += 3) {
    const triangle = [source.index.getX(index), source.index.getX(index + 1), source.index.getX(index + 2)];
    if (triangle.every((vertex) => vertex < vertexCount)) indices.push(...triangle);
  }
  block.setIndex(indices);
  block.center();
  block.computeBoundingSphere();
  return block;
}

function getDropColumn(shapeSize) {
  return Math.floor((PLAYFIELD_COLUMNS - shapeSize.width) / 2);
}

function getCenteredPiecePosition(cells, row) {
  return getPieceCenter(getDropColumn(getShapeSize(cells)), row, cells);
}

function cloneForGame(template, targetParent) {
  template.updateWorldMatrix(true, false);
  targetParent.updateWorldMatrix(true, false);

  const clone = template.clone(true);
  clone.material = template.userData.brightMaterial.clone();
  scratchMatrix.copy(targetParent.matrixWorld).invert().multiply(template.matrixWorld);
  scratchMatrix.decompose(clone.position, clone.quaternion, clone.scale);

  return clone;
}

function fitPieceInNextPreview(piece) {
  piece.updateWorldMatrix(true, true);
  moveObjectCenterTo(piece, NEXT_PREVIEW_CENTER);
}

function restorePieceFromNextPreview(piece) {
  piece.updateWorldMatrix(true, true);
}

function prepareHoldIndicators(templates) {
  templates.forEach((template) => {
    template.userData.brightMaterial = template.material.clone();
    template.material = template.material.clone();
  });

  function setHeldShape(shapeName) {
    templates.forEach((template) => {
      const brightness = template.name === shapeName ? 1 : HOLD_INDICATOR_DIM;
      template.material.color.copy(template.userData.brightMaterial.color).multiplyScalar(brightness);
    });
  }

  setHeldShape(null);
  return setHeldShape;
}

function getLevelForLines(lineCount) {
  return Math.min(
    DROP_INTERVALS_BY_LEVEL.length,
    Math.floor(lineCount / LINES_PER_LEVEL) + 1
  );
}

function getDropInterval(level) {
  return DROP_INTERVALS_BY_LEVEL[level - 1] ?? DROP_INTERVALS_BY_LEVEL.at(-1);
}

function prepareLevelIndicators(model) {
  const segments = DROP_INTERVALS_BY_LEVEL.map((_, index) => (
    model.getObjectByName(`ControlHUB_Healthbar_LevelBar_Copy_Segment_${index + 1}_Fill`)
  ));

  segments.forEach((segment) => {
    if (!segment?.material) return;
    segment.userData.brightMaterial = segment.material.clone();
    segment.material = segment.material.clone();
  });

  return (level) => {
    segments.forEach((segment, index) => {
      if (!segment) return;
      segment.visible = true;
      if (!segment.material || !segment.userData.brightMaterial) return;

      const brightness = index < level ? 1 : LEVEL_INDICATOR_DIM;
      segment.material.color
        .copy(segment.userData.brightMaterial.color)
        .multiplyScalar(brightness);
    });
  };
}

function prepareHealthIndicators(model) {
  const segments = Array.from({ length: MAX_HEALTH }, (_, index) => (
    model.getObjectByName(`ControlHUB_Healthbar_Segment_${index + 1}_Fill`)
  ));

  segments.forEach((segment) => {
    if (!segment?.material) return;
    segment.userData.brightMaterial = segment.material.clone();
    segment.material = segment.material.clone();
  });

  return (health) => {
    segments.forEach((segment, index) => {
      if (!segment) return;
      segment.visible = true;
      if (!segment.material || !segment.userData.brightMaterial) return;

      const brightness = index < health ? 1 : HEALTH_INDICATOR_DIM;
      segment.material.color
        .copy(segment.userData.brightMaterial.color)
        .multiplyScalar(brightness);
    });
  };
}

export function createTetrominoDropController(model, onScoreChange = () => {}) {
  const templates = collectTetrominoTemplates(model);
  const settledBlockGeometry = templates[0]
    ? extractBlockGeometry(templates[0])
    : new THREE.BoxGeometry(0.145, 0.145, 0.145);
  const setHeldShape = prepareHoldIndicators(templates);
  const setLevelIndicator = prepareLevelIndicators(model);
  const setHealthIndicator = prepareHealthIndicators(model);
  const templatesByName = new Map(templates.map((template) => [template.name, template]));
  const fallingGroup = new THREE.Group();
  fallingGroup.name = 'Game_FallingTetromino';
  model.add(fallingGroup);

  let activePiece = null;
  let activeCells = null;
  let activeShapeName = null;
  let activeCol = 0;
  let activeRow = 0;
  let activeSettleRow = 0;
  let dropTimer = 0;
  let lockTimer = 0;
  let previewPiece = null;
  let previewCells = null;
  let previewShapeName = null;
  let heldShapeName = null;
  let previewTimer = FIRST_PREVIEW_HOLD_TIME;
  let respawnTimer = 0;
  let isStopped = false;
  let isPaused = false;
  let clearedLineCount = 0;
  let score = 0;
  let level = getLevelForLines(clearedLineCount);
  let health = MAX_HEALTH;
  const settledBlocks = new Map();
  setLevelIndicator(level);
  setHealthIndicator(health);

  function canOccupy(cells, col, row) {
    return cells.every(([cellCol, cellRow]) => {
      const targetCol = col + cellCol;
      const targetRow = row + cellRow;
      return targetCol >= 0
        && targetCol < PLAYFIELD_COLUMNS
        && targetRow >= 0
        && targetRow < PLAYFIELD_ROWS
        && !settledBlocks.has(getCellKey(targetCol, targetRow));
    });
  }

  function findSettleRow(cells, col, spawnRow) {
    let row = spawnRow;

    while (canOccupy(cells, col, row - 1)) {
      row -= 1;
    }

    return row;
  }

  function createSettledBlocks(cells, col, row) {
    cells.forEach(([cellCol, cellRow]) => {
      const targetCol = col + cellCol;
      const targetRow = row + cellRow;
      const block = new THREE.Mesh(settledBlockGeometry, activePiece.material.clone());
      block.name = `Settled_Block_${targetCol}_${targetRow}`;
      fallingGroup.add(block);
      moveObjectCenterTo(block, getCellCenter(targetCol, targetRow));
      settledBlocks.set(getCellKey(targetCol, targetRow), block);
    });
  }

  function clearCompletedLines() {
    const fullRows = [];
    for (let row = 0; row < PLAYFIELD_ROWS; row += 1) {
      const isFull = Array.from(
        { length: PLAYFIELD_COLUMNS },
        (_, col) => settledBlocks.has(getCellKey(col, row))
      ).every(Boolean);
      if (isFull) fullRows.push(row);
    }
    if (fullRows.length === 0) return;

    const clearedRows = new Set(fullRows);
    const blocksBeforeClear = [...settledBlocks.entries()];
    settledBlocks.clear();

    blocksBeforeClear.forEach(([key, block]) => {
      const [col, row] = key.split(':').map(Number);
      if (clearedRows.has(row)) {
        block.removeFromParent();
        block.material.dispose();
        return;
      }

      const newRow = row - fullRows.filter((clearedRow) => clearedRow < row).length;
      moveObjectCenterTo(block, getCellCenter(col, newRow));
      block.name = `Settled_Block_${col}_${newRow}`;
      settledBlocks.set(getCellKey(col, newRow), block);
    });

    const clearedRowCount = fullRows.length;
    const scoreForClear = SCORE_BY_CLEAR_COUNT[clearedRowCount]
      ?? (SCORE_BY_CLEAR_COUNT[4] + (clearedRowCount - 4) * 400);
    score += scoreForClear * level;
    clearedLineCount += clearedRowCount;
    level = getLevelForLines(clearedLineCount);
    setLevelIndicator(level);
    onScoreChange(score, clearedLineCount, level);
  }

  function showNextPreview(requestedShapeName = null) {
    if (isStopped || templates.length === 0) return;

    const template = requestedShapeName
      ? templatesByName.get(getBaseShapeName(requestedShapeName))
      : pickRandomItem(templates);
    if (!template) return;
    previewShapeName = template.name;
    previewCells = getShapeCells(template.name);

    if (!previewCells) {
      console.warn(`Missing grid shape for ${template.name}; skipping piece.`);
      respawnTimer = RESPAWN_DELAY;
      return;
    }

    previewPiece = cloneForGame(template, fallingGroup);
    previewPiece.name = `Next_${previewPiece.name}`;
    previewPiece.visible = true;
    fallingGroup.add(previewPiece);
    fitPieceInNextPreview(previewPiece);
  }

  function removePreviewPiece() {
    if (!previewPiece) return;
    previewPiece.removeFromParent();
    previewPiece.material.dispose();
    previewPiece = null;
    previewCells = null;
    previewShapeName = null;
  }

  function removeActivePiece() {
    if (!activePiece) return;
    activePiece.removeFromParent();
    activePiece.material.dispose();
    activePiece = null;
    activeCells = null;
    activeShapeName = null;
  }

  function clearBoardForHealthLoss() {
    removePreviewPiece();
    removeActivePiece();

    settledBlocks.forEach((block) => {
      block.removeFromParent();
      block.material.dispose();
    });
    settledBlocks.clear();

    activeCol = 0;
    activeRow = 0;
    activeSettleRow = 0;
    dropTimer = 0;
    lockTimer = 0;
    previewTimer = FIRST_PREVIEW_HOLD_TIME;
    respawnTimer = RESPAWN_DELAY;
  }

  function loseHealth() {
    health = Math.max(0, health - 1);
    setHealthIndicator(health);
    clearBoardForHealthLoss();

    if (health <= 0) {
      isStopped = true;
      console.info('Tetromino drop stopped: health depleted.');
      return;
    }

    console.info(`Tetromino health lost. Remaining health: ${health}.`);
  }

  function holdPreviewPiece() {
    if (!previewPiece || !previewShapeName || isStopped) return false;

    const nextHeldShape = getBaseShapeName(previewShapeName);
    const shapeToPreview = heldShapeName;
    removePreviewPiece();
    heldShapeName = nextHeldShape;
    setHeldShape(heldShapeName);
    showNextPreview(shapeToPreview);
    return true;
  }

  function startPreviewPieceFalling() {
    if (!previewPiece || !previewCells) return;

    activeCells = previewCells;
    activeShapeName = previewShapeName;
    const shapeSize = getShapeSize(activeCells);
    activeCol = getDropColumn(shapeSize);
    const spawnRow = PLAYFIELD_ROWS - shapeSize.height;

    if (!canOccupy(activeCells, activeCol, spawnRow)) {
      loseHealth();
      return;
    }

    activeRow = spawnRow;
    activeSettleRow = findSettleRow(activeCells, activeCol, activeRow);
    dropTimer = 0;
    lockTimer = 0;
    activePiece = previewPiece;
    restorePieceFromNextPreview(activePiece);
    activePiece.name = activePiece.name.replace('Next_', 'Falling_');
    previewPiece = null;
    previewCells = null;
    previewShapeName = null;
    moveObjectCenterTo(activePiece, getCenteredPiecePosition(activeCells, spawnRow));

    showNextPreview();
  }

  function settleActivePiece() {
    if (!activePiece) return;

    createSettledBlocks(activeCells, activeCol, activeSettleRow);
    activePiece.removeFromParent();
    activePiece.material.dispose();
    clearCompletedLines();

    activePiece = null;
    activeCells = null;
    activeShapeName = null;
    activeRow = 0;
    dropTimer = 0;
    lockTimer = 0;
    respawnTimer = RESPAWN_DELAY;
  }

  function moveActivePiece(direction) {
    if (!activePiece || !activeCells || isStopped) return false;

    scratchBox.setFromObject(activePiece);
    scratchBox.getCenter(scratchCenter);
    const currentCenterY = scratchCenter.y;
    const nextCol = activeCol + direction;

    if (!canOccupy(activeCells, nextCol, activeRow)) return false;

    activeCol = nextCol;
    activeSettleRow = findSettleRow(activeCells, activeCol, activeRow);
    const targetCenter = getPieceCenter(activeCol, activeRow, activeCells);
    targetCenter.y = currentCenterY;
    moveObjectCenterTo(activePiece, targetCenter);
    return true;
  }

  function moveActivePieceDown() {
    if (!activePiece || !activeCells || isStopped) return false;

    scratchBox.setFromObject(activePiece);
    if (activeRow <= activeSettleRow) return false;

    activeRow -= 1;
    const settleY = PLAYFIELD_BOTTOM_Y + activeSettleRow * CELL_SIZE;
    moveObjectBottomTo(activePiece, Math.max(settleY, scratchBox.min.y - CELL_SIZE));
    dropTimer = 0;
    lockTimer = 0;
    return true;
  }

  function rotateActivePieceClockwise() {
    if (!activePiece || !activeCells || isStopped || activeShapeName === 'TT_Square_Purple') {
      return false;
    }

    scratchBox.setFromObject(activePiece).getCenter(scratchCenter);
    const currentCenterY = scratchCenter.y;
    const currentSize = getShapeSize(activeCells);
    const rotatedCells = rotateCellsClockwise(activeCells);
    const rotatedSize = getShapeSize(rotatedCells);
    const centeredColumn = activeCol
      + currentSize.width / 2
      - rotatedSize.width / 2;
    const centeredCol = rotatedSize.width < currentSize.width
      ? Math.ceil(centeredColumn)
      : Math.floor(centeredColumn);
    const centeredRowValue = activeRow
      + currentSize.height / 2
      - rotatedSize.height / 2;
    const centeredRow = rotatedSize.height < currentSize.height
      ? Math.ceil(centeredRowValue)
      : Math.floor(centeredRowValue);
    const kickOffsets = [0, 1, -1, 2, -2];
    let rotatedCol;
    let rotatedRow;

    for (const rowOffset of kickOffsets) {
      rotatedRow = centeredRow + rowOffset;
      rotatedCol = kickOffsets
        .map((colOffset) => centeredCol + colOffset)
        .find((col) => canOccupy(rotatedCells, col, rotatedRow));
      if (rotatedCol !== undefined) break;
    }

    if (rotatedCol === undefined) return false;

    activePiece.rotateX(-Math.PI / 2);
    activeCells = rotatedCells;
    activeCol = rotatedCol;
    activeRow = rotatedRow;
    activeSettleRow = findSettleRow(activeCells, activeCol, activeRow);
    const targetCenter = getPieceCenter(activeCol, activeRow, activeCells);
    targetCenter.y = currentCenterY + (activeRow - centeredRow) * CELL_SIZE;
    moveObjectCenterTo(activePiece, targetCenter);

    return true;
  }

  showNextPreview();

  return {
    moveLeft: () => (!isPaused && moveActivePiece(1)),
    moveRight: () => (!isPaused && moveActivePiece(-1)),
    moveDown: () => (!isPaused && moveActivePieceDown()),
    rotateClockwise: () => (!isPaused && rotateActivePieceClockwise()),
    holdPreview: () => (!isPaused && holdPreviewPiece()),
    togglePause: () => {
      if (isStopped) return false;
      isPaused = !isPaused;
      return isPaused;
    },
    setPaused: (nextPaused) => {
      if (isStopped) return false;
      isPaused = Boolean(nextPaused);
      return isPaused;
    },
    isPaused: () => isPaused,

    update(deltaSeconds) {
      if (isStopped || isPaused) {
        return;
      }

      if (!activePiece) {
        if (!previewPiece) {
          respawnTimer -= deltaSeconds;
          if (respawnTimer <= 0) {
            showNextPreview();
          }
          return;
        }

        if (respawnTimer > 0) {
          respawnTimer -= deltaSeconds;
          return;
        }

        previewTimer -= deltaSeconds;
        if (previewTimer <= 0) {
          startPreviewPieceFalling();
        }
        return;
      }

      const settleY = PLAYFIELD_BOTTOM_Y + activeSettleRow * CELL_SIZE;
      if (activeRow <= activeSettleRow) {
        moveObjectBottomTo(activePiece, settleY);
        dropTimer = 0;
        lockTimer += deltaSeconds;
      } else {
        dropTimer += deltaSeconds;
        lockTimer = 0;
        if (dropTimer >= getDropInterval(level)) moveActivePieceDown();
      }

      if (lockTimer >= LOCK_DELAY) {
    settleActivePiece();
  }
    },
  };
}


const MOVE_TOLERANCE = 8;
const POINTER_REPEAT_DELAY = 0.25;
const POINTER_REPEAT_INTERVAL = 0.08;
const SOFT_DROP_REPEAT_DELAY = 0.1;
const SOFT_DROP_REPEAT_INTERVAL = 0.035;
const DOWN_HOLD_SOUND_DELAY_MS = 150;
const BUTTON_PRESS_OFFSET = 0.11;
const BUTTON_PRESS_SPEED = 18;
const BUTTON_ROTATION_OFFSET = Math.PI / 3;
const INPUTS = {
  SettingsButton: 'toggleSettings',
  PauseButton: { action: 'togglePause', pressAction: 'pauseButton' },
  PlayButton: { action: 'togglePause', pressAction: 'playButton' },
  Rotation_Button: 'rotateClockwise',
  DPad_Hold: { action: 'holdPreview', pressAction: 'holdButton' },
  DPad_Left: { action: 'moveLeft', pressAction: 'leftButton' },
  DPad_Right: { action: 'moveRight', pressAction: 'rightButton' },
  DPad_Down: { action: 'moveDown', pressAction: 'downButton' },
};
const KEYS = {
  KeyP: { action: 'togglePause', pressAction: 'togglePause' },
  Space: { action: 'rotateClockwise', pressAction: 'rotateClockwise' },
  ArrowUp: { action: 'holdPreview', pressAction: 'holdButton' },
  ArrowLeft: { action: 'moveLeft', pressAction: 'leftButton' },
  ArrowRight: { action: 'moveRight', pressAction: 'rightButton' },
  ArrowDown: { action: 'moveDown', pressAction: 'downButton' },
};
const ONE_PRESS_ACTIONS = new Set(['rotateClockwise', 'holdPreview', 'togglePause']);
const POINTER_REPEAT_ACTIONS = new Set(['moveLeft', 'moveRight', 'moveDown']);
const DIRECTION_SOUND_BY_ACTION = {
  moveLeft: 'left',
  moveRight: 'right',
  holdPreview: 'up',
  moveDown: 'down',
};
const PRESS_MOTION_BY_ACTION = {
  toggleSettings: {
    objectName: 'SettingsButton',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
    rotationAxis: 'x',
    rotationOffset: BUTTON_ROTATION_OFFSET,
    rotationChildNames: [
      'ControlHUB_PPS_SettingsButton_Gear_Shadow',
      'ControlHUB_PPS_SettingsButton_Gear_White',
      'ControlHUB_PPS_SettingsButton_Orange_Center',
    ],
  },
  rotateClockwise: {
    objectName: 'Rotation_Button',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
    rotationAxis: 'x',
    rotationOffset: -BUTTON_ROTATION_OFFSET,
    rotationChildNames: [
      'ControlHUB_Rotation_Icon_Arrow_Cream_Bottom',
      'ControlHUB_Rotation_Icon_Arrow_Cream_Top',
    ],
  },
  pauseButton: {
    objectName: 'PauseButton',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
    scaleOffset: 0.94,
  },
  playButton: {
    objectName: 'PlayButton',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
    scaleOffset: 0.94,
  },
  holdButton: {
    objectName: 'DPad_Hold',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
  },
  leftButton: {
    objectName: 'DPad_Left',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
  },
  rightButton: {
    objectName: 'DPad_Right',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
  },
  downButton: {
    objectName: 'DPad_Down',
    axis: 'x',
    offset: BUTTON_PRESS_OFFSET,
  },
};

function createButtonPressMotion(object, {
  axis,
  offset,
  scaleOffset = 1,
  rotationAxis = null,
  rotationOffset = 0,
  rotationChildNames = [],
}) {
  const start = object.position[axis];
  const startScale = object.scale.clone();
  let target = start;
  let scaleTarget = 1;
  let rotationTarget = 0;
  const arrowPivot = new THREE.Group();
  const animatedArrowChildren = rotationChildNames
    .map((name) => object.getObjectByName(name))
    .filter(Boolean);

  if (animatedArrowChildren.length > 0 && rotationAxis) {
    arrowPivot.name = 'Game_RotationButtonArrowMotion';
    object.add(arrowPivot);
    animatedArrowChildren.forEach((child) => arrowPivot.attach(child));
  }

  return {
    press() {
      target = start + offset;
      scaleTarget = scaleOffset;
      rotationTarget = rotationOffset;
    },
    release() {
      target = start;
      scaleTarget = 1;
      rotationTarget = 0;
    },
    update(deltaSeconds) {
      object.position[axis] = THREE.MathUtils.damp(
        object.position[axis],
        target,
        BUTTON_PRESS_SPEED,
        deltaSeconds
      );
      if (rotationAxis) {
        arrowPivot.rotation[rotationAxis] = THREE.MathUtils.damp(
          arrowPivot.rotation[rotationAxis],
          rotationTarget,
          BUTTON_PRESS_SPEED,
          deltaSeconds
        );
      }
      object.scale.set(
        THREE.MathUtils.damp(object.scale.x, startScale.x * scaleTarget, BUTTON_PRESS_SPEED, deltaSeconds),
        THREE.MathUtils.damp(object.scale.y, startScale.y * scaleTarget, BUTTON_PRESS_SPEED, deltaSeconds),
        THREE.MathUtils.damp(object.scale.z, startScale.z * scaleTarget, BUTTON_PRESS_SPEED, deltaSeconds)
      );
    },
    reset() {
      object.position[axis] = start;
      object.scale.copy(startScale);
      if (rotationAxis) arrowPivot.rotation[rotationAxis] = 0;
    },
  };
}

function normalizeInputConfig(input) {
  return typeof input === 'string' ? { action: input, pressAction: input } : input;
}

export function createGameController({
  camera,
  domElement,
  model,
  tetrominoController,
  onSettingsToggle = () => {},
}) {
  const buttons = Object.entries(INPUTS).map(([name, input]) => {
    const config = normalizeInputConfig(input);
    return {
      ...config,
      object: model.getObjectByName(name),
    };
  });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pressedKeys = new Set();
  let press = null;
  let downKeyRepeatTimer = 0;
  let downSoundBlockedUntilRelease = false;
  let isDownInputHeld = false;
  let downSoundStartTimer = null;
  let downPressSoundPending = false;
  const pressMotions = new Map(
    Object.entries(PRESS_MOTION_BY_ACTION)
      .map(([action, config]) => {
        const object = model.getObjectByName(config.objectName);
        return object ? [action, createButtonPressMotion(object, config)] : null;
      })
      .filter(Boolean)
  );

  const pauseButton = model.getObjectByName('PauseButton');
  const playButton = model.getObjectByName('PlayButton');
  const setPauseButtonState = () => {
    const isPaused = tetrominoController?.isPaused?.() ?? false;
    if (pauseButton) pauseButton.visible = !isPaused;
    if (playButton) playButton.visible = isPaused;
  };
  setPauseButtonState();

  const run = (action) => {
    if (action === 'toggleSettings') {
      onSettingsToggle();
      setPauseButtonState();
      return true;
    }

    const result = tetrominoController?.[action]?.() ?? false;
    if (action === 'togglePause') {
      setPauseButtonState();
      setGameMusicPaused(tetrominoController?.isPaused?.() ?? false);
    }
    return result;
  };
  const clearPendingDownSound = () => {
    if (downSoundStartTimer === null) return;
    window.clearTimeout(downSoundStartTimer);
    downSoundStartTimer = null;
  };
  const scheduleDownHoldSound = () => {
    clearPendingDownSound();
    if (!isDownInputHeld || downSoundBlockedUntilRelease) return;

    downSoundStartTimer = window.setTimeout(() => {
      downSoundStartTimer = null;
      if (!isDownInputHeld || downSoundBlockedUntilRelease) return;
      downPressSoundPending = false;
      startDownHoldSound();
    }, DOWN_HOLD_SOUND_DELAY_MS);
  };
  const stopDownSound = () => {
    clearPendingDownSound();
    stopDownHoldSound();
  };
  const playControlSound = (action, isInitialPress = false) => {
    if (action === 'togglePause') {
      if (tetrominoController?.isPaused?.()) {
        playPlaySound();
      } else {
        playPauseSound();
      }
      return;
    }

    if (action === 'rotateClockwise') {
      playRotationSound();
      return;
    }

    const direction = DIRECTION_SOUND_BY_ACTION[action];
    if (!direction) return;

    if (direction === 'down') {
      if (isInitialPress) {
        downSoundBlockedUntilRelease = false;
        isDownInputHeld = true;
        downPressSoundPending = true;
        scheduleDownHoldSound();
      }
      return;
    }

    playDirectionButtonSound(direction);
  };
  const setActionPressed = (action, isPressed) => {
    if (action === 'togglePause') {
      setActionPressed(tetrominoController?.isPaused?.() ? 'playButton' : 'pauseButton', isPressed);
      return;
    }

    const pressMotion = pressMotions.get(action);
    if (!pressMotion) return;
    if (isPressed) {
      pressMotion.press();
    } else {
      pressMotion.release();
    }
  };
  const consume = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  function buttonAt(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    return buttons.find(({ object }) => (
      object && object.visible && raycaster.intersectObject(object, true).length > 0
    ));
  }

  function actionAt(event) {
    return buttonAt(event)?.action;
  }

  function onKeyDown(event) {
    const keyConfig = normalizeInputConfig(KEYS[event.code]);
    if (!keyConfig?.action || (event.repeat && ONE_PRESS_ACTIONS.has(keyConfig.action))) return;
    event.preventDefault();
    const isInitialPress = !pressedKeys.has(event.code);
    if (!isInitialPress && keyConfig.action === 'moveDown') return;
    if (isInitialPress) {
      playControlSound(keyConfig.action, true);
    }
    pressedKeys.add(event.code);
    setActionPressed(keyConfig.pressAction, true);
    const didRun = run(keyConfig.action);
    if (keyConfig.action === 'moveDown' && !didRun) {
      downSoundBlockedUntilRelease = true;
      downPressSoundPending = false;
      stopDownSound();
    }
    if (keyConfig.action === 'moveDown') downKeyRepeatTimer = 0;
  }

  function onKeyUp(event) {
    const keyConfig = normalizeInputConfig(KEYS[event.code]);
    if (!keyConfig?.action || !pressedKeys.has(event.code)) return;
    pressedKeys.delete(event.code);
    event.preventDefault();
    setActionPressed(keyConfig.pressAction, false);
    if (keyConfig.action === 'moveDown') {
      const shouldPlayPressSound = downPressSoundPending && !downSoundBlockedUntilRelease;
      downKeyRepeatTimer = 0;
      downSoundBlockedUntilRelease = false;
      isDownInputHeld = false;
      downPressSoundPending = false;
      stopDownSound();
      if (shouldPlayPressSound) playDownPressSound();
    }
  }

  function onPointerDown(event) {
    const button = buttonAt(event);
    if ((event.button ?? 0) !== 0 || !button?.action) return;

    playControlSound(button.action, true);
    press = {
      action: button.action,
      pressAction: button.pressAction,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      repeatElapsed: 0,
      repeatTimer: 0,
      didRunOnPress: POINTER_REPEAT_ACTIONS.has(button.action),
    };
    setActionPressed(button.pressAction, true);
    if (press.didRunOnPress) {
      const didRun = run(button.action);
      if (button.action === 'moveDown' && !didRun) {
        downSoundBlockedUntilRelease = true;
        downPressSoundPending = false;
        stopDownSound();
      }
    }
    domElement.setPointerCapture?.(event.pointerId);
    consume(event);
  }

  function onPointerUp(event) {
    if (event.pointerId !== press?.id) return;

    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const action = press.action;
    const pressAction = press.pressAction;
    const didRunOnPress = press.didRunOnPress;
    press = null;
    setActionPressed(pressAction, false);
    if (action === 'moveDown') {
      const shouldPlayPressSound = downPressSoundPending && !downSoundBlockedUntilRelease;
      downSoundBlockedUntilRelease = false;
      isDownInputHeld = false;
      downPressSoundPending = false;
      stopDownSound();
      if (shouldPlayPressSound) playDownPressSound();
    }
    domElement.releasePointerCapture?.(event.pointerId);

    if (!didRunOnPress && moved <= MOVE_TOLERANCE && actionAt(event) === action) run(action);
    consume(event);
  }

  function onPointerCancel(event) {
    if (event.pointerId !== press?.id) return;
    if (press.action === 'moveDown') {
      downSoundBlockedUntilRelease = false;
      isDownInputHeld = false;
      downPressSoundPending = false;
      stopDownSound();
    }
    setActionPressed(press.pressAction, false);
    press = null;
  }

  function onWindowBlur() {
    pressedKeys.clear();
    downKeyRepeatTimer = 0;
    downSoundBlockedUntilRelease = false;
    isDownInputHeld = false;
    downPressSoundPending = false;
    setActionPressed('downButton', false);
    stopDownSound();
  }

  const pointerHandlers = {
    pointerdown: onPointerDown,
    pointerup: onPointerUp,
    pointercancel: onPointerCancel,
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onWindowBlur);
  Object.entries(pointerHandlers).forEach(([type, handler]) => {
    domElement.addEventListener(type, handler, true);
  });

  return {
    update(deltaSeconds) {
      pressMotions.forEach((pressMotion) => pressMotion.update(deltaSeconds));
      if (pressedKeys.has('ArrowDown')) {
        downKeyRepeatTimer += deltaSeconds;
        while (downKeyRepeatTimer >= SOFT_DROP_REPEAT_INTERVAL) {
          downKeyRepeatTimer -= SOFT_DROP_REPEAT_INTERVAL;
          const didMoveDown = run('moveDown');
          if (!didMoveDown) {
            downKeyRepeatTimer = 0;
            downSoundBlockedUntilRelease = true;
            downPressSoundPending = false;
            stopDownSound();
            break;
          }
        }
      }
      if (press?.didRunOnPress) {
        press.repeatElapsed += deltaSeconds;
        const repeatDelay = press.action === 'moveDown'
          ? SOFT_DROP_REPEAT_DELAY
          : POINTER_REPEAT_DELAY;
        const repeatInterval = press.action === 'moveDown'
          ? SOFT_DROP_REPEAT_INTERVAL
          : POINTER_REPEAT_INTERVAL;
        if (press.repeatElapsed >= repeatDelay) {
          press.repeatTimer += deltaSeconds;
          while (press.repeatTimer >= repeatInterval) {
            press.repeatTimer -= repeatInterval;
            const didRun = run(press.action);
            if (press.action === 'moveDown') {
              if (!didRun) {
                press.repeatTimer = 0;
                downSoundBlockedUntilRelease = true;
                downPressSoundPending = false;
                stopDownSound();
                break;
              }
            }
          }
        }
      }
    },
    syncPauseButtonState: setPauseButtonState,
    dispose() {
      isDownInputHeld = false;
      downPressSoundPending = false;
      stopDownSound();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      Object.entries(pointerHandlers).forEach(([type, handler]) => {
        domElement.removeEventListener(type, handler, true);
      });
      pressMotions.forEach((pressMotion) => pressMotion.reset());
    },
  };
}
