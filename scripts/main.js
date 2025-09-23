// src/main.js
import * as THREE         from 'three';

import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { createCamera }   from './core/camera.js';
import { Loop }           from './core/loop.js';
import { Resizer }        from './core/resizer.js';
import { load }          from './core/assets.js';  
//import { createPhysics }  from './systems/physics.js';      // opcional
//import { createCollisions } from './systems/collisions.js';  // opcional
import { createControls } from './systems/controls.js';      // opcional
//import { createPlayer }     from './features/player.js'; //de momento no hay player
//import { createEnvironment } from './features/environment.js';

const container = document.querySelector('.game-area');
if (!container) throw new Error('No existe un elemento con la clase ".game-area"');

// Núcleo
const scene    = createScene();
//setSceneBackground(scene, "#17020D"); //No acepta todos los colores
const camera   = createCamera(container);
const renderer = createRenderer(container);

// Utilidades
new Resizer(container, camera, renderer);   // ajusta tamaños al contenedor
const grid = new THREE.GridHelper(30, 30); // malla de referencia
scene.add(grid);

// Carga de assets



// Loop de actualización y render
const loop = new Loop(camera, scene, renderer);
loop.start();

// sistemas
const controls   = createControls(camera, renderer.domElement);
loop.addSystem((dt) => controls.update?.(dt));
/*

// sistemas
const physics    = createPhysics();        // world.step(dt)… (si usas)
const collisions = createCollisions(scene);// cheques AABB, raycasts…


// entidades
const env    = createEnvironment(assets);  // luces, piso, etc.
const player = createPlayer(assets);       // devuelve { object3D, update(dt) }

scene.add(env.group, player.group);

// registra actualizaciones
loop.addSystem((dt) => controls.update?.(dt));
loop.addSystem((dt) => physics.update?.(dt, scene));   // si hay físicas
loop.addSystem((dt) => collisions.update?.(dt));       // si las usas
loop.addSystem((dt) => player.update?.(dt));           // jugador
*/ 

