// src/core/camera.js
import * as THREE from 'three';

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
};