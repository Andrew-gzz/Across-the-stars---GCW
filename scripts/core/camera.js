// src/core/camera.js
import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 20, 20);
  camera.lookAt(0,0,0) // mirar hacia adelante
  
  
  return camera;
}

export function updateCamera(camera, x, y, z, target = new THREE.Vector3(0, 0, 0)) {
  camera.position.set(x, y, z);
  camera.lookAt(target); // 👈 aseguras que siga mirando al frente
}