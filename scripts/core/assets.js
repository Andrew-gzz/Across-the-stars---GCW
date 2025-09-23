// scripts/core/assets.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
 
export async function load() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('models/ejemplo.glbf');
  return gltf.scene;
}
