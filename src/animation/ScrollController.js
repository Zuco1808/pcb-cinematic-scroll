// animation/ScrollController.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollController {
  constructor(sm) {
    this.sm     = sm;
    this.camera = sm.camera;
    this.rig    = sm.cameraRig;
    this.pivot  = sm.cameraRig.getPivot();
    this.lights = sm.scene.userData.lights;

    this.proxy = {
      fov: 45,
      keyI: 12, fillI: 4, rimI: 6, underI: 2.5,
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { this.rig.setToWaypoint('cta'); return; }

    ScrollTrigger.config({ ignoreMobileResize: true });

    this._buildScrollTimelines();
    this._animatePageElements();
    this._setupScrollHint();
    this._setupResizeHandler();
  }

  _syncProxy() {
    const { camera, proxy, lights } = this;
    camera.fov = proxy.fov;
    camera.updateProjectionMatrix();
    if (lights) {
      lights.keyLight.intensity  = proxy.keyI;
      lights.fillLight.intensity = proxy.fillI;
      lights.rimLight.intensity  = proxy.rimI;
      lights.underglow.intensity = proxy.underI;
    }
  }

  _buildScrollTimelines() {
    const { camera, pivot } = this;

    // ── HERO → TRANSITION ────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        invalidateOnRefresh: true,
        onEnter:     () => this._phase('hero'),
        onEnterBack: () => this._phase('hero'),
      }
    })
    .to(camera.position, { x:0, y:6, z:9, ease:'none' })
    .to(camera.rotation, { x:-0.40, y:0, z:0, ease:'none' }, '<')
    .to(pivot.rotation,  { y:0, ease:'none' }, '<')
    .to(this.proxy, { fov:45, keyI:12, fillI:4, rimI:6, underI:2.5, ease:'none', onUpdate:()=>this._syncProxy() }, '<');

    // ── PROCESS ──────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-trans',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.0,
        invalidateOnRefresh: true,
        onEnter:     () => this._phase('transition'),
        onEnterBack: () => this._phase('transition'),
      }
    })
    .to(camera.position, { x:-2, y:3, z:6, ease:'power1.inOut' })
    .to(camera.rotation, { x:-0.2, y:0.4, z:0.1, ease:'power1.inOut' }, '<')
    .to(pivot.rotation,  { y:0.3, ease:'sine.inOut' }, '<')
    .to(this.proxy, { fov:40, keyI:16, fillI:5, rimI:9, underI:3.5, ease:'sine.inOut', onUpdate:()=>this._syncProxy() }, '<');

    // ── CAPABILITIES ─────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-detail',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5,
        invalidateOnRefresh: true,
        onEnter:     () => this._phase('detail'),
        onEnterBack: () => this._phase('detail'),
      }
    })
    .to(camera.position, { x:1.5, y:0.8, z:2.5, ease:'expo.inOut' })
    .to(camera.rotation, { x:-0.1, y:0.3, z:0, ease:'expo.inOut' }, '<')
    .to(pivot.rotation,  { y:-0.2, ease:'expo.inOut' }, '<')
    .to(this.proxy, { fov:35, keyI:20, fillI:1.5, rimI:14, underI:4, ease:'expo.inOut', onUpdate:()=>this._syncProxy() }, '<');

    // ── CTA ───────────────────────────────────────────
    gsap.timeline({
      scrollTrigger: {
        trigger: '#s-cta',
        start: 'top bottom',
        end: 'center center',
        scrub: 1.8,
        invalidateOnRefresh: true,
        onEnter:     () => this._phase('cta'),
        onEnterBack: () => this._phase('cta'),
      }
    })
    .to(camera.position, { x:0, y:3.5, z:11, ease:'power3.out' })
    .to(camera.rotation, { x:-0.28, y:0, z:0, ease:'power3.out' }, '<')
    .to(pivot.rotation,  { y:Math.PI*0.12, ease:'power2.inOut' }, '<')
    .to(this.proxy, { fov:50, keyI:10, fillI:4, rimI:6, underI:2, ease:'power3.out', onUpdate:()=>this._syncProxy() }, '<');
  }

  _phase(name) {
    document.body.setAttribute('data-phase', name);

    // Phase dots
    const dots = document.querySelectorAll('.pdot');
    const map = { hero:0, transition:1, detail:2, cta:3 };
    dots.forEach((d,i) => d.classList.toggle('active', i === map[name]));

    // PCB highlight
    if (this.sm.pcb) {
      if (name === 'detail') {
        this.sm.pcb.highlightComponent('ic',  0x5FABDB);
        this.sm.pcb.highlightComponent('cap', 0xD4AF37);
      } else {
        this.sm.pcb.resetHighlights();
      }
    }
  }

  _animatePageElements() {
    // Eyebrows
    document.querySelectorAll('.eyebrow').forEach(el => {
      gsap.to(el, { opacity:1, y:0, duration:0.7, ease:'power2.out',
        scrollTrigger:{ trigger:el, start:'top 85%', invalidateOnRefresh:true }});
    });
    // Titles
    document.querySelectorAll('.s-title').forEach(el => {
      gsap.to(el, { opacity:1, y:0, duration:0.85, ease:'power2.out',
        scrollTrigger:{ trigger:el, start:'top 82%', invalidateOnRefresh:true }});
    });
    // Subs
    document.querySelectorAll('.s-sub').forEach(el => {
      gsap.to(el, { opacity:1, y:0, duration:0.85, ease:'power2.out', delay:0.08,
        scrollTrigger:{ trigger:el, start:'top 82%', invalidateOnRefresh:true }});
    });
    // Steps stagger
    gsap.to('.step', { opacity:1, x:0, duration:0.65, ease:'power2.out', stagger:0.1,
      scrollTrigger:{ trigger:'.steps', start:'top 75%', invalidateOnRefresh:true }});
    // Quote card
    gsap.to('#process-visual', { opacity:1, y:0, duration:0.85, ease:'power2.out',
      scrollTrigger:{ trigger:'#process-visual', start:'top 80%', invalidateOnRefresh:true }});
    // Caps grid
    gsap.to('.caps-grid', { opacity:1, y:0, duration:0.85, ease:'power2.out',
      scrollTrigger:{ trigger:'.caps-grid', start:'top 78%', invalidateOnRefresh:true }});
    // CTA upload
    gsap.to('.cta-card', { opacity:1, y:0, duration:0.8, ease:'power2.out',
      scrollTrigger:{ trigger:'.cta-card', start:'top 80%', invalidateOnRefresh:true }});
    // Certs
    gsap.to('#cert-row', { opacity:1, duration:0.7, delay:0.2,
      scrollTrigger:{ trigger:'#cert-row', start:'top 88%', invalidateOnRefresh:true }});
  }

  _setupScrollHint() {
    const hint = document.getElementById('scroll-hint');
    if (!hint) return;
    ScrollTrigger.create({
      trigger: document.body,
      start: '3% top',
      onEnter:     () => gsap.to(hint, { opacity:0, duration:0.4 }),
      onLeaveBack: () => gsap.to(hint, { opacity:1, duration:0.4 }),
    });
  }

  _setupResizeHandler() {
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(true), 200);
    });
  }

  destroy() { ScrollTrigger.killAll(); }
}
