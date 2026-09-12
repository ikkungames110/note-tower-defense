import test from "node:test";
import assert from "node:assert/strict";
import { Battle, HEROES } from "../src/game.js";
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
test("インク回復と強化の上限", () => {
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
test("消しゴム砲のチャージ、押し戻し、撃破報酬", () => {
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
    b[hp] = 0;
    run(b, 1);
    assert.equal(b.status, status);
    assert.equal(events.filter((e) => e.type === status).length, 1);
  }
});
for (let stage = 0; stage < 3; stage++)
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
