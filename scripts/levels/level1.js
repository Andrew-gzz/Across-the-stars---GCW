import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';
import { input } from '../core/input.js';

export async function loadLevel1(scene, physics) {

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

  // Diffuse map (color)
  const diffuse = textureLoader.load('/Img/FloorTexture.png');
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.repeat.set(1, 8);

  // Normal map (relieve)
  const normalMap = textureLoader.load('/Img/N_Floor.png');
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(1, 8);
  normalMap.flipY = false;

  // Material con relieve
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: diffuse,
    normalMap: normalMap,
    roughness: 0.4,
    metalness: 0.6,
    emissive: 0xffffff,
    emissiveMap: diffuse,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.75,
  });


  // Tamaño del piso infinito
  const groundLength = 220;

  // Primer segmento
  const ground1 = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, groundLength),
    groundMaterial
  );
  ground1.position.set(0, -2, 0);
  ground1.receiveShadow = true;
  scene.add(ground1);

  // Segundo segmento
  const ground2 = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, groundLength),
    groundMaterial
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

  //-----------------------------------------------------
  // ::::::::::::::: ESCENARIO
  //-----------------------------------------------------
  let mercuryOrbit = null;
  let venusOrbit   = null;
  let moonOrbit    = null;

  const scenery = [];

  function addScenery(obj, {
    speedZ = 0,      // movimiento hacia el jugador
    rotX = 0,
    rotY = 0,
    rotZ = 0
  } = {}) {
    obj.velocity = new THREE.Vector3(0, 0, speedZ);
    obj.rotateSpeed = { x: rotX, y: rotY, z: rotZ };
    scenery.push(obj);
  }
  // SATÉLITE → se mueve hacia el jugador (y puede rotar un poco si quieres)
  const satelite = await loadModel('/models/Planets/Sattelite.glb');
  satelite.scale.setScalar(0.5);
  satelite.type = "satelite";

  // Ojo: rotaciones en radianes, no en grados

  satelite.rotateZ(-75);
  satelite.rotateY(Math.PI);
  satelite.position.set(40, -10, 10);
  scene.add(satelite);

  // Se moverá hacia el jugador y rotará un poquito en Y
  addScenery(satelite, {
    speedZ: 0.03,
  });

  // SUN → no se mueve, solo rota
  const sun = await loadModel('/models/Planets/Sun.glb');
  sun.scale.setScalar(0.25);
  sun.type = "planet";
  sun.position.set(-80, -40, -60);
  scene.add(sun);

  // Lo metemos al sistema pero sin velocidad, solo rotación
  addScenery(sun, {
    speedZ: 0,
    rotY: 0.005      // roto suave en Y
  });

  const mercury = await loadModel('/models/Planets/Mercury.glb');
  mercury.scale.setScalar(0.25);
  mercury.type = "planet";
  mercury.position.set(-70, -40, -60);
  scene.add(mercury);

  // Lo metemos al sistema pero sin velocidad, solo rotación
  addScenery(mercury, {
    speedZ: 0,
    rotY: 0.005, 
    rotZ: 0.02     // roto suave en Y
  });

  const venus = await loadModel('/models/Planets/Venus.glb');
  venus.scale.setScalar(0.25);
  venus.type = "planet";
  venus.position.set(-60, -40, -60);
  scene.add(venus);

  // Lo metemos al sistema pero sin velocidad, solo rotación
  addScenery(venus, {
    speedZ: 0,
    rotY: 0.005, 
    rotZ: 0.02     // roto suave en Y
  });
  // EARTH → rota mientras se mueve hacia el jugador
  const earth = await loadModel('/models/Planets/Earth.glb');
  earth.scale.setScalar(1);
  earth.type = "planet";
  earth.position.set(40, -10, -180);
  scene.add(earth);

  addScenery(earth, {
    speedZ: 0.025,   // un poco más lento que el satélite
    rotY: 0.02       // gira más rápido
  });

  // ---- ÓRBITAS ALREDEDOR DEL SOL ----
// Calculamos radio y ángulo inicial de Mercurio respecto al Sol
  {
    const dx = mercury.position.x - sun.position.x;
    const dz = mercury.position.z - sun.position.z;
    const radius = Math.hypot(dx, dz);
    const angle  = Math.atan2(dz, dx);

    mercuryOrbit = {
      radius,
      angle,
      speed: 0.002,        // más pequeño → más lento
      y: mercury.position.y
    };
  }

  // Lo mismo para Venus
  {
    const dx = venus.position.x - sun.position.x;
    const dz = venus.position.z - sun.position.z;
    const radius = Math.hypot(dx, dz);
    const angle  = Math.atan2(dz, dx);

    venusOrbit = {
      radius,
      angle,
      speed: 0.0012,      // un pelín más lento que Mercurio
      y: venus.position.y
    };
  }

      //:::::::Escenario: Asteroides
  const asteroid = await loadModel('/models/Asteroides/Asteroide1.glb');
  const asteroid1 = await loadModel('/models/Asteroides/Asteroide2.glb');
  const asteroid2 = await loadModel('/models/Asteroides/Asteroide3.glb');
  const asteroid3 = await loadModel('/models/Asteroides/Asteroide4.glb');
  const asteroid4 = await loadModel('/models/Asteroides/Asteroide5.glb');
  const asteroid5 = await loadModel('/models/Asteroides/Asteroide6.glb');
  const asteroid6 = await loadModel('/models/Asteroides/Asteroide7.glb');
  const asteroid7 = await loadModel('/models/Asteroides/Asteroide8.glb');
  const asteroid8 = await loadModel('/models/Asteroides/Asteroide9.glb');
  const asteroid9 = await loadModel('/models/Asteroides/Asteroide10.glb');
  const voyager = await loadModel('/models/Level1/Voyager.glb');
  
  asteroid.scale.setScalar(1);
  asteroid1.scale.setScalar(1);
  asteroid2.scale.setScalar(1);
  asteroid3.scale.setScalar(1);
  asteroid4.scale.setScalar(1);
  asteroid5.scale.setScalar(1);
  asteroid6.scale.setScalar(1);
  asteroid7.scale.setScalar(1);
  asteroid8.scale.setScalar(1);
  asteroid9.scale.setScalar(1);
  voyager.scale.setScalar(1);

  asteroid.position.set(28, -10, -160);
  asteroid1.position.set(40, -10, -140);
  asteroid2.position.set(30, -10, -120);
  asteroid3.position.set(80, -10, -100);
  asteroid4.position.set(50, -10, -80);
  asteroid5.position.set(40, -10, -60);
  asteroid6.position.set(60, -10, -40);
  asteroid7.position.set(28, -10, -20);
  asteroid8.position.set(75, -10, -180);
  asteroid9.position.set(28, -10, -200);
  voyager.position.set(-50, -10, -100);

  scene.add(asteroid);
  scene.add(asteroid1);
  scene.add(asteroid2);
  scene.add(asteroid3);
  scene.add(asteroid4);
  scene.add(asteroid5);
  scene.add(asteroid6);
  scene.add(asteroid7);
  scene.add(asteroid8);
  scene.add(asteroid9);
  scene.add(voyager);

  addScenery(asteroid, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(asteroid1, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(asteroid2, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(asteroid3, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(asteroid4, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(asteroid5, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
      addScenery(asteroid6, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
      addScenery(asteroid7, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
      addScenery(asteroid8, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
      addScenery(asteroid9, {
    speedZ: 0.04,  
    rotY: 0.02       
  });
    addScenery(voyager, {
    speedZ: 0.020,  
    rotY: 0.01       
  });

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

    // ---- THE MOOON ----
  
    moon = await loadModel('/models/Planets/Moon.glb');
    moon.scale.setScalar(8);
    moon.position.set(
      meta.position.x,
      meta.position.y - 3,
      meta.position.z + -10
    );
    scene.add(moon);
    
    {
      const dx = moon.position.x - meta.position.x;
      const dz = moon.position.z - meta.position.z;
      const radius = Math.hypot(dx, dz);
      const angle  = Math.atan2(dz, dx);

      moonOrbit = {
        radius,
        angle,
        speed: 0.0001,                 // rotación muy lenta
        yOffset: moon.position.y - meta.position.y
      };
    }


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

      if (r < 0.25) return baseEsmeralda;   // 30%  ↓ menos
      if (r < 0.55) return baseDiamante;    // 25%
      if (r < 0.75) return baseAsteroid;    // 20%
      return baseThunder;                   // 25%  ↑ más
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

  // ---- Particulas ----
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
  function crearRayos(scene, position) {
    const particleCount = 15;
    const particles = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();
    const thunderTexture = textureLoader.load('/Img/thunder.png');

    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.PlaneGeometry(1.2, 2); // rayo alargado
      const mat = new THREE.MeshStandardMaterial({
        map: thunderTexture,
        emissive: 0x55aaff,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false // evita sombras raras
      });

      const p = new THREE.Mesh(geom, mat);

      p.position.copy(position);

      // Movimiento errático tipo electricidad
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      );

      // Rotación aleatoria para variación
      p.rotation.z = Math.random() * Math.PI;

      particles.add(p);
    }

    scene.add(particles);

    let alive = 0;
    const interval = setInterval(() => {
      alive += 16;

      particles.children.forEach(p => {
        p.position.add(p.velocity);
        p.material.opacity -= 0.06;
        p.rotation.z += 0.2; // chispa girando
      });

      if (alive > 1500) {
        scene.remove(particles);
        clearInterval(interval);
      }
    }, 16);
  }
  function crearHeals(scene, position) {
    const particleCount = 20;
    const particles = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();
    const healTexture = textureLoader.load('/Img/Heals.png');

    for (let i = 0; i < particleCount; i++) {
      // Partículas más pequeñas, suaves y "mágicas"
      const geom = new THREE.PlaneGeometry(1.5, 1.5);
      const mat = new THREE.MeshStandardMaterial({
        map: healTexture,
        emissive: 0x00ff88,            // verde brillante
        emissiveIntensity: 3,          // brillo mágico
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const p = new THREE.Mesh(geom, mat);

      // Posición inicial
      p.position.copy(position);
      p.position.x += (Math.random() - 0.5) * 2; // dispersión horizontal
      p.position.z += (Math.random() - 0.5) * 2;

      // Movimiento vertical suave tipo healing
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2, // suave dispersión lateral
        Math.random() * 0.5 + 0.3,   // siempre sube
        (Math.random() - 0.5) * 0.2
      );

      // Rotación suave
      p.rotation.z = Math.random() * Math.PI;

      particles.add(p);
    }

    scene.add(particles);

    let alive = 0;
    const interval = setInterval(() => {
      alive += 16;

      particles.children.forEach(p => {
        p.position.add(p.velocity);

        // Opacidad lenta para efecto duradero
        p.material.opacity -= 0.008;

        // Rotación suave, no como rayo
        p.rotation.z += 0.01;

        // Aumentar un poquito de tamaño para el glow
        p.scale.multiplyScalar(1.005);
      });

      // Duración total: ~2 segundos
      if (alive > 2000) {
        scene.remove(particles);
        clearInterval(interval);
      }
    }, 16);
  }
  function crearDiamantes(scene, position) {
    const particleCount = 15;
    const particles = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();
    const thunderTexture = textureLoader.load('/Img/diamante.png');

    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.PlaneGeometry(1.2, 2); // rayo alargado
      const mat = new THREE.MeshStandardMaterial({
        map: thunderTexture,
        emissive: 0x55aaff,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false // evita sombras raras
      });

      const p = new THREE.Mesh(geom, mat);

      p.position.copy(position);

      // Movimiento errático tipo electricidad
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      );

      // Rotación aleatoria para variación
      p.rotation.z = Math.random() * Math.PI;

      particles.add(p);
    }

    scene.add(particles);

    let alive = 0;
    const interval = setInterval(() => {
      alive += 16;

      particles.children.forEach(p => {
        p.position.add(p.velocity);
        p.material.opacity -= 0.06;
        p.rotation.z += 0.2; // chispa girando
      });

      if (alive > 1500) {
        scene.remove(particles);
        clearInterval(interval);
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
  let moon = null;
  let ovniTime = 0;

  // distancia detrás de la meta
  let finalTargetOffset = -5; 


  function animate() {
  
    requestAnimationFrame(animate);
    if (gameState.paused) return;
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
    if (meta && !gameState.ended) {
      const metaBBox = new THREE.Box3().setFromObject(meta);

      if (berniceBBox.intersectsBox(metaBBox)) {
        // Marcamos fin de partida
        gameState.ended = true;

        // Animación de victoria
        if (bernice.controller && bernice.controller.win) {
          bernice.controller.win();
          gameState.paused = true;
        }

        // Que ya no la puedas mover
        bernice.isFrozen = true;

        // Esperamos 5s para mostrar el Win
        setTimeout(() => {
          gameState.paused = true;
          if (gameState.timeInterval) clearInterval(gameState.timeInterval);
          mostrarWin();
        }, 5000);

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
          crearRayos(scene, enemy.position.clone());
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

          if (bernice.controller && bernice.controller.takeDamage){
            bernice.controller.takeDamage();
          }
          if (gameState.esmeraldas <= 0 && !gameState.ended) {
            // Marcamos que el juego ya terminó para no volver a entrar
            gameState.ended = true;

            // Animación de derrota en el controller (si existe)
            if (bernice.controller && bernice.controller.defeat) {
              bernice.controller.defeat();
              gameState.paused = true;
            }

            // Que ya no reciba input, pero dejamos correr la animación
            bernice.isFrozen = true;

            // Después de 5 segundos ahora sí pausamos y mostramos Game Over
            setTimeout(() => {
              gameState.paused = true;
              if (gameState.timeInterval) clearInterval(gameState.timeInterval);
              mostrarGameOver();
            }, 3000);
          }
        }


        if (enemy.type === "diamond") {
          crearDiamantes(scene, enemy.position.clone());
          gameState.diamantes++;
          diamondsHUD.textContent = gameState.diamantes;
        }

        if (enemy.type === "emerald") {
          crearHeals(scene, enemy.position.clone());
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
    // ---- MOVIMIENTO DE ESCENARIO (planetas, satélites, etc.) ----
    for (let i = scenery.length - 1; i >= 0; i--) {
      const obj = scenery[i];

      // Movimiento hacia el jugador
      if (obj.velocity) {
        obj.position.addScaledVector(obj.velocity, globalSpeedMultiplier);
      }

      // Rotación
      if (obj.rotateSpeed) {
        obj.rotation.x += obj.rotateSpeed.x;
        obj.rotation.y += obj.rotateSpeed.y;
        obj.rotation.z += obj.rotateSpeed.z;
      }

      // Si ya pasó muy atrás del jugador, lo quitamos opcionalmente
      if (obj.position.z > MAX_Z + 150) {
        obj.removeFromParent();
        scenery.splice(i, 1);
      }
    }
        // ---- ÓRBITA DE MERCURIO Y VENUS ALREDEDOR DEL SOL ----
    if (sun) {
      if (mercuryOrbit) {
        mercuryOrbit.angle += mercuryOrbit.speed;

        mercury.position.set(
          sun.position.x + Math.cos(mercuryOrbit.angle) * mercuryOrbit.radius,
          mercuryOrbit.y,
          sun.position.z + Math.sin(mercuryOrbit.angle) * mercuryOrbit.radius
        );
      }

      if (venusOrbit) {
        venusOrbit.angle += venusOrbit.speed;

        venus.position.set(
          sun.position.x + Math.cos(venusOrbit.angle) * venusOrbit.radius,
          venusOrbit.y,
          sun.position.z + Math.sin(venusOrbit.angle) * venusOrbit.radius
        );
      }
    }

    // ---- ÓRBITA DE LA LUNA ----
    if (moon) {
      moon.rotation.y += 0.002; // ajusta la velocidad a tu gusto
    }

    frames++;
  }



  // evitar rotación indeseada
  bernice.rotation.set(0, Math.PI, 0);

  window.startGameLoop = animate;
  animate();

  return { bernice };
}
