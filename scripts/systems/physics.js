// src/systems/physics.js
export function createPhysics() {
  // aquí podrías inicializar cannon-es / rapier y enlazar rigidbodies
  // import('cannon-es') ... world = new CANNON.World()
  return {
    update(dt /*, scene */) {
      // world.step(fixedDt) y sincronizar meshes con bodies
    },
  };
}
