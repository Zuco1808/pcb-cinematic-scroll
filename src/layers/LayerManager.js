// layers/LayerManager.js
import * as THREE from 'three';
import gsap from 'gsap';

export class LayerManager {
  constructor(scene) {
    this.scene  = scene;
    this.layers = {};
    this._createBackground();
    this._createMidground();
    this._createParticles();
    this._createDustParticles();
  }

  _createBackground() {
    // Proceduralna PCB mreža u pozadini
    const group = new THREE.Group();
    group.position.z = -9;

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xb8d8ee,
      transparent: true,
      opacity: 0.4,
    });

    // Horizontalne linije
    for (let i = -8; i <= 8; i += 0.8) {
      const pts = [new THREE.Vector3(-15, i, 0), new THREE.Vector3(15, i, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, lineMat));
    }

    // Vertikalne linije
    for (let i = -15; i <= 15; i += 0.8) {
      const pts = [new THREE.Vector3(i, -8, 0), new THREE.Vector3(i, 8, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, lineMat));
    }

    // Veliki plane za fog catch
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xeef7fc,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.0,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), planeMat);
    plane.position.z = -0.1;
    group.add(plane);

    this.layers.background = group;
    this.scene.add(group);
  }

  _createMidground() {
    // Floating PCB fragmenti u sredini
    const group = new THREE.Group();
    group.position.z = -4;

    const colors = [0xd0e8f5, 0xb8d8ee, 0xe0f2fb];
    const fragData = [
      { w: 1.2, d: 0.8, x: -6, y: 2,  r: 0.3  },
      { w: 0.8, d: 1.2, x:  6, y: -1, r: -0.5 },
      { w: 1.5, d: 0.6, x: -5, y: -3, r: 0.8  },
      { w: 0.6, d: 0.9, x:  7, y: 3,  r: -0.2 },
      { w: 1.0, d: 1.0, x: -8, y: 0,  r: 1.0  },
    ];

    fragData.forEach(({ w, d, x, y, r }) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const geo   = new THREE.BoxGeometry(w, 0.08, d);
      const mat   = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.4,
      });
      const frag = new THREE.Mesh(geo, mat);
      frag.position.set(x, y, Math.random() * 2 - 1);
      frag.rotation.y = r;
      group.add(frag);
    });

    // Blagi float animacija
    gsap.to(group.position, {
      y: '+=0.3',
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    this.layers.midground = group;
    this.scene.add(group);
  }

  _createParticles() {
    // Lebdeće čestice — električki naboj estetika
    const count     = 300;
    const geometry  = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      sizes[i] = Math.random() * 0.04 + 0.01;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0x4fc3f7,
      size: 0.035,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Rotacija
    gsap.to(particles.rotation, {
      y: Math.PI * 2,
      duration: 80,
      repeat: -1,
      ease: 'none'
    });
    gsap.to(particles.rotation, {
      x: Math.PI * 0.5,
      duration: 120,
      repeat: -1,
      yoyo: true,
      ease: 'none'
    });

    this.layers.particles = particles;
  }

  _createDustParticles() {
    // Sitna prašina — bliže kameri
    const count     = 150;
    const geometry  = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 + 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x5FABDB,
      size: 0.015,
      transparent: true,
      opacity: 0.12,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dust = new THREE.Points(geometry, material);
    this.scene.add(dust);

    // Sporiji drift
    gsap.to(dust.position, {
      x: '+=0.5',
      y: '+=0.2',
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    this.layers.dust = dust;
  }

  updateParallax(cameraX, cameraY) {
    if (this.layers.background) {
      this.layers.background.position.x = cameraX * 0.08;
      this.layers.background.position.y = cameraY * 0.08;
    }
    if (this.layers.midground) {
      this.layers.midground.position.x += (cameraX * 0.35 - this.layers.midground.position.x) * 0.05;
      this.layers.midground.position.y += (cameraY * 0.35 - this.layers.midground.position.y) * 0.05;
    }
  }
}
