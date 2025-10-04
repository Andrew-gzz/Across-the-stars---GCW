import * as THREE from 'three';

// Core
import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { createCamera, ThirdPersonCamera }   from './core/camera.js';
import { Loop }           from './core/loop.js';
import { Resizer }        from './core/resizer.js';

// Assets & Features
import { loadModel }      from './core/assets.js';  
import { createEnvironment, createHDRI } from './features/environment.js';
import { Player } from './features/player.js';

// Systems
import { BasicCharacterController } from './systems/controls.js';
import { createPhysics, createBoxShapeFromMesh } from './systems/physics.js';

// Physics engine
import * as CANNON from 'cannon-es';

class Main{
  constructor() {
    this._Initialize();
  }

  async _Initialize() {
    //Contenedor
    const container = document.querySelector('.game-area');
    if (!container) throw new Error('No existe un elemento con la clase ".game-area"');
    this.container = container;
    //Nucleo del motor
    this.scene    = createScene();
    this.camera   = createCamera(container);
    this.renderer = createRenderer(container);
    this.loop     = new Loop(this.camera, this.scene, this.renderer);
    //Utilidades
    new Resizer(container, this.camera, this.renderer);
    //Entorno
    createHDRI(this.scene, '/models/Level2/HDRi.jpg');
    const { group: environment } = createEnvironment();
    this.scene.add(environment);
    //Física
    this.physics = createPhysics();
    //Suelo
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const groundShape = new CANNON.Plane();
    const groundBody  = this.physics.add(ground, groundShape, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    //Assets
    const modelo = await loadModel('../models/scene.gltf');
    modelo.scale.set(10, 10, 10);
    modelo.position.set(0, 2.5, 0);
    this.scene.add(modelo);

    const cheeseShape = createBoxShapeFromMesh(modelo);
    this.physics.add(modelo, cheeseShape, 20);
    //Personaje
    const params = {
      camera: this.camera,
      scene: this.scene,
    };
    this._characterController = new BasicCharacterController(params);

    // Cámara en tercera persona
    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this.camera,
      target: this._characterController,
    });
    //Loop principal
    this.loop.addSystem((dt) => this.physics.update(dt));
    this.loop.addSystem((dt) => this._characterController.Update(dt));
    this.loop.addSystem((dt) => this._thirdPersonCamera.Update(dt));
    this.loop.start();
  }
  async _LoadAnimatedModel() {
    const params = {
      camera: this.camera,
      scene: this.scene,
    }
    this._controls = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this.camera,
      target: this._controls,
    });
  }
  
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Main();
});