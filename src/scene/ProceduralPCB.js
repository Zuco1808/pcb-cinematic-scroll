// scene/ProceduralPCB.js
import * as THREE from 'three';
import gsap from 'gsap';

export class ProceduralPCB {
  constructor(scene) {
    this.scene      = scene;
    this.group      = new THREE.Group();
    this.components = [];
  }

  build() {
    this._buildSubstrate();
    this._buildCopper();
    this._buildTraces();
    this._buildVias();
    this._buildSMDComponents();
    this._buildCapacitors();
    this._buildConnectors();
    this._buildMountingHoles();
    this.scene.add(this.group);
    return this.group;
  }

  _buildSubstrate() {
    const geo = new THREE.BoxGeometry(8, 0.14, 5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a6b1a,
      roughness: 0.45,
      metalness: 0.05,
    });
    const board = new THREE.Mesh(geo, mat);
    board.castShadow = true;
    board.receiveShadow = true;
    board.name = 'PCB_Substrate';
    this.group.add(board);

    // Bottom copper layer (görünür arka yüz)
    const botGeo = new THREE.BoxGeometry(8, 0.01, 5);
    const botMat = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.3,
      metalness: 0.85,
    });
    const bot = new THREE.Mesh(botGeo, botMat);
    bot.position.y = -0.075;
    this.group.add(bot);
  }

  _buildCopper() {
    // Copper pads površina
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.15,
      metalness: 1.0,
    });

    const padPositions = [
      [-2.5, 1.2], [-1.5, 1.2], [-0.5, 1.2], [0.5, 1.2],
      [-2.5, -1.2], [-1.5, -1.2], [2.5, -1.2], [3.0, -1.2],
      [2.0, 0.6], [2.5, 0.6], [3.0, 0.6],
    ];

    padPositions.forEach(([x, z]) => {
      const geo = new THREE.BoxGeometry(0.3, 0.01, 0.2);
      const pad = new THREE.Mesh(geo, padMat);
      pad.position.set(x, 0.075, z);
      this.group.add(pad);
    });
  }

  _buildTraces() {
    const traceMat = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.2,
      metalness: 0.9,
    });

    const traces = [
      // Horizontalne
      { w: 5.0, d: 0.025, x: -1.0, z:  0.6 },
      { w: 3.5, d: 0.025, x: -2.0, z: -0.6 },
      { w: 2.0, d: 0.018, x:  2.0, z:  1.5 },
      { w: 4.0, d: 0.018, x:  0.0, z: -1.8 },
      { w: 1.5, d: 0.015, x:  2.5, z:  0.0 },
      // Vertikalne
      { w: 0.025, d: 3.0, x:  0.5,  z:  0.0 },
      { w: 0.025, d: 2.0, x: -1.0,  z:  0.5 },
      { w: 0.025, d: 1.5, x:  2.0,  z: -0.5 },
      { w: 0.018, d: 2.5, x: -2.5,  z:  0.0 },
      { w: 0.018, d: 1.0, x:  3.2,  z:  0.5 },
    ];

    traces.forEach(({ w, d, x, z }) => {
      const geo  = new THREE.BoxGeometry(w, 0.012, d);
      const mesh = new THREE.Mesh(geo, traceMat);
      mesh.position.set(x, 0.078, z);
      this.group.add(mesh);
    });
  }

  _buildVias() {
    const viaMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.1,
      metalness: 1.0,
    });

    const viaPositions = [
      [0.5, 1.2], [-0.5, 1.2], [1.2, -0.8],
      [-1.2, -0.8], [2.5, 0.3], [-2.5, 0.3],
      [0.0, 0.0], [1.8, -1.5], [-1.8, 1.5],
    ];

    viaPositions.forEach(([x, z]) => {
      const geo  = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8);
      const via  = new THREE.Mesh(geo, viaMat);
      via.position.set(x, 0, z);
      this.group.add(via);

      // Via ring na površini
      const ringGeo = new THREE.RingGeometry(0.045, 0.09, 8);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, roughness: 0.1, metalness: 1.0, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.072, z);
      this.group.add(ring);
    });
  }

  _buildSMDComponents() {
    // Glavni IC čip
    this._addICChip(-1, 0.175, 0, 1.4, 0.16, 1.0, 'CPU');
    // Memorija
    this._addICChip( 2, 0.175, 0.5, 0.7, 0.12, 0.7, 'RAM');
    this._addICChip( 2, 0.175, -0.5, 0.7, 0.12, 0.7, 'RAM2');
    // Mali kontroleri
    this._addICChip(-2.5, 0.155, -0.8, 0.5, 0.1, 0.5, 'IC1');
    this._addICChip(-2.5, 0.155,  0.8, 0.5, 0.1, 0.5, 'IC2');
    this._addICChip( 3.2, 0.155, -1.2, 0.35, 0.08, 0.5, 'IC3');

    // SMD rezistori — niz
    for (let i = 0; i < 10; i++) {
      this._addResistor(-3.2 + i * 0.5, 0.155, -1.9, 0.22, 0.065, 0.13);
    }
    // Drugi niz rezistora
    for (let i = 0; i < 6; i++) {
      this._addResistor(-1.5 + i * 0.45, 0.155, 2.1, 0.22, 0.065, 0.13);
    }

    // SMD kondenzatori (mali)
    const smCapPositions = [
      [1.5, 0.155, 1.8], [1.9, 0.155, 1.8], [2.3, 0.155, 1.8],
      [-0.5, 0.155, -2.1], [0.0, 0.155, -2.1], [0.5, 0.155, -2.1],
    ];
    smCapPositions.forEach(([x, y, z]) => {
      this._addResistor(x, y, z, 0.2, 0.1, 0.2); // SMD cap oblik
    });
  }

  _addICChip(x, y, z, w, h, d, name = '') {
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.75,
      metalness: 0.08,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.name = `SMD_IC_${name}`;
    this.group.add(body);
    this.components.push(body);

    // IC marking (bijela linija)
    const markGeo = new THREE.BoxGeometry(w * 0.85, h + 0.002, 0.02);
    const markMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1.0, metalness: 0.0,
      emissive: 0xffffff, emissiveIntensity: 0.05
    });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.position.set(x, y + h / 2, z - d / 2 + 0.02);
    this.group.add(mark);

    // Pin-ovi
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, roughness: 0.1, metalness: 0.95
    });
    const pinCount = Math.max(4, Math.floor(w * 5));
    const spacing  = w / pinCount;

    for (let i = 0; i < pinCount; i++) {
      const px = x - w / 2 + spacing / 2 + i * spacing;
      [-1, 1].forEach(side => {
        const pinGeo = new THREE.BoxGeometry(spacing * 0.6, 0.02, 0.1);
        const pin    = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(px, y - h / 2 + 0.01, z + side * (d / 2 + 0.05));
        this.group.add(pin);
      });
    }
  }

  _addResistor(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, roughness: 0.9, metalness: 0.0
    });
    const res = new THREE.Mesh(geo, mat);
    res.position.set(x, y, z);
    res.name = 'SMD_Resistor';
    this.group.add(res);
    this.components.push(res);

    // Metalne krajeve
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, roughness: 0.1, metalness: 0.95
    });
    [-1, 1].forEach(side => {
      const capGeo = new THREE.BoxGeometry(0.04, h + 0.002, d + 0.002);
      const cap    = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x + side * (w / 2 - 0.02), y, z);
      this.group.add(cap);
    });
  }

  _buildCapacitors() {
    const positions = [
      [1.5, 0.155, 0.5, 0.13, 0.4],
      [1.85, 0.155, 0.5, 0.13, 0.5],
      [2.2, 0.155, 0.5, 0.13, 0.38],
      [1.5, 0.155, -0.5, 0.13, 0.42],
      [1.85, 0.155, -0.5, 0.1,  0.3],
      [-3.0, 0.155, 0.5, 0.15, 0.55],
      [-3.0, 0.155, -0.5, 0.12, 0.4],
    ];

    positions.forEach(([x, y, z, r, h]) => {
      const geo = new THREE.CylinderGeometry(r, r, h, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a3a8a, roughness: 0.5, metalness: 0.1
      });
      const cap = new THREE.Mesh(geo, mat);
      cap.position.set(x, y + h / 2, z);
      cap.castShadow = true;
      cap.name = 'SMD_Capacitor';
      this.group.add(cap);
      this.components.push(cap);

      // Bijela traka (negativni pol)
      const bandGeo = new THREE.CylinderGeometry(r + 0.002, r + 0.002, 0.04, 16, 1, true);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xdddddd, roughness: 0.9, side: THREE.FrontSide
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(x, y + h - 0.02, z);
      this.group.add(band);

      // Top
      const topGeo = new THREE.CircleGeometry(r, 16);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x2a4aaa, roughness: 0.3, metalness: 0.2
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.rotation.x = -Math.PI / 2;
      top.position.set(x, y + h, z);
      this.group.add(top);
    });
  }

  _buildConnectors() {
    // USB konektori
    this._addConnector(3.8, 0.155, 0, 0.6, 0.32, 0.9, 0x888888, 'USB_A');
    this._addConnector(3.8, 0.155, -1.2, 0.45, 0.28, 0.7, 0x777777, 'USB_C');
    // Power
    this._addConnector(-3.8, 0.155, 0, 0.5, 0.35, 0.8, 0x333333, 'PWR');
    // Audio jack
    this._addConnector(-3.8, 0.155, 1.5, 0.35, 0.35, 0.35, 0x555555, 'AUDIO');
  }

  _addConnector(x, y, z, w, h, d, color, name = '') {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: 0.35, metalness: 0.75
    });
    const conn = new THREE.Mesh(geo, mat);
    conn.position.set(x, y + h / 2, z);
    conn.castShadow = true;
    conn.name = `Connector_${name}`;
    this.group.add(conn);

    // Unutrašnjost konektora
    const innerGeo = new THREE.BoxGeometry(w * 0.7, h * 0.6, 0.1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x222222, roughness: 0.9
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(x + w / 2 - 0.05, y + h / 2, z);
    this.group.add(inner);
  }

  _buildMountingHoles() {
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a, roughness: 1.0, metalness: 0.0
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, roughness: 0.1, metalness: 1.0
    });

    const holePositions = [
      [-3.7, 2.2], [3.7, 2.2], [-3.7, -2.2], [3.7, -2.2]
    ];

    holePositions.forEach(([x, z]) => {
      const holeGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 12);
      const hole    = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(x, 0, z);
      this.group.add(hole);

      const ringGeo = new THREE.RingGeometry(0.14, 0.22, 12);
      const ring    = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.072, z);
      this.group.add(ring);
    });
  }

  highlightComponent(keyword, color = 0x00ff41) {
    const c = new THREE.Color(color);
    this.components.forEach(comp => {
      if (comp.name.toLowerCase().includes(keyword.toLowerCase())) {
        gsap.to(comp.material.emissive, {
          r: c.r, g: c.g, b: c.b,
          duration: 0.6, ease: 'power2.out'
        });
        gsap.to(comp.material, {
          emissiveIntensity: 0.4,
          duration: 0.6
        });
      }
    });
  }

  resetHighlights() {
    this.components.forEach(comp => {
      if (!comp.material) return;
      gsap.to(comp.material.emissive, {
        r: 0, g: 0, b: 0,
        duration: 0.4
      });
      gsap.to(comp.material, {
        emissiveIntensity: 0,
        duration: 0.4
      });
    });
  }

  playAssemblyAnimation() {
    this.components.forEach((comp, i) => {
      const oy = comp.position.y;
      comp.position.y = oy + 4 + Math.random() * 2;
      if (comp.material) {
        comp.material.transparent = true;
        comp.material.opacity = 0;
      }

      gsap.to(comp.position, {
        y: oy,
        duration: 1.0 + Math.random() * 0.4,
        delay: i * 0.03,
        ease: 'elastic.out(1, 0.6)'
      });

      if (comp.material) {
        gsap.to(comp.material, {
          opacity: 1,
          duration: 0.5,
          delay: i * 0.03,
          ease: 'power2.in'
        });
      }
    });
  }
}
