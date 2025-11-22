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

  // --- OVNI AL FINAL DE LA PISTA ---
  const ovni = await loadModel('/models/ovni.glb');
  ovni.scale.setScalar(0.5);
  ovni.position.set(0, -2, -95); // Ajusta esta posición si quieres moverlo
  scene.add(ovni);
    
  // Luz principal del OVNI (brillante)
  const ovniLight = new THREE.PointLight(0x33ffff, 6, 60);
  ovniLight.position.set(0, -1, 0);
  ovniLight.castShadow = true;
  ovni.add(ovniLight);

  // Luz ambiente azul
  const ovniGlow = new THREE.PointLight(0x99ccff, 2, 80);
  ovniGlow.position.set(0, 0.5, 0);
  ovniGlow.castShadow = false;
  ovni.add(ovniGlow);

  scene.add(ovni);

  // Variables para animación de flotación
  let ovniTime = 0;


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

  //Pantalla de lose 
  function mostrarGameOver() {
    const gameArea = document.querySelector(".game-area");
    if (!gameArea) return;

    const overlay = document.createElement("div");
    overlay.id = "gameover-screen";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.backdropFilter = "blur(5px)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "100";

    // Imagen lose.png
    const img = document.createElement("img");
    img.src = "Img/lose.png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";  // Hace que llene todo sin deformarse


    overlay.appendChild(img);
    gameArea.appendChild(overlay);
  }


  // -------------------------------------------------------
  // 🔥 LOOP PRINCIPAL
  // -------------------------------------------------------

  function animate() {
    requestAnimationFrame(animate);
    ovniTime += 0.02;

    // Flotación arriba / abajo
    ovni.position.y = -1 + Math.sin(ovniTime * 2) * 1.5;

    // Movimiento horizontal izquierda–derecha entre -10 y +10
    ovni.position.x = Math.sin(ovniTime * 0.7) * 10;

    // Rotación suave
    ovni.rotation.y += 0.01;

    // Luz pulsante
    ovniLight.intensity = 2 + Math.sin(ovniTime * 3) * 0.7;
    ovniGlow.intensity = 1 + Math.cos(ovniTime * 3) * 0.4;


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
              mostrarGameOver(); // 🔥 APARECE LA IMAGEN
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
