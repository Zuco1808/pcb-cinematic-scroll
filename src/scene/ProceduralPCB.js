// scene/ProceduralPCB.js — STM103 inspirisana geometrija
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
    this._buildGoldTraces();
    this._buildSTM32Chip();
    this._buildMemoryChips();
    this._buildPowerSection();
    this._buildConnectors();
    this._buildCrystal();
    this._buildPassives();
    this._buildVias();
    this._buildSilkscreen();
    this.scene.add(this.group);
    return this.group;
  }

  // ── SUBSTRATE — tamno plava (STM103 karakteristična boja) ──
  _buildSubstrate() {
    // Osnovna pločica
    const geo = new THREE.BoxGeometry(7.2, 0.12, 4.8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0d1b2a,      // Tamna navy — STM103 stil
      roughness: 0.35,
      metalness: 0.08,
      envMapIntensity: 0.6,
    });
    const board = new THREE.Mesh(geo, mat);
    board.castShadow = true;
    board.receiveShadow = true;
    board.name = 'PCB_Substrate';
    this.group.add(board);

    // Bottom layer — tamni bakar
    const botGeo = new THREE.BoxGeometry(7.2, 0.008, 4.8);
    const botMat = new THREE.MeshStandardMaterial({
      color: 0x8B6914,
      roughness: 0.25,
      metalness: 0.9,
    });
    const bot = new THREE.Mesh(botGeo, botMat);
    bot.position.y = -0.064;
    this.group.add(bot);

    // Ivica pločice — lagano svjetlija
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1a3a5c, linewidth: 1 });
    const edge = new THREE.LineSegments(edgeGeo, edgeMat);
    this.group.add(edge);
  }

  // ── ZLATNE TRACE — karakteristične za premium PCB ──
  _buildGoldTraces() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.12,
      metalness: 1.0,
    });

    // Glavni power rails
    const powerTraces = [
      { w: 6.5, d: 0.05, x: 0, z:  2.2 }, // VCC rail
      { w: 6.5, d: 0.05, x: 0, z: -2.2 }, // GND rail
      { w: 0.04, d: 4.0, x: 3.1, z: 0  }, // Right power
      { w: 0.04, d: 4.0, x:-3.1, z: 0  }, // Left power
    ];

    // Data traces — tanje
    const dataTraces = [
      { w: 3.0, d: 0.02, x: -1.2, z: 0.8  },
      { w: 3.0, d: 0.02, x: -1.2, z: 0.5  },
      { w: 3.0, d: 0.02, x: -1.2, z: 0.2  },
      { w: 3.0, d: 0.02, x: -1.2, z:-0.2  },
      { w: 2.0, d: 0.02, x:  1.5, z: 1.2  },
      { w: 2.0, d: 0.02, x:  1.5, z: 0.9  },
      { w: 2.0, d: 0.02, x:  1.5, z: 0.6  },
      { w: 0.02,d: 1.8,  x: -0.2, z: 0.0  },
      { w: 0.02,d: 1.8,  x:  0.2, z: 0.0  },
      { w: 0.02,d: 1.2,  x:  2.5, z: 0.0  },
      { w: 1.5, d: 0.02, x:  2.2, z:-0.8  },
      { w: 1.5, d: 0.02, x:  2.2, z:-1.1  },
    ];

    [...powerTraces, ...dataTraces].forEach(({ w, d, x, z }) => {
      const geo = new THREE.BoxGeometry(w, 0.01, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.065, z);
      this.group.add(mesh);
    });
  }

  // ── STM32 GLAVNI ČIPOVI — centralni fokus ──
  _buildSTM32Chip() {
    // Glavni MCU — LQFP100 paket
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.18, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.05,
    });
    const mcu = new THREE.Mesh(bodyGeo, bodyMat);
    mcu.position.set(-0.5, 0.15, 0);
    mcu.castShadow = true;
    mcu.name = 'SMD_IC_STM32';
    this.group.add(mcu);
    this.components.push(mcu);

    // STM32 logo marking
    const markGeo = new THREE.BoxGeometry(1.0, 0.002, 0.12);
    const markMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
    });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.position.set(-0.5, 0.242, -0.35);
    this.group.add(mark);

    // Pin-ovi na sve 4 strane (LQFP100 = 25 pina po strani)
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0, roughness: 0.08, metalness: 0.98
    });
    const sides = [
      { axis: 'x', sign:  1, rotate: false },
      { axis: 'x', sign: -1, rotate: false },
      { axis: 'z', sign:  1, rotate: true  },
      { axis: 'z', sign: -1, rotate: true  },
    ];

    sides.forEach(({ axis, sign, rotate }) => {
      for (let i = 0; i < 25; i++) {
        const pinGeo = new THREE.BoxGeometry(
          rotate ? 0.09 : 0.015,
          0.015,
          rotate ? 0.015 : 0.09
        );
        const pin = new THREE.Mesh(pinGeo, pinMat);
        const offset = -0.6 + i * 0.05;
        pin.position.set(
          axis === 'x' ? -0.5 + sign * 0.75 : -0.5 + offset,
          0.148,
          axis === 'z' ? sign * 0.75 : offset
        );
        this.group.add(pin);
      }
    });

    // Drugi STM modul — desno
    const mcu2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.14, 0.9),
      bodyMat.clone()
    );
    mcu2.position.set(1.8, 0.13, 0.6);
    mcu2.castShadow = true;
    mcu2.name = 'SMD_IC_STM_AUX';
    this.group.add(mcu2);
    this.components.push(mcu2);
  }

  // ── MEMORIJA — SOIC paketi ──
  _buildMemoryChips() {
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.75, metalness: 0.05
    });
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xBBBBBB, roughness: 0.1, metalness: 0.95
    });

    const chips = [
      { x: -2.2, z: -1.2, w: 0.8, d: 0.5, pins: 8, name: 'FLASH' },
      { x: -2.2, z: -1.9, w: 0.8, d: 0.5, pins: 8, name: 'EEPROM' },
      { x:  2.5, z: -1.5, w: 0.7, d: 0.45, pins: 8, name: 'RAM' },
    ];

    chips.forEach(({ x, z, w, d, pins, name }) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), chipMat);
      chip.position.set(x, 0.12, z);
      chip.castShadow = true;
      chip.name = `SMD_IC_${name}`;
      this.group.add(chip);
      this.components.push(chip);

      // Pinovi lijevo/desno
      for (let i = 0; i < pins / 2; i++) {
        const pz = z - d/2 + (d / (pins/2)) * (i + 0.5);
        [-1, 1].forEach(side => {
          const pin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.025), pinMat);
          pin.position.set(x + side * (w/2 + 0.04), 0.07, pz);
          this.group.add(pin);
        });
      }
    });
  }

  // ── POWER SECTION — regulatori napona ──
  _buildPowerSection() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.7, metalness: 0.05
    });

    // Linearni regulator (SOT-223)
    const reg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.45), mat);
    reg.position.set(-2.8, 0.17, 1.5);
    reg.castShadow = true;
    reg.name = 'SMD_IC_LDO';
    this.group.add(reg);
    this.components.push(reg);

    // Heatsink površina regulatora (srebrna)
    const hsMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.01, 0.3), hsMat);
    hs.position.set(-2.8, 0.271, 1.58);
    this.group.add(hs);

    // Buck converter (SOP-8)
    const buck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.55), mat.clone());
    buck.position.set(-2.8, 0.135, 0.8);
    buck.castShadow = true;
    buck.name = 'SMD_IC_BUCK';
    this.group.add(buck);
    this.components.push(buck);

    // Induktivitet (cilindrični, žuto-zeleni)
    const indGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 12);
    const indMat = new THREE.MeshStandardMaterial({
      color: 0x4a5a2a, roughness: 0.6, metalness: 0.1
    });
    const ind = new THREE.Mesh(indGeo, indMat);
    ind.position.set(-2.2, 0.16, 1.1);
    ind.castShadow = true;
    this.group.add(ind);
    this.components.push(ind);
  }

  // ── KONEKTORI — USB, SWD, napajanje ──
  _buildConnectors() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x777777, roughness: 0.25, metalness: 0.85
    });

    // Micro-USB konektor
    const usbGeo = new THREE.BoxGeometry(0.7, 0.3, 0.5);
    const usb = new THREE.Mesh(usbGeo, metalMat);
    usb.position.set(3.5, 0.21, 0);
    usb.castShadow = true;
    usb.name = 'Connector_USB';
    this.group.add(usb);

    // USB port unutrašnjost
    const portMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.12), portMat);
    port.position.set(3.62, 0.21, 0);
    this.group.add(port);

    // SWD debug header (2x5 pin)
    this._buildPinHeader(2.8, 0.14, -1.8, 5, 2);

    // Power header (1x3)
    this._buildPinHeader(-3.2, 0.14, 1.9, 3, 1);

    // GPIO header (2x10)
    this._buildPinHeader(-3.0, 0.14, -0.2, 10, 2);
  }

  _buildPinHeader(x, y, z, rows, cols) {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.9 });
    const pinMat  = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });

    const w = cols * 0.22 + 0.1;
    const d = rows * 0.22 + 0.1;
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), baseMat);
    base.position.set(x, y, z);
    this.group.add(base);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), pinMat);
        pin.position.set(
          x - (cols-1)*0.11 + c*0.22,
          y + 0.2,
          z - (rows-1)*0.11 + r*0.22
        );
        this.group.add(pin);
      }
    }
  }

  // ── KVARCNI OSCILATOR ──
  _buildCrystal() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xC8A800, roughness: 0.2, metalness: 0.85
    });
    // Tijelo (metalni cilinder, zlatno)
    const crystalGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.38, 8);
    const crystal = new THREE.Mesh(crystalGeo, mat);
    crystal.position.set(0.8, 0.25, -1.6);
    crystal.rotation.z = Math.PI / 2;
    crystal.castShadow = true;
    crystal.name = 'Crystal_OSC';
    this.group.add(crystal);
    this.components.push(crystal);

    // Nožice
    const legMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.1, metalness: 0.95 });
    [-0.18, 0.18].forEach(dz => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), legMat);
      leg.position.set(0.8, 0.08, -1.6 + dz);
      this.group.add(leg);
    });
  }

  // ── PASIVNE KOMPONENTE — rezistori i kondenzatori ──
  _buildPassives() {
    // Elektroliti
    const capPositions = [
      [1.2, 0.13, -1.6], [1.5, 0.13, -1.6], [1.8, 0.13, -1.6],
      [-1.5, 0.11, 1.8], [-1.9, 0.11, 1.8],
    ];
    capPositions.forEach(([x, y, z], i) => {
      const h = 0.28 + i * 0.04;
      const r = 0.1 + (i % 2) * 0.02;
      const capMat = new THREE.MeshStandardMaterial({
        color: [0x2a5ab0, 0xb03030, 0x2a8a2a][i % 3],
        roughness: 0.5, metalness: 0.1
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), capMat);
      cap.position.set(x, y + h/2, z);
      cap.castShadow = true;
      cap.name = 'SMD_Capacitor';
      this.group.add(cap);
      this.components.push(cap);

      // Bijeli prsten na vrhu
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r+0.002, r+0.002, 0.04, 16, 1, true), ringMat);
      ring.position.set(x, y + h - 0.02, z);
      this.group.add(ring);
    });

    // SMD rezistori (0402 i 0603)
    const resMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    const capSMDMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    const endMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.08, metalness: 0.95 });

    // Niz rezistora
    for (let i = 0; i < 8; i++) {
      const x = -3.2 + i * 0.42;
      const res = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), resMat);
      res.position.set(x, 0.09, 2.0);
      res.name = 'SMD_Resistor';
      this.group.add(res);
      this.components.push(res);
      [-0.08, 0.08].forEach(dx => {
        const e = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.062, 0.102), endMat);
        e.position.set(x+dx, 0.09, 2.0);
        this.group.add(e);
      });
    }

    // Niz SMD kap
    for (let i = 0; i < 6; i++) {
      const x = -1.0 + i * 0.38;
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.12), capSMDMat);
      c.position.set(x, 0.105, -2.1);
      c.name = 'SMD_Capacitor';
      this.group.add(c);
      this.components.push(c);
    }

    // Ferit bead
    const fbMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const fb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.14), fbMat);
      fb.position.set(2.0 + i*0.32, 0.095, 1.8);
      this.group.add(fb);
    }
  }

  // ── VIAS ──
  _buildVias() {
    const viaMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, roughness: 0.08, metalness: 1.0
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, roughness: 0.08, metalness: 1.0, side: THREE.DoubleSide
    });

    const vias = [
      [0,0], [1,1], [-1,1], [1,-1], [-1,-1],
      [2.5, 0.5], [-2.5, 0.5], [0.5, 2.0], [-0.5, -2.0],
      [3.0, -1.0], [-3.0, -1.0], [2.0, -2.0],
    ];

    vias.forEach(([x, z]) => {
      const via = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), viaMat);
      via.position.set(x, 0, z);
      this.group.add(via);

      const ring = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.085, 8), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.065, z);
      this.group.add(ring);
    });

    // Mounting holes sa prstenovima
    [[-3.4, 2.2], [3.4, 2.2], [-3.4, -2.2], [3.4, -2.2]].forEach(([x, z]) => {
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x050a10, roughness: 1.0 });
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), holeMat);
      hole.position.set(x, 0, z);
      this.group.add(hole);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.26, 12), ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.065, z);
      this.group.add(ring);
    });
  }

  // ── SILKSCREEN — bijeli natpisi i markeri ──
  _buildSilkscreen() {
    const silkMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.04,
    });

    // Oznake konektora — horizontalne linije
    const silkLines = [
      { w: 0.8, d: 0.01, x: 2.8, z: 0.35 },
      { w: 0.8, d: 0.01, x: 2.8, z:-0.35 },
      { w: 0.01, d: 0.5, x: 2.4, z: 0 },
      { w: 1.5, d: 0.01, x:-2.5, z: 0.55 },
      { w: 1.5, d: 0.01, x:-2.5, z:-0.55 },
    ];

    silkLines.forEach(({ w, d, x, z }) => {
      const geo = new THREE.BoxGeometry(w, 0.001, d);
      const mesh = new THREE.Mesh(geo, silkMat);
      mesh.position.set(x, 0.067, z);
      this.group.add(mesh);
    });

    // Polaritetni marker za kondenzator ("+")
    const plus = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.001, 0.01), silkMat);
    plus.position.set(1.12, 0.067, -1.6);
    this.group.add(plus);
  }

  highlightComponent(keyword, color = 0x00aaff) {
    const c = new THREE.Color(color);
    this.components.forEach(comp => {
      if (!comp.name.toLowerCase().includes(keyword.toLowerCase())) return;
      if (!comp.material) return;
      gsap.to(comp.material.emissive, { r: c.r, g: c.g, b: c.b, duration: 0.7, ease: 'power2.out' });
      gsap.to(comp.material, { emissiveIntensity: 0.35, duration: 0.7 });
    });
  }

  resetHighlights() {
    this.components.forEach(comp => {
      if (!comp.material) return;
      gsap.to(comp.material.emissive, { r: 0, g: 0, b: 0, duration: 0.4 });
      gsap.to(comp.material, { emissiveIntensity: 0, duration: 0.4 });
    });
  }

  playAssemblyAnimation() {
    this.components.forEach((comp, i) => {
      const oy = comp.position.y;
      comp.position.y = oy + 3 + Math.random() * 2;
      if (comp.material) {
        comp.material.transparent = true;
        comp.material.opacity = 0;
      }
      gsap.to(comp.position, { y: oy, duration: 0.9 + Math.random() * 0.5, delay: i * 0.04, ease: 'elastic.out(1, 0.65)' });
      if (comp.material) gsap.to(comp.material, { opacity: 1, duration: 0.45, delay: i * 0.04 });
    });
  }
}
