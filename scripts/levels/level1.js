    import * as THREE from 'three';
    import * as CANNON from 'cannon-es';
    import { loadModel } from '../core/assets.js';
    import { createConvexShapeFromGeometry } from '../systems/physics.js';

    export async function loadLevel1(scene, physics) {
    const light = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    const escenario = await loadModel('../models/Level1/escenario1.glb');
    escenario.scale.set(300, 300, 300);
    escenario.position.set(0, -115, 0);
    scene.add(escenario);

    escenario.traverse(child => {
        if (child.isMesh && child.geometry) {
        const shape = createConvexShapeFromGeometry(child.geometry);
        if (shape) {
            physics.add(child, shape, 0); // suelo estático
        }
        }
    });

    const esmeralda = await loadModel('../models/Level1/diamante.glb');
    esmeralda.scale.set(5, 5, 5);
    esmeralda.position.set(10, 5, 0); // ajusta altura o posición en el mapa
    esmeralda.rotation.x = Math.PI / 2; // gira -90 grados hacia abajo
    scene.add(esmeralda);

    esmeralda.traverse(child => {
        if (child.isMesh && child.geometry) {
        const shape = createConvexShapeFromGeometry(child.geometry);
        if (shape) {
            physics.add(child, shape, 0); // masa 0 = estático (no cae)
        }
        }
    });

    

    const limitSize = 300;
    const wallThickness = 5;
    const wallHeight = 100;

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
    });

    const wallGeometry = new THREE.BoxGeometry(limitSize, wallHeight, wallThickness);
    const positions = [
        { x: 0, y: wallHeight / 2 - 5, z: limitSize / 2 },
        { x: 0, y: wallHeight / 2 - 5, z: -limitSize / 2 },
        { x: limitSize / 2, y: wallHeight / 2 - 5, z: 0 },
        { x: -limitSize / 2, y: wallHeight / 2 - 5, z: 0 },
    ];

    for (const pos of positions) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(pos.x, pos.y, pos.z);
        scene.add(wall);

        const wallShape = new CANNON.Box(
        new CANNON.Vec3(limitSize / 2, wallHeight / 2, wallThickness / 2)
        );
        physics.add(wall, wallShape, 0);
    }

    console.log('✅ Nivel 1 cargado con escenario, esmeralda y límites invisibles');
    }