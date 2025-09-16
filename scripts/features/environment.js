// src/features/environment.js
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function createEnvironment(/* assets */) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  group.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7);
  group.add(dir);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x225555 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  group.add(ground);

  return { group };
}
