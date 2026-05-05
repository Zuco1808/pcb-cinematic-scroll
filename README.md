# PCB Cinematic Scroll Animation

Cinematic scroll animacija za EMS/SMD montažu matičnih ploča — izgrađena sa **Three.js** i **GSAP ScrollTrigger**.

![PCB Cinematic](https://img.shields.io/badge/Three.js-0.169-black?style=flat&logo=threedotjs)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?style=flat)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)

---

## Pregled

Projekt implementira **4-faznu cinematic scroll animaciju** koja simulira kadar kontinuiranog kretanja kamere kroz PCB montažni proces:

| Faza | Scroll | Opis | Kamera |
|------|--------|------|--------|
| **Hero** | 0–25% | Široki pregled PCB pločice | `(0, 8, 12)` — visok kut |
| **Transition** | 25–50% | Let oko pločice | `(-2, 3, 6)` — orbitalni kut |
| **Detail** | 50–80% | Macro zoom na SMD komponente | `(1.5, 0.8, 2.5)` — tlo razina |
| **CTA** | 80–100% | Pull-back reveal + poziv na akciju | `(0, 4, 14)` — široki završni kadar |

---

## Arhitektura

```
src/
├── main.js                    # Entry point — spaja sve module
├── PostProcessing.js          # EffectComposer + Bloom
├── scene/
│   ├── SceneManager.js        # Three.js renderer, scena, kamera, render loop
│   ├── CameraRig.js           # Pivot sistem za kameru + waypoints
│   ├── Lighting.js            # 5-svetlosni setup (Key/Fill/Rim/Underglow/Accent)
│   └── ProceduralPCB.js       # Proceduralna PCB geometrija (bez 3D modela)
├── layers/
│   └── LayerManager.js        # Background/Midground/Particles paralaksa
├── animation/
│   └── ScrollController.js    # GSAP ScrollTrigger — 4 faze
├── shaders/
│   └── UnderglowShader.js     # Custom GLSL shader za PCB glow efekat
├── audio/
│   └── AudioManager.js        # Proceduralni Web Audio API ambient zvuk
└── utils/
    ├── PerformanceManager.js  # GPU tier detekcija + FPS monitoring
    └── MobileScrollFix.js     # iOS/Android scroll bugfixevi
```

---

## Pokretanje

```bash
# Instaliraj zavisnosti
npm install

# Development server (http://localhost:3000)
npm run dev

# Produkcijski build
npm run build

# Preview build-a
npm run preview
```

---

## Ključne Tehničke Odluke

### GSAP `scrub` vrijednosti
Svaka faza ima različitu `scrub` vrijednost:
- **Hero**: `1.5` — standardno
- **Transition**: `2.0` — glađi prelaz
- **Detail**: `2.5` — najsporiji, macro shot mora biti stabilan
- **CTA**: `1.8` — srednje

### Lighting Setup
```
Key Light   (SpotLight)   — hladno bijela, -4,6,4    — key/fill = 4:1 kontrast
Fill Light  (PointLight)  — topla narandžasta, 5,1,3
Rim Light   (SpotLight)   — hladna plava, 2,-1,-5     — naglašava ivice čipova
Underglow   (PointLight)  — PCB zelena, 0,-1.5,0
Accent      (PointLight)  — plavi odsjaj, -3,2,-6
```

### Post-Processing Stack
```
RenderPass → UnrealBloomPass → OutputPass
```
Bloom intenzitet se dinamički mijenja po fazi (0.6 Hero → 1.7 Detail → 0.9 CTA).

### GPU Tier Detekcija
Automatska degradacija performansi:
- **High** (RTX, Apple M) — puni efekti, pixel ratio 2x
- **Mid** (Adreno 6xx, Mali-G7x) — shadowMap Basic, pixel ratio 1.5x
- **Low** (stariji GPU) — bez bloom, pixel ratio 1x, bez sjena

### Underglow Shader
Custom `ShaderMaterial` sa Fresnel efektom i animiranim UV grid glow-om koji simulira PCB trace osvjetljenje.

---

## Proširivanje sa GLB Modelom

Zamijeni `ProceduralPCB` sa stvarnim GLB modelom:

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const draco = new DRACOLoader();
draco.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
loader.load('/model.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**Naming convention za Blender:**
- `PCB_Substrate` → PCB materijal
- `SMD_IC_*` → IC čip materijal
- `SMD_Capacitor_*` → Kondenzator materijal
- `Connector_*` → Konektor materijal

---

## Mobilna Optimizacija

- `prefers-reduced-motion` — automatski skip animacije
- iOS Safari scroll fix via `ignoreMobileResize: true`
- FPS monitoring sa automatskom degradacijom
- `invalidateOnRefresh: true` na svim ScrollTrigger instancama
- Pinch-zoom disabled (ne remeti Three.js canvas)

---

## Teksture (Opciono)

Za produkciju, dodaj AI-generisane teksture u `/public/textures/`:

| Fajl | Dimenzija | Opis |
|------|-----------|------|
| `pcb_color.webp` | 2048×2048 | PCB color map |
| `pcb_normal.webp` | 2048×2048 | Normal map za reljef trasa |
| `pcb_roughness.webp` | 2048×2048 | Roughness mapa |
| `pcb_metalness.webp` | 2048×2048 | Metalness mapa |
| `bg-pcb-blurred.webp` | 1920×1080 | Zamagljeni background |

**AI Prompt za generisanje:**
> `"FR4 PCB circuit board top-down view, green soldermask, gold copper traces, SMD components, photorealistic, 4K, studio lighting, no background"`

---

## Licenca

MIT
