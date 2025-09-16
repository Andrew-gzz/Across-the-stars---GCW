// src/core/loop.js
export class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.systems = [];
    this._acc = 0;
    this._last = performance.now();
    this._raf = null;
  }
  addSystem(fn) { this.systems.push(fn); }
  start = () => { this._last = performance.now(); this._raf = requestAnimationFrame(this._tick); };
  stop  = () => { cancelAnimationFrame(this._raf); };
  _tick = (t) => {
    const dt = Math.min(0.05, (t - this._last) / 1000); // clamp dt
    this._last = t;

    for (const sys of this.systems) sys?.(dt);

    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._tick);
  }
}
