import * as THREE from 'three';

const GLYPH_PREFIX = 'ControlHUB_PPS_HexTetromino_';
const DIGIT_SPACING = 0.067;
const DISPLAY_CENTER_Z = 0.003;
const SCORE_Y = 0.095;
const LINES_Y = 0.605;

function createZero(material) {
  const zero = new THREE.Group();
  const geometry = new THREE.BoxGeometry(0.021, 0.015, 0.015);
  const pattern = ['111', '101', '101', '101', '111'];

  pattern.forEach((line, row) => [...line].forEach((pixel, col) => {
    if (pixel === '0') return;
    const block = new THREE.Mesh(geometry, material);
    block.position.set(0, (2 - row) * 0.018, (1 - col) * 0.018);
    zero.add(block);
  }));
  return zero;
}

export function createScoreDisplay(model) {
  const root = model.getObjectByName('HexadecimalText');
  if (!root) return { setScore() {}, setLines() {} };

  const glyphs = new Map();
  const backplate = root.getObjectByName('ControlHUB_PPS_HexadecimalTetromino_Backplate');
  root.children.forEach((object) => {
    if (!object.name.startsWith(GLYPH_PREFIX)) return;
    glyphs.set(object.name.slice(GLYPH_PREFIX.length), object);
    object.visible = false;
  });

  if (backplate) {
    const linesBackplate = backplate.clone();
    linesBackplate.name = 'Game_LinesBackplate';
    linesBackplate.position.y = LINES_Y;
    root.add(linesBackplate);
  }

  function createCounter(name, y) {
    const display = new THREE.Group();
    display.name = name;
    root.add(display);

    return (value) => {
      display.clear();
      const digits = Math.max(0, Math.trunc(value)).toString(16).toUpperCase();

      [...digits].forEach((digit, index) => {
        const glyph = digit === '0'
          ? createZero(glyphs.get('8').material)
          : glyphs.get(digit)?.clone();
        if (!glyph) return;

        glyph.visible = true;
        glyph.position.set(
          0,
          y,
          DISPLAY_CENTER_Z + ((digits.length - 1) / 2 - index) * DIGIT_SPACING
        );
        display.add(glyph);
      });
    };
  }

  return {
    setScore: createCounter('Game_ScoreDisplay', SCORE_Y),
    setLines: createCounter('Game_LinesDisplay', LINES_Y),
  };
}
