// src/core/camera.js
import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 10, 10);
  camera.rotation.x = -0.5;
  // el aspect real se fija en Resizer
  return camera;
}
