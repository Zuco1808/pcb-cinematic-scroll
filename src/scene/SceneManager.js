// scene/SceneManager.js
import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { setupLighting } from './Lighting.js';

export class SceneManager {
  constructor(container) {
    this.container   = container;
    this.scene       = null;
    this.camera      = null;
    this.renderer    = null;
    this.composer    = null;
    this.bokeh       = null;
    this.cameraRig   = null;
    this.clock       = new THREE.Clock();
    this.deltaTime   = 0;
    this.elapsedTime = 0;
    this.onTick      = null;
    this._rafId      = null;
    this._shaderMaterials = [];
    this._init();
  }

  _init() {
    this._initRenderer();
    this._initScene();
    this._initCamera();
    const lights = setupLighting(this.scene);
    this.scene.userData.lights = lights;
    this.cameraRig = new CameraRig(this.camera);
    this.scene.add(this.cameraRig.getPivot());
    this._startLoop();
    window.addEventListener('resize', this._onResize.bind(this));
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdaeef8);
    this.scene.fog = new THREE.FogExp2(0xdaeef8, 0.018); // Svijetlo plava
    // Bez foga na light theme — sakriva PCB
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 100
    );
    this.camera.position.set(0, 5, 8);
    this.camera.rotation.x = -0.38;
  }

  setComposer(composer, bokeh = null) {
    this.composer = composer;
    this.bokeh    = bokeh;
  }

  registerShaderMaterial(mat) {
    this._shaderMaterials.push(mat);
  }

  _startLoop() {
    const loop = () => {
      this._rafId      = requestAnimationFrame(loop);
      this.deltaTime   = this.clock.getDelta();
      this.elapsedTime = this.clock.getElapsedTime();

      this._shaderMaterials.forEach(mat => {
        if (mat.uniforms?.uTime) mat.uniforms.uTime.value = this.elapsedTime;
      });

      this.onTick?.(this.camera.position);

      if (this.composer) {
        this.composer.render(this.deltaTime);
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    this.scene.traverse(obj => {
      obj.geometry?.dispose();
      const mats = obj.material
        ? Array.isArray(obj.material) ? obj.material : [obj.material]
        : [];
      mats.forEach(m => {
        Object.values(m).forEach(v => v?.isTexture && v.dispose());
        m.dispose();
      });
    });
    this.renderer.dispose();
  }
}
