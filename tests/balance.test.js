import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, HEROES, STAGES } from '../src/game.js';
import { SOLUTIONS, strategy, simulate, fixedOrder, randomOrders } from './helpers/strategy.js';

const result = b => `page=${b.stage + 1}, ${b.status}, time=${b.time.toFixed(1)}, home=${b.homeHp.toFixed(0)}, enemy=${b.enemyHp.toFixed(0)}`;

test('あいうえおの役割と費用は左から順に並ぶ', () => {
  assert.deepEqual(HEROES.map(h => [h.glyph, h.role, h.cost]), [
    ['あ', '基本', 60], ['い', '耐久', 100], ['う', '範囲攻撃', 140], ['え', '速攻', 180], ['お', '長距離', 220],
  ]);
  assert.equal(Math.max(...HEROES.map(h => h.hp)), HEROES[1].hp);
  assert.equal(Math.max(...HEROES.map(h => h.speed)), HEROES[3].speed);
  assert.equal(Math.max(...HEROES.map(h => h.range)), HEROES[4].range);
});

for (let stage = 0; stage < STAGES.length; stage++) {
  test(`ページ${stage + 1}は役割を選び資源を残せば初期編成で攻略できる`, () => {
    const b = simulate(new Battle(stage), strategy(SOLUTIONS[stage]));
    assert.equal(b.status, 'won', result(b));
  });
  test(`ページ${stage + 1}は単種連打・固定順・ランダム召喚では突破できない`, () => {
    const orders = [[0], [1], [2], [3], [4], [0, 1, 2, 3, 4], [4, 0, 2, 1, 3]];
    for (const order of orders) {
      const b = simulate(new Battle(stage), fixedOrder(order), {seconds: 600});
      assert.equal(b.status, 'lost', `${order}: ${result(b)}`);
    }
    // 毎回同じ乱数列で検証する。敵を見ずに購入可能なカードを連打し、強化と消しゴムも使う。
    for (let seed = 1; seed <= 12; seed++) {
      const b = simulate(new Battle(stage), randomOrders(seed), {seconds: 600});
      assert.equal(b.status, 'lost', `seed=${seed}: ${result(b)}`);
    }
  });
}

test('増援の予告・出現・再装填はページ設定に従い、停止中は進まない', () => {
  const events = [], b = new Battle(0, event => events.push(event));
  b.start(); b.wave = b.config.waves;
  b.time = b.reinforcementAt - 0.02;
  const before = b.nextWave;
  assert.ok(before.reinforcement);
  assert.equal(before.at, b.config.reinforcements.at);
  b.update(1 / 60);
  assert.equal(b.units.length, 0);
  b.status = 'paused'; b.update(1 / 60);
  assert.equal(b.nextWave.at, before.at);
  b.status = 'playing'; b.update(1 / 60);
  assert.equal(b.units.length, 1);
  assert.equal(b.units[0].kind, before.enemies[0]);
  assert.equal(b.queue.length, before.enemies.length - 1);
  assert.equal(b.nextWave.at, before.at + b.config.reinforcements.every);
  assert.equal(events.filter(e => e.type === 'reinforcements').length, 1);
  assert.equal(b.wave, b.config.waves);
  assert.equal(b.units.filter(u => u.boss).length, 0);
});
