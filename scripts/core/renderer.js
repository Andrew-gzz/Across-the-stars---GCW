// src/core/renderer.js
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  return renderer;
}
