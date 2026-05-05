// scene/CameraRig.js
import * as THREE from 'three';
import gsap from 'gsap';

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.pivot  = new THREE.Object3D();
    this.pivot.add(camera);

    this.waypoints = {
      hero: {
        pivotPos: { x: 0,  y: 0, z: 0 },
        camPos:   { x: 0,  y: 8, z: 12 },
        camRot:   { x: -0.45, y: 0, z: 0 },
        fov: 45
      },
      transition: {
        pivotPos: { x: -1, y: 0, z: 0 },
        camPos:   { x: -2, y: 3, z: 6 },
        camRot:   { x: -0.2, y: 0.4, z: 0.1 },
        fov: 40
      },
      detail: {
        pivotPos: { x: 1.5, y: 0, z: 0 },
        camPos:   { x: 1.5, y: 0.8, z: 2.5 },
        camRot:   { x: -0.1, y: 0.3, z: 0 },
        fov: 35
      },
      cta: {
        pivotPos: { x: 0, y: 0, z: 0 },
        camPos:   { x: 0, y: 4, z: 14 },
        camRot:   { x: -0.28, y: 0, z: 0 },
        fov: 50
      }
    };
  }

  getPivot() { return this.pivot; }

  setToWaypoint(name) {
    const wp = this.waypoints[name];
    if (!wp) return;
    gsap.set(this.pivot.position, wp.pivotPos);
    gsap.set(this.camera.position, wp.camPos);
    gsap.set(this.camera.rotation, wp.camRot);
    this.camera.fov = wp.fov;
    this.camera.updateProjectionMatrix();
  }
}
