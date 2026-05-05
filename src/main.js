// src/main.js — Entry Point
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { SceneManager }      from './scene/SceneManager.js';
import { ProceduralPCB }     from './scene/ProceduralPCB.js';
import { LayerManager }      from './layers/LayerManager.js';
import { ScrollController }  from './animation/ScrollController.js';
import { setupPostProcessing } from './PostProcessing.js';
import { PerformanceManager } from './utils/PerformanceManager.js';
import { applyMobileScrollFix } from './utils/MobileScrollFix.js';
import { AudioManager }      from './audio/AudioManager.js';
import { createUnderglowMaterial } from './shaders/UnderglowShader.js';

gsap.registerPlugin(ScrollTrigger);

// ─── SCROLL HEIGHT ──────────────────────────────────────
document.body.style.height = '500vh';

async function init() {
  // Mobile fixes
  applyMobileScrollFix();

  // Scene
  const container  = document.getElementById('canvas-container');
  const sm         = new SceneManager(container);

  // Post-processing
  const { composer, bloom } = setupPostProcessing(sm.renderer, sm.scene, sm.camera);
  sm.setComposer(composer);
  sm.bloom = bloom;

  // PCB geometrija
  const pcb = new ProceduralPCB(sm.scene);
  pcb.build();
  sm.pcb = pcb;

  // Underglow shader na PCB substrate
  const underglowMat = createUnderglowMaterial();
  sm.registerShaderMaterial(underglowMat);
  // Postavi na prvi child (substrate) grupe
  const substrate = sm.scene.getObjectByName('PCB_Substrate');
  if (substrate) substrate.material = underglowMat;

  // Layers (paralaksa)
  const layers = new LayerManager(sm.scene);

  // Performance manager
  const perf = new PerformanceManager(sm.renderer, composer);

  // Tick callback
  sm.onTick = (camPos) => {
    layers.updateParallax(camPos.x, camPos.y);
    perf.tick();

    // Bloom intenzitet po fazi
    if (sm.bloom) {
      const phase = document.body.getAttribute('data-phase') || 'hero';
      const bloomMap = { hero: 0.6, transition: 1.1, detail: 1.7, cta: 0.9 };
      sm.bloom.strength += (( bloomMap[phase] || 0.7 ) - sm.bloom.strength) * 0.04;
    }
  };

  // Scroll controller
  const scrollCtrl = new ScrollController(sm);

  // Audio
  const audio = new AudioManager();
  _setupMuteButton(audio);

  // Assembly animation odmah
  setTimeout(() => pcb.playAssemblyAnimation(), 600);

  // Fade out loading screen
  _fadeLoading();

  // Cleanup pri page hide
  window.addEventListener('pagehide', () => {
    sm.destroy();
    scrollCtrl.destroy();
    audio.destroy();
  });
}

function _fadeLoading() {
  // Simuliraj progres
  let pct = 0;
  const bar  = document.getElementById('loading-bar');
  const pctEl = document.getElementById('loading-pct');

  const interval = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      setTimeout(() => {
        const screen = document.getElementById('loading-screen');
        if (!screen) return;
        gsap.to(screen, {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: () => screen.remove()
        });
      }, 300);
    }
    if (bar)   bar.style.width   = `${pct}%`;
    if (pctEl) pctEl.textContent = `${Math.floor(pct)}%`;
  }, 80);
}

function _setupMuteButton(audio) {
  const btn  = document.getElementById('mute-btn');
  const waves = btn?.querySelector('.sound-waves');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    btn.classList.toggle('muted', muted);
    if (waves) waves.style.opacity = muted ? '0' : '1';
    btn.setAttribute('aria-label', muted ? 'Uključi zvuk' : 'Isključi zvuk');
  });
}

init().catch(err => {
  console.error('Init error:', err);
  // Fallback — ukloni loading screen čak i ako init puca
  const screen = document.getElementById('loading-screen');
  if (screen) screen.remove();
});
