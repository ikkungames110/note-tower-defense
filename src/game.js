import { STAGES } from './stages.js';
export { STAGES } from './stages.js';
export const HEROES = [
  {
    glyph: "あ",
    name: "ぐるぐる斬り",
    role: "範囲攻撃",
    color: "#397b77",
    cost: 100,
    hp: 260,
    attack: 36,
    range: 65,
    speed: 35,
    interval: 1.5,
    cooldown: 4,
    description:
      "おなかの輪をぐるんと回し、近くの敵をまとめて斬る。前線の頼れる一文字。",
  },
  {
    glyph: "い",
    name: "にほんの連撃",
    role: "速攻",
    color: "#bd7735",
    cost: 60,
    hp: 140,
    attack: 23,
    range: 45,
    speed: 57,
    interval: 0.65,
    cooldown: 2.5,
    description:
      "二本の払いを交互に振り下ろす、すばやい連撃。少ない鉛筆でどんどん出撃！",
  },
  {
    glyph: "う",
    name: "まがり弾",
    role: "遠距離",
    color: "#6385b8",
    cost: 140,
    hp: 135,
    attack: 42,
    range: 220,
    speed: 28,
    interval: 1.8,
    cooldown: 6,
    description:
      "頭の点を、曲線に沿ってぽーんと飛ばす。仲間の後ろから遠くの敵を狙う。",
  },
  {
    glyph: "え",
    name: "クロス払い",
    role: "押し戻し",
    color: "#a078ab",
    cost: 180,
    hp: 240,
    attack: 48,
    range: 110,
    speed: 30,
    interval: 2,
    cooldown: 7,
    description:
      "交差する線から大きなバツを描き、敵を後ろに押し戻す。ピンチの前線を立て直す。",
  },
  {
    glyph: "お",
    name: "まるっとガード",
    role: "守り",
    color: "#cd7376",
    cost: 220,
    hp: 850,
    attack: 27,
    range: 50,
    speed: 21,
    interval: 1.8,
    cooldown: 9,
    description:
      "大きな輪を盾にして、どっしり前線を守る。右上の点でカウンターパンチ！",
  },
];
export const ENEMIES = [
  {
    glyph: "A",
    name: "とんがり突き",
    hp: 120,
    attack: 17,
    range: 43,
    speed: 29,
    interval: 1.3,
    description: "三角の先端を突き出して進む基本の敵。",
  },
  {
    glyph: "B",
    name: "ダブルバウンド",
    hp: 240,
    attack: 30,
    range: 55,
    speed: 22,
    interval: 1.6,
    description: "二つのふくらみを弾ませて体当たり。",
  },
  {
    glyph: "C",
    name: "カーブカッター",
    hp: 130,
    attack: 25,
    range: 170,
    speed: 25,
    interval: 1.8,
    description: "開いた輪から三日月の刃を放つ遠距離タイプ。",
  },
  {
    glyph: "D",
    name: "アーチシールド",
    hp: 680,
    attack: 36,
    range: 48,
    speed: 17,
    interval: 2,
    description: "大きなアーチで攻撃を受け止める、頑丈な壁。",
  },
  {
    glyph: "E",
    name: "さんぼんビーム",
    hp: 350,
    attack: 48,
    range: 200,
    speed: 20,
    interval: 2.5,
    description: "三本の横線をビームにして飛ばす強敵。",
  },
];
// 同じ母音の次の行へ。全3ページの一周で最大3回進化する。
export const EVOLUTION = ['あかさた', 'いきしち', 'うくすつ', 'えけせて', 'おこそと'];
export function heroesFor(ranks = [0, 0, 0, 0, 0]) {
  return HEROES.map((h, i) => {
    const rank = Math.max(0, Math.min(3, Math.trunc(ranks[i] || 0)));
    return { ...h, glyph: EVOLUTION[i][rank], hp: h.hp * (1 + rank * 0.08), attack: h.attack * (1 + rank * 0.08), rank };
  });
}
export function upgradeChoices(ranks, random = Math.random) {
  const candidates = heroesFor(ranks).flatMap((h, kind) => h.rank < 3 ? [{ kind, from: h.glyph, glyph: EVOLUTION[kind][h.rank + 1] }] : []);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, 3);
}
ENEMIES.push(
  { glyph: 'F', name: 'ふたすじ払い', hp: 380, attack: 46, range: 155, speed: 23, interval: 2.2, description: '二本の横線を払って、前線へ迫る。' },
  { glyph: 'G', name: 'うずまき突き', hp: 420, attack: 50, range: 125, speed: 22, interval: 2.3, description: '大きく曲がった輪から内側の線を突き出す。' },
);
export class Battle {
  constructor(stage = 0, onEvent = () => {}, ranks = [0, 0, 0, 0, 0]) {
    this.stage = stage;
    this.heroes = heroesFor(ranks);
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.config = STAGES[stage];
    this.onEvent = onEvent;
    this.status = "ready";
    this.time = 0;
    this.ink = 280;
    this.level = 1;
    this.homeHp = 2000;
    this.enemyHp = this.config.hp;
    this.units = [];
    this.cooldowns = HEROES.map(() => 0);
    this.wave = 0;
    this.queue = [];
    this.skill = 0;
    this.kills = 0;
    this.nextId = 0;
  }
  get capacity() {
    return 500 + (this.level - 1) * 200;
  }
  get income() {
    return 19 + (this.level - 1) * 8;
  }
  get upgradeCost() {
    return 100 + (this.level - 1) * 80;
  }
  start() {
    if (this.status === "ready") this.status = "playing";
  }
  summon(kind) {
    const h = this.heroes[kind];
    if (
      this.status !== "playing" ||
      !h ||
      this.ink < h.cost ||
      this.cooldowns[kind] > 0 ||
      this.units.filter((u) => u.side === 1).length >= 30
    )
      return false;
    this.ink -= h.cost;
    this.cooldowns[kind] = h.cooldown;
    this.addUnit(kind, 1);
    this.onEvent({ type: "summon", x: 145, kind, side: 1 });
    return true;
  }
  addUnit(kind, side, boss = false) {
    const h = (side === 1 ? this.heroes : ENEMIES)[kind],
      k = side === 1 ? 1 : this.config.strength * (boss ? 2.2 : 1);
    const u = {
      ...h,
      boss,
      id: this.nextId++,
      kind,
      side,
      x: side === 1 ? 145 : 1055,
      hp: h.hp * k,
      maxHp: h.hp * k,
      attack: h.attack * (side === 1 ? 1 : this.config.strength * (boss ? 1.2 : 1)),
      timer: 0.35,
      action: 0,
      stride: 0,
      moving: false,
      bossPhase: null,
      phaseTime: 0,
      strikes: 0,
    };
    this.units.push(u);
    return u;
  }
  upgrade() {
    if (
      this.status !== "playing" ||
      this.level >= 5 ||
      this.ink < this.upgradeCost
    )
      return false;
    this.ink -= this.upgradeCost;
    this.level++;
    this.onEvent({ type: "upgrade" });
    return true;
  }
  cast() {
    if (this.status !== "playing" || this.skill < 30) return false;
    this.skill = 0;
    const erased = this.units.filter(u => u.side === -1).map(u => ({ ...u }));
    for (const u of this.units)
      if (u.side === -1) {
        u.hp -= 240;
        u.x = Math.min(1055, u.x + 65);
      }
    this.enemyHp = Math.max(0, this.enemyHp - 100);
    this.onEvent({ type: "skill", erased });
    this.resolve();
    return true;
  }
  resolve() {
    if (["won", "lost"].includes(this.status)) return;
    for (const u of this.units)
      if (u.hp <= 0) {
        if (u.boss) this.bossDefeated = true;
        if (u.side === -1) {
          this.kills++;
          this.ink = Math.min(this.capacity, this.ink + 22 + u.kind * 9);
        }
        this.onEvent({ type: "defeat", x: u.x, side: u.side, kind: u.kind });
      }
    this.units = this.units.filter((u) => u.hp > 0);
    // 拠点を早く削っても、ボスとの戦闘は必ず行う。
    if (this.enemyHp <= 0 && !this.bossSpawned) this.spawnBoss();
    if (this.homeHp <= 0 || (this.enemyHp <= 0 && this.bossDefeated)) {
      this.status = this.homeHp <= 0 ? "lost" : "won";
      this.onEvent({ type: this.status });
    }
  }
  spawnBoss() {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    this.addUnit(this.config.boss.kind, -1, true);
    this.onEvent({ type: "boss", glyph: ENEMIES[this.config.boss.kind].glyph });
  }
  get nextWave() {
    return this.config.wavePlan[this.wave] || null;
  }
  // 区間をまたぐフレームでも、折り目の中で費やす時間だけ減速する。
  moveDistance(u, dt) {
    if (u.speed <= 0) return 0;
    const fold = this.config.fold;
    if (!fold) return u.speed * dt;
    const entry = u.side === 1 ? fold.from : fold.to;
    const exit = u.side === 1 ? fold.to : fold.from;
    let x = u.x, remaining = dt, distance = 0;
    if ((entry - x) * u.side > 0) {
      const d = Math.min((entry - x) * u.side, u.speed * remaining);
      distance += d; x += d * u.side; remaining -= d / u.speed;
    }
    if ((exit - x) * u.side > 0 && remaining > 0) {
      const d = Math.min((exit - x) * u.side, u.speed * fold.speed * remaining);
      distance += d; remaining -= d / (u.speed * fold.speed);
    }
    return distance + u.speed * remaining;
  }
  attackTarget(u, target, foes, x, multiplier = 1) {
    const amount = u.attack * multiplier;
    const targetIds = [];
    if (target) {
      target.hp -= amount;
      targetIds.push(target.id);
      if (u.side === 1 && u.kind === 0) {
        for (const v of foes) if (v !== target && Math.abs(v.x - target.x) < 80) {
          v.hp -= amount * 0.65;
          targetIds.push(v.id);
        }
      }
      if (u.side === 1 && u.kind === 3) target.x = Math.min(1055, target.x + 24);
    } else if (u.side === 1) this.enemyHp = Math.max(0, this.enemyHp - amount);
    else this.homeHp = Math.max(0, this.homeHp - amount);
    this.onEvent({ type: 'hit', from: u.x, x, amount: Math.round(amount),
      kind: u.kind, side: u.side, attackerId: u.id, targetIds });
  }
  updateTriple(u, dt, target, baseInRange, foes) {
    if (!u.bossPhase) {
      if (u.timer > 0 || (!target && !baseInRange)) return false;
      u.bossPhase = 'windup'; u.phaseTime = 1.2; u.strikes = 0;
      this.onEvent({ type: 'bossWindup', id: u.id });
      return true;
    }
    u.phaseTime -= dt;
    if (u.phaseTime > 0) return true;
    if (u.bossPhase === 'recovery') {
      u.bossPhase = null;
      u.timer = 0.2;
      return true;
    }
    u.bossPhase = 'volley';
    u.strikes++;
    u.action = 0.24;
    if (target || baseInRange) this.attackTarget(u, target, foes, target ? target.x : 130, 0.6);
    if (u.strikes === 3) {
      u.bossPhase = 'recovery'; u.phaseTime = 2.5;
      this.onEvent({ type: 'bossRecovery', id: u.id });
    } else u.phaseTime += 0.28;
    return true;
  }
  update(dt) {
    if (this.status !== "playing") return;
    this.time += dt;
    this.ink = Math.min(this.capacity, this.ink + this.income * dt);
    this.skill = Math.min(30, this.skill + dt);
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    const next = this.config.wavePlan[this.wave];
    if (next && this.time >= next.at) {
      this.wave++;
      next.enemies.forEach((kind, i) => this.queue.push({ at: next.at + i * next.spacing, kind }));
      if (this.wave === this.config.waves && !this.bossSpawned) this.spawnBoss();
      this.onEvent({ type: "wave", wave: this.wave, label: next.label });
    }
    this.queue = this.queue.filter((s) => {
      if (this.time >= s.at) {
        this.addUnit(s.kind, -1);
        return false;
      }
      return true;
    });
    for (const u of this.units) {
      if (u.hp <= 0) continue;
      u.timer -= dt;
      u.action = Math.max(0, u.action - dt);
      u.moving = false;
      const foes = this.units
        .filter(
          (v) => v.side !== u.side && v.hp > 0 && (v.x - u.x) * u.side >= -25,
        )
        .sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x));
      const target = foes[0];
      const inRange = target && Math.abs(target.x - u.x) <= u.range;
      const base = u.side === 1 ? 1070 : 130;
      const baseInRange = Math.abs(base - u.x) <= u.range;
      if (u.boss && this.config.boss.behavior === 'triple' &&
          this.updateTriple(u, dt, inRange ? target : null, baseInRange, foes)) continue;
      if (inRange || baseInRange) {
        if (u.timer <= 0) {
          u.timer = u.interval;
          u.action = 0.38;
          const x = inRange ? target.x : base;
          this.attackTarget(u, inRange ? target : null, foes, x);
        }
      } else {
        const distance = this.moveDistance(u, dt);
        u.x += distance * u.side;
        u.stride += distance / 12;
        u.moving = true;
      }
    }
    this.resolve();
  }
}
