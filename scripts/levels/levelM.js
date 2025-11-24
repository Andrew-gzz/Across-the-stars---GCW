// scripts/levels/levelM.js - MULTIJUGADOR COOPERATIVO SINCRONIZADO
import * as THREE from 'three';
import { loadModel } from '../core/assets.js';
import { gameState } from '../core/gameState.js';
import { input } from '../core/input.js';
import { RoomManager } from '../systems/roomManager.js';
import { auth } from '../config/firebase.js';

export async function loadLevelM(scene) {

    // ===================================
    // 🔹 ESPERAR AUTENTICACIÓN
    // ===================================
    const { auth, waitForAuth } = await import('../config/firebase.js');
    
    console.log("⏳ Esperando autenticación...");
    const user = await waitForAuth();
    
    if (!user) {
        alert("❌ No hay sesión activa. Inicia sesión primero.");
        window.location.href = "index.html";
        return { bernice: null };
    }

    console.log("✅ Usuario autenticado:", user.displayName, user.uid);

    // ===================================
    // 🔹 CONFIGURACIÓN MULTIJUGADOR
    // ===================================
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    console.log("🔍 DEBUG INFO:");
    console.log("- Room ID:", roomId);
    console.log("- User ID:", user.uid);

    if (!roomId) {
        alert("❌ Error: No hay sala válida");
        window.location.href = "lobby.html";
        return { bernice: null };
    }

    const roomManager = new RoomManager();
    roomManager.currentRoomId = roomId;
    roomManager.currentUserId = user.uid;
    
    // Determinar si eres host o guest
    const { db, ref: dbRef, get } = await import('../config/firebase.js');
    const roomSnapshot = await get(dbRef(db, `rooms/${roomId}`));
    
    if (!roomSnapshot.exists()) {
        alert("❌ La sala no existe o fue eliminada");
        console.error("Firebase no encontró la sala:", roomId);
        window.location.href = "lobby.html";
        return { bernice: null };
    }
    
    const roomData = roomSnapshot.val();
    console.log("- Room Data:", roomData);
    
    // ❌ PROBLEMA: Si roomData solo tiene {status: "playing"}, host será undefined
    if (!roomData.host) {
        console.error("❌ ERROR CRÍTICO: La sala no tiene campo 'host'");
        console.error("Datos disponibles:", Object.keys(roomData));
        alert("❌ Error: La sala está corrupta. Los datos se borraron.");
        window.location.href = "lobby.html";
        return { bernice: null };
    }
    
    roomManager.isHost = roomData.host === user.uid;
    const isHost = roomManager.isHost;

    console.log("- Host ID:", roomData.host);
    console.log("- Guest ID:", roomData.guest);
    console.log("- My ID:", user.uid);
    console.log("- Is Host:", isHost);

    console.log("🎮 Modo COOPERATIVO");
    console.log("🏠 Sala:", roomId);
    console.log("👤 Rol:", isHost ? "HOST (Controlador)" : "GUEST (Espectador)");

    // ===================================
    // 🔹 HUD COMPARTIDO
    // ===================================
    const esmeraldasHUD = document.getElementById("vida");
    const diamondsHUD = document.getElementById("score");
    const tiempoHUD = document.getElementById("tiempo");
    const thunderHUD = document.getElementById("poteciador");

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
    // 🔹 PISO INFINITO
    // ===================================
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load('/Img/pista4.png');
    marsTexture.wrapS = THREE.RepeatWrapping;
    marsTexture.wrapT = THREE.RepeatWrapping;
    marsTexture.repeat.set(1, 8);

    const groundLength = 220;

    const ground1 = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.5, groundLength),
        new THREE.MeshStandardMaterial({ map: marsTexture })
    );
    ground1.position.set(0, -2, 0);
    scene.add(ground1);

    const ground2 = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.5, groundLength),
        new THREE.MeshStandardMaterial({ map: marsTexture })
    );
    ground2.position.set(0, -2, -groundLength);
    scene.add(ground2);

    let groundSpeed = 0.2;
    let globalSpeedMultiplier = 1;

    // ===================================
    // 🔹 BERNICE (JUGADOR LOCAL)
    // ===================================
    const bernice = await loadModel('/models/Bernice.fbx');
    bernice.name = "BerniceLocal";
    bernice.position.set(-5, 0, 20);
    bernice.scale.setScalar(0.06);
    bernice.rotation.y = Math.PI;
    bernice.isFrozen = false;
    bernice.speedMultiplier = 1;
    scene.add(bernice);

    const berniceBBox = new THREE.Box3().setFromObject(bernice);

    console.log("✅ Bernice (Jugador Local) cargada");

    // ===================================
    // 🔹 JUGADOR REMOTO (TEXTURA DIFERENTE)
    // ===================================
    const ghostPlayer = await loadModel('/models/Bernice.fbx');
    ghostPlayer.name = "BerniceRemote";
    ghostPlayer.position.set(5, 0, 20);
    ghostPlayer.scale.setScalar(0.06);
    ghostPlayer.rotation.y = Math.PI;

    // Aplicar textura diferente
    const bunnyTexture = textureLoader.load('/models/DIFF_Bunny2.png');
    ghostPlayer.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.map = bunnyTexture;
            child.material.needsUpdate = true;
        }
    });

    scene.add(ghostPlayer);
    console.log("👻 Jugador Remoto cargado (textura DIFF_Bunny2.png)");

    // ===================================
    // 🔹 MODELOS BASE
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

    const baseThunder = await loadModel('/models/thunder3.glb');
    baseThunder.scale.setScalar(1.5);
    baseThunder.type = "thunder";

    const modelsByType = {
        asteroid: baseAsteroid,
        diamond: baseDiamante,
        emerald: baseEsmeralda,
        thunder: baseThunder
    };

    // ===================================
    // 🔹 FUNCIONES AUXILIARES
    // ===================================
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

    function getRandomModel() {
        const r = Math.random();
        if (r < 0.60) return baseAsteroid;
        if (r < 0.80) return baseDiamante;
        if (r < 0.90) return baseEsmeralda;
        return baseThunder;
    }

    // ===================================
    // 🔹 VARIABLES DE JUEGO
    // ===================================
    const enemies = {};
    let nextObjectId = 0;
    let frames = 0;
    let spawnRate = 180;
    let spawnCount = 0;
    const MAX_SPAWN = 200;

    let meta = null;
    let metaSpawned = false;
    let ovniFinal = null;
    let ovniTime = 0;

    const LIMIT_X = 18;
    const MIN_Z = -10;
    const MAX_Z = 50;

    // ===================================
    // 🔹 PANTALLAS
    // ===================================
    function mostrarWin() {
        const gameArea = document.querySelector(".game-area");
        if (!gameArea) return;
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);
            display:flex;justify-content:center;align-items:center;z-index:100;
        `;
        const img = document.createElement("img");
        img.src = "Img/youWin.png";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        overlay.appendChild(img);
        gameArea.appendChild(overlay);
    }

    function mostrarGameOver() {
        const gameArea = document.querySelector(".game-area");
        if (!gameArea) return;
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);
            display:flex;justify-content:center;align-items:center;z-index:100;
        `;
        const img = document.createElement("img");
        img.src = "Img/lose.png";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        overlay.appendChild(img);
        gameArea.appendChild(overlay);
    }

    // ===================================
    // 🔹 SPAWN META (SOLO HOST)
    // ===================================
    async function spawnMeta() {
        if (metaSpawned || !isHost) return;
        metaSpawned = true;

        meta = await loadModel('/models/meta2.glb');
        meta.scale.setScalar(1);
        meta.position.set(0, 0, -50);
        meta.type = "goal";
        meta.velocity = new THREE.Vector3(0, 0, 0.09);
        scene.add(meta);

        ovniFinal = await loadModel('/models/ovni2.glb');
        ovniFinal.scale.setScalar(0.5);
        ovniFinal.position.set(0, 17, -50);
        scene.add(ovniFinal);

        const ovniLight = new THREE.PointLight(0x33ffff, 20, 200);
        ovniFinal.add(ovniLight);

        console.log("🏁 META y OVNI spawneados");
    }

    // ===================================
    // 🎮 SINCRONIZACIÓN MULTIJUGADOR
    // ===================================
    let syncCounter = 0;

    // 📥 GUEST: Escuchar estado del juego
    if (!isHost) {
        roomManager.listenToGameState((data) => {
            gameState.esmeraldas = data.esmeraldas;
            gameState.diamantes = data.diamantes;
            gameState.thunderActive = data.thunderActive;
            gameState.thunderTime = data.thunderTime;
            globalSpeedMultiplier = data.globalSpeedMultiplier;
            spawnCount = data.spawnCount;
            metaSpawned = data.metaSpawned;

            // Actualizar HUD
            esmeraldasHUD.textContent = gameState.esmeraldas;
            diamondsHUD.textContent = gameState.diamantes;
            thunderHUD.textContent = gameState.thunderActive ? `${gameState.thunderTime}s` : "0";

            // Spawn meta si es necesario
            if (metaSpawned && !meta) {
                spawnMeta();
            }
        });

        // 📥 GUEST: Escuchar objetos del host
        roomManager.listenToObjects((objects) => {
            if (!objects) return; // Si no hay objetos, salir

            const currentIds = new Set(Object.keys(enemies));
            const receivedIds = new Set();

            // Firebase ahora devuelve objeto, no array
            Object.entries(objects).forEach(([id, objData]) => {
                receivedIds.add(id);

                if (!enemies[id]) {
                    // Crear nuevo objeto
                    const model = modelsByType[objData.type];
                    if (!model) return;

                    const enemy = cloneModel(model);
                    enemy.userData.id = id;
                    enemy.type = objData.type;
                    enemy.position.set(objData.x, objData.y, objData.z);
                    enemy.rotation.set(objData.rotationX, objData.rotationY, objData.rotationZ);
                    enemy.bbox = new THREE.Box3().setFromObject(enemy);

                    scene.add(enemy);
                    enemies[id] = enemy;
                } else {
                    // Actualizar posición existente
                    const enemy = enemies[id];
                    enemy.position.lerp(new THREE.Vector3(objData.x, objData.y, objData.z), 0.3);
                    enemy.rotation.set(objData.rotationX, objData.rotationY, objData.rotationZ);
                    enemy.bbox.setFromObject(enemy);
                }
            });

            // Eliminar objetos que ya no existen en el host
            currentIds.forEach(id => {
                if (!receivedIds.has(id)) {
                    enemies[id].removeFromParent();
                    delete enemies[id];
                }
            });
        });
    }

    // 📥 Escuchar posición del otro jugador
    roomManager.listenToOtherPlayers((otherPlayers) => {
        if (otherPlayers.length > 0) {
            const remote = otherPlayers[0];
            const targetPos = new THREE.Vector3(remote.x, ghostPlayer.position.y, remote.z);
            ghostPlayer.position.lerp(targetPos, 0.3);
            ghostPlayer.rotation.y = Math.PI;

            // 🎭 Sincronizar animación (si tienes mixer)
            // TODO: Si cargas animaciones en ghostPlayer, usar:
            // if (ghostMixer && remote.animation) {
            //     const action = ghostMixer.clipAction(animaciones[remote.animation]);
            //     action.play();
            // }
        }
    });

    // 📥 HOST: Escuchar colisiones del guest
    if (isHost) {
        roomManager.listenToCollisions((collision) => {
            console.log(`📩 HOST recibió colisión del guest:`, collision);

            const enemy = enemies[collision.objectId];
            if (!enemy) return;

            // Procesar colisión del guest
            if (collision.objectType === "thunder") {
                globalSpeedMultiplier = 2.5;
                bernice.speedMultiplier = 2.5;
                ghostPlayer.speedMultiplier = 2.5;
                gameState.thunderActive = true;
                gameState.thunderTime = 3;
                
                setTimeout(() => {
                    globalSpeedMultiplier = 1;
                    bernice.speedMultiplier = 1;
                    ghostPlayer.speedMultiplier = 1;
                    gameState.thunderActive = false;
                    gameState.thunderTime = 0;
                }, 3000);
            }

            if (collision.objectType === "asteroid") {
                gameState.esmeraldas--;
                esmeraldasHUD.textContent = gameState.esmeraldas;  // ← Actualizar HUD
                if (gameState.esmeraldas <= 0) {
                    gameState.paused = true;
                    bernice.isFrozen = true;
                    ghostPlayer.isFrozen = true;
                    mostrarGameOver();
                }
            }

            if (collision.objectType === "diamond") {
                gameState.diamantes++;
                diamondsHUD.textContent = gameState.diamantes;  // ← Actualizar HUD
            }

            if (collision.objectType === "emerald") {
                gameState.esmeraldas++;
                esmeraldasHUD.textContent = gameState.esmeraldas;  // ← Actualizar HUD
            }

            // Eliminar objeto
            enemy.removeFromParent();
            delete enemies[collision.objectId];
        });
    }

    // ===================================
    // 🔁 LOOP PRINCIPAL
    // ===================================
    function animate() {
        if (gameState.paused) return;
        requestAnimationFrame(animate);

        // --- PISO INFINITO ---
        ground1.position.z += groundSpeed * globalSpeedMultiplier;
        ground2.position.z += groundSpeed * globalSpeedMultiplier;

        if (ground1.position.z > groundLength) {
            ground1.position.z = ground2.position.z - groundLength;
        }
        if (ground2.position.z > groundLength) {
            ground2.position.z = ground1.position.z - groundLength;
        }

        // --- MOVIMIENTO JUGADOR LOCAL ---
        if (!bernice.isFrozen && input && input._keys) {
            let speed = 0.2 * (bernice.speedMultiplier || 1);
            if (input._keys.left) bernice.position.x -= speed;
            if (input._keys.right) bernice.position.x += speed;
            if (input._keys.up) bernice.position.z -= speed;
            if (input._keys.down) bernice.position.z += speed;
        }

        // Límites
        bernice.position.x = Math.max(-LIMIT_X, Math.min(LIMIT_X, bernice.position.x));
        bernice.position.z = Math.max(MIN_Z, Math.min(MAX_Z, bernice.position.z));
        bernice.rotation.set(0, Math.PI, 0);
        berniceBBox.setFromObject(bernice);

        // 📤 Enviar posición cada 100ms
        syncCounter++;
        if (syncCounter >= 6) {
            roomManager.updatePlayerPosition(bernice.position.x, bernice.position.z, "idle");
            syncCounter = 0;
        }

        // ===================================
        // 🎮 LÓGICA DEL GUEST (También detecta colisiones)
        // ===================================
        if (!isHost) {
            // El guest también verifica colisiones con SU propio jugador
            Object.values(enemies).forEach(enemy => {
                if (!enemy.bbox) return;

                if (berniceBBox.intersectsBox(enemy.bbox)) {
                    console.log(`💥 GUEST colisionó con ${enemy.type}`);

                    // Notificar al host de la colisión
                    roomManager.notifyCollision(enemy.userData.id, enemy.type);

                    // Efecto visual local inmediato
                    if (enemy.type === "thunder") {
                        globalSpeedMultiplier = 2.5;
                        bernice.speedMultiplier = 2.5;
                        ghostPlayer.speedMultiplier = 2.5;
                    }
                }
            });
        }

        // ===================================
        // 🎮 LÓGICA DEL HOST
        // ===================================
        if (isHost) {
            // --- OVNI ANIMACIÓN ---
            if (ovniFinal && meta) {
                ovniTime += 0.03;
                ovniFinal.position.x = Math.sin(ovniTime * 0.6) * 10;
                ovniFinal.position.y = meta.position.y + 20 + Math.sin(ovniTime * 2) * 2;
                ovniFinal.position.z = meta.position.z + 5;
                ovniFinal.rotation.y += 0.01;
            }

            // --- COLISIÓN META ---
            if (meta) {
                const metaBBox = new THREE.Box3().setFromObject(meta);
                if (berniceBBox.intersectsBox(metaBBox)) {
                    gameState.paused = true;
                    bernice.isFrozen = true;
                    mostrarWin();
                    return;
                }
                meta.position.addScaledVector(meta.velocity, globalSpeedMultiplier);
            }

            // --- SPAWN OBJETOS ---
            if (frames % spawnRate === 0) {
                if (spawnRate > 30) spawnRate -= 10;

                if (spawnCount >= MAX_SPAWN) {
                    if (!metaSpawned) spawnMeta();
                } else {
                    const model = getRandomModel();
                    const enemy = cloneModel(model);
                    const objectId = `obj_${nextObjectId++}`;
                    
                    enemy.userData.id = objectId;
                    enemy.type = model.type;

                    const laneX = [-12, -6, 0, 6, 12];
                    enemy.position.set(laneX[Math.floor(Math.random() * laneX.length)], 1.2, -50);
                    enemy.velocity = new THREE.Vector3(0, 0, 0.03);
                    enemy.zAcceleration = true;
                    enemy.bbox = new THREE.Box3().setFromObject(enemy);

                    scene.add(enemy);
                    enemies[objectId] = enemy;
                    spawnCount++;
                }
            }

            // --- MOVIMIENTO OBJETOS ---
            Object.values(enemies).forEach(enemy => {
                if (enemy.type === "asteroid") {
                    enemy.rotation.x += 0.015 * globalSpeedMultiplier;
                    enemy.rotation.y += 0.01 * globalSpeedMultiplier;
                    enemy.rotation.z += 0.02 * globalSpeedMultiplier;
                } else {
                    enemy.rotation.y += 0.02 * globalSpeedMultiplier;
                }

                if (enemy.velocity) {
                    enemy.position.addScaledVector(enemy.velocity, globalSpeedMultiplier);
                    if (enemy.zAcceleration) enemy.velocity.z += 0.0003 * globalSpeedMultiplier;
                }

                enemy.bbox.setFromObject(enemy);

                // --- COLISIONES (AMBOS JUGADORES PUEDEN COLISIONAR) ---
                const ghostBBox = new THREE.Box3().setFromObject(ghostPlayer);
                let collisionDetected = false;
                let collisionPlayerId = null;

                // Verificar colisión con jugador local
                if (berniceBBox.intersectsBox(enemy.bbox)) {
                    collisionDetected = true;
                    collisionPlayerId = roomManager.currentUserId;
                }

                // Verificar colisión con jugador remoto
                if (ghostBBox.intersectsBox(enemy.bbox)) {
                    collisionDetected = true;
                    collisionPlayerId = "remote";
                }

                if (collisionDetected) {
                    console.log(`💥 Colisión detectada por: ${collisionPlayerId}`);

                    if (enemy.type === "thunder") {
                        globalSpeedMultiplier = 2.5;
                        bernice.speedMultiplier = 2.5;
                        ghostPlayer.speedMultiplier = 2.5;
                        gameState.thunderActive = true;
                        gameState.thunderTime = 3;
                        
                        setTimeout(() => {
                            globalSpeedMultiplier = 1;
                            bernice.speedMultiplier = 1;
                            ghostPlayer.speedMultiplier = 1;
                            gameState.thunderActive = false;
                            gameState.thunderTime = 0;
                        }, 3000);
                    }

                    if (enemy.type === "asteroid") {
                        gameState.esmeraldas--;
                        esmeraldasHUD.textContent = gameState.esmeraldas;  // ← Actualizar HUD
                        console.log(`💀 Asteroide golpeado. Vida: ${gameState.esmeraldas}`);
                        if (gameState.esmeraldas <= 0) {
                            gameState.paused = true;
                            bernice.isFrozen = true;
                            ghostPlayer.isFrozen = true;
                            mostrarGameOver();
                        }
                    }

                    if (enemy.type === "diamond") {
                        gameState.diamantes++;
                        diamondsHUD.textContent = gameState.diamantes;  // ← Actualizar HUD
                        console.log(`💎 Diamante recogido. Total: ${gameState.diamantes}`);
                    }

                    if (enemy.type === "emerald") {
                        gameState.esmeraldas++;
                        esmeraldasHUD.textContent = gameState.esmeraldas;  // ← Actualizar HUD
                        console.log(`💚 Esmeralda recogida. Vida: ${gameState.esmeraldas}`);
                    }

                    // Eliminar objeto
                    enemy.removeFromParent();
                    delete enemies[enemy.userData.id];
                }
            });

            // 📤 Enviar estado cada 6 frames (100ms aprox, 10 FPS)
            if (frames % 6 === 0) {
                roomManager.updateGameState({
                    esmeraldas: gameState.esmeraldas,
                    diamantes: gameState.diamantes,
                    thunderActive: gameState.thunderActive,
                    thunderTime: gameState.thunderTime,
                    globalSpeedMultiplier,
                    spawnCount,
                    metaSpawned,
                    frames
                }).catch(err => console.error("Error actualizando gameState:", err));

                roomManager.updateObjects(Object.values(enemies))
                    .catch(err => console.error("Error actualizando objects:", err));
            }
        }

        frames++;
    }

    animate();
    return { bernice };
}