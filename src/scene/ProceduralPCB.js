// ProceduralPCB.js — sve komponente unutar 3.5 x 2.8 pločice
import * as THREE from 'three';
import gsap from 'gsap';

export class ProceduralPCB {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.components = [];
  }

  build() {
    this._buildStack();

    // Centriraj grupu
    const box = new THREE.Box3().setFromObject(this.group);
    const centre = box.getCenter(new THREE.Vector3());
    this.group.children.forEach(child => {
      child.position.x -= centre.x;
      child.position.y -= centre.y;
      child.position.z -= centre.z;
    });

    this.group.rotation.x = 0.3;
    this.group.rotation.y = -0.5;
    this.scene.add(this.group);
    return this.group;
  }

  _buildStack() {
    const layerCount = 7;
    const layerGap   = 0.28;
    for (let i = 0; i < layerCount; i++) {
      const y     = i * layerGap - (layerCount * layerGap) / 2;
      const isTop = i === layerCount - 1;
      this._buildLayer(y, isTop, i);
    }
    this._buildStandoffs(layerCount, layerGap);
  }

  // Pločica: 3.5 (X) x 2.8 (Z) — granice X: ±1.75, Z: ±1.4
  _buildLayer(y, isTop, index) {
    const W = 3.5, D = 2.8;
    const geo = new THREE.BoxGeometry(W, 0.10, D);
    const mat = new THREE.MeshStandardMaterial({
      color: isTop ? 0x2d8a2d : 0x1e6b1e,
      roughness: 0.35, metalness: 0.05,
    });
    const board = new THREE.Mesh(geo, mat);
    board.position.y = y;
    board.castShadow = true;
    board.receiveShadow = true;
    board.name = isTop ? 'PCB_Substrate' : `PCB_Layer_${index}`;
    this.group.add(board);

    // Zlatne ivice
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.2, metalness: 0.9 });
    [-(W/2+0.02), (W/2+0.02)].forEach(x => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, D), edgeMat);
      m.position.set(x, y, 0); this.group.add(m);
    });
    [-(D/2+0.02), (D/2+0.02)].forEach(z => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.10, 0.04), edgeMat);
      m.position.set(0, y, z); this.group.add(m);
    });

    if (isTop) this._buildTopComponents(y);
    else       this._buildSimpleLayer(y, index);
  }

  // Sve pozicije unutar X: ±1.55, Z: ±1.20 (margina 0.2 od ruba)
  _buildTopComponents(y) {
    const b = y + 0.07; // base Y

    // ── GLAVNI ČIPS — centar pločice ─────────────────
    this._addIC( 0.0, b,  0.0,  0.9, 0.15, 0.9, 24, 'CPU');

    // ── MANJI IC ČIPOVI — ugaona 4 ───────────────────
    this._addIC(-1.0, b, -0.7,  0.5, 0.11, 0.5, 12, 'IC1');
    this._addIC( 1.0, b, -0.7,  0.45,0.10, 0.45,12, 'IC2');
    this._addIC(-1.0, b,  0.7,  0.5, 0.11, 0.5, 12, 'IC3');
    this._addIC( 1.0, b,  0.7,  0.45,0.10, 0.45,12, 'IC4');

    // ── KONDENZATORI — gornji red, unutar Z: -1.1 ────
    const caps = [
      [-0.6, b, -1.0, 0.13, 0.4],
      [-0.3, b, -1.0, 0.11, 0.35],
      [ 0.0, b, -1.0, 0.13, 0.42],
      [ 0.3, b, -1.0, 0.10, 0.32],
      [ 0.6, b, -1.0, 0.13, 0.4],
    ];
    caps.forEach(([x,yy,z,r,h]) => this._addCap(x, yy, z, r, h));

    // ── JEDAN HEADER KONEKTOR — centriran ─────────────
    // 6 kolona x 2 reda, svaki pin na 0.22 razmak
    // Širina: 6*0.22 = 1.32, centar -0.66 do +0.66 OK
    this._addHeader(0.0, b, 1.0, 6, 2);

    // ── SMD REZISTORI — donji red ─────────────────────
    // X od -1.3 do +1.3 u koracima 0.38
    for (let i = 0; i < 7; i++) {
      this._addRes(-1.14 + i * 0.38, b, -1.2, 0.16, 0.055, 0.09);
    }

    // ── SMD REZISTORI — desna strana ─────────────────
    for (let i = 0; i < 4; i++) {
      this._addRes(1.35, b, -0.5 + i * 0.32, 0.09, 0.055, 0.16);
    }

    // ── ZLATNE TRACE ──────────────────────────────────
    this._buildTraces(y + 0.055);

    // ── MONTAŽNE RUPE ─────────────────────────────────
    this._buildHoles(y);
  }

  _buildSimpleLayer(y, idx) {
    const b = y + 0.07;
    const s = idx * 3;
    // Samo trace linija i par rezistora — sve unutar granica
    const traceMat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.2, metalness: 0.9 });
    const tg = new THREE.BoxGeometry(2.4, 0.008, 0.02);
    const tm = new THREE.Mesh(tg, traceMat);
    tm.position.set(0, y + 0.055, ((s % 5) - 2) * 0.22);
    this.group.add(tm);
    // 2 mala rezistora unutar granica
    if (idx % 2 === 0) this._addRes(-0.6, b, 0.3, 0.14, 0.05, 0.08);
    if (idx % 3 === 0) this._addRes( 0.5, b, -0.4, 0.14, 0.05, 0.08);
  }

  // ── IC ČIPS ────────────────────────────────────────
  _addIC(x, y, z, w, h, d, pins, name) {
    // Provjera granica
    if (Math.abs(x) + w/2 > 1.65 || Math.abs(z) + d/2 > 1.3) {
      console.warn(`IC ${name} van granica! x:${x} z:${z}`);
      return;
    }
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.05 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    body.position.set(x, y + h/2, z);
    body.castShadow = true;
    body.name = `SMD_IC_${name}`;
    this.group.add(body);
    this.components.push(body);

    // Marker
    const mk = new THREE.Mesh(new THREE.BoxGeometry(w*0.7, h+0.001, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }));
    mk.position.set(x, y+h/2, z - d/2 + 0.06);
    this.group.add(mk);

    // Pinovi
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.08, metalness: 0.95 });
    const pps = Math.floor(pins/4);
    const sx  = w / (pps + 1);
    const sz  = d / (pps + 1);
    for (let i = 0; i < pps; i++) {
      const px = x - w/2 + sx*(i+1);
      const pz = z - d/2 + sz*(i+1);
      [-1,1].forEach(s => {
        const pm1 = new THREE.Mesh(new THREE.BoxGeometry(sx*.55, 0.012, 0.1), pinMat);
        pm1.position.set(px, y+0.01, z + s*(d/2+0.05));
        this.group.add(pm1);
        const pm2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, sz*.55), pinMat);
        pm2.position.set(x + s*(w/2+0.05), y+0.01, pz);
        this.group.add(pm2);
      });
    }
  }

  // ── KONDENZATOR ────────────────────────────────────
  _addCap(x, y, z, r, h) {
    if (Math.abs(x) + r > 1.65 || Math.abs(z) + h > 1.35) return;
    const colors = [0x1a1a1a, 0x222233, 0x1a1a2a];
    const col = colors[Math.floor(Math.abs(x*10))%3];
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.1 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat);
    cap.position.set(x, y + h/2, z);
    cap.castShadow = true;
    cap.name = 'SMD_Capacitor';
    this.group.add(cap);
    this.components.push(cap);
    // Bijela traka
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(r+.002, r+.002, .04, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 }));
    bm.position.set(x, y+h-.02, z);
    this.group.add(bm);
    // Top
    const tm = new THREE.Mesh(new THREE.CircleGeometry(r*.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.6 }));
    tm.rotation.x = -Math.PI/2;
    tm.position.set(x, y+h, z);
    this.group.add(tm);
  }

  // ── REZISTOR ───────────────────────────────────────
  _addRes(x, y, z, w, h, d) {
    if (Math.abs(x) + w/2 > 1.65 || Math.abs(z) + d/2 > 1.35) return;
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
    const res = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    res.position.set(x, y + h/2, z);
    res.name = 'SMD_Resistor';
    this.group.add(res);
    this.components.push(res);
    const cm = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.1, metalness: 0.95 });
    [-1,1].forEach(s => {
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, h+.002, d+.002), cm);
      c2.position.set(x + s*(w/2-.015), y+h/2, z);
      this.group.add(c2);
    });
  }

  // ── HEADER KONEKTOR ────────────────────────────────
  _addHeader(x, y, z, cols, rows) {
    const w = cols * 0.22 + 0.08;
    const d = rows * 0.22 + 0.08;
    // Provjera: sve unutar pločice
    if (Math.abs(x) + w/2 > 1.60 || Math.abs(z) + d/2 > 1.30) {
      console.warn(`Header van granica! x:${x} z:${z} w:${w} d:${d}`);
      return;
    }
    const hm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const house = new THREE.Mesh(new THREE.BoxGeometry(w, 0.11, d), hm);
    house.position.set(x, y + 0.055, z);
    this.group.add(house);
    const pm = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.40, 6), pm);
        pin.position.set(
          x - (cols-1)*0.11 + col*0.22,
          y + 0.20,
          z - (rows-1)*0.11 + row*0.22
        );
        this.group.add(pin);
      }
    }
  }

  // ── TRACE LINIJE ───────────────────────────────────
  _buildTraces(y) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.18, metalness: 0.88 });
    [
      { w:2.5, d:.018, x: 0,    z:  0.35 },
      { w:2.5, d:.018, x: 0,    z:  0.15 },
      { w:1.5, d:.018, x: 0.5,  z: -0.4  },
      { w:.018,d:1.8,  x: 0.6,  z:  0.2  },
      { w:.018,d:1.8,  x:-0.6,  z:  0.2  },
      { w:1.2, d:.015, x:-0.8,  z: -0.6  },
    ].forEach(({w,d,x,z}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, d), mat);
      m.position.set(x, y, z);
      this.group.add(m);
    });
    // Vias
    const vm = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });
    [[0.3,0.5],[-0.3,0.5],[0.8,-0.3],[-0.8,-0.3],[0,0]].forEach(([x,z]) => {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.12,8), vm);
      v.position.set(x, y-.01, z);
      this.group.add(v);
    });
  }

  // ── MONTAŽNE RUPE ──────────────────────────────────
  _buildHoles(y) {
    const hm = new THREE.MeshStandardMaterial({ color: 0x0a1a0a, roughness: 1.0 });
    const rm = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0, side: THREE.DoubleSide });
    // Ugaone rupe — dovoljno unutar ruba (±1.4, ±1.1)
    [[-1.4,-1.1],[1.4,-1.1],[-1.4,1.1],[1.4,1.1]].forEach(([x,z]) => {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.14,12), hm);
      h.position.set(x, y, z);
      this.group.add(h);
      const r = new THREE.Mesh(new THREE.RingGeometry(.12,.20,12), rm);
      r.rotation.x = -Math.PI/2;
      r.position.set(x, y+.056, z);
      this.group.add(r);
    });
  }

  // ── STANDOFF STUPOVI ───────────────────────────────
  _buildStandoffs(count, gap) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.15, metalness: 0.95 });
    const totalH = count * gap;
    [[-1.4,-1.1],[1.4,-1.1],[-1.4,1.1],[1.4,1.1]].forEach(([x,z]) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,totalH,8), mat);
      st.position.set(x, 0, z);
      this.group.add(st);
    });
  }

  // ── HIGHLIGHT / RESET ──────────────────────────────
  highlightComponent(keyword, color = 0x5FABDB) {
    const col = new THREE.Color(color);
    this.components.forEach(c => {
      if (!c.name.toLowerCase().includes(keyword.toLowerCase()) || !c.material) return;
      gsap.to(c.material.emissive, { r:col.r, g:col.g, b:col.b, duration:.6, ease:'power2.out' });
      gsap.to(c.material, { emissiveIntensity:.3, duration:.6 });
    });
  }

  resetHighlights() {
    this.components.forEach(c => {
      if (!c.material) return;
      gsap.to(c.material.emissive, { r:0, g:0, b:0, duration:.4 });
      gsap.to(c.material, { emissiveIntensity:0, duration:.4 });
    });
  }

  playAssemblyAnimation() {
    this.group.children.forEach((obj, i) => {
      const oy = obj.position.y;
      obj.position.y = oy + 4 + Math.random();
      gsap.to(obj.position, { y:oy, duration:1.0+Math.random()*.4, delay:i*.006, ease:'elastic.out(1,.7)' });
    });
  }
}
