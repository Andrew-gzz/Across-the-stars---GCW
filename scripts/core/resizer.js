// src/core/resizer.js
export class Resizer {
  constructor(container, camera, renderer) {
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight || window.innerHeight * 0.7;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);
  }
}
