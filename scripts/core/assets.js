// scripts/core/assets.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Carga un modelo GLTF/GLB y opcionalmente aplica un material con textura.
 * 
 * @param {string} modelPath - Ruta del modelo (ej: 'models/scene.gltf')
 * @param {string} [texturePath] - Ruta de la textura (ej: 'textures/metal.jpg')
 * @returns {Promise<THREE.Object3D>} - El modelo listo para añadir a la escena
 */

export async function loadModel(modelPath, texturePath) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(modelPath);
    const model = gltf.scene;

    if (texturePath) {
      const texture = new THREE.TextureLoader().load(texturePath);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
      });

      // Recorremos todos los meshes y les asignamos el material
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = material;
        }
      });
    }

    return model;
  } catch (error) {
    console.error(`❌ Error cargando el modelo: ${modelPath}`, error);
    throw error;
  }
}
