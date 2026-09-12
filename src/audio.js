export class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume();
      this.play("summon");
    }
    return this.enabled;
  }
  play(type) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const notes = {
      summon: 660,
      hit: 220,
      upgrade: 880,
      skill: 110,
      won: 1046,
      lost: 140,
      wave: 330,
    };
    if (!notes[type]) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type === "hit" ? "triangle" : "sine";
    o.frequency.setValueAtTime(notes[type], c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      notes[type] * (type === "skill" ? 3 : 0.7),
      c.currentTime + 0.13,
    );
    g.gain.setValueAtTime(0.035, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.17);
  }
}
