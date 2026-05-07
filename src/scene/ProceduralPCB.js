// ProceduralPCB.js — Vjerna rekonstrukcija slike (zelena PCB, zlatni pinovi, crni čipovi)
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

    // Centriraj grupu PRIJE rotacije
    const box = new THREE.Box3().setFromObject(this.group);
    const centre = box.getCenter(new THREE.Vector3());
    // Pomakni sve objekte da je centar na (0,0,0)
    this.group.children.forEach(child => {
      child.position.x -= centre.x;
      child.position.y -= centre.y;
      child.position.z -= centre.z;
    });

    // Rotacija za izometrijski view
    this.group.rotation.x = 0.3;
    this.group.rotation.y = -0.5;

    this.scene.add(this.group);
    return this.group;
  }

  _buildStack() {
    const layerCount = 7;
    const layerGap   = 0.28;

    for (let i = 0; i < layerCount; i++) {
      const y = i * layerGap - (layerCount * layerGap) / 2;
      const isTop = (i === layerCount - 1);
      this._buildLayer(y, isTop, i);
    }

    // Zlatni standoff stupovi (ugaoni)
    this._buildStandoffs(layerCount, layerGap);
  }

  _buildLayer(y, isTop, index) {
    // FR4 supstrat — zeleni
    const geo = new THREE.BoxGeometry(5.0, 0.10, 4.0);
    const mat = new THREE.MeshStandardMaterial({
      color: isTop ? 0x2d8a2d : 0x1e6b1e,
      roughness: 0.35,
      metalness: 0.05,
    });
    const board = new THREE.Mesh(geo, mat);
    board.position.y = y;
    board.castShadow = true;
    board.receiveShadow = true;
    board.name = isTop ? 'PCB_Substrate' : `PCB_Layer_${index}`;
    this.group.add(board);

    // Zlatna bakrena površina (ivice pločice)
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xC8941A,
      roughness: 0.2,
      metalness: 0.9,
    });
    // Lijeva i desna ivica
    [-2.52, 2.52].forEach(x => {
      const eg = new THREE.BoxGeometry(0.04, 0.10, 4.0);
      const em = new THREE.Mesh(eg, edgeMat);
      em.position.set(x, y, 0);
      this.group.add(em);
    });
    // Prednja i zadnja ivica
    [-2.02, 2.02].forEach(z => {
      const eg = new THREE.BoxGeometry(5.0, 0.10, 0.04);
      const em = new THREE.Mesh(eg, edgeMat);
      em.position.set(0, y, z);
      this.group.add(em);
    });

    if (isTop) {
      this._buildTopComponents(y);
    } else {
      this._buildSimpleComponents(y, index);
    }
  }

  _buildTopComponents(y) {
    const base = y + 0.07;

    // ── GLAVNI ČIPS (crni LQFP) ──────────────────────
    this._addICChip(0.2, base, -0.3, 1.1, 0.15, 1.1, 28, 'CPU');

    // Mali IC čipovi
    this._addICChip(-1.5, base, -1.0, 0.65, 0.12, 0.65, 16, 'IC1');
    this._addICChip( 1.6, base, -1.0, 0.55, 0.10, 0.55, 14, 'IC2');
    this._addICChip( 1.6, base,  0.8, 0.55, 0.10, 0.55, 14, 'IC3');
    this._addICChip(-1.5, base,  1.0, 0.65, 0.12, 0.65, 16, 'IC4');

    // ── KONDENZATORI (crni elektrolitski) ─────────────
    const caps = [
      [-0.8, base, -1.3, 0.18, 0.5],
      [-0.5, base, -1.3, 0.15, 0.4],
      [-0.2, base, -1.3, 0.18, 0.55],
      [ 0.1, base, -1.3, 0.14, 0.38],
      [ 0.4, base, -1.3, 0.18, 0.5],
      [-1.8, base,  0.2, 0.16, 0.45],
      [-1.8, base,  0.5, 0.18, 0.5],
      [-1.8, base, -0.3, 0.14, 0.4],
    ];
    caps.forEach(([x, yy, z, r, h]) => this._addCapacitor(x, yy, z, r, h));

    // ── ZLATNI HEADER PINOVI — unutar pločice ────────
    this._buildGoldHeader(-1.4, base, 1.3, 8, 2);
    this._buildGoldHeader( 0.8, base, 1.3, 6, 2);

    // ── SMD REZISTORI ─────────────────────────────────
    for (let i = 0; i < 8; i++) {
      this._addResistor(-2.0 + i * 0.45, base, 0.3, 0.18, 0.06, 0.10);
    }
    for (let i = 0; i < 6; i++) {
      this._addResistor(-1.5 + i * 0.4, base, 1.1, 0.16, 0.055, 0.09);
    }

    // ── ZLATNE TRACE ──────────────────────────────────
    this._buildTraces(y + 0.055);

    // ── MONTAŽNE RUPE ─────────────────────────────────
    this._buildMountingHoles(y);
  }

  _buildSimpleComponents(y, idx) {
    const base = y + 0.07;
    // Svaki layer ima manje komponenti (vidljivi sa strane)
    const seed = idx * 7;
    // Nekoliko rezistora
    for (let i = 0; i < 4; i++) {
      const x = -1.5 + i * 0.8 + (seed % 3) * 0.1;
      this._addResistor(x, base, ((seed % 4) - 1.5) * 0.5, 0.16, 0.055, 0.09);
    }
    // Mali kondenzator
    if (idx % 2 === 0) {
      this._addCapacitor(-1.5 + (seed % 4) * 0.6, base, 0.5, 0.12, 0.3);
    }
    // Trace linija
    const traceMat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.2, metalness: 0.9 });
    const tg = new THREE.BoxGeometry(3.0, 0.008, 0.02);
    const tm = new THREE.Mesh(tg, traceMat);
    tm.position.set(0, y + 0.055, (seed % 3 - 1) * 0.4);
    this.group.add(tm);
  }

  _addICChip(x, y, z, w, h, d, pinCount, name) {
    // Crno tijelo čipa
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.7, metalness: 0.05,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    body.position.set(x, y + h/2, z);
    body.castShadow = true;
    body.name = `SMD_IC_${name}`;
    this.group.add(body);
    this.components.push(body);

    // Bijeli trokut marker (pin 1)
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.08, h + 0.001, 0.08), markerMat);
    marker.position.set(x - w/2 + 0.1, y + h/2, z - d/2 + 0.1);
    this.group.add(marker);

    // Srebrni pin-ovi na sve 4 strane
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.08, metalness: 0.95 });
    const pinsPerSide = Math.floor(pinCount / 4);
    const spacing = w / (pinsPerSide + 1);

    for (let i = 0; i < pinsPerSide; i++) {
      const px = x - w/2 + spacing * (i + 1);
      // Prednja i zadnja strana
      [-1, 1].forEach(side => {
        const pg = new THREE.BoxGeometry(spacing * 0.55, 0.012, 0.12);
        const pm = new THREE.Mesh(pg, pinMat);
        pm.position.set(px, y + 0.01, z + side * (d/2 + 0.06));
        this.group.add(pm);
      });
    }
    const spacingD = d / (pinsPerSide + 1);
    for (let i = 0; i < pinsPerSide; i++) {
      const pz = z - d/2 + spacingD * (i + 1);
      [-1, 1].forEach(side => {
        const pg = new THREE.BoxGeometry(0.12, 0.012, spacingD * 0.55);
        const pm = new THREE.Mesh(pg, pinMat);
        pm.position.set(x + side * (w/2 + 0.06), y + 0.01, pz);
        this.group.add(pm);
      });
    }
  }

  _addCapacitor(x, y, z, radius, height) {
    // Crni/tamni elektrolitski kondenzator
    const colors = [0x1a1a1a, 0x222233, 0x1a1a2a];
    const color = colors[Math.floor(Math.abs(x * z * 10)) % colors.length];
    const capMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), capMat);
    cap.position.set(x, y + height/2, z);
    cap.castShadow = true;
    cap.name = 'SMD_Capacitor';
    this.group.add(cap);
    this.components.push(cap);

    // Bijela traka (negativni pol)
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(radius+0.002, radius+0.002, 0.05, 16, 1, true), bandMat);
    band.position.set(x, y + height - 0.025, z);
    this.group.add(band);

    // Top disk (srebrni)
    const topMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.6 });
    const top = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.9, 16), topMat);
    top.rotation.x = -Math.PI/2;
    top.position.set(x, y + height, z);
    this.group.add(top);
  }

  _addResistor(x, y, z, w, h, d) {
    const resMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
    const res = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), resMat);
    res.position.set(x, y + h/2, z);
    res.name = 'SMD_Resistor';
    this.group.add(res);
    this.components.push(res);
    // Srebrne krajeve
    const capMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.1, metalness: 0.95 });
    [-1, 1].forEach(s => {
      const cg = new THREE.BoxGeometry(0.035, h + 0.002, d + 0.002);
      const cm = new THREE.Mesh(cg, capMat);
      cm.position.set(x + s*(w/2 - 0.017), y + h/2, z);
      this.group.add(cm);
    });
  }

  _buildGoldHeader(x, y, z, cols, rows) {
    // Crno plastično kućište
    const w = cols * 0.22 + 0.1, d = rows * 0.22 + 0.1;
    const houseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const house = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), houseMat);
    house.position.set(x, y + 0.06, z);
    this.group.add(house);

    // Zlatni pinovi
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), pinMat);
        pin.position.set(
          x - (cols-1)*0.11 + c*0.22,
          y + 0.22,
          z - (rows-1)*0.11 + r*0.22
        );
        this.group.add(pin);
      }
    }
  }

  _buildTraces(y) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.18, metalness: 0.88 });
    const traces = [
      { w: 3.5, d: 0.02, x: -0.2, z:  0.5 },
      { w: 3.5, d: 0.02, x: -0.2, z:  0.2 },
      { w: 2.0, d: 0.02, x:  1.2, z: -0.5 },
      { w: 0.02, d: 2.5, x:  0.8, z:  0.2 },
      { w: 0.02, d: 2.5, x: -0.8, z:  0.2 },
      { w: 1.5, d: 0.015, x: -1.0, z: -0.8 },
      { w: 0.015, d: 1.8, x:  1.5, z:  0.5 },
    ];
    traces.forEach(({ w, d, x, z }) => {
      const geo = new THREE.BoxGeometry(w, 0.008, d);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      this.group.add(m);
    });

    // Via rupe
    const viaMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0 });
    [[0.5, 0.8], [-0.5, 0.8], [1.2, -0.3], [-1.2, -0.3], [0, 0]].forEach(([x, z]) => {
      const via = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), viaMat);
      via.position.set(x, y - 0.01, z);
      this.group.add(via);
    });
  }

  _buildMountingHoles(y) {
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.1, metalness: 1.0, side: THREE.DoubleSide });
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x0a1a0a, roughness: 1.0 });
    [[-2.3, -1.8], [2.3, -1.8], [-2.3, 1.8], [2.3, 1.8]].forEach(([x, z]) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 12), holeMat);
      hole.position.set(x, y, z);
      this.group.add(hole);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.24, 12), ringMat);
      ring.rotation.x = -Math.PI/2;
      ring.position.set(x, y + 0.056, z);
      this.group.add(ring);
    });
  }

  _buildStandoffs(count, gap) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xC8941A, roughness: 0.15, metalness: 0.95 });
    const totalH = count * gap;
    [[-2.3, -1.8], [2.3, -1.8], [-2.3, 1.8], [2.3, 1.8]].forEach(([x, z]) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, totalH, 8), mat);
      st.position.set(x, 0, z);
      this.group.add(st);
    });
  }

  highlightComponent(keyword, color = 0x5FABDB) {
    const c = new THREE.Color(color);
    this.components.forEach(comp => {
      if (!comp.name.toLowerCase().includes(keyword.toLowerCase()) || !comp.material) return;
      gsap.to(comp.material.emissive, { r:c.r, g:c.g, b:c.b, duration:0.6, ease:'power2.out' });
      gsap.to(comp.material, { emissiveIntensity: 0.3, duration:0.6 });
    });
  }

  resetHighlights() {
    this.components.forEach(comp => {
      if (!comp.material) return;
      gsap.to(comp.material.emissive, { r:0, g:0, b:0, duration:0.4 });
      gsap.to(comp.material, { emissiveIntensity:0, duration:0.4 });
    });
  }

  playAssemblyAnimation() {
    // Svaki layer pada od gore
    const children = this.group.children;
    children.forEach((obj, i) => {
      const oy = obj.position.y;
      obj.position.y = oy + 5 + Math.random() * 2;
      gsap.to(obj.position, {
        y: oy,
        duration: 1.2 + Math.random() * 0.4,
        delay: i * 0.008,
        ease: 'elastic.out(1, 0.7)'
      });
    });
  }
}
