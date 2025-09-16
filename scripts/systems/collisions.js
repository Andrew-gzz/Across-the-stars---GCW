// src/systems/collisions.js
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function createCollisions(scene) {
  const boxA = new THREE.Box3();
  const boxB = new THREE.Box3();

  return {
    update() {
      // ejemplo: detectar colisiones entre dos grupos si los conoces
      // boxA.setFromObject(obj1); boxB.setFromObject(obj2);
      // if (boxA.intersectsBox(boxB)) { ... }
    },
  };
}
