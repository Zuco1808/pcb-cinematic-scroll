// audio/AudioManager.js — Smirujući ambient

export class AudioManager {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.nodes      = {};
    this.isInit     = false;
    this.isMuted    = false;
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
      this.masterGain.gain.value = 0.0;
      this.masterGain.connect(this.ctx.destination);
      this._startDroneBase();
      this._startSoftPad();
      this._startAirFlow();
      this._startOccasionalTone();
      this.masterGain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 4.0);
      this.isInit = true;
    } catch (e) {
      console.warn('AudioManager: Web Audio API nije dostupan', e);
    }
  }

  _startDroneBase() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = 55;
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 0.8;
    gain.gain.value = 0.18;
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.nodes.drone = osc;
    this.nodes.droneLFO = lfo;
  }

  _startSoftPad() {
    [110, 110.4, 165, 165.6].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'bandpass';
      filter.frequency.value = freq * 2;
      filter.Q.value = 2.0;
      gain.gain.value = 0.06;
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.01;
      lfoG.gain.value = 0.03;
      lfo.connect(lfoG);
      lfoG.connect(gain.gain);
      lfo.start();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.nodes[`pad${i}`] = osc;
    });
  }

  _startAirFlow() {
    const sr = this.ctx.sampleRate;
    const bufSize = sr * 4;
    const buf = this.ctx.createBuffer(2, bufSize, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
      }
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const hi = this.ctx.createBiquadFilter();
    hi.type='highshelf'; hi.frequency.value=3000; hi.gain.value=-18;
    const lo = this.ctx.createBiquadFilter();
    lo.type='lowshelf'; lo.frequency.value=120; lo.gain.value=-8;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.07;
    src.connect(hi); hi.connect(lo); lo.connect(gain); gain.connect(this.masterGain);
    src.start();
    this.nodes.airflow = src;
  }

  _startOccasionalTone() {
    const schedule = () => {
      if (!this.isInit || this.isMuted) return;
      setTimeout(() => { this._playGentleTone(); schedule(); }, (8 + Math.random() * 16) * 1000);
    };
    setTimeout(schedule, 5000);
  }

  _playGentleTone() {
    if (!this.ctx) return;
    const freq = [220, 330, 440][Math.floor(Math.random() * 3)];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 8;
    const dur = 3.5 + Math.random() * 2;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.055, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + dur + 0.1);
  }

  transitionPhase(phase) {
    if (!this.isInit || !this.nodes.drone) return;
    const now = this.ctx.currentTime;
    const cfg = { hero:{freq:55,gain:0.45}, transition:{freq:55,gain:0.40}, detail:{freq:82.5,gain:0.38}, cta:{freq:55,gain:0.42} }[phase] || {freq:55,gain:0.45};
    this.nodes.drone.frequency.linearRampToValueAtTime(cfg.freq, now + 3.0);
    if (!this.isMuted) this.masterGain.gain.linearRampToValueAtTime(cfg.gain, now + 2.0);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime + 0.8);
    }
    return this.isMuted;
  }

  destroy() {
    Object.values(this.nodes).forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(_){} });
    this.ctx?.close();
  }
}
