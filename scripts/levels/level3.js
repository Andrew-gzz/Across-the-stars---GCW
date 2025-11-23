import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';

export async function loadLevel3(scene, physics) {

  // ✔ Recuperar dificultad del localStorage
  const dificultad = (localStorage.getItem("dificultad") || "normal").toLowerCase();

  let tiempoActivado;
  if (dificultad === "facil") tiempoActivado = 10;
  else if (dificultad === "dificil") tiempoActivado = 4;

  console.log("Dificultad:", dificultad, "Tiempo:", tiempoActivado);

  // OBSERVADOR GLOBAL DEL PAUSE
  setInterval(() => {
      if (gameState.paused) {

          // Pausar thunder
          if (gameState.thunderInterval) {
              clearInterval(gameState.thunderInterval);
              gameState.thunderInterval = null;
          }

          if (gameState.thunderTimeout) {
              clearTimeout(gameState.thunderTimeout);
              gameState.thunderTimeout = null;
          }

          // Frenar completamente a Bernice
          if (bernice) bernice.speedMultiplier = 0;

          // Frenar enemigos
          enemies.forEach(e => e.velocity.set(0, 0, 0));
      }
  }, 100);


  // --- HUD ---
  const esmeraldasHUD = document.getElementById("esmeraldas");
  const diamondsHUD = document.getElementById("diamantes");
  const tiempoHUD = document.getElementById("tiempo");

  esmeraldasHUD.textContent = gameState.esmeraldas;
  diamondsHUD.textContent = gameState.diamantes;


  // --- LUCES ---
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 100, 100);
  scene.add(dirLight);
// --- PISO ---
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load('/Img/pista4.png');

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

  // --- OVNI ---
  const ovni = await loadModel('/models/ovni.glb');
  ovni.scale.setScalar(0.5);
  ovni.position.set(0, -2, -170);
  scene.add(ovni);

  const ovniLight = new THREE.PointLight(0x33ffff, 20, 200);
  ovniLight.position.set(0, -1, 0);
  ovniLight.castShadow = true;
  ovni.add(ovniLight);

  const ovniGlow = new THREE.PointLight(0x99ccff, 2, 80);
  ovniGlow.position.set(0, 0.5, 0);
  ovniGlow.castShadow = false;
  ovni.add(ovniGlow);

  let ovniTime = 0;

  // -------------------------------------------------------
  // 🔥 CARGA DE MODELOS DE OBJETOS
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

  const baseThunder = await loadModel('/models/thunder3.glb');
  baseThunder.scale.setScalar(1.5);
  baseThunder.type = "thunder";

  const models = [baseAsteroid, baseDiamante, baseEsmeralda, baseThunder];

  // Función para clonar
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

  const enemies = [];
  let frames = 0;
  let spawnRate = 180;

  function removeEnemy(enemy) {
    enemy.removeFromParent();
    const i = enemies.indexOf(enemy);
    if (i !== -1) enemies.splice(i, 1);
  }

  // Pantallas
  function mostrarWin() {
    const gameArea = document.querySelector(".game-area");
    if (!gameArea) return;

    const overlay = document.createElement("div");
    overlay.id = "win-screen";
    overlay.style = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);
      display:flex;justify-content:center;align-items:center;z-index:100;
    `;
    const img = document.createElement("img");
    img.src = "Img/youWin.png";
    img.style = "width:100%;height:100%;object-fit:cover;";
    overlay.appendChild(img);
    gameArea.appendChild(overlay);
  }

  function mostrarGameOver() {
    const gameArea = document.querySelector(".game-area");
    if (!gameArea) return;

    const overlay = document.createElement("div");
    overlay.id = "gameover-screen";
    overlay.style = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);
      display:flex;justify-content:center;align-items:center;z-index:100;
    `;
    const img = document.createElement("img");
    img.src = "Img/lose.png";
    img.style = "width:100%;height:100%;object-fit:cover;";
    overlay.appendChild(img);
    gameArea.appendChild(overlay);
  }

  const thunderHUD = document.getElementById("poteciador");

  // Boost
  gameState.thunderActive = false;
  let normalSpeed = 0.03;

  // -------------------------------------------------------
  // ⏳ TIMER SOLO EN DIFICULTAD "dificil"
  // -------------------------------------------------------
  if (dificultad === "dificil") {

    gameState.timeLeft = 60;

    function formatTime(s) {
      const m = Math.floor(s / 60).toString().padStart(2, "0");
      const ss = (s % 60).toString().padStart(2, "0");
      return `${m}:${ss}`;
    }

    tiempoHUD.textContent = formatTime(gameState.timeLeft);

    gameState.timeInterval = setInterval(() => {
      if (gameState.paused) return;

      gameState.timeLeft--;
      tiempoHUD.textContent = formatTime(gameState.timeLeft);

      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timeInterval);
        gameState.paused = true;
        console.log("⏰ Tiempo agotado — GAME OVER");
        mostrarGameOver();
      }

    }, 1000);

  } else {
    // Fácil / Normal → no hay tiempo
    tiempoHUD.textContent = "--:--";
    gameState.timeInterval = null;
  }

    function crearExplosion(scene, position) {
    const particleCount = 20;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.SphereGeometry(0.2, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff5500,
        emissive: 0xff2200,
        transparent: true,
        opacity: 0.9
      });

      const p = new THREE.Mesh(geom, mat);

      p.position.copy(position);
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );

      particles.add(p);
    }

    scene.add(particles);

    // Animación de partículas por 500ms
    let alive = 0;
    const explosionInterval = setInterval(() => {
      alive += 16;

      particles.children.forEach(p => {
        p.position.add(p.velocity);
        p.material.opacity -= 0.03;
      });

      if (alive > 500) {
        scene.remove(particles);
        clearInterval(explosionInterval);
      }
    }, 16);
  }

  
  

  // -------------------------------------------------------
  // 🔥 LOOP PRINCIPAL
  // -------------------------------------------------------

  function animate() {
    if (gameState.paused) return;
    requestAnimationFrame(animate);

    // OVNI animación
    ovniTime += 0.02;
    ovni.position.y = -1 + Math.sin(ovniTime * 2) * 1.5;
    ovni.position.x = Math.sin(ovniTime * 0.7) * 10;
    ovni.rotation.y += 0.01;

    ovniLight.intensity = 2 + Math.sin(ovniTime * 3) * 0.7;
    ovniGlow.intensity = 1 + Math.cos(ovniTime * 3) * 0.4;

    berniceBBox.setFromObject(bernice);

    // ---- COLISIÓN CON EL OVNI ----
    const ovniBBox = new THREE.Box3().setFromObject(ovni);

    if (berniceBBox.intersectsBox(ovniBBox)) {
        console.log("🚀 ¡Llegaste al OVNI! GANASTE");

        gameState.paused = true;
        bernice.isFrozen = true;

        if (gameState.timeInterval) clearInterval(gameState.timeInterval);

        mostrarWin();
        return;
    }


    // ---- COLISIONES ----
    enemies.forEach(enemy => {
      

      if (berniceBBox.intersectsBox(enemy.bbox)) {

        // ⚡ THUNDER
        if (enemy.type === "thunder") {

          console.log("⚡ Potenciador ACTIVADO");

          gameState.thunderActive = true;
          bernice.speedMultiplier = 2.5;

          gameState.thunderTime = 3;
          thunderHUD.textContent = gameState.thunderTime + "s";

          if (gameState.thunderInterval) clearInterval(gameState.thunderInterval);
          if (gameState.thunderTimeout) clearTimeout(gameState.thunderTimeout);

          gameState.thunderInterval = setInterval(() => {
            gameState.thunderTime--;
            if (gameState.thunderTime >= 0)
              thunderHUD.textContent = gameState.thunderTime + "s";

            if (gameState.thunderTime <= 0)
              clearInterval(gameState.thunderInterval);

          }, 1000);

          gameState.thunderTimeout = setTimeout(() => {
            console.log("⛔ Thunder terminado");

            gameState.thunderActive = false;
            bernice.speedMultiplier = 1;
            thunderHUD.textContent = "0";

          }, 3000);
        }

        // 💥 ASTEROIDE
        if (enemy.type === "asteroid") {
            // 💥 Crear explosión
            crearExplosion(scene, enemy.position.clone());

            gameState.esmeraldas--;
            esmeraldasHUD.textContent = gameState.esmeraldas;

            if (gameState.esmeraldas <= 0) {
              if (gameState.timeInterval) clearInterval(gameState.timeInterval);
              bernice.isFrozen = true;
              gameState.paused = true;
              mostrarGameOver();
            }
        }

        // 💎 DIAMANTE
        if (enemy.type === "diamond") {
          gameState.diamantes++;
          diamondsHUD.textContent = gameState.diamantes;
        }

        // 🟩 ESMERALDA
        if (enemy.type === "emerald") {
          gameState.esmeraldas++;
          esmeraldasHUD.textContent = gameState.esmeraldas;
        }

        // 🚀 LLEGADA AL OVNI
        const ovniBBox = new THREE.Box3().setFromObject(ovni);
        if (berniceBBox.intersectsBox(ovniBBox)) {

          console.log("🚀 ¡Llegaste al OVNI! GANASTE");

          gameState.paused = true;
          bernice.isFrozen = true;

          if (gameState.timeInterval) clearInterval(gameState.timeInterval);

          mostrarWin();
          return;
        }

        removeEnemy(enemy);
      }

    });

    // ---- SPAWNEO ----
    if (frames % spawnRate === 0) {
      if (spawnRate > 30) spawnRate -= 10;

      const model = models[Math.floor(Math.random() * models.length)];
      const enemy = cloneModel(model);

      const laneX = [-12, -6, 0, 6, 12];
      enemy.position.set(laneX[Math.floor(Math.random() * laneX.length)], 1.2, -160);

      enemy.velocity = new THREE.Vector3(0, 0, 0.03);
      enemy.zAcceleration = true;
      enemy.bbox = new THREE.Box3().setFromObject(enemy);

      scene.add(enemy);
      enemies.push(enemy);
    }

   // ---- MOVIMIENTO + ANIMACIONES ----
    enemies.forEach(enemy => {

      // --- ANIMACIONES POR TIPO ---
      if (enemy.type === "emerald" || enemy.type === "diamond" ||enemy.type === "thunder") {
        enemy.position.y += Math.sin(Date.now() * 0.003 + enemy.position.x) * 0.005;
        enemy.rotation.y += 0.02;
      }

      
      if (enemy.type === "asteroid") {
        enemy.rotation.x += 0.05;
        enemy.rotation.y += 0.03;
        enemy.rotation.z += 0.02;
      }

      // --- MOVIMIENTO BASE ---
      if (enemy.zAcceleration) enemy.velocity.z += 0.0003;
      enemy.position.add(enemy.velocity);
      enemy.bbox.setFromObject(enemy);
    });

    frames++;
    }

  window.startGameLoop = animate;

  animate();

  return { bernice };
}
