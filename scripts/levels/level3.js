import * as THREE from 'three';
import { loadModel } from '../core/assets.js';

export async function loadLevel3(scene) {

  // --- LUCES ---
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 100, 100);
  scene.add(dirLight);

  // --- PISO ---
  const groundGeometry = new THREE.BoxGeometry(40, 0.5, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#0369a1' });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, 0, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // --- CARGAR BERNICE ---
  const bernice = await loadModel('/models/Bernice.fbx');
  bernice.name = "Bernice";
  bernice.position.set(0, 0, 20);
  bernice.scale.setScalar(0.06);
  bernice.rotation.y = Math.PI;
  bernice.isFrozen = false;
  scene.add(bernice);

  const berniceBBox = new THREE.Box3().setFromObject(bernice);

  console.log("Bernice cargada:", bernice);

  // --- CLASE ENEMIGO ---
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

      this.bbox = new THREE.Box3().setFromObject(this);
    }

    update(ground) {
      if (this.zAcceleration) this.velocity.z += 0.0003;
      this.position.add(this.velocity);
      this.bbox.setFromObject(this);

      this.applyGravity(ground);
    }

    applyGravity(ground) {
      this.velocity.y += this.gravity;

      if (this.position.y <= ground.position.y + 0.25) {
        this.velocity.y = 0;
        this.position.y = ground.position.y + 0.25;
      }
    }
  }

  // --- ENEMIGOS ---
  const enemies = [];
  let frames = 0;
  let spawnRate = 180;

  // --- LOOP PRINCIPAL ---
  function animate() {
    requestAnimationFrame(animate);

    // actualizar bounding box de Bernice
    berniceBBox.setFromObject(bernice);

    // colisión
    if (!bernice.isFrozen) {
      enemies.forEach((enemy) => {
        if (berniceBBox.intersectsBox(enemy.bbox)) {
          bernice.isFrozen = true;
          console.log("🔥 COLISIÓN DETECTADA: Bernice se congeló");
        }
      });
    }

    // spawn de enemigos
    if (frames % spawnRate === 0) {
      if (spawnRate > 30) spawnRate -= 10;

      const enemy = new Box({
        width: 3.5,
        height: 3.5,
        depth: 3.5,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          0,
          -200
        ),
        velocity: new THREE.Vector3(0, 0, 0.03),
        zAcceleration: true
      });

      scene.add(enemy);
      enemies.push(enemy);
    }

    // actualizar enemigos
    enemies.forEach((enemy) => enemy.update(ground));

    frames++;
  }

  animate();

  // 🔥🔥🔥 IMPORTANTE 🔥🔥🔥
  // El nivel debe regresar la Bernice para que el main la use
  return { bernice };
}
