// src/core/camera.js
/*import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 20, 20);
  return camera;
}

//NEW CAMERA FOR THIRD PERSON VIEW

export class ThirdPersonCamera {
  constructor(params){
    this._params = params;
    this._camrea = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }
  _CalculateIdealOffset(){
    const idealOffset = new THREE.Vector3(-15,20,-30);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }
  _CalculateIdealLookat(){
    const idealLookat = new THREE.Vector3(0, 10, 50); 
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }
  Update(timeElapsed){
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    const t = 1.0 - Math.pow(0.001,timeElapsed);

    this._currentPosition.copy(idealOffset, t);
    this._currentLookat.copy(idealLookat, t);

    this._camrea.position.copy(this._currentPosition);
    this._camrea.lookAt(this._currentLookat);
  }
}; */


/*
// src/core/camera.js
import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 8, 15);
  return camera;
}

export class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  //Posición de la cámara arriba y mirando hacia abajo en 45°
  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(0, 30, -15);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 2, 7);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

 Update(timeElapsed) {
    if (this._params.target && this._params.target._target) {
      const bernice = this._params.target._target;

      // Evita cualquier rotación acumulada
      bernice.rotation.set(0, Math.PI, 0);
      bernice.quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));

      // 🔹 Movimiento lateral sin rotar el cuerpo
      if (this._params.target._input) {
        const moveSpeed = 0.2;
        if (this._params.target._input._keys.left) {
          bernice.position.x -= moveSpeed; 
        }
        if (this._params.target._input._keys.right) {
          bernice.position.x += moveSpeed; 
        }
      }
    }

    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);

    
  }
}
*/
/*
import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(
  50,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});

  camera.position.set(0, 8, 15);
  return camera;
}

export class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  //Posición de la cámara arriba y mirando hacia abajo en 45°
  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(0, 30, -15);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 2, 5);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
  if (this._params.target && this._params.target._target) {
    const bernice = this._params.target._target;

    // El personaje NO rota
    bernice.rotation.set(0, Math.PI, 0);
    bernice.quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));

    // Movimiento lateral sin afectar la rotación ni la cámara
    if (this._params.target._input) {
      const moveSpeed = 0.2;
      if (this._params.target._input._keys.left) {
        bernice.position.x -= moveSpeed;
      }
      if (this._params.target._input._keys.right) {
        bernice.position.x += moveSpeed;
      }
    }
  }

  const idealOffset = this._CalculateIdealOffset();
  const idealLookat = this._CalculateIdealLookat();

  const t = 1.0 - Math.pow(0.001, timeElapsed);

  this._currentPosition.lerp(idealOffset, t);
  this._currentLookat.lerp(idealLookat, t);

  // ⛔ Cámara NO sigue a Bernice en X
  this._currentPosition.x = 5;
  this._currentLookat.x = 5;

  this._camera.position.copy(this._currentPosition);
  this._camera.lookAt(this._currentLookat);
}

}
*/

// camera.js FINAL
import * as THREE from "three";

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  // Cámara fija
  camera.position.set(7, 35, 40);
  camera.lookAt(7, 0, 10);

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  return camera;
}


