export class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.lastHit = -1;
  }
  toggle() {
    if (!this.ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      this.ctx = new Audio();
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate / 2, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    this.enabled = !this.enabled;
    if (this.enabled) { this.ctx.resume(); this.play('summon'); }
    return this.enabled;
  }
  tone(frequency, delay = 0, duration = 0.18) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), at = c.currentTime + delay;
    o.type = 'sine'; o.frequency.setValueAtTime(frequency, at);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.025, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, at + duration);
    o.connect(g).connect(c.destination); o.start(at); o.stop(at + duration);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  play(type) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx;
    if (['hit', 'summon', 'skill', 'page'].includes(type)) {
      if (type === 'hit' && c.currentTime - this.lastHit < 0.05) return;
      if (type === 'hit') this.lastHit = c.currentTime;
      const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      const duration = type === 'skill' ? 0.16 : type === 'page' ? 0.2 : 0.09;
      n.buffer = this.noise; f.type = 'bandpass';
      f.frequency.value = type === 'skill' ? 650 : type === 'page' ? 450 : 1600;
      f.Q.value = 0.7;
      g.gain.setValueAtTime(type === 'hit' ? 0.035 : type === 'skill' ? 0.045 : 0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      n.connect(f).connect(g).connect(c.destination); n.start(); n.stop(c.currentTime + duration);
      n.onended = () => { n.disconnect(); f.disconnect(); g.disconnect(); };
      return;
    }
    const notes = {
      upgrade: [660, 880], wave: [330], boss: [220, 165], bossWindup: [196],
      bossRecovery: [440], bossChange: [196, 262], won: [523, 659, 784],
      lost: [262, 196], ending: [523, 659, 784, 1046, 784, 659, 523],
    }[type];
    notes?.forEach((frequency, i) => this.tone(frequency, i * 0.15, type === 'ending' ? 0.45 : 0.18));
  }
}
