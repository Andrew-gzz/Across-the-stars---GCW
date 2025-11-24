// scripts/core/renderer.js
import * as THREE from 'three';

export function createRenderer(container) {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	container.appendChild(renderer.domElement);
	return renderer;
}
