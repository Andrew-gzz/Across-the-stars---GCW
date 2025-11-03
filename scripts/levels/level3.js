import * as THREE from 'three';
import { loadModel } from '../core/assets.js';

export async function loadLevel3(scene) {
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 100, 50);
  scene.add(dirLight);

  const groundGeometry = new THREE.BoxGeometry(30, 0.5, 1000); // más ancho y largo
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#0369a1' });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, 0, -490); // más cerca del centro visual
  ground.receiveShadow = true;
  scene.add(ground);

  const bernice = scene.getObjectByName('Bernice');
  if (bernice) {
    bernice.position.set(0, 0, 25);
    bernice.scale.setScalar(0.18);
    bernice.rotation.y = Math.PI; 
  } else {
    console.warn('Bernice aún no está cargada en la escena.');
  }

  class Box extends THREE.Mesh {
    constructor({ width, height, depth, color = 'red', position, velocity, zAcceleration }) {
      super(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color })
      );
      this.position.copy(position);
      this.velocity = velocity;
      this.gravity = -0.002;
      this.zAcceleration = zAcceleration;
      this.width = width;
      this.height = height;
      this.depth = depth;
    }

    update(ground) {
      if (this.zAcceleration) this.velocity.z += 0.0003;
      this.position.add(this.velocity);
      this.applyGravity(ground);
    }

    applyGravity(ground) {
      this.velocity.y += this.gravity;
      if (this.position.y - this.height / 2 <= ground.position.y + 0.25) {
        this.velocity.y = 0;
        this.position.y = ground.position.y + this.height / 2 + 0.25;
      }
    }
  }

  const enemies = [];
  let frames = 0;
  let spawnRate = 180;

  function animate() {
    requestAnimationFrame(animate);

    // Colisiones simples CHECAR
    if (bernice) {
      enemies.forEach((enemy) => {
        const dist = bernice.position.distanceTo(enemy.position);
        if (dist < 1.2) console.log('Bernice colisionó con un enemigo!');
      });
    }

    // Spawnear enemigos a lo largo de la pista
    if (frames % spawnRate === 0) {
      if (spawnRate > 30) spawnRate -= 10;
      const enemy = new Box({
        width: 3.5,
        height: 3.5,
        depth: 3.5,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 16, // dentro del ancho de la pista
          0,
          -1000
        ),
        velocity: new THREE.Vector3(0, 0, 0.07),
        zAcceleration: true
      });
      scene.add(enemy);
      enemies.push(enemy);
    }

    enemies.forEach((enemy) => enemy.update(ground));
    frames++;
  }

  animate();
}
