// src/main.js
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

// Visina stranice — 4 sekcije + footer
document.body.style.height = '520vh';

async function init() {
  applyMobileScrollFix();

  const container   = document.getElementById('canvas-container');
  const sm          = new SceneManager(container);

  const { composer, bloom } = setupPostProcessing(sm.renderer, sm.scene, sm.camera);
  sm.setComposer(composer);
  sm.bloom = bloom;

  const pcb = new ProceduralPCB(sm.scene);
  pcb.build();
  sm.pcb = pcb;

  const underglowMat = createUnderglowMaterial();
  sm.registerShaderMaterial(underglowMat);
  const substrate = sm.scene.getObjectByName('PCB_Substrate');
  if (substrate) substrate.material = underglowMat;

  const layers = new LayerManager(sm.scene);
  const perf   = new PerformanceManager(sm.renderer, composer);

  sm.onTick = (camPos) => {
    layers.updateParallax(camPos.x, camPos.y);
    perf.tick();
    if (sm.bloom) {
      const phase    = document.body.getAttribute('data-phase') || 'hero';
      const bloomMap = { hero: 0.5, transition: 1.0, detail: 1.5, cta: 0.7 };
      sm.bloom.strength += ((bloomMap[phase] || 0.55) - sm.bloom.strength) * 0.03;
    }
  };

  const scrollCtrl = new ScrollController(sm);
  const audio      = new AudioManager();

  _setupMuteButton(audio);
  _setupUploadBox();
  _animateHeroEntrance();

  setTimeout(() => pcb.playAssemblyAnimation(), 800);
  _fadeLoading();

  window.addEventListener('pagehide', () => {
    sm.destroy();
    scrollCtrl.destroy();
    audio.destroy();
  });
}

function _animateHeroEntrance() {
  // Hero content animacija pri učitavanju
  gsap.to('.hero-inner', {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: 'power3.out',
    delay: 0.8,
  });
}

function _fadeLoading() {
  let pct = 0;
  const bar   = document.getElementById('loading-bar');
  const pctEl = document.getElementById('loading-pct');

  const iv = setInterval(() => {
    pct += Math.random() * 20 + 8;
    if (pct >= 100) {
      pct = 100;
      clearInterval(iv);
      setTimeout(() => {
        const screen = document.getElementById('loading-screen');
        if (!screen) return;
        gsap.to(screen, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: () => screen.remove()
        });
      }, 200);
    }
    if (bar)   bar.style.width   = `${pct}%`;
    if (pctEl) pctEl.textContent = `${Math.floor(pct)}%`;
  }, 70);
}

function _setupMuteButton(audio) {
  const btn   = document.getElementById('mute-btn');
  const waves = btn?.querySelector('.sound-waves');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    btn.classList.toggle('muted', muted);
    if (waves) waves.style.opacity = muted ? '0' : '1';
    btn.setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
  });
}

function _setupUploadBox() {
  const box = document.getElementById('upload-box');
  if (!box) return;
  box.addEventListener('dragover', (e) => {
    e.preventDefault();
    box.style.borderColor = 'rgba(79,195,247,0.8)';
    box.style.background  = 'rgba(13,27,42,0.9)';
  });
  box.addEventListener('dragleave', () => {
    box.style.borderColor = '';
    box.style.background  = '';
  });
  box.addEventListener('drop', (e) => {
    e.preventDefault();
    box.style.borderColor = '';
    box.style.background  = '';
    // Placeholder za upload logiku
    const title = box.querySelector('.upload-title');
    if (title) title.textContent = '✓ File received — processing...';
  });
}

init().catch(err => {
  console.error('Init error:', err);
  const screen = document.getElementById('loading-screen');
  if (screen) screen.remove();
});
