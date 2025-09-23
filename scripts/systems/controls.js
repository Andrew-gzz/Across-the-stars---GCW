// src/systems/controls.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  return {
    update(dt) {
      controls.update();
    },
  };
}
