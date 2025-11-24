// scripts/main.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Niveles
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';
import { loadLevel3 } from './levels/level3.js';
import { loadLevelM } from './levels/levelM.js';

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
	const levelParam = urlParams.get('level') || '1';

	console.log("Parámetro level recibido:", levelParam);

	let level;
	let modo = null;
	let dificultad = null;

	if (levelParam === 'M') {
		// Modo Multijugador
		level = 'M';
		console.log("Modo MULTIJUGADOR detectado");
	} else {
		// Modo Individual - Obtener dificultad de localStorage
		level = parseInt(levelParam);
		modo = localStorage.getItem("modo");
		dificultad = localStorage.getItem("dificultad");
		
		console.log("Modo INDIVIDUAL - Nivel:", level);
		console.log("Modo:", modo, "| Dificultad:", dificultad);

		// Mostrar/Ocultar HUD de tiempo según dificultad
		const tiempoHUD = document.getElementById("tiempo")?.parentElement;
		if (tiempoHUD) {
			if (dificultad === "facil") {
				tiempoHUD.style.display = "none";
				console.log("Temporizador oculto (modo fácil)");
			} else {
				tiempoHUD.style.display = "inline-flex";
				console.log("Temporizador visible (modo difícil)");
			}
		}
	}

	new Main({ level, modo, dificultad });
});


class Main {
	constructor({ level, modo = null, dificultad = null }) {
		this.level = level;
		this.modo = modo;
		this.dificultad = dificultad;
		this._Initialize();
	}

	async _Initialize() {

		// Contenedor
		const container = document.querySelector('.game-area');
		if (!container) throw new Error('No existe un elemento con la clase ".game-area"');

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

		console.log("Cargando nivel:", this.level);

		let result = null;

		if (this.level === 'M') { // Nivel Multijugador

			console.log("Cargando nivel MULTIJUGADOR...");
			result = await loadLevelM(this.scene, this.physics);
		} else { // Niveles Individuales con Dificultad

			console.log(`Cargando Level ${this.level} - Dificultad: ${this.dificultad || 'normal'}`);		
			switch (this.level) {
				case 1:
					result = await loadLevel1(this.scene, this.physics, this.dificultad);
					break;

				case 2:
					result = await loadLevel2(this.scene, this.physics, this.dificultad);
					break;

				case 3:
					result = await loadLevel3(this.scene, this.physics, this.dificultad);
					break;

				default:
					console.warn("Nivel no encontrado, cargando Level 1 por defecto");
					result = await loadLevel1(this.scene, this.physics, this.dificultad);
			}
		}

		// Verificar que Bernice existe
		if (!result || !result.bernice) {
			throw new Error("Error: el nivel no devolvió la Bernice.");
		}

		this.bernice = result.bernice;
		console.log("Bernice cargada correctamente:", this.bernice);

		this._characterController = new BasicCharacterController({
			camera: this.camera,
			scene: this.scene,
			bernice: this.bernice,
		});

		/*
		this._thirdPersonCamera = new ThirdPersonCamera({
			camera: this.camera,
			target: this._characterController,
		});
		*/

		// LOOP
		this.loop.addSystem((dt) => this.physics.update(dt));
		this.loop.addSystem((dt) => this._characterController.Update(dt));
		this.loop.addSystem((dt) => this._thirdPersonCamera.Update(dt));

		this.loop.start();
		console.log("Loop de juego iniciado");
	}
}