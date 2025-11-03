import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { loadModel } from '../core/assets.js';
import { createBoxShapeFromMesh } from '../systems/physics.js';

export async function loadLevel2(scene, physics) {
  const modelo = await loadModel('/models/Level2/scene.gltf');
  modelo.scale.set(10, 10, 10);
  modelo.position.set(0, 0, 0);
  scene.add(modelo);

  const shape = createBoxShapeFromMesh(modelo);
  physics.add(modelo, shape, 0); // cuerpo estático (masa 0)

  const audio = new Audio('/sound/level2.mp3');
  audio.loop = true;
  audio.volume = 0.5;
  audio.play();

  //Crear jugador (cubo verde)
  const playerGeo = new THREE.BoxGeometry(1, 1, 1);
  const playerMat = new THREE.MeshStandardMaterial({ color: '#00ff00' });
  const playerMesh = new THREE.Mesh(playerGeo, playerMat);
  playerMesh.castShadow = true;
  playerMesh.position.set(0, 2, 0);
  scene.add(playerMesh);

  const playerBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    position: new CANNON.Vec3(0, 2, 0),
    linearDamping: 0.2
  });
  physics.world.addBody(playerBody);

  // Luces básicas
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  light.castShadow = true;
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Controles
  const keys = { w: false, a: false, s: false, d: false, space: false };

  window.addEventListener('keydown', e => {
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyD') keys.d = true;
    if (e.code === 'Space') keys.space = true;
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyD') keys.d = false;
    if (e.code === 'Space') keys.space = false;
  });

  //Enemigos
  const enemies = [];

  function spawnEnemy() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 'red' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    const zStart = -30;
    const xStart = (Math.random() - 0.5) * 10;
    mesh.position.set(xStart, 1, zStart);
    scene.add(mesh);

    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      position: new CANNON.Vec3(xStart, 1, zStart),
    });
    body.velocity.set(0, 0, 5); // hacia el jugador
    physics.world.addBody(body);

    enemies.push({ mesh, body });
  }

  // Actualización (se debe llamar en el loop principal del juego)
  let spawnCounter = 0;

  function update(deltaTime) {
    // Sincronizar malla con cuerpo
    playerMesh.position.copy(playerBody.position);
    playerMesh.quaternion.copy(playerBody.quaternion);

    // Movimiento del jugador
    const speed = 5;
    if (keys.w) playerBody.velocity.z = -speed;
    else if (keys.s) playerBody.velocity.z = speed;
    else playerBody.velocity.z *= 0.9;

    if (keys.a) playerBody.velocity.x = -speed;
    else if (keys.d) playerBody.velocity.x = speed;
    else playerBody.velocity.x *= 0.9;

    // Salto
    if (keys.space && Math.abs(playerBody.velocity.y) < 0.05) {
      playerBody.velocity.y = 8;
    }

    // Spawnear enemigos periódicamente
    spawnCounter += deltaTime;
    if (spawnCounter > 2) { // cada 2 segundos
      spawnEnemy();
      spawnCounter = 0;
    }

    // Actualizar enemigos
    enemies.forEach((e, i) => {
      e.mesh.position.copy(e.body.position);
      e.mesh.quaternion.copy(e.body.quaternion);

      // Si choca con el jugador → fin del juego
      const dist = e.body.position.vsub(playerBody.position).length();
      if (dist < 1) {
        console.log('💥 Game Over');
        audio.pause();
      }

      // Eliminar enemigos que pasaron al jugador
      if (e.body.position.z > 10) {
        physics.world.removeBody(e.body);
        scene.remove(e.mesh);
        enemies.splice(i, 1);
      }
    });
  }

  // Exportar objetos del nivel
  return { modelo, playerMesh, playerBody, enemies, audio, update };
}
