import { chromium } from "@playwright/test";
import { createServer } from "vite";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const server = await createServer({ server: { port: 0, host: "127.0.0.1" } });
await server.listen();
const url = server.resolvedUrls.local[0];
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // テスト用の参照はレスポンスにだけ追加し、本番コードには公開しない。
  await page.route('**/src/main.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + '\nwindow.testBattle = { get battle() { return battle; }, renderer };' });
  });
  await page.goto(url);
  await page.locator('.scene').evaluate(async img => {
    await img.decode();
    if (!img.naturalWidth) throw new Error('背景画像を読み込めません');
  });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.locator("#start").click();
  await page.locator('[data-unit="0"]').click();
  assert.ok(await page.locator('[data-unit="0"]').isDisabled());
  await page.waitForTimeout(1200);
  const movingFrame = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('#battle').evaluate(c => c.toDataURL()), movingFrame);
  await page.locator("#pause").click();
  assert.match(await page.locator("#overlay").innerText(), /ひとやすみ/);
  const value = await page.locator("#ink-value").innerText();
  const pausedFrame = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#ink-value").innerText(), value);
  assert.equal(await page.locator('#battle').evaluate(c => c.toDataURL()), pausedFrame);
  await page.locator("#start").click();
  await page.locator("#book").click();
  assert.ok(await page.locator("#dialog").isVisible());
  assert.equal(await page.locator(".dex").count(), 12);
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("#overlay").isVisible());
  await page.locator("#start").click();
  await page.locator("#speed").click();
  assert.equal(await page.locator("#speed").innerText(), "×2");
  await page.locator("#sound").click();
  assert.equal(await page.locator("#sound").innerText(), "♪ ON");
  await page.locator("#stages").click();
  assert.ok(await page.locator('[data-stage="1"]').isDisabled());
  await page.keyboard.press("Escape");
  await page.locator("#start").click();
  await page.waitForTimeout(7000);
  await page.screenshot({ path: "test-results/battle.png", fullPage: true });
  await page.evaluate(() => localStorage.setItem("mojimoji-progress", "[0]"));
  await page.reload();
  await page.locator("#stages").click();
  assert.equal(await page.locator('[data-stage="1"]').isEnabled(), true);
  await page.locator('[data-stage="1"]').click();
  assert.match(await page.locator("#stage-name").innerText(), /放課後/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.locator("#start").click();
  await page.locator('[data-unit="1"]').click();
  await page.locator("#guide").click();
  assert.ok(await page.locator("#dialog").isVisible());
  await page.keyboard.press("Escape");
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const selector of ['#stages', '#speed', '#pause', '[data-unit="4"]']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `${selector} が画面内に収まる`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.reload();
  assert.match(await page.title(), /^ノート上の戦い/);
  // 旧3ページ版の記録をそのまま読み、第2章の先頭だけが新たに解放される。
  await page.evaluate(() => localStorage.setItem('mojimoji-progress', '[0,1,2]'));
  await page.reload();
  await page.locator('#stages').click();
  assert.equal(await page.locator('.chapter-heading').count(), 2);
  assert.equal(await page.locator('[data-stage]').count(), 6);
  assert.ok(await page.locator('[data-stage="3"]').isEnabled());
  assert.ok(await page.locator('[data-stage="4"]').isDisabled());
  await page.keyboard.press('Escape');
  for (let stage = 0; stage < 6; stage++) {
    await page.locator('#start').click();
    await page.evaluate(() => {
      const b = window.testBattle.battle;
      for (let i = 0; i < 60 * 300 && b.status === 'playing'; i++) {
        if (b.level < 3 && b.ink > b.upgradeCost + 100) b.upgrade();
        for (const kind of [4, 0, 2, 1, 3]) b.summon(kind);
        b.cast(); b.update(1 / 60);
      }
    });
    assert.equal(await page.locator('[data-evolve]').count(), 3);
    if (stage === 0) {
      await page.screenshot({ path: 'test-results/upgrades.png', fullPage: true });
      await page.setViewportSize({ width: 320, height: 844 });
      await page.screenshot({ path: 'test-results/upgrades-mobile.png', fullPage: true });
      for (const el of await page.locator('[data-evolve]').all()) {
        const box = await el.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 320);
      }
      await page.setViewportSize({ width: 1440, height: 1050 });
    }
    const kind = Number(await page.locator('[data-evolve]').first().getAttribute('data-evolve'));
    const expected = await page.locator('[data-evolve]').first().getAttribute('aria-label');
    await page.locator('[data-evolve]').first().click();
    assert.equal(await page.locator('[data-evolve]').count(), 0);
    if (stage === 2) {
      assert.equal(await page.locator('.chapter-letters .letter').count(), 5);
      assert.match(await page.locator('#overlay').innerText(), /次の章は/);
      await page.setViewportSize({ width: 320, height: 844 });
      await page.screenshot({ path: 'test-results/chapter-clear-mobile.png', fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#start').click();
      assert.equal(await page.locator('.final-letters .letter').count(), 5);
      await page.keyboard.press('Escape');
      await page.setViewportSize({ width: 1440, height: 1050 });
    }
    if (stage < 5) {
      await page.locator('#next').click();
      const glyph = await page.evaluate(kind => window.testBattle.battle.heroes[kind].glyph, kind);
      if (stage === 2) {
        assert.deepEqual(await page.evaluate(() => window.testBattle.battle.heroes.map(h => h.rank)), [0, 0, 0, 0, 0]);
        assert.match(await page.locator('#chapter-name').innerText(), /第2章/);
        await page.screenshot({ path: 'test-results/chapter-two.png', fullPage: true });
      } else {
        assert.ok(expected.endsWith(`${glyph}に強化`));
        assert.ok((await page.locator(`[data-unit="${kind}"]`).getAttribute('aria-label')).startsWith(glyph));
      }
    } else {
      await page.locator('#start').click();
      assert.equal(await page.locator('.final-letters .letter').count(), 5);
      await page.keyboard.press('Escape');
    }
  }
  await page.reload();
  await page.locator('#start').click();
  await page.evaluate(async () => {
    const { battle: b, renderer: r } = window.testBattle;
    await r.eraser.decode();
    b.spawnBoss();
    b.units.find(u => u.boss).x = 800;
    for (let i = 0; i < 4; i++) b.addUnit(i, -1).x = 400 + i * 80;
    b.skill = 30;
  });
  await page.screenshot({ path: 'test-results/boss.png', fullPage: true });
  await page.keyboard.press('q');
  await page.waitForTimeout(650);
  await page.screenshot({ path: 'test-results/eraser.png', fullPage: true });
  const eraserFrame = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.waitForTimeout(200);
  assert.notEqual(await page.locator('#battle').evaluate(c => c.toDataURL()), eraserFrame);
  await page.locator('#pause').click();
  const still = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#battle').evaluate(c => c.toDataURL()), still);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const { battle: b, renderer: r } = window.testBattle;
    r.effects = [{ type: 'skill', life: 0.5 }]; r.draw(b, 0);
  });
  await page.screenshot({ path: 'test-results/reduced-motion.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await page.locator('#start').click();
  assert.match(await page.locator('#wave-preview').innerText(), /次の波まで/);
  await page.evaluate(() => {
    const { battle: b, renderer: r } = window.testBattle;
    b.wave = b.config.waves; b.units = []; b.queue = []; r.effects = [];
    b.spawnBoss(); const boss = b.units[0]; boss.x = 760; boss.timer = 0;
    const hero = b.addUnit(4, 1); hero.x = 580; hero.speed = 0;
    b.update(1 / 60); b.status = 'paused';
  });
  await page.waitForTimeout(150);
  assert.match(await page.locator('#battle-hint').innerText(), /三連撃の構え/);
  await page.screenshot({ path: 'test-results/e-windup.png', fullPage: true });
  const warningFrame = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#battle').evaluate(c => c.toDataURL()), warningFrame);
  await page.evaluate(() => {
    const b = window.testBattle.battle; b.status = 'playing';
    for (let i = 0; i < 112; i++) b.update(1 / 60);
    b.status = 'paused';
  });
  await page.waitForTimeout(150);
  assert.match(await page.locator('#battle-hint').innerText(), /攻める好機/);
  await page.screenshot({ path: 'test-results/e-recovery.png', fullPage: true });
  // 各文字の一画が攻撃中に動き、動きを減らす設定では静止する。
  await page.evaluate(() => {
    const { battle: b, renderer: r } = window.testBattle;
    b.units = []; r.effects = [];
    for (let kind = 0; kind < 5; kind++) {
      const u = b.addUnit(kind, 1); u.x = 270 + kind * 155; u.action = 0.28;
    }
  });
  await page.waitForTimeout(100);
  const attackFrame = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.screenshot({ path: 'test-results/letter-attacks.png', fullPage: true });
  await page.evaluate(() => window.testBattle.battle.units.forEach(u => u.action = 0.12));
  await page.waitForTimeout(100);
  assert.notEqual(await page.locator('#battle').evaluate(c => c.toDataURL()), attackFrame);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const reducedAttack = await page.locator('#battle').evaluate(c => c.toDataURL());
  await page.evaluate(() => window.testBattle.battle.units.forEach(u => u.action = 0.28));
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#battle').evaluate(c => c.toDataURL()), reducedAttack);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#stages').click();
  await page.locator('[data-stage="1"]').click();
  assert.match(await page.locator('#overlay').innerText(), /折り目/);
  await page.locator('#start').click();
  assert.match(await page.locator('#battle-hint').innerText(), /移動速度/);
  await page.evaluate(() => {
    const b = window.testBattle.battle;
    b.units = []; b.status = 'paused';
    b.addUnit(4, 1).x = 555; b.addUnit(2, 1).x = 415;
    b.addUnit(3, -1).x = 645; b.addUnit(2, -1).x = 790;
  });
  await page.screenshot({ path: 'test-results/fold.png', fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const selector of ['#battle-hint', '#wave-preview']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width);
    }
    await page.screenshot({ path: `test-results/fold-mobile-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  for (const [stage, glyph, initial, seconds, recovered] of [
    [4, 'F', /払いの構え/, 1.5, /攻める好機/],
    [5, 'G', /65%軽減/, 3.5, /1.5倍/],
  ]) {
    await page.locator('#stages').click();
    await page.locator(`[data-stage="${stage}"]`).click();
    await page.locator('#start').click();
    await page.evaluate(() => {
      const { battle: b, renderer: r } = window.testBattle;
      b.wave = b.config.waves; b.units = []; b.queue = []; r.effects = [];
      b.spawnBoss(); const boss = b.units[0]; boss.x = 760; boss.timer = 0;
      const hero = b.addUnit(4, 1); hero.x = 650; hero.speed = 0; hero.timer = 100;
      const rear = b.addUnit(2, 1); rear.x = 500; rear.speed = 0; rear.timer = 100;
      b.update(1 / 60); b.status = 'paused';
    });
    await page.waitForTimeout(150);
    assert.match(await page.locator('#battle-hint').innerText(), initial);
    await page.screenshot({ path: `test-results/${glyph}-prepare.png`, fullPage: true });
    await page.evaluate(seconds => {
      const b = window.testBattle.battle; b.status = 'playing';
      for (let i = 0; i < seconds * 60; i++) b.update(1 / 60);
      b.status = 'paused';
    }, seconds);
    await page.waitForTimeout(150);
    assert.match(await page.locator('#battle-hint').innerText(), recovered);
    await page.screenshot({ path: `test-results/${glyph}-recovery.png`, fullPage: true });
  }
  // 章末の再挑戦でも、そのページに入った時点の編成に戻る。
  await page.reload();
  await page.locator('#stages').click();
  await page.locator('[data-stage="2"]').click();
  await page.locator('#start').click();
  await page.evaluate(() => {
    const b = window.testBattle.battle; b.spawnBoss();
    b.units.find(u => u.boss).hp = 0; b.enemyHp = 0; b.resolve();
  });
  await page.locator('[data-evolve]').first().click();
  await page.locator('#retry').click();
  assert.deepEqual(await page.evaluate(() => window.testBattle.battle.heroes.map(h => h.rank)), [0, 0, 0, 0, 0]);
  assert.equal(await page.evaluate(() => window.testBattle.battle.status), 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#stages').click();
  await page.screenshot({ path: 'test-results/chapters.png', fullPage: true });
  await page.locator('[data-stage="3"]').click();
  assert.equal(await page.locator('.field').evaluate(el => el.getAnimations().length), 0);
  assert.match(await page.locator('#chapter-name').innerText(), /第2章/);
  assert.deepEqual(errors, []);
  console.log(
    "ブラウザー検証成功：出撃、停止、図鑑、速度、音声、解放制限、モバイル表示、ウェーブ予告、折り目、E・F・Gの専用行動、全6ページ攻略、章内育成と章間リセット、旧記録互換、攻撃演出、動きを減らす設定、実行時エラーなし",
  );
} finally {
  await browser?.close();
  await server.close();
}
