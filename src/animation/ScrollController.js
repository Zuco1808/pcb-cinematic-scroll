// animation/ScrollController.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollController {
  constructor(sceneManager) {
    this.sm     = sceneManager;
    this.camera = sceneManager.camera;
    this.rig    = sceneManager.cameraRig;
    this.pivot  = sceneManager.cameraRig.getPivot();
    this.lights = sceneManager.scene.userData.lights;

    // Prefers reduced motion check
    this._prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this._prefersReduced) {
      this.rig.setToWaypoint('cta');
      console.info('Scroll animacija isključena — prefers-reduced-motion');
      return;
    }

    // Proxy za Three.js vrijednosti
    this.proxy = {
      fov:           45,
      keyIntensity:  8,
      fillIntensity: 2,
      rimIntensity:  4,
      underIntensity: 1.5,
      fogDensity:    0.032,
    };

    ScrollTrigger.config({
      ignoreMobileResize: true,
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    });

    this._buildTimelines();
    this._setupTextAnimations();
    this._setupPhaseIndicator();
    this._setupScrollHint();
    this._setupResizeHandler();
  }

  _syncProxy() {
    const { camera, proxy, lights } = this;
    camera.fov = proxy.fov;
    camera.updateProjectionMatrix();
    if (lights) {
      lights.keyLight.intensity   = proxy.keyIntensity;
      lights.fillLight.intensity  = proxy.fillIntensity;
      lights.rimLight.intensity   = proxy.rimIntensity;
      lights.underglow.intensity  = proxy.underIntensity;
    }
    if (this.sm.scene.fog) {
      this.sm.scene.fog.density = proxy.fogDensity;
    }
  }

  _buildTimelines() {
    const { camera, pivot } = this;

    // ── HERO ────────────────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        invalidateOnRefresh: true,
        onEnter:     () => this._onPhase('hero'),
        onEnterBack: () => this._onPhase('hero'),
      }
    })
    .to(camera.position, { x: 0, y: 8, z: 12, ease: 'none' })
    .to(camera.rotation, { x: -0.45, y: 0, z: 0, ease: 'none' }, '<')
    .to(pivot.position,  { x: 0, y: 0, z: 0, ease: 'none' }, '<')
    .to(pivot.rotation,  { y: 0, ease: 'none' }, '<')
    .to(this.proxy, {
      fov: 45, keyIntensity: 8, fillIntensity: 2,
      rimIntensity: 4, underIntensity: 1.5, fogDensity: 0.032,
      ease: 'none', onUpdate: () => this._syncProxy()
    }, '<');

    // ── TRANSITION ──────────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-trans',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.0,
        invalidateOnRefresh: true,
        onEnter:     () => this._onPhase('transition'),
        onEnterBack: () => this._onPhase('transition'),
      }
    })
    .to(camera.position, { x: -2, y: 3, z: 6, ease: 'power1.inOut' })
    .to(camera.rotation, { x: -0.2, y: 0.4, z: 0.1, ease: 'power1.inOut' }, '<')
    .to(pivot.rotation,  { y: 0.3, ease: 'sine.inOut' }, '<')
    .to(this.proxy, {
      fov: 40, keyIntensity: 13, fillIntensity: 5,
      rimIntensity: 8, underIntensity: 2.5, fogDensity: 0.02,
      ease: 'sine.inOut', onUpdate: () => this._syncProxy()
    }, '<');

    // ── DETAIL ──────────────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-detail',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5,
        invalidateOnRefresh: true,
        onEnter:     () => this._onPhase('detail'),
        onEnterBack: () => this._onPhase('detail'),
      }
    })
    .to(camera.position, { x: 1.5, y: 0.8, z: 2.5, ease: 'expo.inOut' })
    .to(camera.rotation, { x: -0.1, y: 0.3, z: 0, ease: 'expo.inOut' }, '<')
    .to(pivot.rotation,  { y: -0.2, ease: 'expo.inOut' }, '<')
    .to(this.proxy, {
      fov: 35, keyIntensity: 18, fillIntensity: 1,
      rimIntensity: 14, underIntensity: 3.5, fogDensity: 0.008,
      ease: 'expo.inOut', onUpdate: () => this._syncProxy()
    }, '<');

    // ── CTA ─────────────────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-cta',
        start: 'top bottom',
        end: 'center center',
        scrub: 1.8,
        invalidateOnRefresh: true,
        onEnter:     () => this._onPhase('cta'),
        onEnterBack: () => this._onPhase('cta'),
      }
    })
    .to(camera.position, { x: 0, y: 4, z: 14, ease: 'power3.out' })
    .to(camera.rotation, { x: -0.28, y: 0, z: 0, ease: 'power3.out' }, '<')
    .to(pivot.rotation,  { y: Math.PI * 0.12, ease: 'power2.inOut' }, '<')
    .to(this.proxy, {
      fov: 50, keyIntensity: 10, fillIntensity: 4,
      rimIntensity: 6, underIntensity: 2.0, fogDensity: 0.038,
      ease: 'power3.out', onUpdate: () => this._syncProxy()
    }, '<');
  }

  _onPhase(phase) {
    document.body.setAttribute('data-phase', phase);
    this._updatePhaseIndicator(phase);

    if (this.sm.pcb) {
      if (phase === 'detail') {
        this.sm.pcb.highlightComponent('ic', 0x4fc3f7);
        this.sm.pcb.highlightComponent('cap', 0xD4AF37);
      } else {
        this.sm.pcb.resetHighlights();
      }
    }
  }

  _setupTextAnimations() {
    // Hero entrance
    gsap.to('.hero-left', { opacity:1, y:0, duration:1.1, ease:'power3.out', delay:0.5 });
    gsap.to('.hero-right',{ opacity:1, y:0, duration:1.1, ease:'power3.out', delay:0.7 });

    // Section eyebrows
    document.querySelectorAll('.s-eyebrow').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', invalidateOnRefresh: true }
      });
    });

    // Section headings
    document.querySelectorAll('.s-title').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', invalidateOnRefresh: true }
      });
    });

    // Section subtitles
    document.querySelectorAll('.s-sub').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', invalidateOnRefresh: true }
      });
    });

    // Process steps — stagger
    gsap.to('.process-step', {
      opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.process-steps', start: 'top 75%', invalidateOnRefresh: true }
    });

    // Features grid
    gsap.to('.caps-grid', {
      opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '.caps-grid', start: 'top 80%', invalidateOnRefresh: true }
    });

    gsap.to('#process-visual', {
      opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '#process-visual', start: 'top 80%', invalidateOnRefresh: true }
    });

    // Upload box
    gsap.to('.cta-upload-box', {
      opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: '.cta-upload-box', start: 'top 80%', invalidateOnRefresh: true }
    });

    // Cert row
    gsap.to('#cert-strip', {
      opacity: 1, duration: 0.8, delay: 0.3,
      scrollTrigger: { trigger: '#cert-row', start: 'top 90%', invalidateOnRefresh: true }
    });
  }

  _setupPhaseIndicator() {
    const dots = document.querySelectorAll('.pdot');
    const phaseMap = { hero: 0, transition: 1, detail: 2, cta: 3 };

    this._updatePhaseIndicator = (phase) => {
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === phaseMap[phase]);
      });
    };
  }

  _setupScrollHint() {
    const hint = document.getElementById('scroll-hint');
    if (!hint) return;
    ScrollTrigger.create({
      trigger: document.body,
      start: '3% top',
      onEnter:     () => gsap.to(hint, { opacity: 0, duration: 0.5 }),
      onLeaveBack: () => gsap.to(hint, { opacity: 1, duration: 0.5 }),
    });
  }

  _setupResizeHandler() {
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(true), 200);
    });
  }

  destroy() {
    ScrollTrigger.killAll();
  }
}
