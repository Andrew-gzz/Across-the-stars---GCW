import * as THREE from 'three';

import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { createCamera }   from './core/camera.js';
import { Loop }           from './core/loop.js';
import { Resizer }        from './core/resizer.js';
import { loadModel }      from './core/assets.js';  
import { createControls } from './systems/controls.js';
import { createEnvironment, createHDRI } from './features/environment.js';

const container = document.querySelector('.game-area');
if (!container) throw new Error('No existe un elemento con la clase ".game-area"');

// Núcleo
const scene    = createScene();
const camera   = createCamera(container);
const renderer = createRenderer(container);

// Utilidades
new Resizer(container, camera, renderer);   // ajusta tamaños al contenedor
const grid = new THREE.GridHelper(30, 30); // malla de referencia
scene.add(grid);

// Entorno (luces, suelo y fondo)
createHDRI(scene, '/Img/Space.png');
const { group: environment } = createEnvironment();
scene.add(environment);

// Carga de assets
const modelo = await loadModel('../models/scene.gltf');
modelo.scale.set(10,10,10)
scene.add(modelo);

// Loop de actualización y render
const loop = new Loop(camera, scene, renderer);
loop.start();

// sistemas
const controls = createControls(camera, renderer.domElement);
loop.addSystem((dt) => controls.update?.(dt));
