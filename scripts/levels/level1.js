import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';

export async function loadLevel1(scene, physics) {

  gameState.paused = false;

  const esmeraldasHUD = document.getElementById("esmeraldas");
  const diamondsHUD = document.getElementById("diamantes");
  esmeraldasHUD.textContent = gameState.esmeraldas;
  diamondsHUD.textContent = gameState.diamantes;

  // --- LUCES ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(50, 100, 100);
  scene.add(dir);

  // --- PISO ---
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load('/Img/mars.jpg');

    // Para que la textura se repita a lo largo de la pista
    marsTexture.wrapS = THREE.RepeatWrapping;
    marsTexture.wrapT = THREE.RepeatWrapping;

    // Ajusta cuántas veces se repetirá la textura
    marsTexture.repeat.set(1, 8); // Puedes cambiar los valores

    const ground = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, 360),
    new THREE.MeshStandardMaterial({
        map: marsTexture
    })
    );

    ground.position.set(0, -2, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // --- PERSONAJE (BERNICE) ---
  const bernice = await loadModel('/models/Bernice.fbx');
  bernice.position.set(0,0,20);
  bernice.scale.setScalar(0.06);
  bernice.speedMultiplier = 1;
  scene.add(bernice);

  const berniceBBox = new THREE.Box3().setFromObject(bernice);

  // --- OVNI ---
  const ovni = await loadModel('/models/ovni.glb');
  ovni.scale.setScalar(0.5);
  ovni.position.set(0,-2,-60);
  scene.add(ovni);
  
  let ovniTime = 0;

  // --- OBJETOS (solo diamantes y esmeraldas, sin thunder) ---
  const baseDiamante = await loadModel('/models/diamante.glb');
  baseDiamante.scale.setScalar(1.5);
  baseDiamante.type = "diamond";

  const baseEsmeralda = await loadModel('/models/esmeralda.glb');
  baseEsmeralda.scale.setScalar(1.5);
  baseEsmeralda.type = "emerald";

  const models = [baseDiamante, baseEsmeralda];

  const enemies = [];
  let frames = 0;
  let spawnRate = 200;

  function clone(model) {
    const c = model.clone(true);
    c.type = model.type;
    c.traverse(o => {
      if (o.isMesh) { o.castShadow=true; o.receiveShadow=true; }
    });
    return c;
  }

  // --- PAUSA GLOBAL ---
  setInterval(() => {
      if (gameState.paused) {
          bernice.speedMultiplier = 0;
          enemies.forEach(e => e.velocity.set(0,0,0));
      }
  }, 80);

  // --- LOOP ---
  function animate() {
    if (gameState.paused) return;
    requestAnimationFrame(animate);

    // OVNI animación
    ovniTime += 0.02;
    ovni.position.y = -1 + Math.sin(ovniTime*2)*1.5;
    ovni.rotation.y += 0.01;

    berniceBBox.setFromObject(bernice);

    // COLISIONES
    enemies.forEach(enemy => {

      if (berniceBBox.intersectsBox(enemy.bbox)) {

        if (enemy.type === "diamond") {
          gameState.diamantes++;
          diamondsHUD.textContent = gameState.diamantes;
        }

        if (enemy.type === "emerald") {
          gameState.esmeraldas++;
          esmeraldasHUD.textContent = gameState.esmeraldas;
        }

        enemy.removeFromParent();
      }

    });

    // SPAWNEO
    if (frames % spawnRate === 0) {
      const model = models[Math.floor(Math.random()*models.length)];
      const e = clone(model);
      e.position.set([-10,0,10][Math.floor(Math.random()*3)],1.2,-120);
      e.velocity = new THREE.Vector3(0,0,0.02);
      e.bbox = new THREE.Box3().setFromObject(e);
      enemies.push(e);
      scene.add(e);
    }

    // MOVIMIENTO
    enemies.forEach(e => {
      e.position.add(e.velocity);
      e.bbox.setFromObject(e);
    });

    frames++;
  }

  animate();

  return { bernice };
}
