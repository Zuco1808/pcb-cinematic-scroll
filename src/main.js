// src/main.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneManager }       from './scene/SceneManager.js';
import { ProceduralPCB }      from './scene/ProceduralPCB.js';
import { LayerManager }       from './layers/LayerManager.js';
import { ScrollController }   from './animation/ScrollController.js';
import { setupPostProcessing } from './PostProcessing.js';
import { PerformanceManager } from './utils/PerformanceManager.js';
import { applyMobileScrollFix } from './utils/MobileScrollFix.js';
import { AudioManager }       from './audio/AudioManager.js';
import { createUnderglowMaterial } from './shaders/UnderglowShader.js';

gsap.registerPlugin(ScrollTrigger);

// KRITIČNO: body mora imati visinu za scroll
// Svaka sekcija = 100vh, imamo 4 sekcije + margine
document.body.style.height = '500vh';

// Canvas je FIXED, page content lebdi iznad njega
// Sekcije su prozirne — canvas se vidi ispod

async function init() {
  applyMobileScrollFix();

  const container = document.getElementById('canvas-container');
  const sm = new SceneManager(container);

  // Post-processing
  const { composer, bloom } = setupPostProcessing(sm.renderer, sm.scene, sm.camera);
  sm.setComposer(composer);
  sm.bloom = bloom;

  // PCB
  const pcb = new ProceduralPCB(sm.scene);
  pcb.build();
  sm.pcb = pcb;

  // Underglow shader
  const underglowMat = createUnderglowMaterial();
  sm.registerShaderMaterial(underglowMat);
  const substrate = sm.scene.getObjectByName('PCB_Substrate');
  if (substrate) substrate.material = underglowMat;

  // Layers
  const layers = new LayerManager(sm.scene);

  // Performance
  const perf = new PerformanceManager(sm.renderer, composer);

  // Tick
  sm.onTick = (camPos) => {
    layers.updateParallax(camPos.x, camPos.y);
    perf.tick();
    if (sm.bloom) {
      const phase = document.body.getAttribute('data-phase') || 'hero';
      const bMap = { hero: 0.45, transition: 0.80, detail: 1.20, cta: 0.50 };
      sm.bloom.strength += ((bMap[phase] || 0.45) - sm.bloom.strength) * 0.04;
    }
  };

  // Scroll animacija
  const scrollCtrl = new ScrollController(sm);

  // Audio
  const audio = new AudioManager();
  _setupMuteBtn(audio);
  _setupUploadDrag();
  _animateHero();
  setTimeout(() => pcb.playAssemblyAnimation(), 700);
  _fadeLoading();

  window.addEventListener('pagehide', () => {
    sm.destroy();
    scrollCtrl.destroy();
    audio.destroy();
  });
}

function _animateHero() {
  gsap.to('.hero-left',  { opacity:1, y:0, duration:1.1, ease:'power3.out', delay:0.6 });
  gsap.to('.hero-right', { opacity:1, y:0, duration:1.1, ease:'power3.out', delay:0.85 });
}

function _fadeLoading() {
  let pct = 0;
  const bar = document.getElementById('loading-bar');
  const pctEl = document.getElementById('loading-pct');
  const iv = setInterval(() => {
    pct += Math.random() * 22 + 8;
    if (pct >= 100) {
      pct = 100;
      clearInterval(iv);
      setTimeout(() => {
        const s = document.getElementById('loading-screen');
        if (!s) return;
        gsap.to(s, { opacity:0, duration:0.6, onComplete:() => s.remove() });
      }, 250);
    }
    if (bar) bar.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${Math.floor(pct)}%`;
  }, 65);
}

function _setupMuteBtn(audio) {
  const btn = document.getElementById('mute-btn');
  const waves = btn?.querySelector('.sound-waves');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    btn.classList.toggle('muted', muted);
    if (waves) waves.style.opacity = muted ? '0' : '1';
  });
}

function _setupUploadDrag() {
  const uz = document.getElementById('uz');
  if (!uz) return;
  uz.addEventListener('dragover', e => { e.preventDefault(); uz.style.borderColor='var(--tr)'; uz.style.background='var(--tr-bg)'; });
  uz.addEventListener('dragleave', () => { uz.style.borderColor=''; uz.style.background=''; });
  uz.addEventListener('drop', e => { e.preventDefault(); uz.querySelector('h4').textContent='✓ File received — processing...'; uz.style.borderColor=''; uz.style.background=''; });
}

init().catch(err => {
  console.error(err);
  const s = document.getElementById('loading-screen');
  if (s) s.remove();
});
