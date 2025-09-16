// scripts/three.js
import * as THREE from "https://unpkg.com/three@0.159.0/build/three.module.js";

// 1) Obtener el contenedor de juego
const container = document.querySelector(".game-area");
if (!container) {
  throw new Error('No existe un elemento con la clase ".game-area"');
}

// 2) Escena y cámara
const scene = new THREE.Scene();
scene.background = new THREE.Color("#057160");

const camera = new THREE.PerspectiveCamera(
  45,
  1,          // se ajustará después según el contenedor
  0.1,
  1000
);
camera.position.set(0, 0, 15);

// 3) Renderer dentro del contenedor
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Función para ajustar tamaño al contenedor
function resizeToContainer() {
  const w = container.clientWidth;
  const h = container.clientHeight || window.innerHeight * 0.7; // fallback si no hay altura
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeToContainer();
window.addEventListener("resize", resizeToContainer);

// 4) Geometrías
const geometry = new THREE.BoxGeometry(3, 3, 3, 10, 10, 10);

const radius = 1.5;
const height = 3;
const radialSegments = 8;
const geometry2 = new THREE.ConeGeometry(radius, height, radialSegments);

const radius2 = 1.5;
const widthSegments = 8;
const heightSegments = 6;
const geometry3 = new THREE.SphereGeometry(radius2, widthSegments, heightSegments);

// 5) Materiales (corrigiendo color)
const material  = new THREE.MeshBasicMaterial({ color: "#ffffff", wireframe: true });
const material2 = new THREE.MeshBasicMaterial({ color: "#402A7A", wireframe: false });
const material3 = new THREE.MeshBasicMaterial({ color: "#FF0000", wireframe: true });

// 6) Meshes
const cube   = new THREE.Mesh(geometry,  material);
const cone   = new THREE.Mesh(geometry2, material2);
const sphere = new THREE.Mesh(geometry3, material3);

// 7) Posiciones
cone.position.x = -5;
sphere.position.x = 5;

// 8) Añadir a la escena (sin scene.add(scene))
scene.add(cube, cone, sphere);

// 9) Animación
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01; cube.rotation.y += 0.01;
  cone.rotation.x += 0.01; cone.rotation.y += 0.01;
  sphere.rotation.x += 0.01; sphere.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
