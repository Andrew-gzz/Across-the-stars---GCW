// scripts/features/player.js
import * as THREE from 'three';

export class Player {
	constructor() {
		this.group = new THREE.Group();
	}

	setPosition(x, y, z) {
		this.group.position.set(x, y, z);
	}
	createPlayer(assets) {
		const group = new THREE.Group();

		// placeholder: una esfera como jugador
		const radius = 2;
		const widthSegments = 12;
		const heightSegments = 8;
		const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
		const material = new THREE.MeshStandardMaterial({ color: 0xff6f00 });
		const mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);

		//return { group };
		return mesh;
	}
}

