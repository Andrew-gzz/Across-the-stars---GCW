// scripts/core/scene.js
import * as THREE from 'three';

export function createScene() {
	const scene = new THREE.Scene();
	return scene;
}
export function setSceneBackground(scene, color) {
	scene.background = new THREE.Color(color);
}