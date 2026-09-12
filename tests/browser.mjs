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
  assert.equal(await page.locator(".dex").count(), 10);
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
  assert.deepEqual(errors, []);
  console.log(
    "ブラウザー検証成功：出撃、停止、図鑑、速度、音声、解放制限、モバイル表示、実行時エラーなし",
  );
} finally {
  await browser?.close();
  await server.close();
}
