// audio/AudioManager.js

export class AudioManager {
  constructor() {
    this.ctx         = null;
    this.masterGain  = null;
    this.nodes       = {};
    this.isInit      = false;
    this.isMuted     = false;
    this._setupInit();
  }

  _setupInit() {
    const init = () => {
      if (this.isInit) return;
      this._init();
    };
    ['scroll', 'click', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, init, { once: true, passive: true })
    );
  }

  async _init() {
    try {
      this.ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this._startHum();
      this._startNoise();
      this._scheduleTicks();
      this.isInit = true;
    } catch (e) {
      console.warn('AudioManager: Web Audio API nije dostupan', e);
    }
  }

  _startHum() {
    const osc    = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain   = this.ctx.createGain();

    osc.type           = 'sawtooth';
    osc.frequency.value = 60;
    filter.type        = 'lowpass';
    filter.frequency.value = 110;
    filter.Q.value     = 4;
    gain.gain.value    = 0.035;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.nodes.humOsc  = osc;
    this.nodes.humGain = gain;
  }

  _startNoise() {
    const sr         = this.ctx.sampleRate;
    const bufSize    = sr * 3;
    const buf        = this.ctx.createBuffer(1, bufSize, sr);
    const data       = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src    = this.ctx.createBufferSource();
    src.buffer   = buf;
    src.loop     = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.5;

    const gain   = this.ctx.createGain();
    gain.gain.value = 0.025;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    this.nodes.noise = src;
  }

  _scheduleTicks() {
    const tick = () => {
      if (!this.isInit || this.isMuted) return;
      this._playTick();
      setTimeout(tick, (0.8 + Math.random() * 2.4) * 1000);
    };
    setTimeout(tick, 1200);
  }

  _playTick() {
    if (!this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type   = 'sine';
    osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  transitionPhase(phase) {
    if (!this.isInit || !this.nodes.humOsc) return;
    const freqMap = { hero: 60, transition: 65, detail: 55, cta: 60 };
    const gainMap = { hero: 0.035, transition: 0.055, detail: 0.02, cta: 0.03 };
    const now = this.ctx.currentTime;
    this.nodes.humOsc.frequency.linearRampToValueAtTime(freqMap[phase] || 60, now + 1.2);
    this.nodes.humGain?.gain.linearRampToValueAtTime(gainMap[phase] || 0.035, now + 1.2);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : 0.5,
        this.ctx.currentTime + 0.4
      );
    }
    return this.isMuted;
  }

  destroy() {
    Object.values(this.nodes).forEach(n => {
      try { n.stop?.(); n.disconnect?.(); } catch (_) {}
    });
    this.ctx?.close();
  }
}
