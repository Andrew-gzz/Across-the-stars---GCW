import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Niveles
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';
import { loadLevel3 } from './levels/level3.js';

// Core
import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { createCamera, ThirdPersonCamera } from './core/camera.js';
import { Loop } from './core/loop.js';
import { Resizer } from './core/resizer.js';

// Assets & Features
import { loadModel } from './core/assets.js';
import { createEnvironment, createHDRI } from './features/environment.js';

// Systems
import { BasicCharacterController } from './systems/controls.js';
import { createPhysics, createBoxShapeFromMesh } from './systems/physics.js';

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level')) || 1; // Por defecto: nivel 1
  new Main(level);
});

class Main {
  constructor(level = 1) {
    this.level = level;
    this._Initialize();
  }

  async _Initialize() {
    const container = document.querySelector('.game-area');
    if (!container) throw new Error('No existe un elemento con la clase ".game-area"');
    this.container = container;

    this.scene = createScene();
    this.camera = createCamera(container);
    this.renderer = createRenderer(container);
    this.loop = new Loop(this.camera, this.scene, this.renderer);

    new Resizer(container, this.camera, this.renderer);

    createHDRI(this.scene, '/models/Level2/HDRi.jpg');
    const { group: environment } = createEnvironment();
    this.scene.add(environment);

    this.physics = createPhysics();

    // Suelo genérico
    /*const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const groundShape = new CANNON.Plane();
    const groundBody = this.physics.add(ground, groundShape, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);*/

    // Carga de nivel según la selección del jugador
    switch (this.level) {
      case 1:
        console.log('Cargando Nivel 1...');
        await loadLevel1(this.scene, this.physics);
        break;
      case 2:
        console.log('Cargando Nivel 2...');
        await loadLevel2(this.scene, this.physics);
        break;
      case 3:
        console.log('Cargando Nivel 3...');
        await loadLevel3(this.scene, this.physics);
        break;
      default:
        console.warn('Nivel no reconocido. Cargando Nivel 1 por defecto.');
        await loadLevel1(this.scene, this.physics);
    }

    const params = {
      camera: this.camera,
      scene: this.scene,
    };
    this._characterController = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this.camera,
      target: this._characterController,
    });

    this.loop.addSystem((dt) => this.physics.update(dt));
    this.loop.addSystem((dt) => this._characterController.Update(dt));
    this.loop.addSystem((dt) => this._thirdPersonCamera.Update(dt));
    this.loop.start();
  }
}
