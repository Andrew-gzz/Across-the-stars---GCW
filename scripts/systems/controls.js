// src/systems/controls.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export function createControls(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  return {
    update(dt) {
      controls.update();
    },
  };
}
export function createPlayerControls(camera, playerMesh, playerBody) {
  const keys = {};

  // Captura teclas
  document.addEventListener('keydown', (e) => keys[e.code] = true);
  document.addEventListener('keyup', (e) => keys[e.code] = false);

  const step = 0.2; // velocidad de movimiento
  let canJump = false;
  // infer radius from the player's bounding sphere if possible
  let playerRadius = 1;
  try {
    if (playerMesh.geometry && playerMesh.geometry.boundingSphere) {
      playerRadius = playerMesh.geometry.boundingSphere.radius;
    } else if (playerMesh.geometry) {
      playerMesh.geometry.computeBoundingSphere();
      playerRadius = playerMesh.geometry.boundingSphere.radius;
    }
  } catch (e) {
    // fallback: keep default
  }

  return {
    update(dt) {
      if (!playerBody) return;
      // Movimiento simple en X/Z
      if (keys['KeyW']) playerBody.position.z -= step;
      if (keys['KeyS']) playerBody.position.z += step;
      if (keys['KeyA']) playerBody.position.x -= step; 
      if (keys['KeyD']) playerBody.position.x += step;

      // Detectar si está en el suelo (posición y cercana a radius)
      const groundEpsilon = 0.05;
      if (playerBody.position.y <= playerRadius + groundEpsilon) {
        canJump = true;
        // asegurar que no atraviese el suelo
        playerBody.position.y = playerRadius;
        playerBody.velocity.y = 0;
      }

      // Salto: solo una vez hasta que vuelva a tocar suelo
      if (keys['Space'] && canJump) {
        // aplicar impulso vertical cambiando la velocidad
        playerBody.velocity.y = 20 ; // ajuste de fuerza de salto
        canJump = false;
      }
      // Sincroniza mesh inmediatamente (aunque physics.update lo hará también)
      playerMesh.position.copy(playerBody.position);

      // Cámara tipo "third person"
      const camOffset = new THREE.Vector3(0, 10, 15); // detrás y arriba
      const camPos = playerMesh.position.clone().add(camOffset);
      camera.position.lerp(camPos, 0.1); // suaviza el seguimiento
      camera.lookAt(playerMesh.position);
    }
  };
}