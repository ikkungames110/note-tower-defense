import "./style.css";
import { Battle, HEROES, ENEMIES, STAGES } from "./game.js";
import { Renderer } from "./render.js";
import { Sound } from "./audio.js";
import { letterSvg } from "./letters.js";
let cleared = [];
try {
  const data = JSON.parse(localStorage.getItem("mojimoji-progress") || "[]");
  if (Array.isArray(data))
    cleared = [
      ...new Set(data.filter((n) => Number.isInteger(n) && n >= 0 && n < 3)),
    ];
} catch {}
const app = document.querySelector("#app");
app.innerHTML = `<main>
<header><a class="brand" href="./" aria-label="もじもじ大作戦 ホーム"><h1>もじもじ大作戦</h1></a><nav aria-label="メニュー"><button id="guide">あそびかた</button><button id="book">文字のこと</button><button id="sound" aria-label="サウンドを有効にする">♪ OFF</button></nav></header>
<section class="notebook" aria-label="ゲーム">
<div class="field">
<img class="scene" src="${import.meta.env.BASE_URL}assets/classroom-notebook.png" alt="窓から光が差す教室の机に開かれたノート" fetchpriority="high" />
<div class="battle-toolbar"><button id="stages" class="stage-button" aria-label="ページをえらぶ"><span class="page-label"><b id="page-number">01</b> / 03</span><span id="stage-name"></span><span aria-hidden="true">⌄</span></button><div class="battle-tools"><span id="wave"></span><button id="speed" aria-label="速度切替">×1</button><button id="pause" aria-label="開始・再開">▷</button></div></div>
<canvas id="battle" aria-label="ノートに立つ鉛筆の文字。左のあいうえおを守り、右のABCDEを倒す戦場"></canvas>
<div id="overlay" class="overlay"></div><div id="announcement" role="status"></div>
</div>
<div class="command-area">
<div class="resource-row"><div class="ink"><span>インク</span><strong id="ink-value"></strong><div class="meter"><i id="ink-fill"></i></div><span id="income"></span></div><div class="resource-actions"><button id="upgrade">ためる力 <span id="upgrade-cost"></span><kbd>U</kbd></button><button id="skill">消しゴム <span id="skill-charge"></span><kbd>Q</kbd></button></div></div>
<div class="cards">${HEROES.map((h, i) => `<button class="unit-card" data-unit="${i}" aria-label="${h.glyph}を召喚 ${h.cost}インク" title="${h.role}：${h.description}"><kbd>${i + 1}</kbd><span class="glyph">${letterSvg(h.glyph)}</span><span class="card-detail"><span class="role">${h.role}</span><span class="card-bottom">${h.cost}<span class="card-state"></span></span></span><span class="cooldown"></span></button>`).join("")}</div>
</div></section>
<footer><span>あのころの、ノートのすみで。</span><span id="progress"></span></footer>
</main><dialog id="dialog"><button class="close" aria-label="閉じる">×</button><div id="dialog-body"></div></dialog>`;
const $ = (s) => document.querySelector(s),
  sound = new Sound(),
  renderer = new Renderer($("#battle"));
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
function newBattle(stage = 0) {
  renderer.effects = [];
  battle = new Battle(stage, (e) => {
    renderer.event(e);
    sound.play(e.type);
    if (e.type === "wave") notify(`第 ${e.wave} 波`);
    if (e.type === "won") {
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
  });
  $("#stage-name").textContent = battle.config.name;
  $("#page-number").textContent = String(stage + 1).padStart(2, "0");
  showOverlay();
  updateUI();
}
function showOverlay() {
  const o = $("#overlay");
  o.hidden = battle.status === "playing";
  if (o.hidden) return;
  const state = battle.status;
  const titles = {
    ready: "チャイムのあとで。",
    paused: "ちょっと、ひとやすみ。",
    won: "このページを、守れた。",
    lost: "もう一度、書きなおそう。",
  };
  const descriptions = {
    ready: "文字をえらんで、右の陣地へ。",
    paused: "",
    won: `${Math.floor(battle.time)} 秒 · ${cleared.length} / 3 ページ`,
    lost: "「お」で守って、「う」で援護。",
  };
  o.innerHTML = `<h2>${titles[state]}</h2>${descriptions[state] ? `<p>${descriptions[state]}</p>` : ""}<div class="overlay-actions"><button class="primary" id="start">${state === "ready" ? "はじめる" : state === "paused" ? "つづける" : "もう一度"}<span aria-hidden="true"> →</span></button>${state === "won" && battle.stage < 2 ? '<button id="next" class="next">次のページへ →</button>' : ""}</div>`;
  $("#start").onclick = () => {
    if (state === "won" || state === "lost") newBattle(battle.stage);
    battle.status = "playing";
    showOverlay();
    updateUI();
  };
  if ($("#next")) $("#next").onclick = () => newBattle(battle.stage + 1);
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
  $("#pause").textContent = playing ? "Ⅱ" : "▷";
  $("#pause").setAttribute("aria-label", playing ? "一時停止" : "開始・再開");
  $("#pause").disabled = ["won", "lost"].includes(battle.status);
  $("#progress").textContent = `${"✶".repeat(cleared.length)} ${cleared.length} / 3 ページ`;
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
          ? "インク待ち"
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
    `<h2>あそびかた</h2><p>左を守って、右の陣地をなくせば勝ち。<br>文字は、自分で進んで戦います。</p><ol><li>インクで文字を呼ぶ。<kbd>1–5</kbd></li><li>「ためる力」でインクの回復と上限を増やす。<kbd>U</kbd></li><li>30秒たまった「消しゴム」で敵を押し戻す。<kbd>Q</kbd></li></ol><p><kbd>Space</kbd> 開始・ひとやすみ ／ ×1・×2で速度変更</p><p>クリアしたページだけ、このブラウザーに記録します。</p>`,
  );
$("#book").onclick = () =>
  openDialog(
    `<h2>文字のこと</h2><h3>ひらがな組</h3>${HEROES.map((h) => `<article class="dex"><span>${letterSvg(h.glyph)}</span><div><b>${h.name} <small>${h.role} · ${h.cost}インク</small></b><p>${h.description}</p></div></article>`).join("")}<h3>アルファベット組</h3>${ENEMIES.map((h) => `<article class="dex"><span>${letterSvg(h.glyph)}</span><div><b>${h.name}</b><p>${h.description}</p></div></article>`).join("")}`,
  );
$("#stages").onclick = () => {
  openDialog(
    `<h2>ページをえらぶ</h2><p>ページを移ると、今の戦闘は最初からになります。</p>${STAGES.map((s, i) => `<button class="stage-choice" data-stage="${i}" ${i > 0 && !cleared.includes(i - 1) ? "disabled" : ""}><span>0${i + 1}</span><div><b>${s.name}</b><small>${s.subtitle}</small></div><span>${cleared.includes(i) ? "★" : i === 0 || cleared.includes(i - 1) ? "→" : "未解放"}</span></button>`).join("")}`,
  );
  document.querySelectorAll("[data-stage]").forEach(
    (el) =>
      (el.onclick = () => {
        dialog.close();
        newBattle(Number(el.dataset.stage));
      }),
  );
};
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
