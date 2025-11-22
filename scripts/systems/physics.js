import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export function createPhysics() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

  const bodies = []; // { mesh, body }

  function add(mesh, shape, mass = 1) {
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(mesh.position);
    world.addBody(body);
    bodies.push({ mesh, body });
    return body;
  }

  function update(dt) {
    world.step(1 / 60, dt, 3);
    for (const { mesh, body } of bodies) {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    }
  }

  return { world, add, update };
}

export function createBoxShapeFromMesh(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);

  // La mitad de las dimensiones para Cannon
  return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
}

/**
 * 🔹 Crea una forma convexa (colisión más precisa)
 *    a partir de la geometría de un mesh de Three.js
 */
export function createConvexShapeFromGeometry(geometry) {
  const position = geometry.attributes.position;

  if (!position) {
    console.warn('No hay geometría válida para crear colisión convexa.');
    return null;
  }

  const points = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    points.push(new CANNON.Vec3(x, y, z));
  }

  // 🔸 Convierte los puntos a una forma convexa
  return new CANNON.ConvexPolyhedron({ vertices: points });
}
