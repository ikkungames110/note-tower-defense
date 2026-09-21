// 開発用の比較操作。画面から読み取れる戦況だけを使い、購入資金を残す。
export function strategy({ tanks = 2, ranged = 3, splash = 2, fast = 0, economy = 2 } = {}) {
  return b => {
    const friends = b.units.filter(u => u.side === 1);
    const enemies = b.units.filter(u => u.side === -1);
    const count = kind => friends.filter(u => u.kind === kind).length;
    const danger = enemies.some(u => u.x < 400);
    const boss = enemies.find(u => u.boss);
    const guarding = boss?.bossBehavior === 'guard' && boss.bossPhase !== 'recovery';
    if (danger || boss?.bossPhase === 'recovery' || (!guarding && enemies.filter(u => !u.obstacle).length >= 7)) b.cast();
    if (b.time < 1) b.upgrade();

    if (count(1) < tanks) {
      b.summon(1);
      if (count(1) === 0) return;
    }
    if (b.level < economy && b.time >= 45 && count(1) >= tanks && count(2) + count(4) >= 2 && !danger) {
      b.upgrade();
      return;
    }
    const crowded = enemies.filter(u => u.kind === 0 || u.obstacle).length >= 4;
    if (crowded && count(2) < splash) { b.summon(2); return; }
    if (fast && count(3) < fast && (enemies.some(u => u.writingLeft > 0) || !enemies.length)) {
      b.summon(3);
      return;
    }
    if (count(4) < ranged) { b.summon(4); return; }
    if (count(2) < splash) { b.summon(2); return; }
    if (count(0) < 2) b.summon(0);
  };
}

// 各ページで維持する前衛・後衛の目安。設計意図は docs/level-design.md。
export const SOLUTIONS = [
  { tanks: 1, ranged: 2 },
  { tanks: 2, ranged: 4, economy: 3 },
  { tanks: 3, ranged: 2 },
  { tanks: 2, ranged: 4, economy: 3, fast: 1 },
  { tanks: 2, ranged: 2, fast: 1 },
  { tanks: 3, ranged: 4 },
  { tanks: 2, ranged: 4 },
  { tanks: 3, ranged: 4, fast: 1 },
  { tanks: 3, ranged: 2 },
  { tanks: 2, ranged: 4 },
  { tanks: 3, ranged: 4, fast: 1 },
  { tanks: 3, ranged: 4 },
];

// 操作は通常の召喚・強化・消しゴムだけ。時間は実ゲームと同じ1/60秒で進める。
export function simulate(battle, decide, { seconds = 360, decisionFrames = 30 } = {}) {
  battle.start();
  for (let frame = 0; frame < seconds * 60 && battle.status === 'playing'; frame++) {
    if (frame % decisionFrames === 0) decide(battle);
    battle.update(1 / 60);
  }
  return battle;
}
export function fixedOrder(order) {
  return b => {
    if (b.level < 3 && b.ink > b.upgradeCost + 100) b.upgrade();
    for (const kind of order) b.summon(kind);
    b.cast();
  };
}
export function randomOrders(seed) {
  return b => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    if (b.level < 3 && seed % 5 === 0) b.upgrade();
    const order = [0, 1, 2, 3, 4];
    for (let i = 4; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const kind of order) b.summon(kind);
    b.cast();
  };
}
