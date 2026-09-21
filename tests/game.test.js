import test from "node:test";
import assert from "node:assert/strict";
import { Battle, HEROES, heroesFor, upgradeChoices, STAGES } from "../src/game.js";
const run = (b, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 60) b.update(1 / 60);
};
test("開始前と停止中は進行せず召喚できない", () => {
  const b = new Battle();
  assert.equal(b.summon(0), false);
  run(b, 3);
  assert.equal(b.time, 0);
  b.start();
  b.status = "paused";
  run(b, 3);
  assert.equal(b.time, 0);
  assert.equal(b.upgrade(), false);
});
test("召喚コスト、待機時間、人数制限を守る", () => {
  const b = new Battle();
  b.start();
  assert.ok(b.summon(0));
  assert.equal(b.ink, 180);
  assert.equal(b.summon(0), false);
  run(b, 4.1);
  assert.ok(b.summon(0));
  b.ink = 500;
  b.cooldowns.fill(0);
  while (b.units.filter((u) => u.side === 1).length < 30) b.addUnit(1, 1);
  assert.equal(b.summon(1), false);
});
test("鉛筆回復と強化の上限", () => {
  const b = new Battle();
  b.start();
  assert.ok(b.upgrade());
  assert.equal(b.level, 2);
  assert.equal(b.capacity, 700);
  b.ink = 5000;
  while (b.level < 5) assert.ok(b.upgrade());
  assert.equal(b.upgrade(), false);
  run(b, 1);
  assert.ok(b.ink <= b.capacity);
});
test("消しゴムのチャージ、押し戻し、撃破報酬", () => {
  const b = new Battle();
  b.start();
  assert.equal(b.cast(), false);
  const enemy = b.addUnit(0, -1);
  enemy.x = 500;
  b.skill = 30;
  assert.ok(b.cast());
  assert.equal(b.skill, 0);
  assert.equal(b.kills, 1);
  assert.equal(b.units.length, 0);
  assert.equal(b.enemyHp, 1400);
});
test("文字の範囲攻撃と押し戻し", () => {
  const b = new Battle();
  b.start();
  const a = b.addUnit(0, 1),
    e = b.addUnit(0, -1),
    e2 = b.addUnit(1, -1);
  a.x = 500;
  a.timer = 0;
  e.x = 550;
  e2.x = 570;
  b.update(1 / 60);
  assert.ok(e.hp < e.maxHp);
  assert.ok(e2.hp < e2.maxHp);
  b.units = [];
  const cross = b.addUnit(3, 1),
    target = b.addUnit(1, -1);
  cross.x = 500;
  cross.timer = 0;
  target.x = 580;
  b.update(1 / 60);
  assert.ok(target.x > 600);
});
test("勝利と敗北は一度だけ通知", () => {
  for (const [hp, status] of [
    ["enemyHp", "won"],
    ["homeHp", "lost"],
  ]) {
    const events = [],
      b = new Battle(0, (e) => events.push(e));
    b.start();
    if (hp === "enemyHp") {
      b.spawnBoss();
      b.units.find(u => u.boss).hp = 0;
    }
    b[hp] = 0;
    run(b, 1);
    assert.equal(b.status, status);
    assert.equal(events.filter((e) => e.type === status).length, 1);
  }
});
for (let stage = 0; stage < STAGES.length; stage++)
  test(`ページ${stage + 1}は通常操作で攻略できる`, () => {
    const b = new Battle(stage);
    b.start();
    for (let i = 0; i < 60 * 300 && b.status === "playing"; i++) {
      if (b.level < 3 && b.ink > b.upgradeCost + 100) b.upgrade();
      for (const kind of [4, 0, 2, 1, 3]) b.summon(kind);
      b.cast();
      b.update(1 / 60);
    }
    assert.equal(
      b.status,
      "won",
      `time=${b.time}, base=${b.homeHp}, enemy=${b.enemyHp}`,
    );
  });
test("操作しないと敗北する", () => {
  const b = new Battle();
  b.start();
  run(b, 300);
  assert.equal(b.status, "lost");
});
test("全ウェーブを通して5種の敵が登場する", () => {
  const b = new Battle();
  b.start();
  b.homeHp = 100000;
  const kinds = new Set();
  for (let i = 0; i < 60 * 100; i++) {
    b.update(1 / 60);
    for (const u of b.units) kinds.add(u.kind);
  }
  assert.equal(kinds.size, 5);
});

test('隣の行から重複なしの3択を選び、役割とコストを保って強化する', () => {
  const ranks = [0, 1, 2, 0, 1];
  const expected = ['か', 'し', 'つ', 'け', 'そ'];
  const seen = new Set();
  for (let n = 0; n < 20; n++) {
    const choices = upgradeChoices(ranks, () => n / 20);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(c => c.kind)).size, 3);
    choices.forEach(c => { assert.equal(c.glyph, expected[c.kind]); seen.add(c.glyph); });
  }
  assert.equal(seen.size, 5);
  const heroes = heroesFor([1, 2, 3, 0, 0]);
  assert.equal(heroes[0].glyph, 'か');
  assert.equal(heroes[0].hp, HEROES[0].hp * 1.08);
  assert.equal(heroes[2].attack, HEROES[2].attack * 1.24);
  assert.equal(heroes[0].cost, HEROES[0].cost);
  const b = new Battle(1, () => {}, [1, 0, 0, 0, 0]);
  b.start(); b.summon(0);
  assert.equal(b.units[0].glyph, 'か');
  assert.equal(b.units[0].attack, heroes[0].attack);
});
for (let stage = 0; stage < 3; stage++) {
  test(`ページ${stage + 1}のボスは${'EFG'[stage]}一体、過去のボスは通常敵`, () => {
    const events = [];
    const b = new Battle(stage, e => events.push(e));
    b.start(); b.homeHp = 1e8;
    run(b, 130);
    const bosses = b.units.filter(u => u.boss);
    assert.equal(bosses.length, 1);
    assert.equal(bosses[0].glyph, 'EFG'[stage]);
    assert.equal(events.filter(e => e.type === 'boss').length, 1);
    const normal = new Set(b.units.filter(u => !u.boss).map(u => u.glyph));
    assert.deepEqual([...normal].sort(), [...'ABCDEF'.slice(0, 4 + stage)]);
  });
}
test('早く拠点を削ってもボス撃破が必要で、ボス撃破だけでも勝利しない', () => {
  const b = new Battle(); b.start(); b.enemyHp = 0; b.resolve();
  assert.equal(b.status, 'playing');
  assert.equal(b.units.filter(u => u.boss).length, 1);
  b.resolve(); assert.equal(b.units.length, 1);
  b.units[0].hp = 0; b.resolve(); assert.equal(b.status, 'won');
  const c = new Battle(); c.start(); c.spawnBoss(); c.units[0].hp = 0; c.resolve();
  assert.equal(c.status, 'playing');
});

test('個別ウェーブは予告時刻と間隔で出現し、停止中は進まない', () => {
  const events = [], b = new Battle(1, e => events.push(e));
  b.start();
  run(b, 2.9);
  assert.equal(b.units.length, 0);
  assert.equal(b.nextWave.at, 3);
  run(b, 0.2);
  assert.equal(b.wave, 1);
  assert.equal(b.units.length, 1);
  assert.equal(b.units[0].glyph, 'A');
  assert.match(events.find(e => e.type === 'wave').label, /折り目/);
  b.status = 'paused';
  const time = b.time, queued = structuredClone(b.queue);
  run(b, 10);
  assert.equal(b.time, time);
  assert.deepEqual(b.queue, queued);
  b.status = 'playing';
  run(b, 4.6);
  assert.deepEqual(b.units.map(u => u.glyph), ['A', 'A', 'B']);
  assert.equal(b.nextWave.at, 19);
});

test('折り目の中だけ敵味方とも半速になり、境界をまたいでも移動時間が正しい', () => {
  const b = new Battle(1);
  for (const side of [1, -1]) {
    const u = b.addUnit(0, side);
    u.speed = 100;
    u.x = 600;
    assert.equal(b.moveDistance(u, 0.1), 5);
    u.x = side === 1 ? 540 : 660;
    assert.equal(b.moveDistance(u, 0.2), 15);
    u.x = side === 1 ? 645 : 555;
    assert.equal(b.moveDistance(u, 0.2), 15);
    u.x = side === 1 ? 660 : 540;
    assert.equal(b.moveDistance(u, 0.2), 20);
    const firstPage = new Battle(0);
    u.x = 600;
    assert.equal(firstPage.moveDistance(u, 0.2), 20);
  }
});

test('折り目は攻撃間隔・射程・押し戻しに影響しない', () => {
  const scenarios = [0, 1].map(stage => {
    const b = new Battle(stage); b.start();
    const hero = b.addUnit(3, 1), enemy = b.addUnit(1, -1);
    hero.x = 560; enemy.x = 620; hero.timer = 0; enemy.timer = 10; enemy.speed = 0;
    b.update(1 / 60);
    return { hero, enemy, damage: enemy.maxHp - enemy.hp };
  });
  assert.equal(scenarios[0].hero.timer, scenarios[1].hero.timer);
  assert.equal(scenarios[0].hero.range, scenarios[1].hero.range);
  assert.equal(scenarios[0].damage, scenarios[1].damage);
  assert.equal(scenarios[1].enemy.x, 644);
});

function bossEncounter() {
  const events = [], b = new Battle(0, e => events.push(e));
  b.start(); b.wave = b.config.waves;
  b.spawnBoss();
  const boss = b.units[0]; boss.x = 700; boss.timer = 0;
  const hero = b.addUnit(4, 1); hero.x = 510; hero.speed = 0; hero.timer = 100;
  b.update(1 / 60);
  return { b, boss, hero, events };
}

test('Eは1.2秒予告し、三回だけ攻撃した後2.5秒休止する', () => {
  const { b, boss, hero, events } = bossEncounter();
  assert.equal(boss.bossPhase, 'windup');
  const hp = hero.hp;
  run(b, 1.1);
  assert.equal(hero.hp, hp);
  run(b, 0.75);
  assert.equal(events.filter(e => e.type === 'hit').length, 3);
  assert.ok(Math.abs(hero.hp - (hp - boss.attack * 1.8)) < 1e-8);
  assert.equal(boss.bossPhase, 'recovery');
  const after = hero.hp, x = boss.x;
  run(b, 2.3);
  assert.equal(hero.hp, after);
  assert.equal(boss.x, x);
  assert.equal(events.filter(e => e.type === 'bossRecovery').length, 1);
  run(b, 0.5);
  assert.equal(boss.bossPhase, 'windup');
});

test('ボスの予告と三連撃は停止中に進まず、再開後に続く', () => {
  const { b, boss, hero } = bossEncounter();
  run(b, 0.5);
  b.status = 'paused';
  const remaining = boss.phaseTime, hp = hero.hp;
  run(b, 10);
  assert.equal(boss.phaseTime, remaining);
  assert.equal(hero.hp, hp);
  b.status = 'playing';
  run(b, 0.8);
  assert.ok(hero.hp < hp);
});

test('消しゴムでEを射程外へ押し戻すと予告済みの攻撃も空振りする', () => {
  const { b, boss, hero, events } = bossEncounter();
  const hp = hero.hp;
  b.skill = 30; b.cast();
  assert.equal(boss.x, 765);
  run(b, 1.85);
  assert.equal(hero.hp, hp);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
  assert.equal(boss.bossPhase, 'recovery');
});

test('予告中にボスを倒すと三連撃は発生しない', () => {
  const { b, boss, hero, events } = bossEncounter();
  const hp = hero.hp;
  boss.hp = 1; b.skill = 30; b.cast();
  run(b, 2);
  assert.equal(hero.hp, hp);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
  assert.ok(b.bossDefeated);
});

test('ボスEの三連撃は拠点にも適用され、通常のEは予告行動を使わない', () => {
  const { b, boss } = bossEncounter();
  b.units = [boss]; boss.x = 300;
  const hp = b.homeHp;
  run(b, 1.85);
  assert.ok(Math.abs(b.homeHp - (hp - boss.attack * 1.8)) < 1e-8);
  const c = new Battle(1); c.start();
  const e = c.addUnit(4, -1); e.x = 300; e.timer = 0;
  c.update(1 / 60);
  assert.equal(e.bossPhase, null);
  assert.equal(c.homeHp, 2000 - e.attack);
});


// 第2章も初期編成から攻略でき、章をまたいだ育成の持ち込みを前提にしない。
test('章内は育成を引き継ぎ、章末と最終ページではリセットする', async () => {
  const { CHAPTERS, isChapterEnd, nextLoadout } = await import('../src/stages.js');
  assert.equal(CHAPTERS.length, 4);
  assert.equal(STAGES.length, 12);
  assert.deepEqual(STAGES.map(s => s.chapter), [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
  const ranks = [1, 1, 0, 0, 1];
  assert.deepEqual(nextLoadout(1, ranks), ranks);
  assert.notEqual(nextLoadout(1, ranks), ranks);
  assert.deepEqual(nextLoadout(2, ranks), [0, 0, 0, 0, 0]);
  assert.deepEqual(nextLoadout(5, ranks), [0, 0, 0, 0, 0]);
  assert.ok(isChapterEnd(2)); assert.ok(isChapterEnd(5));
  assert.equal(isChapterEnd(3), false);
});

function specialEncounter(stage, heroX = 590) {
  const events = [], b = new Battle(stage, e => events.push(e));
  b.start(); b.wave = b.config.waves; b.spawnBoss();
  const boss = b.units[0]; boss.x = 700; boss.timer = 0;
  const hero = b.addUnit(4, 1); hero.x = heroX; hero.speed = 0; hero.timer = 100;
  b.update(1 / 60);
  return { b, boss, hero, events };
}

test('Fは予兆後に射程内の前衛だけをまとめて押し戻す', () => {
  const { b, boss, hero, events } = specialEncounter(1);
  const second = b.addUnit(4, 1); second.x = 570; second.speed = 0; second.timer = 100;
  const rear = b.addUnit(2, 1); rear.x = 480; rear.speed = 0; rear.timer = 100;
  const hp = hero.hp;
  run(b, 1.3);
  assert.equal(hero.hp, hp); assert.equal(hero.x, 590);
  run(b, 0.15);
  assert.equal(hero.x, 505); assert.equal(second.x, 485); assert.equal(rear.x, 480);
  assert.equal(rear.hp, rear.maxHp);
  assert.ok(Math.abs(hero.hp - (hp - boss.attack * 1.4)) < 1e-8);
  assert.equal(events.filter(e => e.type === 'hit').length, 2);
  assert.equal(boss.bossPhase, 'recovery');
  const x = boss.x, after = hero.hp;
  run(b, 2);
  assert.equal(boss.x, x); assert.equal(hero.hp, after);
});

test('Fは消しゴムで射程外に出ると空振りし、停止中は予兆が進まない', () => {
  const { b, boss, hero, events } = specialEncounter(4, 550);
  const remaining = boss.phaseTime;
  b.status = 'paused'; run(b, 10); assert.equal(boss.phaseTime, remaining);
  b.status = 'playing'; b.skill = 30; b.cast();
  run(b, 1.5);
  assert.equal(hero.hp, hero.maxHp); assert.equal(hero.x, 550);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
  assert.equal(boss.bossPhase, 'recovery');
});

test('Gは接敵時に防御、構え、突き、3秒の隙を順番に繰り返す', () => {
  const { b, boss, hero, events } = specialEncounter(2);
  assert.equal(boss.bossPhase, 'guard');
  const hp = hero.hp;
  run(b, 2.25); assert.equal(hero.hp, hp); assert.equal(boss.bossPhase, 'guard');
  run(b, 0.2); assert.equal(boss.bossPhase, 'windup');
  assert.equal(hero.hp, hp);
  run(b, 1); assert.equal(boss.bossPhase, 'recovery');
  assert.ok(Math.abs(hero.hp - (hp - boss.attack * 1.4)) < 1e-8);
  assert.equal(events.filter(e => e.type === 'hit').length, 1);
  run(b, 2.85); assert.equal(boss.bossPhase, 'recovery');
  run(b, 0.2); assert.equal(boss.bossPhase, 'guard');
});

test('Gの防御と隙は通常攻撃・範囲攻撃・消しゴムすべてに適用される', () => {
  for (const [phase, multiplier] of [['guard', 0.35], ['windup', 1], ['recovery', 1.5]]) {
    const { b, boss } = specialEncounter(2);
    boss.bossPhase = phase;
    const hp = boss.hp;
    const attacker = b.addUnit(0, 1);
    b.attackTarget(attacker, boss, [boss], boss.x);
    assert.ok(Math.abs(boss.hp - (hp - attacker.attack * multiplier)) < 1e-8);
    const victim = b.addUnit(0, -1); victim.x = boss.x - 10;
    const afterHit = boss.hp;
    b.attackTarget(attacker, victim, [victim, boss], victim.x);
    assert.ok(Math.abs(boss.hp - (afterHit - attacker.attack * 0.65 * multiplier)) < 1e-8);
    const beforeSkill = boss.hp;
    b.skill = 30; b.cast();
    assert.ok(Math.abs(boss.hp - (beforeSkill - 240 * multiplier)) < 1e-8);
  }
});

test('Gの防御時間は停止で凍結し、倒されたボスは攻撃しない', () => {
  const { b, boss, hero, events } = specialEncounter(5);
  const remaining = boss.phaseTime;
  b.status = 'paused'; run(b, 8);
  assert.equal(boss.phaseTime, remaining);
  b.status = 'playing'; boss.hp = 1; b.skill = 30; b.cast(); run(b, 5);
  assert.equal(hero.hp, hero.maxHp);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
});

test('通常のF・Gにはボスの押し戻しや防御が付かない', () => {
  const b = new Battle(5); b.start(); b.wave = b.config.waves;
  const f = b.addUnit(5, -1), g = b.addUnit(6, -1), hero = b.addUnit(4, 1);
  f.x = 650; g.x = 1100; hero.x = 560; hero.speed = 0; hero.timer = 100; f.timer = 0;
  b.update(1 / 60);
  assert.equal(hero.x, 560); assert.equal(f.bossPhase, null); assert.equal(g.bossPhase, null);
  const hp = g.hp; b.damageUnit(g, 100); assert.equal(g.hp, hp - 100);
});


test('12ページの編成・ボス・章境界に未定義の文字がない', async () => {
  const { ENEMIES } = await import('../src/game.js');
  const { LETTERS } = await import('../src/letters.js');
  for (const s of STAGES) {
    assert.ok(LETTERS[ENEMIES[s.boss.kind].glyph]);
    assert.ok(s.wavePlan.every((w, i) => w.at >= 0 && w.spacing > 0 && (!i || w.at > s.wavePlan[i - 1].at)));
    for (const w of s.wavePlan) for (const k of w.enemies) assert.ok(LETTERS[ENEMIES[k]?.glyph]);
  }
});

test('書きかけは完成まで移動・攻撃せず、完成前にも倒せる', () => {
  const b = new Battle(6); b.start(); run(b, 3.1);
  const enemy = b.units[0]; assert.ok(enemy.writingLeft > 3.8);
  const x = enemy.x;
  const hero = b.addUnit(4, 1); hero.x = x - 20; hero.speed = 0; hero.timer = 100;
  run(b, 3.5);
  assert.equal(enemy.x, x); assert.equal(hero.hp, hero.maxHp);
  b.status = 'paused'; const left = enemy.writingLeft; run(b, 8);
  assert.equal(enemy.writingLeft, left);
  b.status = 'playing'; b.skill = 30; b.cast();
  assert.ok(!b.units.includes(enemy)); assert.ok(b.kills >= 1);
});

test('書きかけは時間経過で通常の敵として動き出す', () => {
  const b = new Battle(6); b.start(); run(b, 3.1);
  const enemy = b.units[0], x = enemy.x;
  run(b, 4.1);
  assert.equal(enemy.writingLeft, 0); assert.ok(enemy.x < x);
});

test('Hの読点は攻撃対象となり、8秒で消えるが撃破報酬を出さない', () => {
  const b = new Battle(7); b.start(); b.wave = b.config.waves;
  const h = b.addUnit(7, -1); h.speed = 0; h.x = 600;
  run(b, 3.1);
  const comma = b.units.find(u => u.obstacle);
  assert.ok(comma); assert.equal(comma.glyph, '、'); assert.equal(comma.x, 500);
  const hero = b.addUnit(0, 1); hero.x = 450; hero.timer = 0;
  b.update(1 / 60); assert.ok(comma.hp < 80);
  hero.timer = 100; hero.speed = 0; h.punctuationTimer = 100;
  const kills = b.kills;
  b.status = 'paused'; const ttl = comma.ttl; run(b, 9); assert.equal(comma.ttl, ttl);
  b.status = 'playing'; run(b, 8.1);
  assert.ok(!b.units.includes(comma)); assert.equal(b.kills, kills);
});

test('読点は5個まで、消しゴムで消せて鉛筆の稼ぎにはならない', () => {
  const b = new Battle(7); b.start(); const h = b.addUnit(7, -1);
  for (let i = 0; i < 10; i++) b.addComma(h);
  assert.equal(b.units.filter(u => u.obstacle).length, 5);
  b.units = b.units.filter(u => u.obstacle);
  const ink = b.ink; b.skill = 30; b.cast();
  assert.equal(b.units.length, 0); assert.equal(b.kills, 0); assert.equal(b.ink, ink);
});

test('育成した範囲攻撃と押し戻しは初期編成より届く', () => {
  for (const rank of [0, 1]) {
    const b = new Battle(0, () => {}, [rank, 0, 0, rank, 0]); b.start();
    const hero = b.addUnit(0, 1), first = b.addUnit(3, -1), second = b.addUnit(3, -1);
    hero.x = 450; first.x = 500; second.x = 590;
    b.attackTarget(hero, first, [first, second], first.x);
    assert.equal(second.hp < second.maxHp, Boolean(rank));
    const cross = b.addUnit(3, 1); first.x = 500;
    b.attackTarget(cross, first, [first], first.x);
    assert.equal(first.x, 524 + rank * 8);
  }
});

test('速攻の強化は出撃後4秒のみ、遠距離の強化は射程に反映する', () => {
  const b = new Battle(0, () => {}, [0, 2, 2, 0, 0]);
  const fast = b.addUnit(1, 1); fast.age = 1;
  assert.equal(b.moveDistance(fast, 1), fast.speed * 1.3);
  fast.age = 4; assert.equal(b.moveDistance(fast, 1), fast.speed);
  const ranged = b.addUnit(2, 1); assert.equal(ranged.range, HEROES[2].range + 24);
});

test('守りの強化は最初の被弾だけを軽減し、再召喚で復活する', () => {
  const b = new Battle(0, () => {}, [0, 0, 0, 0, 2]);
  const defender = b.addUnit(4, 1);
  assert.equal(b.damageUnit(defender, 100), 70);
  assert.equal(b.damageUnit(defender, 100), 100);
  assert.equal(b.damageUnit(b.addUnit(4, 1), 100), 70);
});

test('Zは半分以下でも予兆を打ち切らず、休止後に払い・守り・三連撃へ切り替わる', () => {
  const { b, boss, hero } = specialEncounter(11);
  assert.ok(boss.finale); assert.equal(boss.glyph, 'Z');
  assert.equal(boss.bossBehavior, 'triple');
  boss.hp = boss.maxHp * 0.49; hero.hp = hero.maxHp = 1e6;
  run(b, 1); assert.equal(boss.bossBehavior, 'triple');
  run(b, 3.5); assert.equal(boss.bossBehavior, 'sweep');
  hero.x = boss.x - 100;
  run(b, 4); assert.equal(boss.bossBehavior, 'guard');
  hero.x = boss.x - 100;
  run(b, 6.8); assert.equal(boss.bossBehavior, 'triple');
});

test('最終ボスZを倒しても拠点が残れば終了せず、勝利通知は一回だけ', () => {
  const events = [], b = new Battle(11, e => events.push(e)); b.start();
  b.spawnBoss(); b.units[0].hp = 0; b.resolve(); assert.equal(b.status, 'playing');
  b.enemyHp = 0; b.resolve(); b.resolve();
  assert.equal(b.status, 'won'); assert.equal(events.filter(e => e.type === 'won').length, 1);
});
