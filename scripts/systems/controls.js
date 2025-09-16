// src/systems/controls.js
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  return {
    update(dt) {
      controls.update();
    },
  };
}
