import * as THREE from 'three';

// Core
import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { createCamera }   from './core/camera.js';
import { Loop }           from './core/loop.js';
import { Resizer }        from './core/resizer.js';

// Assets & Features
import { loadModel }      from './core/assets.js';  
import { createEnvironment, createHDRI } from './features/environment.js';
import { Player } from './features/player.js';

// Systems
import { createControls, createPlayerControls } from './systems/controls.js';
import { createPhysics, createBoxShapeFromMesh } from './systems/physics.js';

// Physics engine
import * as CANNON from 'cannon-es';

// --------------------------------------------------
// Inicialización del contenedor
// --------------------------------------------------
const container = document.querySelector('.game-area');
if (!container) throw new Error('No existe un elemento con la clase ".game-area"');

// --------------------------------------------------
// Núcleo del motor
// --------------------------------------------------
const scene    = createScene();
const camera   = createCamera(container);
const renderer = createRenderer(container);
const loop     = new Loop(camera, scene, renderer);

// --------------------------------------------------
// Física
// --------------------------------------------------
const physics = createPhysics();

// --------------------------------------------------
// Sistemas de controles
// --------------------------------------------------
const controls = createControls(camera, renderer.domElement);
// Controles del jugador (teclado) — se añadirán después de crear playerBody
// --------------------------------------------------
// Utilidades y helpers
// --------------------------------------------------
new Resizer(container, camera, renderer);   // ajusta tamaños al contenedor
const grid = new THREE.GridHelper(30, 30); // malla de referencia
scene.add(grid);

// --------------------------------------------------
// Entorno (luces, suelo, fondo)
// --------------------------------------------------
createHDRI(scene, '/Img/Space.png');
const { group: environment } = createEnvironment();
scene.add(environment);

// --------------------------------------------------
// Jugador
// --------------------------------------------------
const player = new Player();
const playerMesh = player.createPlayer();
playerMesh.position.set(0, 15, 0);
scene.add(playerMesh);

// Física del jugador
const playerShape = new CANNON.Sphere(2);
const playerBody  = physics.add(playerMesh, playerShape, 1);


// --------------------------------------------------
// Carga de assets (ejemplo: modelo externo)
// --------------------------------------------------
const modelo = await loadModel('../models/scene.gltf');
modelo.scale.set(10,10,10);
modelo.position.set(0,2.5,0);
scene.add(modelo);

// Física del modelo
const cheeseShape = createBoxShapeFromMesh(modelo);
physics.add(modelo, cheeseShape, 20);

// --------------------------------------------------
// Suelo
// --------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Física del suelo
const groundShape = new CANNON.Plane();
const groundBody  = physics.add(ground, groundShape, 0);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

// --------------------------------------------------
// Controles del jugador
// --------------------------------------------------
const playerControls = createPlayerControls(camera, playerMesh, playerBody);

// --------------------------------------------------
// Loop principal
// --------------------------------------------------
loop.addSystem((dt) => physics.update(dt));
loop.addSystem((dt) => controls.update?.(dt));
loop.addSystem((dt) => playerControls.update(dt));
loop.start();
