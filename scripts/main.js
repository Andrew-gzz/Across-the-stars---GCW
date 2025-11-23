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

// Features
import { createEnvironment, createHDRI } from './features/environment.js';

// Systems
import { BasicCharacterController } from './systems/controls.js';
import { createPhysics } from './systems/physics.js';
import { gameState } from './core/gameState.js';

let tiempoInterval = null;

export function iniciarTiempo() {
    const tiempoHUD = document.getElementById("tiempo");
    let segundos = 0;

    if (tiempoInterval) clearInterval(tiempoInterval);

    tiempoInterval = setInterval(() => {
        if (gameState.paused) return;

        segundos++;
        
        const min = String(Math.floor(segundos / 60)).padStart(2, "0");
        const sec = String(segundos % 60).padStart(2, "0");

        tiempoHUD.textContent = `${min}:${sec}`;
        gameState.tiempo = segundos;

    }, 1000);
}

export function detenerTiempo() {
    if (tiempoInterval) {
        clearInterval(tiempoInterval);
        tiempoInterval = null;
    }
}

window.restartGame = function () {
  console.log("Reiniciando juego...");

  gameState.reset();                 
  window.location.reload();          
};


window.addEventListener('DOMContentLoaded', () => {

  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level')) || 1;

  const modo = localStorage.getItem("modo"); 
  const dificultad = localStorage.getItem("dificultad");

  // OCULTAR EL TIEMPO SI ES FÁCIL
  const tiempoHUD = document.getElementById("tiempo").parentElement;

  if (dificultad === "facil") {
      tiempoHUD.style.display = "none";
  } else {
      tiempoHUD.style.display = "inline-flex";
  }


  console.log("Modo:", modo);
  console.log("Dificultad:", dificultad);
  console.log("Nivel:", level);

  new Main({ level, modo, dificultad });
});



class Main {
    constructor({ level, modo, dificultad }) {
        this.level = level;
        this.modo = modo;
        this.dificultad = dificultad;
        this._Initialize();
    }

    async _Initialize() {

        const container = document.querySelector('.game-area');
        if (!container) throw new Error('No existe el elemento ".game-area"');

        this.container = container;
        this.scene = createScene();
        this.camera = createCamera(container);
        this.renderer = createRenderer(container);
        this.loop = new Loop(this.camera, this.scene, this.renderer);

        new Resizer(container, this.camera, this.renderer);

        // HDRI + ambiente
        createHDRI(this.scene, '/models/Level2/HDRi.jpg');
        const { group: environment } = createEnvironment();
        this.scene.add(environment);

        // Physics
        this.physics = createPhysics();

        // -------------------------------------------
        // 1) CARGAR NIVEL
        // -------------------------------------------
        console.log("Cargando nivel:", this.level, "Dificultad:", this.dificultad);

        let result = null;

        switch (this.level) {
          case 1: result = await loadLevel1(this.scene, this.physics, this.dificultad); break;
          case 2: result = await loadLevel2(this.scene, this.physics, this.dificultad); break;
          case 3: result = await loadLevel3(this.scene, this.physics, this.dificultad); break;
        }

        if (!result || !result.bernice) {
          throw new Error("Error: el nivel no devolvió la Bernice.");
        }

        this.bernice = result.bernice;

        // -------------------------------------------
        // 2) CONTROLADOR + CÁMARA
        // -------------------------------------------
        this._characterController = new BasicCharacterController({
          camera: this.camera,
          scene: this.scene,
          bernice: this.bernice,
        });

        this._thirdPersonCamera = new ThirdPersonCamera({
          camera: this.camera,
          target: this._characterController,
        });

        // -------------------------------------------
        // 3) LOOP
        // -------------------------------------------
        this.loop.addSystem((dt) => this.physics.update(dt));
        this.loop.addSystem((dt) => this._characterController.Update(dt));
        this.loop.addSystem((dt) => this._thirdPersonCamera.Update(dt));

        this.loop.start();
    }
}
