// src/core/scene.js
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function createScene() {
  const scene = new THREE.Scene();
  return scene;
}
export function setSceneBackground(scene, color) {
  scene.background = new THREE.Color(color);
}