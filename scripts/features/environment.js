// src/features/environment.js
import * as THREE from 'three';
export function createEnvironment(/* assets */) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  group.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7);
  group.add(dir);

  return { group };
}
