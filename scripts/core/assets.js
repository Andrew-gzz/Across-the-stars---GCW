// scripts/core/assets.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * Carga un modelo GLTF/GLB o FBX, y opcionalmente aplica un material con textura.
 * 
 * @param {string} modelPath - Ruta del modelo (ej: 'models/scene.gltf', 'models/model.fbx')
 * @param {string} [texturePath] - Ruta de la textura (ej: 'textures/metal.jpg')
 * @returns {Promise<THREE.Object3D>} - El modelo listo para añadir a la escena
 */

export async function loadModel(modelPath, texturePath) {
	let loader;

	// Detectar automáticamente si el archivo es FBX
	if (modelPath.toLowerCase().endsWith('.fbx')) {
		loader = new FBXLoader();
	} else {
		loader = new GLTFLoader();
	}

	try {
		const loaded = await loader.loadAsync(modelPath);

		// gltf.scene existe solo para GLTF; en FBX el modelo es el root directamente
		const model = loaded.scene || loaded;

		// Aplicar textura si viene en parámetros
		if (texturePath) {
			const texture = new THREE.TextureLoader().load(texturePath);
			const material = new THREE.MeshPhongMaterial({
				map: texture,
				transparent: true,
			});

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
