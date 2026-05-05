// utils/PerformanceManager.js

export class PerformanceManager {
  constructor(renderer, composer) {
    this.renderer   = renderer;
    this.composer   = composer;
    this.frameCount = 0;
    this.lastTime   = performance.now();
    this.fps        = 60;
    this.tier       = this._detectTier();
    this._applyTier();
    this._startMonitor();
  }

  _detectTier() {
    const gl   = this.renderer.getContext();
    const ext  = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'mid';
    const gpu  = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL).toLowerCase();
    if (/apple m[1-9]|rtx [3-9]|rx [6-9]/.test(gpu)) return 'high';
    if (/adreno [6-9]|mali-g[7-9]|apple a1[2-9]/.test(gpu)) return 'mid';
    return 'low';
  }

  _applyTier() {
    console.log(`[Perf] GPU tier: ${this.tier}`);
    switch (this.tier) {
      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        break;
      case 'mid':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        break;
      case 'low':
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        this._disablePass('UnrealBloomPass');
        break;
    }
  }

  _disablePass(name) {
    this.composer?.passes.forEach(p => {
      if (p.constructor.name === name) p.enabled = false;
    });
  }

  _startMonitor() {
    setInterval(() => {
      const now   = performance.now();
      const delta = now - this.lastTime;
      this.fps    = Math.round(this.frameCount / (delta / 1000));
      this.frameCount = 0;
      this.lastTime   = now;
      if (this.fps < 28 && this.tier !== 'low') {
        console.warn(`[Perf] FPS: ${this.fps} — degradacija`);
        this.tier = 'low';
        this._applyTier();
      }
    }, 2500);
  }

  tick() { this.frameCount++; }
}
