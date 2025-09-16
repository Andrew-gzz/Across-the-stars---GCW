// scripts/core/assets.js
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

export async function load() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('models/ejemplo.glbf');
  return gltf.scene;
}
