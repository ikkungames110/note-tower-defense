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
      "二本の払いを交互に振り下ろす、すばやい連撃。少ないインクでどんどん出撃！",
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
export const STAGES = [
  {
    name: "はじまりの1ページ",
    subtitle: "まずは、余白からはじめよう。",
    hp: 1500,
    waves: 5,
    interval: 17,
    strength: 1,
  },
  {
    name: "放課後のらくがき",
    subtitle: "ページのすみで、大さわぎ。",
    hp: 2200,
    waves: 6,
    interval: 16,
    strength: 1.2,
  },
  {
    name: "さいごの見開き",
    subtitle: "このノートの、主役になろう。",
    hp: 3000,
    waves: 7,
    interval: 15,
    strength: 1.4,
  },
];
export class Battle {
  constructor(stage = 0, onEvent = () => {}) {
    this.stage = stage;
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
    const h = HEROES[kind];
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
  addUnit(kind, side) {
    const h = (side === 1 ? HEROES : ENEMIES)[kind],
      k = side === 1 ? 1 : this.config.strength;
    const u = {
      ...h,
      id: this.nextId++,
      kind,
      side,
      x: side === 1 ? 145 : 1055,
      hp: h.hp * k,
      maxHp: h.hp * k,
      attack: h.attack * k,
      timer: 0.35,
      action: 0,
      stride: 0,
      moving: false,
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
    for (const u of this.units)
      if (u.side === -1) {
        u.hp -= 240;
        u.x = Math.min(1055, u.x + 65);
      }
    this.enemyHp = Math.max(0, this.enemyHp - 100);
    this.onEvent({ type: "skill" });
    this.resolve();
    return true;
  }
  resolve() {
    for (const u of this.units)
      if (u.hp <= 0) {
        if (u.side === -1) {
          this.kills++;
          this.ink = Math.min(this.capacity, this.ink + 22 + u.kind * 9);
        }
        this.onEvent({ type: "defeat", x: u.x, side: u.side, kind: u.kind });
      }
    this.units = this.units.filter((u) => u.hp > 0);
    if (this.homeHp <= 0 || this.enemyHp <= 0) {
      this.status = this.homeHp <= 0 ? "lost" : "won";
      this.onEvent({ type: this.status });
    }
  }
  update(dt) {
    if (this.status !== "playing") return;
    this.time += dt;
    this.ink = Math.min(this.capacity, this.ink + this.income * dt);
    this.skill = Math.min(30, this.skill + dt);
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    if (
      this.wave < this.config.waves &&
      this.time >= 3 + this.wave * this.config.interval
    ) {
      this.wave++;
      const count = 2 + this.wave + this.stage;
      for (let i = 0; i < count; i++)
        this.queue.push({
          at: this.time + i * 2.3,
          kind:
            i === count - 1 && this.wave === this.config.waves
              ? 4
              : (i + this.wave - 1) % Math.min(4, 1 + this.wave),
        });
      this.onEvent({ type: "wave", wave: this.wave });
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
      if (inRange || baseInRange) {
        if (u.timer <= 0) {
          u.timer = u.interval;
          u.action = 0.38;
          const x = inRange ? target.x : base;
          if (inRange) {
            target.hp -= u.attack;
            if (u.side === 1 && u.kind === 0)
              for (const v of foes)
                if (v !== target && Math.abs(v.x - target.x) < 80)
                  v.hp -= u.attack * 0.65;
            if (u.side === 1 && u.kind === 3)
              target.x = Math.min(1055, target.x + 24);
          } else if (u.side === 1)
            this.enemyHp = Math.max(0, this.enemyHp - u.attack);
          else this.homeHp = Math.max(0, this.homeHp - u.attack);
          this.onEvent({
            type: "hit",
            from: u.x,
            x,
            amount: Math.round(u.attack),
            kind: u.kind,
            side: u.side,
          });
        }
      } else {
        u.x += u.speed * dt * u.side;
        u.stride += (u.speed * dt) / 12;
        u.moving = true;
      }
    }
    this.resolve();
  }
}
