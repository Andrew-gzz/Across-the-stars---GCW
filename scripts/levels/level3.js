import * as THREE from 'three';
import { loadModel } from '../core/assets.js';

export async function loadLevel3(scene) {

  // --- HUD ---
  let esmeraldas = 10;
  let diamonds = 0;

  const esmeraldasHUD = document.getElementById("esmeraldas");
  const diamondsHUD = document.getElementById("diamantes");

  esmeraldasHUD.textContent = esmeraldas;
  diamondsHUD.textContent = diamonds;


  // --- LUCES ---
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 100, 100);
  scene.add(dirLight);

  // --- PISO ---
  const groundGeometry = new THREE.BoxGeometry(40, 0.5, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#0369a1' });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, -2, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // --- CARGAR BERNICE ---
  const bernice = await loadModel('/models/Bernice.fbx');
  bernice.name = "Bernice";
  bernice.position.set(0, 0, 20);
  bernice.scale.setScalar(0.06);
  bernice.rotation.y = Math.PI;
  bernice.isFrozen = false;
  scene.add(bernice);

  const berniceBBox = new THREE.Box3().setFromObject(bernice);

  console.log("Bernice cargada:", bernice);


  // -------------------------------------------------------
  // 🔥 CARGA DE MODELOS PARA ENEMIGOS y OBJETOS
  // -------------------------------------------------------

  // --- ASTEROIDE ---
  const baseAsteroid = await loadModel('/models/asteroid2.glb');
  baseAsteroid.scale.setScalar(1.5);
  baseAsteroid.type = "asteroid";

  // --- DIAMANTE ---
  const baseDiamante = await loadModel('/models/diamante.glb');
  baseDiamante.scale.setScalar(2);
  baseDiamante.type = "diamond";

  // --- ESMERALDA ---
  const baseEsmeralda = await loadModel('/models/esmeralda.glb');
  baseEsmeralda.scale.setScalar(2);
  baseEsmeralda.type = "emerald";

  // Modelos disponibles para aparecer
  const models = [baseAsteroid, baseDiamante, baseEsmeralda];


  // Función para clonar el modelo SIN compartir materiales
  function cloneModel(model) {
    const clone = model.clone(true);
    clone.type = model.type;
    clone.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }

  // --- LISTA DE OBJETOS EN EL MUNDO ---
  const enemies = [];
  let frames = 0;
  let spawnRate = 180;

  function removeEnemy(enemy) {
    enemy.removeFromParent();             
    const index = enemies.indexOf(enemy); 
    if (index !== -1) enemies.splice(index, 1);
  }

  // -------------------------------------------------------
  // 🔥 LOOP PRINCIPAL
  // -------------------------------------------------------

  function animate() {
    requestAnimationFrame(animate);

    // actualizar bounding box de Bernice
    berniceBBox.setFromObject(bernice);

    // --- COLISIONES ---
    enemies.forEach(enemy => {

      if (berniceBBox.intersectsBox(enemy.bbox)) {

        // ASTEROIDE → quita vida
       if (enemy.type === "asteroid") {
          esmeraldas--;                      // baja la vida
          esmeraldasHUD.textContent = esmeraldas;

          console.log("💥 Colisión con ASTEROIDE. Esmeraldas (vida):", esmeraldas);

          if (esmeraldas <= 0) {
              bernice.isFrozen = true;
              console.log("❌ Sin esmeraldas (vida). Juego terminado.");
          }
        }

        if (enemy.type === "diamond") {
            diamonds++;
            diamondsHUD.textContent = diamonds;
            console.log("💎 Recogiste un DIAMANTE. Total:", diamonds);
        }

        if (enemy.type === "emerald") {
            // si quieres que las esmeraldas recogidas SUMEN vida:
            esmeraldas++;
            esmeraldasHUD.textContent = esmeraldas;

            console.log("🟩 Recogiste una ESMERALDA extra. Nuevas esmeraldas:", esmeraldas);
        }


        // desaparecer después de colisionar
        removeEnemy(enemy);
      }

    });

    // --- SPAWN ENEMIGOS ---
    if (frames % spawnRate === 0) {

      if (spawnRate > 30) spawnRate -= 10;

      const randomModel = models[Math.floor(Math.random() * models.length)];

      const enemy = cloneModel(randomModel);

      // 5 filas horizontales en X
      const laneX = [-12, -6, 0, 6, 12];
      const randomX = laneX[Math.floor(Math.random() * laneX.length)];

      enemy.position.set(
        randomX,
        1.2,
        -200
      );

      enemy.velocity = new THREE.Vector3(0, 0, 0.03);
      enemy.zAcceleration = true;
      enemy.bbox = new THREE.Box3().setFromObject(enemy);

      scene.add(enemy);
      enemies.push(enemy);
    }

    // --- MOVIMIENTO ---
    enemies.forEach(enemy => {

      if (enemy.zAcceleration) enemy.velocity.z += 0.0003;

      enemy.position.add(enemy.velocity);

      // actualizar bbox
      enemy.bbox.setFromObject(enemy);
    });

    frames++;
  }

  animate();

  return { bernice };
}
