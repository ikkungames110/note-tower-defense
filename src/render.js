import { LETTERS } from './letters.js';
const INK = '#575047';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effects = [];
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.sprites = Object.fromEntries(Object.entries(LETTERS).map(([glyph, paths]) => [glyph, this.makeLetter(paths)]));
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }
  makeLetter(paths) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 220;
    const c = canvas.getContext('2d');
    c.scale(2, 2);
    const graphite = c.createLinearGradient(15, 10, 85, 95);
    graphite.addColorStop(0, '#777066');
    graphite.addColorStop(0.45, '#4e4943');
    graphite.addColorStop(1, '#777168');
    c.strokeStyle = graphite;
    c.lineCap = c.lineJoin = 'round';
    paths.forEach((path, i) => {
      c.lineWidth = 2.6 + i * 0.15;
      c.stroke(new Path2D(path));
    });
    // 紙目は筆跡の内側だけ。文字の外へ粉や点を散らさない。
    const pixels = c.getImageData(0, 0, 200, 220);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i + 3]) pixels.data[i + 3] *= 0.7 + ((i * 13 % 97) / 97) * 0.3;
    }
    c.putImageData(pixels, 0, 0);
    return canvas;
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.canvas.clientWidth * d);
    this.canvas.height = Math.round(this.canvas.clientWidth * 440 / 1200 * d);
  }
  event(e) {
    if (['hit', 'defeat', 'summon', 'skill'].includes(e.type)) this.effects.push({ ...e, life: 0 });
    if (this.effects.length > 100) this.effects.shift();
  }
  draw(b, dt) {
    const c = this.ctx;
    c.setTransform(this.canvas.width / 1200, 0, 0, this.canvas.height / 440, 0, 0);
    c.clearRect(0, 0, 1200, 440);
    this.base(105, b.homeHp / 2000, 'あいうえお');
    this.base(1095, b.enemyHp / b.config.hp, 'ABCDE');
    if (b.status === 'ready') {
      [...'あいうえおABCDE'].forEach((glyph, i) => this.unit({
        glyph, x: i < 5 ? 206 + i * 77 : 699 + (i - 5) * 77,
        id: i, kind: i % 5, side: i < 5 ? 1 : -1,
        hp: 1, maxHp: 1, action: 0, moving: false, stride: 0,
      }));
    }
    [...b.units].sort((a, z) => (a.id % 3) - (z.id % 3)).forEach(u => this.unit(u));
    for (const e of this.effects) {
      e.life += dt;
      const p = e.life / 0.45;
      if (p > 1) continue;
      c.save();
      c.globalAlpha = (1 - p) * 0.6;
      c.strokeStyle = INK;
      c.lineWidth = 1.6;
      // 遠距離攻撃だけ短く筆跡が飛ぶ。ダメージはゲーム側ですでに適用済み。
      if (e.type === 'hit' && Math.abs(e.x - e.from) > 125) {
        const t = Math.min(1, p * 2.5);
        const x = e.from + (e.x - e.from) * t;
        const y = 252 - Math.sin(t * Math.PI) * 38;
        c.beginPath();
        c.moveTo(x - 5 * e.side, y - 2);
        c.quadraticCurveTo(x, y + 3, x + 5 * e.side, y);
        c.stroke();
      } else if (e.type === 'skill') {
        c.globalAlpha = Math.sin(p * Math.PI) * 0.75;
        c.translate(1150 - p * 1100, 261);
        c.rotate(-0.12);
        c.shadowColor = '#3f342b44'; c.shadowBlur = 12; c.shadowOffsetY = 12;
        c.fillStyle = '#f3ecdd';
        c.beginPath(); c.roundRect(-36, -22, 72, 38, 5); c.fill();
        c.shadowColor = 'transparent'; c.fillStyle = '#8c9187'; c.fillRect(-10, -22, 36, 38);
      }
      c.restore();
    }
    this.effects = this.effects.filter(e => e.life < 0.5);
  }
  base(x, ratio, label) {
    const c = this.ctx;
    c.save();
    c.translate(x, 300);
    c.fillStyle = '#5d524b';
    c.font = '12px serif'; c.textAlign = 'center';
    c.fillText(label, 0, 28);
    c.fillStyle = '#5d524b25'; c.fillRect(-30, 36, 60, 2);
    c.fillStyle = '#776956'; c.fillRect(-30, 36, 60 * Math.max(0, ratio), 2);
    c.strokeStyle = '#71695c80'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-22, 9); c.lineTo(-29, 3); c.lineTo(-20, -3);
    c.moveTo(22, 9); c.lineTo(29, 3); c.lineTo(20, -3); c.stroke();
    c.restore();
  }
  unit(u) {
    const c = this.ctx;
    const sprite = this.sprites[u.glyph];
    const lane = (u.id % 3) * 11;
    const walk = u.moving && !this.reducedMotion.matches ? Math.sin(u.stride) : 0;
    const phase = u.action > 0 ? 1 - u.action / 0.38 : 0;
    const motion = this.reducedMotion.matches ? 0 : Math.sin(phase * Math.PI * 2);
    const hit = this.effects.some(e => e.type === 'hit' && e.side !== u.side && Math.abs(e.x - u.x) < 25 && e.life < 0.12);
    const size = (u.kind === 4 && u.side === 1) || (u.kind === 3 && u.side === -1) ? 91 : 79;
    const x = u.x + motion * 7 * u.side;
    const y = 290 + lane - Math.abs(walk) * 2;
    // 同じ筆跡を紙面へ投影した影で、薄い文字が垂直に立つことを表す。
    c.save();
    c.translate(x, 290 + lane);
    c.transform(1, 0.13, -0.8, -0.25, 0, 0);
    c.globalAlpha = 0.36;
    c.filter = 'blur(1px)';
    c.drawImage(sprite, -size / 2, -size * 0.94, size, size * 1.1);
    c.restore();
    c.save();
    c.fillStyle = '#4d423316';
    c.filter = 'blur(2px)';
    c.beginPath(); c.ellipse(x, 291 + lane, size * 0.26, 2.5, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save();
    c.translate(x + (hit ? -u.side * 3 : 0), y);
    const tilt = [0.12, 0.08, -0.09, 0.13, 0.045][u.kind];
    c.rotate(walk * 0.017 + motion * tilt * u.side);
    c.scale(1 + Math.abs(motion) * 0.025, 1 - Math.abs(motion) * 0.025);
    c.globalAlpha = hit ? 0.65 : 0.95;
    c.drawImage(sprite, -size / 2, -size * 0.94, size, size * 1.1);
    c.restore();
    if (u.hp < u.maxHp) {
      c.fillStyle = '#695e4e22'; c.fillRect(x - 13, 303 + lane, 26, 1.5);
      c.fillStyle = '#695e4e88'; c.fillRect(x - 13, 303 + lane, 26 * Math.max(0, u.hp / u.maxHp), 1.5);
    }
  }
}
