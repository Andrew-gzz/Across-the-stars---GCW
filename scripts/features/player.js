// src/features/player.js
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function createPlayer(assets) {
  const group = new THREE.Group();

  // placeholder: un cubo como jugador
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color: 0xff6f00 })
  );
  group.add(mesh);

  // si tenías modelo GLTF:
  // if (assets.models.player) group.add(assets.models.player);

  let t = 0;
  function update(dt) {
    t += dt;
    group.rotation.y += dt;      // animación dummy
  }

  return { group, update };
}
