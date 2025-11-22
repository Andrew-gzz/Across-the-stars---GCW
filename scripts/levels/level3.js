import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';

export async function loadLevel3(scene) {

  // --- HUD ---
  const esmeraldasHUD = document.getElementById("esmeraldas");
  const diamondsHUD = document.getElementById("diamantes");

  esmeraldasHUD.textContent = gameState.esmeraldas;
  diamondsHUD.textContent = gameState.diamantes;


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
  ovni.position.set(0, -2, -95);
  scene.add(ovni);

  const ovniLight = new THREE.PointLight(0x33ffff, 6, 60);
  ovniLight.position.set(0, -1, 0);
  ovniLight.castShadow = true;
  ovni.add(ovniLight);

  const ovniGlow = new THREE.PointLight(0x99ccff, 2, 80);
  ovniGlow.position.set(0, 0.5, 0);
  ovniGlow.castShadow = false;
  ovni.add(ovniGlow);

  // --- Animación del OVNI ---
  let ovniTime = 0;


  // -------------------------------------------------------
  // 🔥 CARGA DE MODELOS PARA ENEMIGOS y OBJETOS
  // -------------------------------------------------------

  const baseAsteroid = await loadModel('/models/asteroid2.glb');
  baseAsteroid.scale.setScalar(1.5);
  baseAsteroid.type = "asteroid";

  const baseDiamante = await loadModel('/models/diamante.glb');
  baseDiamante.scale.setScalar(2);
  baseDiamante.type = "diamond";

  const baseEsmeralda = await loadModel('/models/esmeralda.glb');
  baseEsmeralda.scale.setScalar(2);
  baseEsmeralda.type = "emerald";

  // --- THUNDER / POTENCIADOR DE VELOCIDAD ---
  const baseThunder = await loadModel('/models/thunder2.glb');
  baseThunder.scale.setScalar(1.5);
  baseThunder.type = "thunder";


  const models = [baseAsteroid, baseDiamante, baseEsmeralda, baseThunder];


  // Función para clonar modelos sin compartir materiales
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

  // Lista de enemigos
  const enemies = [];
  let frames = 0;
  let spawnRate = 180;

  function removeEnemy(enemy) {
    enemy.removeFromParent();
    const index = enemies.indexOf(enemy);
    if (index !== -1) enemies.splice(index, 1);
  }

  // Pantalla de victoria
  function mostrarWin() {
    const gameArea = document.querySelector(".game-area");
    if (!gameArea) return;

    const overlay = document.createElement("div");
    overlay.id = "win-screen";
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

    const img = document.createElement("img");
    img.src = "Img/youWin.png";   // 🔥 IMAGEN DE VICTORIA
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    overlay.appendChild(img);
    gameArea.appendChild(overlay);
  }

  // Pantalla de game over
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

    const img = document.createElement("img");
    img.src = "Img/lose.png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    overlay.appendChild(img);
    gameArea.appendChild(overlay);
  }

  const thunderHUD = document.getElementById("poteciador");

  //Boost de velocidad
  let speedBoost = false;
  let speedBoostTimeout = null;
  let normalSpeed = 0.03;
  let boostedSpeed = 0.12; // Ajusta como quieras


  // -------------------------------------------------------
  // 🔥 LOOP PRINCIPAL
  // -------------------------------------------------------

  function animate() {
    if (gameState.paused) return;
    requestAnimationFrame(animate);

    // --- Animación OVNI ---
    ovniTime += 0.02;
    ovni.position.y = -1 + Math.sin(ovniTime * 2) * 1.5;
    ovni.position.x = Math.sin(ovniTime * 0.7) * 10;
    ovni.rotation.y += 0.01;

    ovniLight.intensity = 2 + Math.sin(ovniTime * 3) * 0.7;
    ovniGlow.intensity = 1 + Math.cos(ovniTime * 3) * 0.4;

    // Actualizar BBox
    berniceBBox.setFromObject(bernice);

    // --- COLISIONES ---
    enemies.forEach(enemy => {

      if (berniceBBox.intersectsBox(enemy.bbox)) {
        
        if (enemy.type === "thunder") {

          console.log("⚡ Potenciador ACTIVADO");

          gameState.thunderActive = true;

          // Velocidad aumentada
          bernice.speedMultiplier = 2.5;

          // Tiempo inicial
          gameState.thunderTime = 3;
          thunderHUD.textContent = gameState.thunderTime + "s";

          // Cancelar intervalos anteriores
          if (gameState.thunderInterval) clearInterval(gameState.thunderInterval);
          if (gameState.thunderTimeout) clearTimeout(gameState.thunderTimeout);

          // 🟡 Cuenta regresiva
          gameState.thunderInterval = setInterval(() => {
              gameState.thunderTime--;

              if (gameState.thunderTime >= 0) {
                  thunderHUD.textContent = gameState.thunderTime + "s";
              }

              if (gameState.thunderTime <= 0) {
                  clearInterval(gameState.thunderInterval);
              }

          }, 1000);

          // 🔵 Fin del boost
          gameState.thunderTimeout = setTimeout(() => {

              console.log("⛔ Thunder terminado");

              gameState.thunderActive = false;
              bernice.speedMultiplier = 1;

              thunderHUD.textContent = "0";

          }, 3000);
      }

        // ASTEROIDE → quita vida
        if (enemy.type === "asteroid") {
          gameState.esmeraldas--;
          esmeraldasHUD.textContent = gameState.esmeraldas;

          console.log("💥 Colisión con ASTEROIDE. Esmeraldas:", gameState.esmeraldas);

          if (gameState.esmeraldas <= 0) {
              bernice.isFrozen = true;
              gameState.paused = true;   // 🔥 PAUSAR JUEGO
              console.log("❌ Juego terminado.");
              mostrarGameOver();
          }

        }

        // DIAMANTE
        if (enemy.type === "diamond") {
          gameState.diamantes++;
          diamondsHUD.textContent = gameState.diamantes;
          console.log("💎 Recogiste un DIAMANTE:", gameState.diamantes);
        }

        // ESMERALDA
        if (enemy.type === "emerald") {
          gameState.esmeraldas++;
          esmeraldasHUD.textContent = gameState.esmeraldas;
          console.log("🟩 Recogiste una ESMERALDA:", gameState.esmeraldas);
        }

        const ovniBBox = new THREE.Box3().setFromObject(ovni);
        if (berniceBBox.intersectsBox(ovniBBox)) {
            console.log("🚀 ¡Llegaste al OVNI! GANASTE");
            gameState.paused = true;   // 🔥 PAUSAR TODO
            bernice.isFrozen = true;

            mostrarWin();
            return;  // Detiene la ejecución del frame actual
        }

        removeEnemy(enemy);
      }

    });


    // --- SPAWN DE ENEMIGOS ---
    if (frames % spawnRate === 0) {

      if (spawnRate > 30) spawnRate -= 10;

      const randomModel = models[Math.floor(Math.random() * models.length)];

      const enemy = cloneModel(randomModel);

      const laneX = [-12, -6, 0, 6, 12];
      const randomX = laneX[Math.floor(Math.random() * laneX.length)];

      enemy.position.set(randomX, 1.2, -200);

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
      enemy.bbox.setFromObject(enemy);
    });

    frames++;
  }

  animate();

  return { bernice };
}
