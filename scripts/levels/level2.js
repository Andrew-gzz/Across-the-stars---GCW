// scripts/levels/level2.js
import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';
import { input } from '../core/input.js';

export async function loadLevel2(scene, physics) {

  // ✔ Recuperar dificultad del localStorage
  const dificultad = (localStorage.getItem("dificultad") || "normal").toLowerCase();

  let tiempoActivado;
  if (dificultad === "facil") tiempoActivado = 10;
  else if (dificultad === "dificil") tiempoActivado = 4;

  console.log("Dificultad:", dificultad, "Tiempo:", tiempoActivado);

  // ---- HUD ----
  const esmeraldasHUD = document.getElementById("esmeraldas");
  const diamondsHUD = document.getElementById("diamantes");
  const tiempoHUD = document.getElementById("tiempo");

  esmeraldasHUD.textContent = gameState.esmeraldas;
  diamondsHUD.textContent = gameState.diamantes;

  // ---- LUCES ----
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 100, 100);
  scene.add(dirLight);

  // ---- PISO INFINITO ----
  const textureLoader = new THREE.TextureLoader();
  const marsTexture = textureLoader.load('/Img/pista2.png');

  marsTexture.wrapS = THREE.RepeatWrapping;
  marsTexture.wrapT = THREE.RepeatWrapping;
  marsTexture.repeat.set(1, 8);

  const groundLength = 220;

  const ground1 = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, groundLength),
    new THREE.MeshStandardMaterial({ map: marsTexture })
  );
  ground1.position.set(0, -2, 0);
  ground1.receiveShadow = true;
  scene.add(ground1);

  const ground2 = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, groundLength),
    new THREE.MeshStandardMaterial({ map: marsTexture })
  );
  ground2.position.set(0, -2, -groundLength);
  ground2.receiveShadow = true;
  scene.add(ground2);

  let groundSpeed = 0.2;

  // 🔥 MULTIPLICADOR GLOBAL PARA ACELERAR TODO
  let globalSpeedMultiplier = 1;

  // ---- BERNICE ----
  const bernice = await loadModel('/models/Bernice.fbx');
  bernice.name = "Bernice";
  bernice.position.set(0, 0, 20);
  bernice.scale.setScalar(0.06);
  bernice.rotation.y = Math.PI;
  bernice.isFrozen = false;
  bernice.speedMultiplier = 1;
  scene.add(bernice);

  const berniceBBox = new THREE.Box3().setFromObject(bernice);

  // ---- MODELOS BASE ----
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



  // ---- META FINAL ----
 async function spawnMeta() {

    if (metaSpawned) return;
    metaSpawned = true;
    

   // ---- META ----
    meta = await loadModel('/models/meta2.glb');
    meta.scale.setScalar(1);
    meta.position.set(0, 0, -50);
    meta.type = "goal";
    meta.velocity = new THREE.Vector3(0, 0, 0.09); 
    scene.add(meta);

    // ---- OVNI FINAL ----
    ovniFinal = await loadModel('/models/ovni2.glb');
    ovniFinal.scale.setScalar(0.5);
    ovniFinal.position.set(
      meta.position.x,
      meta.position.y - 3,
      meta.position.z + 1
    );
    scene.add(ovniFinal);

    // ✔ AHORA SÍ deben imprimirse
    console.log("✔ Modelo cargado: META", meta ? "OK" : "ERROR");
    console.log("✔ Modelo cargado: OVNI FINAL", ovniFinal ? "OK" : "ERROR");

    // ⭐ LUCES
    const ovniLight = new THREE.PointLight(0x33ffff, 20, 200);
    ovniLight.position.set(0, -1, 0);
    ovniFinal.add(ovniLight);

    const ovniGlow = new THREE.PointLight(0x99ccff, 4, 90);
    ovniGlow.position.set(0, 0.5, 0);
    ovniFinal.add(ovniGlow);
  }

  //Cambiar probabilidades
  function getRandomModel() {
      const r = Math.random();

      if (r < 0.40) return baseEsmeralda;   // 40%
      if (r < 0.55) return baseDiamante;    // 15%
      if (r < 0.85) return baseAsteroid;    // 30%
      return baseThunder;                   // 15%
  }


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

  // ---- PANTALLAS ----
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

  // ---- TIMER DIFÍCIL ----
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
        mostrarGameOver();
      }

    }, 1000);
    // 🔥 CADA 3 SEGUNDOS SE PIERDE 1 ESMERALDA EN MODO DIFÍCIL
    gameState.damageInterval = setInterval(() => {
        if (gameState.paused) return;

        gameState.esmeraldas--;
        esmeraldasHUD.textContent = gameState.esmeraldas;

        console.log("💀 Esmeralda perdida. Restantes:", gameState.esmeraldas);

        // Si se queda sin esmeraldas → Game Over
        if (gameState.esmeraldas <= 0) {
            clearInterval(gameState.damageInterval);
            clearInterval(gameState.timeInterval);
            gameState.paused = true;
            bernice.isFrozen = true;
            mostrarGameOver();
        }

    }, 3000); // 🔥 Cada 3 segundos

  } else {
    tiempoHUD.textContent = "--:--";
    gameState.timeInterval = null;
  }

  // ---- EXPLOSIÓN ----
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
  // 🎮 MOVIMIENTO Y LÍMITES DE BERNICE
  // -------------------------------------------------------

  const LIMIT_X = 18;
  const MIN_Z = -10;
  const MAX_Z = 50;

  // -------------------------------------------------------
  // 🔥 LOOP PRINCIPAL
  // -------------------------------------------------------
  //variables globales 
  let spawnCount = 0;      // ← cuenta objetos generados
  const MAX_SPAWN = 200;    // ← límite antes de meta/ovni

  let meta = null;
  let metaSpawned = false;

  let ovniFinal = null;
  let ovniTime = 0;

  // distancia detrás de la meta
  let finalTargetOffset = -5; 


  function animate() {
    if (gameState.paused) return;
    requestAnimationFrame(animate);

    // ---- OVNI FINAL (si existe) ----
    if (ovniFinal && meta) {
        ovniTime += 0.03;

        // --- Movimiento lateral independiente ---
        ovniFinal.position.x = Math.sin(ovniTime * 0.6) * 10;

        // --- Flotación vertical suave ---
        ovniFinal.position.y = meta.position.y + 20 + Math.sin(ovniTime * 2) * 2;

        // --- Mantenerse cerca de la meta en Z ---
        ovniFinal.position.z = meta.position.z + 5;

        // --- Rotación del ovni ---
        ovniFinal.rotation.y += 0.01;
    }



    // ---- COLISIÓN CON META FINAL ----
    if (meta) {
        const metaBBox = new THREE.Box3().setFromObject(meta);

        if (berniceBBox.intersectsBox(metaBBox)) {
            gameState.paused = true;
            bernice.isFrozen = true;
            if (gameState.timeInterval) clearInterval(gameState.timeInterval);
            mostrarWin();
            return;
        }
    }


    // ---- COLISIÓN CON OVNI FINAL ----
    if (ovniFinal) {
      const ovniFinalBBox = new THREE.Box3().setFromObject(ovniFinal);
      if (berniceBBox.intersectsBox(ovniFinalBBox)) {
        gameState.paused = true;
        bernice.isFrozen = true;
        if (gameState.timeInterval) clearInterval(gameState.timeInterval);
        mostrarWin();
        return;
      }
    }


    // --- PISO INFINITO ---
    ground1.position.z += groundSpeed * globalSpeedMultiplier;
    ground2.position.z += groundSpeed * globalSpeedMultiplier;

    if (ground1.position.z > groundLength) {
      ground1.position.z = ground2.position.z - groundLength;
    }

    if (ground2.position.z > groundLength) {
      ground2.position.z = ground1.position.z - groundLength;
    }

    // --- MOVIMIENTO DE BERNICE ---
    if (!bernice.isFrozen && input && input._keys) {
      let speed = 0.2 * (bernice.speedMultiplier || 1);

      if (input._keys.left) bernice.position.x -= speed;
      if (input._keys.right) bernice.position.x += speed;
      if (input._keys.up) bernice.position.z -= speed;
      if (input._keys.down) bernice.position.z += speed;
    }

    // ---- LIMITES ----
    if (bernice.position.x < -LIMIT_X) bernice.position.x = -LIMIT_X;
    if (bernice.position.x > LIMIT_X)  bernice.position.x = LIMIT_X;

    if (bernice.position.z < MIN_Z) bernice.position.z = MIN_Z;
    if (bernice.position.z > MAX_Z) bernice.position.z = MAX_Z;

    berniceBBox.setFromObject(bernice);

    // ---- COLISIONES ----
    enemies.forEach(enemy => {

      if (berniceBBox.intersectsBox(enemy.bbox)) {

        if (enemy.type === "thunder") {

          // 🔥 ACELERA TODO DURANTE EL POWER-UP
          globalSpeedMultiplier = 2.5;
          bernice.speedMultiplier = 2.5;

          gameState.thunderActive = true;
          gameState.thunderTime = 3;
          thunderHUD.textContent = gameState.thunderTime + "s";

          if (gameState.thunderInterval) clearInterval(gameState.thunderInterval);
          if (gameState.thunderTimeout) clearTimeout(gameState.thunderTimeout);

          // cada segundo
          gameState.thunderInterval = setInterval(() => {
            gameState.thunderTime--;
            if (gameState.thunderTime >= 0)
              thunderHUD.textContent = gameState.thunderTime + "s";
          }, 1000);

          // cuando se termina el power-up
          gameState.thunderTimeout = setTimeout(() => {
            gameState.thunderActive = false;
            bernice.speedMultiplier = 1;
            globalSpeedMultiplier = 1;  // 🔥 VOLVER TODO A NORMAL
            thunderHUD.textContent = "0";
          }, 3000);
        }

        if (enemy.type === "asteroid") {
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

        if (enemy.type === "diamond") {
          gameState.diamantes++;
          diamondsHUD.textContent = gameState.diamantes;
        }

        if (enemy.type === "emerald") {
          gameState.esmeraldas++;
          esmeraldasHUD.textContent = gameState.esmeraldas;
        }

        removeEnemy(enemy);
      }

    });

   // ---- SPAWNEO ----
    if (frames % spawnRate === 0) {

        // aceleramos spawn
        if (spawnRate > 30) spawnRate -= 10;

        // 👉 Si ya generamos 50 objetos, solo spawnear META
      if (spawnCount >= MAX_SPAWN) {

          if (!metaSpawned) {
              spawnMeta();   // solo una vez
          }

          // ❌ NO return
          // El juego sigue normalmente
      } else {

          // ✔ generar enemigos normales
          const model = getRandomModel();
          const enemy = cloneModel(model);

          const laneX = [-12, -6, 0, 6, 12];
          enemy.position.set(laneX[Math.floor(Math.random() * laneX.length)], 1.2, -50);

          enemy.velocity = new THREE.Vector3(0, 0, 0.03);
          enemy.zAcceleration = true;
          enemy.bbox = new THREE.Box3().setFromObject(enemy);

          scene.add(enemy);
          enemies.push(enemy);

          spawnCount++;
          console.log(`🟡 OBJETOS GENERADOS: ${spawnCount}/${MAX_SPAWN}`);

      }

    }



    // ---- MOVIMIENTO DE OBJETOS ----
    enemies.forEach(enemy => {
      
      if (enemy.type === "asteroid") {
          // ⚡ Rotación más caótica
          enemy.rotation.x += 0.015 * globalSpeedMultiplier;
          enemy.rotation.y += 0.01  * globalSpeedMultiplier;
          enemy.rotation.z += 0.02  * globalSpeedMultiplier;

          // 🔥 “Tambaleo”
          enemy.position.y += Math.sin(Date.now() * 0.005 + enemy.position.x) * 0.01;
          
      } else {
          // Animación normal de diamantes, esmeraldas, thunder
          enemy.position.y += Math.sin(Date.now() * 0.003 + enemy.position.x) * 0.005;
          enemy.rotation.y += 0.02 * globalSpeedMultiplier;
      }
    
      // velocidad general aplicada aquí 🔥
      enemy.position.addScaledVector(enemy.velocity, globalSpeedMultiplier);

      if (enemy.zAcceleration) enemy.velocity.z += 0.0003 * globalSpeedMultiplier;

      enemy.bbox.setFromObject(enemy);
    });


     // ---- MOVER META ----
    if (meta) {
      meta.position.addScaledVector(meta.velocity, globalSpeedMultiplier);
    }


    frames++;
  }



  // evitar rotación indeseada
  bernice.rotation.set(0, Math.PI, 0);

  window.startGameLoop = animate;
  animate();

  return { bernice };
}
