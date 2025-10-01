import * as THREE from 'three';

import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { createCamera }   from './core/camera.js';
import { Loop }           from './core/loop.js';
import { Resizer }        from './core/resizer.js';
import { loadModel }      from './core/assets.js';  
import { createControls } from './systems/controls.js';
import { createEnvironment, createHDRI } from './features/environment.js';
import { Player } from './features/player.js';
import { createPhysics, createBoxShapeFromMesh } from './systems/physics.js';
import * as CANNON from 'cannon-es';


const container = document.querySelector('.game-area');
if (!container) throw new Error('No existe un elemento con la clase ".game-area"');

// Núcleo
const scene    = createScene();
const camera   = createCamera(container);
const renderer = createRenderer(container);
const loop = new Loop(camera, scene, renderer);

// Física
const physics = createPhysics();
loop.addSystem((dt) => physics.update(dt));

// sistemas
const controls = createControls(camera, renderer.domElement);
loop.addSystem((dt) => controls.update?.(dt));

// Utilidades
new Resizer(container, camera, renderer);   // ajusta tamaños al contenedor
const grid = new THREE.GridHelper(30, 30); // malla de referencia
scene.add(grid);

// Entorno (luces, suelo y fondo)
createHDRI(scene, '/Img/Space.png');
const { group: environment } = createEnvironment();
scene.add(environment);

// Jugador
const player = new Player();
const playerMesh = player.createPlayer();
playerMesh.group.position.set(0,15,0) 
scene.add(playerMesh.group);

// Carga de assets
const modelo = await loadModel('../models/scene.gltf');
modelo.scale.set(10,10,10)
modelo.position.set(0,8,0)
scene.add(modelo);

//Piniendo suelo y fisica
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF})
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const groundShape = new CANNON.Plane();
const groundBody = physics.add(ground, groundShape, 0);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

//Fisica de modelos
const playerShape = new CANNON.Sphere(2);
physics.add(playerMesh.group, playerShape, 2);

const cheeseShape = createBoxShapeFromMesh(modelo);
physics.add(modelo, cheeseShape, 2);


// iniciar
loop.start();

