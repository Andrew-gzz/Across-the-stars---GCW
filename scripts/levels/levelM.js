// scripts/levels/levelM.js - NIVEL MULTIJUGADOR
import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';
import { RoomManager } from '../systems/roomManager.js';
import { auth } from '../config/firebase.js';

export async function loadLevelM(scene) {

    // ===================================
    // 🔹 CONFIGURACIÓN MULTIJUGADOR
    // ===================================
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    if (!roomId || !auth.currentUser) {
        alert("❌ Error: No hay sala o sesión válida");
        window.location.href = "lobby.html";
        return;
    }

    const roomManager = new RoomManager();
    roomManager.currentRoomId = roomId;
    roomManager.currentUserId = auth.currentUser.uid;
    
    console.log("🎮 Modo multijugador activado");
    console.log("🏠 Sala:", roomId);
    console.log("👤 Usuario:", auth.currentUser.displayName);

    let ghostPlayer = null; // Modelo 3D del jugador remoto

    // ===================================
    // 🔹 HUD
    // ===================================
    const esmeraldasHUD = document.getElementById("vida");
    const diamondsHUD = document.getElementById("score");

    esmeraldasHUD.textContent = gameState.esmeraldas;
    diamondsHUD.textContent = gameState.diamantes;

    // ===================================
    // 🔹 LUCES
    // ===================================
    const light = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 100);
    scene.add(dirLight);

    // ===================================
    // 🔹 PISO
    // ===================================
    const groundGeometry = new THREE.BoxGeometry(40, 0.5, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: '#0369a1' });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.set(0, -2, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // ===================================
    // 🔹 CARGAR BERNICE (JUGADOR LOCAL)
    // ===================================
    const bernice = await loadModel('/models/Bernice.fbx');
    bernice.name = "Bernice";
    bernice.position.set(0, 0, 20);
    bernice.scale.setScalar(0.06);
    bernice.rotation.y = Math.PI;
    bernice.isFrozen = false;
    scene.add(bernice);

    const berniceBBox = new THREE.Box3().setFromObject(bernice);

    console.log("✅ Bernice cargada");

    // ===================================
    // 🔹 CREAR JUGADOR FANTASMA
    // ===================================
    ghostPlayer = bernice.clone();
    ghostPlayer.name = "GhostPlayer";
    ghostPlayer.position.set(0, 0, 20);
    ghostPlayer.scale.setScalar(0.06);
    ghostPlayer.rotation.y = Math.PI;

    // Hacer transparente y con color cyan
    ghostPlayer.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.6;
            child.material.color.setHex(0x00ffff);
            child.material.emissive = new THREE.Color(0x0088ff);
            child.material.emissiveIntensity = 0.5;
        }
    });

    scene.add(ghostPlayer);
    console.log("👻 Jugador fantasma creado");

    // ===================================
    // 🔹 OVNI (META)
    // ===================================
    const ovni = await loadModel('/models/ovni.glb');
    ovni.scale.setScalar(0.5);
    ovni.position.set(0, -2, -95);
    scene.add(ovni);

    const ovniLight = new THREE.PointLight(0x33ffff, 6, 60);
    ovniLight.position.set(0, -1, 0);
    ovni.add(ovniLight);

    let ovniTime = 0;

    // ===================================
    // 🔹 CARGAR MODELOS DE OBJETOS
    // ===================================
    const baseAsteroid = await loadModel('/models/asteroid2.glb');
    baseAsteroid.scale.setScalar(1.5);
    baseAsteroid.type = "asteroid";

    const baseDiamante = await loadModel('/models/diamante.glb');
    baseDiamante.scale.setScalar(2);
    baseDiamante.type = "diamond";

    const baseEsmeralda = await loadModel('/models/esmeralda.glb');
    baseEsmeralda.scale.setScalar(2);
    baseEsmeralda.type = "emerald";

    const baseThunder = await loadModel('/models/thunder2.glb');
    baseThunder.scale.setScalar(1.5);
    baseThunder.type = "thunder";

    const models = [baseAsteroid, baseDiamante, baseEsmeralda, baseThunder];

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

    // ===================================
    // 🔹 SISTEMA DE ENEMIGOS
    // ===================================
    const enemies = [];
    let frames = 0;
    let spawnRate = 180;

    function removeEnemy(enemy) {
        enemy.removeFromParent();
        const index = enemies.indexOf(enemy);
        if (index !== -1) enemies.splice(index, 1);
    }

    // ===================================
    // 🔹 PANTALLAS DE VICTORIA/DERROTA
    // ===================================
    function mostrarWin() {
        const gameArea = document.querySelector(".game-area");
        if (!gameArea) return;

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center; z-index: 100;
        `;

        const img = document.createElement("img");
        img.src = "Img/youWin.png";
        img.style.cssText = "width: 100%; height: 100%; object-fit: cover;";

        overlay.appendChild(img);
        gameArea.appendChild(overlay);
    }

    function mostrarGameOver() {
        const gameArea = document.querySelector(".game-area");
        if (!gameArea) return;

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center; z-index: 100;
        `;

        const img = document.createElement("img");
        img.src = "Img/lose.png";
        img.style.cssText = "width: 100%; height: 100%; object-fit: cover;";

        overlay.appendChild(img);
        gameArea.appendChild(overlay);
    }

    // ===================================
    // 🎮 SINCRONIZACIÓN MULTIJUGADOR
    // ===================================
    let syncCounter = 0;

    // 📥 Recibir posiciones de otros jugadores
    roomManager.listenToOtherPlayers((otherPlayers) => {
        if (otherPlayers.length > 0 && ghostPlayer) {
            const remotePlayer = otherPlayers[0];
            
            // Interpolar posición suavemente
            const targetPos = new THREE.Vector3(
                remotePlayer.x,
                ghostPlayer.position.y,
                remotePlayer.z
            );
            
            ghostPlayer.position.lerp(targetPos, 0.3);

            // Mantener rotación consistente
            ghostPlayer.rotation.y = Math.PI;
        }
    });

    // Función para sincronizar (se llama en el loop)
    function syncMultiplayer() {
        syncCounter++;
        if (syncCounter >= 6) { // Cada 100ms aprox (6 frames a 60 FPS)
            roomManager.updatePlayerPosition(
                bernice.position.x,
                bernice.position.z,
                "idle" // Puedes pasar la animación actual aquí
            );
            syncCounter = 0;
        }
    }

    // ===================================
    // 🔁 LOOP PRINCIPAL
    // ===================================
    function animate() {
        if (gameState.paused) return;
        requestAnimationFrame(animate);

        // Animación del OVNI
        ovniTime += 0.02;
        ovni.position.y = -1 + Math.sin(ovniTime * 2) * 1.5;
        ovni.position.x = Math.sin(ovniTime * 0.7) * 10;
        ovni.rotation.y += 0.01;
        ovniLight.intensity = 2 + Math.sin(ovniTime * 3) * 0.7;

        // Actualizar BBox de Bernice
        berniceBBox.setFromObject(bernice);

        // 🎮 Sincronizar multijugador
        syncMultiplayer();

        // Colisiones con enemigos
        enemies.forEach(enemy => {
            if (berniceBBox.intersectsBox(enemy.bbox)) {

                if (enemy.type === "asteroid") {
                    gameState.esmeraldas--;
                    esmeraldasHUD.textContent = gameState.esmeraldas;

                    if (gameState.esmeraldas <= 0) {
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

        // Colisión con OVNI (victoria)
        const ovniBBox = new THREE.Box3().setFromObject(ovni);
        if (berniceBBox.intersectsBox(ovniBBox)) {
            gameState.paused = true;
            bernice.isFrozen = true;
            mostrarWin();
            return;
        }

        // Spawn de enemigos
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

        // Movimiento de enemigos
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