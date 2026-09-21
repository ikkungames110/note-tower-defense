import "./style.css";
import { Battle, HEROES, ENEMIES, STAGES, upgradeChoices, heroesFor, bossStatus, growthDescription } from "./game.js";
import { CHAPTERS, isChapterEnd, nextLoadout } from './stages.js';
import { Renderer } from "./render.js";
import { Sound } from "./audio.js";
import { letterSvg } from "./letters.js";
let cleared = [];
try {
  const data = JSON.parse(localStorage.getItem("mojimoji-progress") || "[]");
  if (Array.isArray(data))
    cleared = [
      ...new Set(data.filter((n) => Number.isInteger(n) && n >= 0 && n < STAGES.length)),
    ];
} catch {}
const app = document.querySelector("#app");
app.innerHTML = `<main>
<header><a class="brand" href="./" aria-label="ノート上の戦い ホーム"><h1>ノート上の戦い</h1></a><nav aria-label="メニュー"><button id="guide">あそびかた</button><button id="book">文字のこと</button><button id="sound" aria-label="サウンドを有効にする">♪ OFF</button></nav></header>
<section class="notebook" aria-label="ゲーム">
<div class="field">
<img class="scene" src="${import.meta.env.BASE_URL}assets/classroom-notebook.png" alt="窓から光が差す教室の机に開かれたノート" fetchpriority="high" />
<div class="battle-toolbar"><button id="stages" class="stage-button" aria-label="ページをえらぶ"><span class="page-label"><b id="page-number">01</b> / ${String(STAGES.length).padStart(2, '0')}</span><span id="stage-name"></span><span aria-hidden="true">⌄</span></button><div class="battle-tools"><span id="wave"></span><button id="speed" aria-label="速度切替">×1</button><button id="pause" aria-label="開始・再開">▷</button></div></div>
<canvas id="battle" aria-label="ノートに立つ鉛筆の文字。左のあいうえおを守り、右のABCDEを倒す戦場"></canvas>
<div id="overlay" class="overlay"></div><div id="announcement" role="status"></div>
</div>
<div class="command-area">
<div class="chapter-caption" id="chapter-name"></div>
<div class="battle-notes"><span id="battle-hint"></span><span id="wave-preview"></span></div>
<div class="resource-row"><div class="ink"><span>鉛筆</span><strong id="ink-value"></strong><div class="meter"><i id="ink-fill"></i></div><span id="income"></span></div><div class="resource-actions"><button id="upgrade">ためる力 <span id="upgrade-cost"></span><kbd>U</kbd></button><button id="skill">消しゴム <span id="skill-charge"></span><kbd>Q</kbd></button></div></div>
<div class="cards">${HEROES.map((h, i) => `<button class="unit-card" data-unit="${i}" aria-label="${h.glyph}を召喚 ${h.cost}鉛筆" title="${h.role}：${h.description}"><kbd>${i + 1}</kbd><span class="glyph">${letterSvg(h.glyph)}</span><span class="card-detail"><span class="role">${h.role}</span><span class="card-bottom">${h.cost}<span class="card-state"></span></span></span><span class="cooldown"></span></button>`).join("")}</div>
</div></section>
<footer><button id="about">このゲームについて</button><span>あのころの、ノートのすみで。</span><span id="progress"></span></footer>
</main><dialog id="dialog"><button class="close" aria-label="閉じる">×</button><div id="dialog-body"></div></dialog>`;
const $ = (s) => document.querySelector(s),
  sound = new Sound(),
  renderer = new Renderer($("#battle"));
let ranks = [0, 0, 0, 0, 0], entryRanks = [...ranks], choices = [], rewardChosen = false;
let battle,
  speed = 1,
  last = 0,
  hud = 0,
  noticeTimer;
function notify(text) {
  $("#announcement").textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($("#announcement").textContent = ""), 2200);
}
function newBattle(stage = 0, loadout = [0, 0, 0, 0, 0]) {
  const changingPage = Boolean(battle);
  if (changingPage) sound.play('page');
  ranks = [...loadout];
  entryRanks = [...loadout];
  choices = [];
  rewardChosen = false;
  renderer.effects = [];
  clearTimeout(noticeTimer);
  $("#announcement").textContent = "";
  battle = new Battle(stage, (e) => {
    renderer.event(e);
    sound.play(e.type);
    if (e.type === "boss") notify(`ボス ${e.glyph} が登場`);
    if (e.type === "wave") notify(`第 ${e.wave} 波 · ${e.label}`);
    if (e.type === "bossChange") notify(`Zの構えが変わった · ${{ sweep: "前方を払う", guard: "斜線の守り", triple: "三連撃" }[e.behavior]}`);
    if (e.type === "bossWindup") notify(`${e.glyph}が構えた。${e.behavior === "sweep" ? "前衛を補充しよう" : e.behavior === "guard" ? "突きに備えよう" : "三連撃に備えよう"}`);
    if (e.type === "bossRecovery") notify(`${e.glyph}がひとやすみ。${e.behavior === "guard" ? "ダメージ1.5倍の好機！" : "攻める好機！"}`);
    if (e.type === "won") {
      choices = upgradeChoices(ranks);
      if (!cleared.includes(battle.stage)) {
        cleared.push(battle.stage);
        try {
          localStorage.setItem("mojimoji-progress", JSON.stringify(cleared));
        } catch {
          notify("この環境ではクリア記録を保存できません");
        }
      }
      showOverlay();
    }
    if (e.type === "lost") showOverlay();
  }, ranks);
  $('.scene').getAnimations().forEach(animation => animation.cancel());
  $('.field').dataset.chapter = battle.config.chapter;
  if (changingPage && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // 操作面を含む親は合成レイヤーにせず、背景だけを切り替える。
    $('.scene').animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  }
  $('#chapter-name').textContent = `第${battle.config.chapter + 1}章 · ${CHAPTERS[battle.config.chapter]}`;
  refreshCards();
  $("#stage-name").textContent = battle.config.name;
  $("#page-number").textContent = String(stage + 1).padStart(2, "0");
  showOverlay();
  updateUI();
}
function refreshCards() {
  document.querySelectorAll('[data-unit]').forEach((el, i) => {
    const h = battle.heroes[i];
    el.querySelector('.glyph').innerHTML = letterSvg(h.glyph);
    el.setAttribute('aria-label', `${h.glyph}を召喚 ${h.cost}鉛筆`);
    el.title = `${h.role} · HP ${Math.round(h.hp)} / 攻撃 ${Math.round(h.attack)}${h.rank ? ` · ${growthDescription(i, h.rank)}` : ""}`;
  });
}
function showOverlay() {
  const o = $("#overlay");
  o.hidden = battle.status === "playing";
  if (o.hidden) return;
  const state = battle.status;
  const titles = {
    ready: battle.stage % 3 === 0 ? `第${battle.config.chapter + 1}章 · ${CHAPTERS[battle.config.chapter]}` : "次のページへ。",
    paused: "ちょっと、ひとやすみ。",
    won: isChapterEnd(battle.stage) ? `第${battle.config.chapter + 1}章を、守れた。` : "このページを、守れた。",
    lost: "もう一度、書きなおそう。",
  };
  const descriptions = {
    ready: battle.config.tip,
    paused: "",
    won: `${Math.floor(battle.time)} 秒 · ${battle.kills}体撃破 · ${cleared.length} / ${STAGES.length} ページ`,
    lost: `${battle.lastThreat || "敵"}に拠点を突破されました。「お」で守って「う」で援護しよう。`,
  };
  if (state === 'won' && !rewardChosen) {
    o.innerHTML = `<h2>次の一文字を、書こう。</h2><p>1つ選んで強化。HP・攻撃力が初期値の8%分アップ。得意技も育ちます。<br>次の章では初期編成に戻ります。</p><div class="evolution-choices">${choices.map(c => `<button data-evolve="${c.kind}" aria-label="${c.from}から${c.glyph}に強化"><span>${letterSvg(c.from)} → ${letterSvg(c.glyph)}</span><small>${HEROES[c.kind].role}</small><small class="growth-perk">${growthDescription(c.kind, c.rank)}</small></button>`).join('')}</div>`;
    o.querySelectorAll('[data-evolve]').forEach(el => el.onclick = () => {
      if (rewardChosen) return;
      ranks[Number(el.dataset.evolve)]++;
      rewardChosen = true;
      battle.heroes = heroesFor(ranks);
      refreshCards();
      showOverlay();
    });
    return;
  }
  const chapterEnd = state === 'won' && isChapterEnd(battle.stage);
  const chapterSummary = chapterEnd ? `<div class="chapter-letters">${battle.heroes.map(h => letterSvg(h.glyph)).join('')}</div><p>${battle.stage < STAGES.length - 1 ? '次の章は「あいうえお」から、新しい編成で始めます。' : '12ページ、最後の一文字まで。この一冊を守りきりました。'}</p>` : '';
  o.innerHTML = `<h2>${titles[state]}</h2>${descriptions[state] ? `<p>${descriptions[state]}</p>` : ""}${chapterSummary}<div class="overlay-actions"><button class="primary" id="start">${state === "ready" ? "はじめる" : state === "paused" ? "つづける" : chapterEnd ? battle.stage === STAGES.length - 1 ? "エンディングを見る" : "育った文字を見る" : "もう一度"}<span aria-hidden="true"> →</span></button>${state === "won" && battle.stage < STAGES.length - 1 ? `<button id="next" class="next">${chapterEnd ? '次の章へ' : '次のページへ'} →</button>` : ""}${chapterEnd ? '<button id="retry" class="next">再挑戦</button>' : ""}</div>`;
  $("#start").onclick = () => {
    if (chapterEnd) {
      const ending = battle.stage === STAGES.length - 1;
      openDialog(`${ending ? '<p class="ending-kicker">全4章 · 12ページ クリア</p><h2>最後の一文字まで。</h2><p>チャイムのあと、静かになった教室。<br>あのころのノートに、小さな戦いの跡が残りました。</p>' : `<h2>第${battle.config.chapter + 1}章で育った文字</h2>`}<div class="final-letters">${battle.heroes.map(h => letterSvg(h.glyph)).join('')}</div><div class="grown-details">${battle.heroes.map((h, i) => `<p>${h.glyph} · HP ${Math.round(h.hp)} / 攻撃 ${Math.round(h.attack)}${h.rank ? `<br>${growthDescription(i, h.rank)}` : ''}</p>`).join('')}</div><p>${ending ? '遊んでくれて、ありがとう。ページ選択から、別の育て方でもう一度。' : 'この章の3ページをクリア！ 次の章では初期編成から始まります。'}</p>`);
      if (ending) sound.play('ending');
      return;
    }
    if (state === "won" || state === "lost") newBattle(battle.stage, entryRanks);
    battle.status = "playing";
    showOverlay();
    updateUI();
  };
  if ($('#retry')) $('#retry').onclick = () => { newBattle(battle.stage, entryRanks); battle.start(); showOverlay(); updateUI(); };
  if ($("#next")) $("#next").onclick = () => newBattle(battle.stage + 1, nextLoadout(battle.stage, ranks));
}
function pause() {
  if (battle.status === "playing") battle.status = "paused";
  else if (battle.status === "paused") battle.status = "playing";
  else if (battle.status === "ready") battle.start();
  showOverlay();
  updateUI();
}
function updateUI() {
  const playing = battle.status === "playing";
  $("#ink-value").innerHTML =
    `${Math.floor(battle.ink)} <small>/ ${battle.capacity}</small>`;
  $("#ink-fill").style.width = `${(battle.ink / battle.capacity) * 100}%`;
  $("#income").textContent = `Lv.${battle.level} · +${battle.income}/秒`;
  $("#upgrade-cost").textContent =
    battle.level === 5 ? "最大" : `${battle.upgradeCost}`;
  $("#upgrade").disabled =
    !playing || battle.level === 5 || battle.ink < battle.upgradeCost;
  $("#skill-charge").textContent =
    battle.skill >= 30 ? "使う" : `${Math.ceil(30 - battle.skill)}秒`;
  $("#skill").disabled = !playing || battle.skill < 30;
  $("#skill").style.setProperty("--charge", `${(battle.skill / 30) * 100}%`);
  $("#wave").textContent = `第 ${battle.wave} 波 / ${battle.config.waves}`;
  const boss = battle.units.find(u => u.boss && u.hp > 0);
  const status = bossStatus(boss);
  $("#battle-hint").textContent = status ? `${boss.glyph}：${status}`
    : battle.stage === 0 && battle.time < 8 ? '下のカードを押して召喚 · 文字は自動で戦います'
    : [battle.config.fold ? '折り目：移動速度 ½' : '', battle.config.writing ? '書きかけは完成前に倒せる' : '', battle.config.punctuation ? '読点は「あ」でまとめて除去' : ''].filter(Boolean).join(' · ') || '群れには「あ」 · 遠くには「う」';
  const next = battle.nextWave;
  const enemies = next ? [...new Set(next.enemies)].map(kind => ENEMIES[kind].glyph).join('・') : '';
  $("#wave-preview").textContent = battle.status === 'won' ? 'ページクリア · 育った文字を確認しよう'
    : battle.status === 'lost' ? '再挑戦で編成と召喚のタイミングを見直そう'
    : next
    ? `次の波まで ${Math.max(0, Math.ceil(next.at - battle.time))}秒 · ${enemies}${battle.wave === battle.config.waves - 1 && !battle.bossSpawned ? ' ＋ ボス' : ''}`
    : '最後の波 · 拠点とボスを倒そう';
  $("#pause").textContent = playing ? "Ⅱ" : "▷";
  $("#pause").setAttribute("aria-label", playing ? "一時停止" : "開始・再開");
  $("#pause").disabled = ["won", "lost"].includes(battle.status);
  $("#progress").textContent = `${"✶".repeat(cleared.length)} ${cleared.length} / ${STAGES.length} ページ`;
  document.querySelectorAll("[data-unit]").forEach((el, i) => {
    const cd = battle.cooldowns[i];
    el.disabled =
      !playing ||
      battle.ink < HEROES[i].cost ||
      cd > 0 ||
      battle.units.filter((u) => u.side === 1).length >= 30;
    el.querySelector(".card-state").textContent =
      cd > 0
        ? `${cd.toFixed(1)} 秒`
        : battle.ink < HEROES[i].cost
          ? "鉛筆待ち"
          : "";
    el.querySelector(".cooldown").style.width =
      `${(cd / HEROES[i].cooldown) * 100}%`;
  });
}
const dialog = $("#dialog");
function openDialog(html) {
  if (battle.status === "playing") {
    battle.status = "paused";
    showOverlay();
    updateUI();
  }
  $("#dialog-body").innerHTML = html;
  dialog.showModal();
}
$(".close").onclick = () => dialog.close();
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
$("#guide").onclick = () =>
  openDialog(
    `<h2>あそびかた</h2><p>左を守って、右の陣地をなくせば勝ち。<br>文字は、自分で進んで戦います。</p><ol><li>鉛筆で文字を呼ぶ。<kbd>1–5</kbd></li><li>「ためる力」で鉛筆の回復と上限を増やす。<kbd>U</kbd></li><li>30秒たまった「消しゴム」で敵を押し戻す。<kbd>Q</kbd></li></ol><p><kbd>Space</kbd> 開始・ひとやすみ ／ ×1・×2で速度変更</p><p>各ページには大きなボスがいます。拠点を削り、ボスを倒すとクリア。3択から文字を1つ強化し、次のページへ引き継ぎます。</p><p>次の波の文字と残り秒数を見て、召喚に備えましょう。折り目のあるページでは、敵も味方も移動速度が半分になります。射程と攻撃速度は変わりません。</p><p>ボスEは1.2秒構えてから三連撃。その後2.5秒は攻撃も移動もしません。消しゴムで射程外へ押し戻すと、その一撃を避けられます。</p><p>Fは1.4秒の構えから前方をまとめて払い、味方を押し戻します。Gは防御中にダメージ65%減、突きの後の3秒間は1.5倍のダメージを受けます。消しゴムも同じ倍率です。</p><p>全4章・12ページ。育成は同じ章の3ページで引き継ぎます。次の章では「あいうえお」から始めます。章の最後にも強化を選び、育った文字を確認できます。</p><p>第3章から薄い書きかけの敵が登場。4秒で完成するまで動きませんが、攻撃で倒せます。Hが置く読点は攻撃か消しゴムで除去でき、8秒で消えます。最終ボスZはHPが半分になると、休止後に払い・守り・三連撃へと構えを変えます。</p><p>強化はHP・攻撃力だけでなく、範囲・出撃直後の速さ・射程・押し戻し・最初の一撃への耐性も伸ばします。</p><p>再挑戦はそのページ開始時の強化に戻ります。ページ選択・再読み込みで文字の強化はリセット。クリアしたページだけ、このブラウザーに記録します。</p>`,
  );
$("#book").onclick = () =>
  openDialog(
    `<h2>文字のこと</h2><h3>ひらがな組</h3>${battle.heroes.map((h) => `<article class="dex"><span>${letterSvg(h.glyph)}</span><div><b>${h.name} <small>${h.role} · ${h.cost}鉛筆</small></b><p>${h.description}${h.rank ? `<br>${growthDescription(battle.heroes.indexOf(h), h.rank)}` : ""}</p></div></article>`).join("")}<h3>アルファベット組</h3>${ENEMIES.map((h) => `<article class="dex"><span>${letterSvg(h.glyph)}</span><div><b>${h.name}</b><p>${h.description}</p></div></article>`).join("")}`,
  );
$("#stages").onclick = () => {
  openDialog(
    `<h2>ページをえらぶ</h2><p>ページを移ると、今の戦闘は最初からになります。</p>${CHAPTERS.map((name, chapter) => `<h3 class="chapter-heading">第${chapter + 1}章 · ${name}</h3>${STAGES.map((s, i) => s.chapter !== chapter ? '' : `<button class="stage-choice" data-stage="${i}" ${i > 0 && !cleared.includes(i - 1) ? "disabled" : ""}><span>${String(i + 1).padStart(2, "0")}</span><div><b>${s.name}</b><small>${s.subtitle}</small></div><span>${cleared.includes(i) ? "★" : i === 0 || cleared.includes(i - 1) ? "→" : "未解放"}</span></button>`).join('')}`).join('')}`,
  );
  document.querySelectorAll("[data-stage]").forEach(
    (el) =>
      (el.onclick = () => {
        dialog.close();
        newBattle(Number(el.dataset.stage));
      }),
  );
};
$('#about').onclick = () => openDialog('<h2>このゲームについて</h2><p>ノート上の戦い · 全4章・12ページ<br>ブラウザーで遊ぶ、鉛筆の文字のタワーディフェンス。</p><h3>制作素材</h3><p>文字・拠点・読点：一画ずつのオリジナルパス<br>背景・消しゴム：AI生成画像<br>効果音：Web Audioによる合成音</p><h3>記録と操作</h3><p>このブラウザーにクリア記録だけを保存します。アカウントや外部サービスへの送信はありません。保存できない環境でも遊べます。育成は章内で引き継ぎ、再読み込みで初期編成に戻ります。</p><p>端末の「動きを減らす」設定に対応しています。音は音符ボタンから有効にできます。</p>');
$("#sound").onclick = () => {
  const enabled = sound.toggle();
  $("#sound").textContent = enabled ? "♪ ON" : "♪ OFF";
  $("#sound").setAttribute(
    "aria-label",
    enabled ? "サウンドを無効にする" : "サウンドを有効にする",
  );
};
$("#speed").onclick = () => {
  speed = speed === 1 ? 2 : 1;
  $("#speed").textContent = `×${speed}`;
};
$("#pause").onclick = pause;
$("#upgrade").onclick = () => {
  battle.upgrade();
  updateUI();
};
$("#skill").onclick = () => {
  battle.cast();
  updateUI();
};
document.querySelectorAll("[data-unit]").forEach(
  (el) =>
    (el.onclick = () => {
      battle.summon(Number(el.dataset.unit));
      updateUI();
    }),
);
window.addEventListener("keydown", (e) => {
  if (e.repeat || dialog.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === "Space") {
    if (e.target.closest("button,a,input,select,textarea")) return;
    e.preventDefault();
    pause();
  } else if (/^[1-5]$/.test(e.key)) battle.summon(Number(e.key) - 1);
  else if (e.key.toLowerCase() === "u") battle.upgrade();
  else if (e.key.toLowerCase() === "q") battle.cast();
  updateUI();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && battle.status === "playing") {
    battle.status = "paused";
    showOverlay();
    updateUI();
  }
});
newBattle();
function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.1);
  last = now;
  let remaining = dt * speed;
  while (remaining > 0) {
    const step = Math.min(remaining, 1 / 60);
    battle.update(step);
    remaining -= step;
  }
  renderer.draw(battle, battle.status === "playing" ? dt * speed : 0);
  hud += dt;
  if (hud > 0.08) {
    updateUI();
    hud = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
