import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { access, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('test-results', { recursive: true });
await assert.rejects(access('dist/concepts'));
const server = await preview({ base: '/note-tower-defense/', preview: { port: 0, host: '127.0.0.1' } });
let browser;
try {
  browser = await chromium.launch();
  const url = server.resolvedUrls.local[0];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(), errors = [], failures = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (!r.url().startsWith(new URL(url).origin) && !r.url().startsWith('data:')) external.push(r.url()); });
  await page.goto(url);
  await page.locator('.scene').evaluate(img => img.decode());
  await page.locator('#start').tap();
  await page.locator('[data-unit="1"]').tap();
  await page.locator('#pause').tap();
  assert.match(await page.locator('#overlay').innerText(), /ひとやすみ/);
  await page.evaluate(() => localStorage.setItem('mojimoji-progress', '[0,1,2,3,4,5]'));
  await page.reload(); await page.locator('#stages').tap();
  assert.equal(await page.locator('[data-stage]').count(), 12);
  assert.ok(await page.locator('[data-stage="6"]').isEnabled());
  assert.ok(await page.locator('[data-stage="7"]').isDisabled());
  await page.locator('[data-stage="6"]').tap();
  assert.match(await page.locator('#chapter-name').innerText(), /第3章/);
  assert.equal(await page.locator('#overlay p').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/production.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('mojimoji-progress', '{invalid'));
  await page.reload();
  assert.ok(await page.locator('#start').isVisible());
  // 保存禁止でも起動・操作できる。読み取りも書き込みも禁止する。
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } }));
  await page.reload(); await page.locator('#start').tap();
  await page.locator('[data-unit="0"]').tap();
  await page.locator('#guide').tap();
  assert.match(await page.locator('#dialog-body').innerText(), /全4章・12ページ/);
  await page.locator('.close').tap();
  assert.deepEqual(errors, []); assert.deepEqual(failures, []); assert.deepEqual(external, []);
  console.log('本番検証成功：サブパス配信、画像、タッチ操作、旧6ページ記録、破損・保存禁止、外部通信なし');
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
