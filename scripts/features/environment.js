// scripts/features/environment.js
import * as THREE from 'three';
/**
 * Aplica una textura HDRI a la escena.
 * @param {THREE.Scene} scene 
 * @param {string} path
 */
export function createEnvironment(/* assets */) {
	const group = new THREE.Group();

	const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
	group.add(hemi);

	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(5, 10, 7);
	group.add(dir);

	return { group };
}
export function createHDRI(scene, path) {
	const loader = new THREE.TextureLoader();
	const texture = loader.load(
		path,
		() => {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			texture.colorSpace = THREE.SRGBColorSpace;
			scene.background = texture;
		});
}
