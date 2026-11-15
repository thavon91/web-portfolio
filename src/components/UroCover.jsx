import { useEffect, useState } from 'react';

export default function UroCover() {
  const [portrait, setPortrait] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const cached = localStorage.getItem('bombom-home-smile-portrait-v2');
        if (cached?.startsWith('data:image/png;base64,')) { setPortrait(cached); return; }
      } catch { /* Render from the model when browser storage is unavailable. */ }
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
      const decoder = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}uro_game/draco/`);
      let renderer;
      let model;
      try {
        const url = new URL('../uro_game/src/assets/source-model/bomber_map_source.glb', import.meta.url).href;
        model = (await new GLTFLoader().setDRACOLoader(decoder).loadAsync(url)).scene;
        if (!active) return;
        model.updateMatrixWorld(true);
        let source;
        model.traverse(o => { if ((o.userData.name ?? o.name).toLowerCase() === 'bomb_0.002') source = o; });
        if (!source) return;
        const bomb = source.clone(true);
        source.matrixWorld.decompose(bomb.position, bomb.quaternion, bomb.scale);
        bomb.visible = true;
        const scene = new THREE.Scene();
        const facing = new THREE.Group();
        scene.add(facing); facing.add(bomb);
        const bounds = new THREE.Box3().setFromObject(bomb);
        bomb.position.sub(bounds.getCenter(new THREE.Vector3()));
        facing.rotation.x = THREE.MathUtils.degToRad(-15);
        const size = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
        const camera = new THREE.PerspectiveCamera(35, 1, size * .01, size * 10);
        camera.position.set(0, 0, -size * 2.15); camera.lookAt(0, 0, 0);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x59647b, 2));
        const light = new THREE.DirectionalLight(0xffefd9, 3);
        light.position.set(-2, 3, -4); scene.add(light);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(256, 256);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.render(scene, camera);
        if (active) setPortrait(renderer.domElement.toDataURL('image/png'));
      } finally {
        decoder.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
        model?.traverse(o => { o.geometry?.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m?.dispose()); });
      }
    }
    load().catch(() => {});
    return () => { active = false; };
  }, []);
  const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400" viewBox="0 0 720 400">
    <rect width="720" height="400" fill="#242c24"/>
    ${portrait ? `<image href="${portrait}" x="28" y="8" width="280" height="280"/>` : ''}
    <text x="336" y="206" font-family="Arial,sans-serif" font-size="98" font-weight="900" letter-spacing="-5"><tspan fill="#ffe1a4">U</tspan><tspan fill="#819b46">R</tspan><tspan fill="#e88126">O</tspan></text>
    <text x="338" y="242" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="#e88126">UNKNOWN REALM ORDNANCE</text>
  </svg>`;
  return <img className="home-project-image" alt="URO blue bomb and game title" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(cover)}`} />;
}
