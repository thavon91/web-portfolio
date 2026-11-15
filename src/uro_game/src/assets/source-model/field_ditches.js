export function createFieldDitches({ collision, bombs, fires, onReveal = () => {} }) {
  const ditches = new Map();
  const normalize = (name) => name.replace(/_collision$/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  function setMap(model) {
    ditches.clear();
    model.traverse((object) => {
      const name = object.userData.name ?? object.name;
      if (/^field_ditch(?:[._]\d+)?$/i.test(name)) ditches.set(normalize(name), object);
    });
  }
  function destroy(name) {
    const ditch = ditches.get(normalize(name));
    if (!ditch || ditch.userData.destroyed) return false;
    ditch.userData.destroyed = true;
    ditch.visible = false;
    collision.removeObstacle(name);
    const bombRevealed = bombs.revealInDitch(ditch);
    const fireRevealed = fires?.revealInDitch(ditch);
    if (bombRevealed || fireRevealed) onReveal();
    return true;
  }
  return { setMap, destroy };
}
