import { bossStatus, ENEMIES } from './game.js';
import { LETTERS } from './letters.js';
const INK = '#575047';
const SKILL_DURATION = 0.55;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effects = [];
    this.eraser = new Image();
    this.eraser.src = `${import.meta.env.BASE_URL}assets/eraser-soft.png`;
    this.baseSprite = this.makeLetter(['M14 95 L15 46 L28 46 L29 57 L40 57 L40 41 L61 41 L61 57 L72 57 L72 45 L85 45 L86 95 Z', 'M40 94 L41 73 Q50 61 60 73 L60 94', 'M50 41 L50 13 L73 20 L51 29', 'M24 67 L24 76', 'M76 67 L76 76']);
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.sprites = Object.fromEntries(Object.entries(LETTERS).map(([glyph, paths]) => [glyph, this.makeLetter(paths)]));
    this.strokes = Object.fromEntries(Object.entries(LETTERS).map(([glyph, paths]) =>
      [glyph, paths.map((path, i) => this.makeLetter([path], i))]));
    this.paths = Object.fromEntries(Object.entries(LETTERS).map(([glyph, paths]) => [glyph, paths.map(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      return { path: new Path2D(d), length: path.getTotalLength() };
    })]));
    this.shadows = Object.fromEntries(Object.entries(this.sprites).map(([glyph, sprite]) => [glyph, this.makeShadow(sprite)]));
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }
  makeLetter(paths, offset = 0) {
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
      c.lineWidth = 2.6 + (i + offset) * 0.15;
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
  makeShadow(sprite) {
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 140;
    const c = canvas.getContext('2d'); c.translate(90, 80);
    c.transform(1, 0.13, -0.8, -0.25, 0, 0);
    c.globalAlpha = 0.36; c.filter = 'blur(1px)';
    c.drawImage(sprite, -50, -94, 100, 110);
    return canvas;
  }
  drawWriting(u, size, progress) {
    const c = this.ctx, paths = this.paths[u.glyph];
    c.save();
    c.globalAlpha *= 0.18;
    c.drawImage(this.sprites[u.glyph], -size / 2, -size * 0.94, size, size * 1.1);
    c.restore(); c.save();
    c.translate(-size / 2, -size * 0.94); c.scale(size / 100, size / 100);
    c.strokeStyle = INK; c.lineCap = c.lineJoin = 'round';
    paths.forEach(({ path, length }, i) => {
      const part = Math.min(1, Math.max(0, progress * paths.length - i));
      if (!part) return;
      c.lineWidth = 2.6 + i * 0.15;
      c.setLineDash([length * part, length + 1]); c.stroke(path);
    });
    c.restore();
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
    this.fold(b.config.fold);
    this.base(105, b.homeHp / 2000, '自分の拠点');
    this.base(1095, b.enemyHp / b.config.hp, '相手の拠点');
    if (b.status === 'ready') {
      [...b.heroes.map(h => h.glyph), ...'ABCD', ENEMIES[b.config.boss.kind].glyph].forEach((glyph, i) => this.unit({
        glyph, x: i < 5 ? 206 + i * 77 : 699 + (i - 5) * 77,
        id: i, kind: i % 5, side: i < 5 ? 1 : -1,
        boss: i === 9, hp: 1, maxHp: 1, action: 0, moving: false, stride: 0,
      }));
    }
    for (const e of this.effects.filter(e => e.type === 'skill')) {
      const p = e.life / SKILL_DURATION;
      c.save();
      c.globalAlpha = Math.max(0, 1 - p * 2) * 0.55;
      for (const u of e.erased || []) {
        if (!b.units.some(live => live.id === u.id)) {
          const size = u.obstacle ? 36 : u.boss ? 125 : 79;
          c.drawImage(this.sprites[u.glyph], u.x - size / 2, 290 + (u.id % 3) * 11 - size * 0.94, size, size * 1.1);
        }
      }
      c.restore();
    }
    [...b.units].sort((a, z) => (a.id % 3) - (z.id % 3)).forEach(u => this.unit(u));
    for (const e of this.effects) {
      e.life += dt;
      const p = e.life / (e.type === 'skill' ? SKILL_DURATION : 0.45);
      if (p > 1) continue;
      c.save();
      c.globalAlpha = (1 - p) * 0.6;
      c.strokeStyle = INK;
      c.lineWidth = 1.6;
      // 遠距離攻撃だけ短く筆跡が飛ぶ。ダメージはゲーム側ですでに適用済み。
      if (e.type === 'defeat' && e.unit && !this.effects.some(effect => effect.type === 'skill' && effect.erased?.some(u => u.id === e.unit.id))) {
        const u = e.unit, size = u.obstacle ? 36 : u.boss ? 125 : 79;
        c.drawImage(this.sprites[u.glyph], u.x - size / 2, 290 + (u.id % 3) * 11 - size * 0.94, size, size * 1.1);
      } else if (e.type === 'hit' && Math.abs(e.x - e.from) > 125) {
        const t = Math.min(1, p * 2.5);
        const x = e.from + (e.x - e.from) * t;
        const y = 252 - Math.sin(t * Math.PI) * 38;
        c.beginPath();
        c.moveTo(x - 5 * e.side, y - 2);
        c.quadraticCurveTo(x, y + 3, x + 5 * e.side, y);
        c.stroke();
      } else if (e.type === 'skill') {
        const reduced = this.reducedMotion.matches;
        c.globalAlpha = Math.min(1, p * 8, (1 - p) * 3) * 0.85;
        // 小さな消しゴムを一度だけ添える。全画面の往復や粉は描かない。
        c.translate(700 + (reduced ? 0 : (p - 0.5) * 22), 215);
        c.rotate(-0.12);
        if (this.eraser.complete && this.eraser.naturalWidth) c.drawImage(this.eraser, -48, -32, 96, 64);
      }
      c.restore();
    }
    this.effects = this.effects.filter(e => e.life < (e.type === 'skill' ? SKILL_DURATION : 0.5));
  }
  fold(fold) {
    if (!fold) return;
    const c = this.ctx, middle = (fold.from + fold.to) / 2;
    c.save();
    // 紙面の奥から手前へ広がる、折り目の陰影。攻撃線や粒子は描かない。
    const gradient = c.createLinearGradient(fold.from, 0, fold.to, 0);
    gradient.addColorStop(0, '#78634c00');
    gradient.addColorStop(0.45, '#78634c08');
    gradient.addColorStop(0.5, '#66513924');
    gradient.addColorStop(0.55, '#fffbed44');
    gradient.addColorStop(1, '#fffbed00');
    c.fillStyle = gradient;
    c.beginPath(); c.moveTo(middle - 14, 210); c.lineTo(middle + 14, 210);
    c.lineTo(fold.to, 365); c.lineTo(fold.from, 365); c.closePath(); c.fill();
    c.fillStyle = '#6c6152'; c.font = '12px serif'; c.textAlign = 'center';
    c.fillText('折り目', middle, 357);
    c.restore();
  }
  drawStrokes(u, size, phase) {
    const c = this.ctx;
    const active = u.action > 0 && !this.reducedMotion.matches;
    if (!active && !(u.bossPhase === 'windup' && !this.reducedMotion.matches)) {
      c.drawImage(this.sprites[u.glyph], -size / 2, -size * 0.94, size, size * 1.1);
      return;
    }
    const pulse = active ? Math.sin(Math.min(1, Math.max(0, phase)) * Math.PI) : 0;
    const strokes = this.strokes[u.glyph];
    strokes.forEach((stroke, i) => {
      c.save();
      // 一画をわずかに動かし、文字の読みやすさと接続を保つ。
      if (u.side === 1) {
        const direction = u.side;
        if (u.kind === 0 && i === strokes.length - 1) {
          c.translate(0, -size * 0.42); c.rotate(pulse * 0.13);
          c.translate(0, size * 0.42);
        } else if (u.kind === 1) {
          const beat = active ? Math.sin(Math.min(1, phase) * Math.PI * 2) : 0;
          c.translate(beat * (i % 2 ? -1 : 1) * 4, 0);
        } else if (u.kind === 2 && i === 0) {
          c.translate(pulse * 6 * direction, -pulse * 5);
        } else if (u.kind === 3 && i === strokes.length - 1) {
          c.translate(pulse * 5 * direction, 0); c.rotate(-pulse * 0.045);
        } else if (u.kind === 4) {
          c.translate(i === strokes.length - 1 ? pulse * 5 * direction : 0, 0);
          if (i !== strokes.length - 1) c.scale(1 + pulse * 0.025, 1);
        }
      } else if (u.boss && u.glyph === 'E' && i > 0 && !this.reducedMotion.matches) {
        const windup = u.bossPhase === 'windup' ? Math.max(0, 1 - u.phaseTime / 1.2) : 0;
        c.translate(windup * i * 1.5 - (u.strikes === i ? pulse * 8 : 0), 0);
      }
      if (u.bossBehavior === 'sweep' && !this.reducedMotion.matches) {
        const windup = u.bossPhase === 'windup' ? Math.max(0, 1 - u.phaseTime / 1.4) : 0;
        c.translate(windup * 4 - pulse * 10, 0);
        if (i === 1) c.rotate(-pulse * 0.06);
      }
      if (u.bossBehavior === 'guard' && u.bossPhase === 'windup' && !this.reducedMotion.matches) {
        c.rotate(-Math.max(0, 1 - u.phaseTime) * 0.05);
      }
      c.drawImage(stroke, -size / 2, -size * 0.94, size, size * 1.1);
      c.restore();
    });
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
    c.save();
    c.transform(1, 0.13, -0.8, -0.25, 0, 0);
    c.globalAlpha = 0.3; c.filter = 'blur(1px)';
    c.drawImage(this.baseSprite, -55, -106, 110, 121);
    c.restore();
    c.drawImage(this.baseSprite, -55, -106, 110, 121);
    c.restore();
  }
  unit(u) {
    const c = this.ctx;
    const sprite = this.sprites[u.glyph];
    const lane = (u.id % 3) * 11;
    const walk = u.moving && !this.reducedMotion.matches ? Math.sin(u.stride) : 0;
    const phase = u.action > 0 ? 1 - u.action / 0.38 : 0;
    const motion = this.reducedMotion.matches ? 0 : Math.sin(phase * Math.PI * 2);
    const hit = this.effects.some(e => e.type === 'hit' && e.targetIds?.includes(u.id) && e.life < 0.12);
    const size = u.obstacle ? 36 : u.boss ? 125 : 79;
    const x = u.x + motion * 7 * u.side;
    const y = 290 + lane - Math.abs(walk) * 2;
    // 投影影は一度だけ描き、人数が増えても毎フレームぼかし処理を重ねない。
    c.save();
    c.globalAlpha = u.writingLeft > 0 ? 0.5 : 1;
    c.drawImage(this.shadows[u.glyph], x - size * 0.9, 290 + lane - size * 0.8, size * 3.2, size * 1.4);
    c.restore();
    c.save();
    c.translate(x + (hit ? -u.side * 3 : 0), y);
    const tilt = [0.12, 0.08, -0.09, 0.13, 0.045][Math.max(0, u.kind) % 5];
    c.rotate(walk * 0.017 + motion * tilt * u.side);
    c.scale(1 + Math.abs(motion) * 0.025, 1 - Math.abs(motion) * 0.025);
    if (u.bossBehavior === 'guard' && !this.reducedMotion.matches) {
      if (u.bossPhase === 'guard') c.scale(0.96, 1.025);
      if (u.bossPhase === 'recovery') c.rotate(0.07);
    }
    c.globalAlpha = hit ? 0.65 : 0.95;
    const progress = u.writingLeft > 0 ? 1 - u.writingLeft / u.writingDuration
      : u.age != null && u.age < 0.4 ? u.age / 0.4 : 1;
    if (progress < 1 && !this.reducedMotion.matches) this.drawWriting(u, size, progress);
    else {
      if (u.writingLeft > 0) c.globalAlpha *= 0.45;
      this.drawStrokes(u, size, phase);
    }
    c.restore();
    if (u.bossPhase || u.writingLeft > 0 || u.obstacle) {
      const label = u.writingLeft > 0 ? `書きかけ ${Math.ceil(u.writingLeft)}秒`
        : u.obstacle ? `読点 ${Math.ceil(u.ttl)}秒` : bossStatus(u);
      c.save();
      c.font = '13px serif'; c.textAlign = 'center';
      c.fillStyle = '#faf6ede8'; const width = c.measureText(label).width + 18;
      c.fillRect(x - width / 2, y - size - 22, width, 22);
      c.fillStyle = INK; c.fillText(label, x, y - size - 6);
      c.restore();
    }
    if (u.hp < u.maxHp) {
      c.fillStyle = '#695e4e22'; c.fillRect(x - 13, 303 + lane, 26, 1.5);
      c.fillStyle = '#695e4e88'; c.fillRect(x - 13, 303 + lane, 26 * Math.max(0, u.hp / u.maxHp), 1.5);
    }
  }
}
