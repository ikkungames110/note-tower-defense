// 時刻・敵の並び・出現間隔をページごとに設計する。番号から敵やボスを推測しない。
const wave = (at, enemies, spacing = 2.3) => ({
  at, spacing, enemies: [...enemies].map(glyph => 'ABCDEFGHZ'.indexOf(glyph)),
});
const reinforcements = enemies => ({ ...wave(0, enemies, 1.2), every: 32 });
export const CHAPTERS = ['はじまりの余白', '折り目の向こう', '書きかけのページ', 'さいごの見開き'];
export const STAGES = [
  {
    name: 'はじまりの1ページ', subtitle: 'まずは、余白からはじめよう。',
    hp: 1500, strength: 1.85, boss: { kind: 4, behavior: 'triple' },
    reinforcements: reinforcements('AABC'),
    wavePlan: [
      wave(3, 'AAAA', 1.1),
      wave(16, 'AAAAAAAAAAAA', 0.4),
      wave(29, 'AAAAAAAAAAAA', 0.4),
      wave(43, 'BB', 1.4),
      wave(52, 'DCC', 1.8),
      wave(73, 'AAAAAAAACC', 0.6),
    ],
  },
  {
    name: '放課後のらくがき', subtitle: '折り目を越えて、向こう側へ。',
    hp: 2200, strength: 1.75, boss: { kind: 5, behavior: 'sweep' },
    fold: { from: 550, to: 650, speed: 0.5 },
    reinforcements: reinforcements('DCC'),
    wavePlan: [
      wave(3, 'AAC', 2.3),
      wave(18, 'CCCC', 2),
      wave(36, 'DCCCC', 1.4),
      wave(56, 'BB', 0.7),
      wave(72, 'DCCCCC', 1.3),
    ],
  },
  {
    name: '夕暮れの見開き', subtitle: 'このノートの、主役になろう。',
    hp: 3000, strength: 1.4, boss: { kind: 6, behavior: 'guard' },
    fold: { from: 550, to: 650, speed: 0.5 },
    reinforcements: reinforcements('BBBC'),
    wavePlan: [
      wave(3, 'ABB', 1.8),
      wave(17, 'BBBB', 0.9),
      wave(32, 'DCC', 2),
      wave(50, 'BBBBBB', 0.8),
      wave(70, 'DAACCC', 1.2),
      wave(90, 'BBBBCC', 0.9),
    ],
  },
  {
    name: '向こう側の余白', subtitle: '新しい章を、あいうえおから。',
    hp: 2300, strength: 1.95, boss: { kind: 4, behavior: 'triple' },
    fold: { from: 420, to: 520, speed: 0.5 },
    reinforcements: reinforcements('AAABBC'),
    wavePlan: [
      wave(3, 'AAAAAA', 0.7),
      wave(17, 'AAAAAAAAAAAAAA', 0.35),
      wave(30, 'AAAAAAAAAAAAAA', 0.35),
      wave(43, 'DCC', 1.8),
      wave(53, 'AAAAAAAAAABB', 0.5),
      wave(76, 'DAAAAAAAACC', 0.6),
    ],
  },
  {
    name: '長い横線', subtitle: '払いの向こうに、隙がある。',
    hp: 2800, strength: 1.65, boss: { kind: 5, behavior: 'sweep' },
    reinforcements: reinforcements('ECC'),
    wavePlan: [
      wave(3, 'ABC', 2),
      wave(20, 'DCCCC', 1.6),
      wave(37, 'BBCC', 1),
      wave(55, 'EECC', 1.5),
      wave(78, 'DCCEECC', 1.2),
    ],
  },
  {
    name: '輪のむこうへ', subtitle: 'この章で育った文字と、最後の一押し。',
    hp: 3300, strength: 1.32, boss: { kind: 6, behavior: 'guard' },
    fold: { from: 670, to: 770, speed: 0.5 },
    reinforcements: reinforcements('BBCC'),
    wavePlan: [
      wave(3, 'AABB', 1.2),
      wave(19, 'DCCCCC', 1.2),
      wave(38, 'BBBBBB', 0.7),
      wave(56, 'DFFCC', 1.3),
      wave(78, 'DDECC', 1.6),
      wave(99, 'BBBBCCC', 0.8),
    ],
  },
  {
    name: '書きかけの文字', subtitle: '完成する前に、もう一歩。',
    hp: 2500, strength: 1.4, boss: { kind: 4, behavior: 'triple' },
    writing: { duration: 4, x: 870 },
    reinforcements: reinforcements('DBE'),
    wavePlan: [
      wave(3, 'AABB', 1),
      wave(19, 'DDEE', 1.4),
      wave(38, 'AAAAAAAACC', 0.5),
      wave(58, 'DDEE', 1.2),
      wave(82, 'DDEECC', 1),
    ],
  },
  {
    name: '読点でひと休み', subtitle: '小さな点にも、意味がある。',
    hp: 2900, strength: 1.65, boss: { kind: 5, behavior: 'sweep' },
    punctuation: true,
    reinforcements: reinforcements('HBBCC'),
    wavePlan: [
      wave(3, 'AAH', 1.5),
      wave(19, 'HAAAAAAH', 0.5),
      wave(37, 'DHHCC', 1.2),
      wave(57, 'HHAAAAAACC', 0.6),
      wave(80, 'DHHCCEE', 1.2),
    ],
  },
  {
    name: '書き終わるまでに', subtitle: '待つ時間と、攻める時間。',
    hp: 3400, strength: 1.4, boss: { kind: 6, behavior: 'guard' },
    writing: { duration: 4, x: 880 }, punctuation: true,
    reinforcements: reinforcements('HBBCC'),
    wavePlan: [
      wave(3, 'ABAH', 1.2),
      wave(19, 'DHEECC', 1.2),
      wave(38, 'BBBBHH', 0.6),
      wave(56, 'DHHAAAAACC', 0.6),
      wave(77, 'DDEHCC', 1),
      wave(98, 'DHHBBCC', 0.8),
    ],
  },
  {
    name: '折り目と書きかけ', subtitle: '覚えたことを、この一行に。',
    hp: 2700, strength: 1.5, boss: { kind: 4, behavior: 'triple' },
    writing: { duration: 4, x: 870 }, fold: { from: 610, to: 710, speed: 0.5 },
    reinforcements: reinforcements('DBCC'),
    wavePlan: [
      wave(3, 'AABB', 0.9),
      wave(18, 'DDEE', 1.1),
      wave(36, 'CCCCCC', 1.2),
      wave(54, 'DDBBBB', 0.8),
      wave(76, 'DDEECC', 1),
      wave(96, 'BBBBCCCC', 0.7),
    ],
  },
  {
    name: '消さずに残した一行', subtitle: '最後の見開きへ、つなごう。',
    hp: 3300, strength: 1.6, boss: { kind: 5, behavior: 'sweep' },
    punctuation: true, fold: { from: 500, to: 600, speed: 0.5 },
    reinforcements: reinforcements('HHBCC'),
    wavePlan: [
      wave(3, 'AAHH', 0.9),
      wave(18, 'HHAAAAAAAA', 0.4),
      wave(36, 'DHHCCCC', 1),
      wave(55, 'BBBBHH', 0.6),
      wave(75, 'DEHHCCCC', 1),
      wave(97, 'HHAAAABBCC', 0.6),
    ],
  },
  {
    name: 'さいごの一文字', subtitle: 'チャイムが鳴る、その前に。',
    hp: 3800, strength: 1.5, boss: { kind: 8, behavior: 'triple', finale: true },
    writing: { duration: 4, x: 880 }, punctuation: true,
    reinforcements: reinforcements('FHBCC'),
    wavePlan: [
      wave(3, 'ABAH', 1),
      wave(19, 'DDEECC', 1.1),
      wave(37, 'HHAAAAAAAA', 0.4),
      wave(55, 'BBBBCCCC', 0.7),
      wave(74, 'DFEHCC', 1),
      wave(98, 'DHHBBECC', 0.8),
    ],
  },
].map((stage, i) => ({ ...stage,
  // 最終波の後も守備隊が補充される。待つだけで敵が尽きる状態を作らない。
  reinforcements: { ...stage.reinforcements, at: stage.wavePlan.at(-1).at + stage.reinforcements.every },
  chapter: Math.floor(i / 3), waves: stage.wavePlan.length }));

export function isChapterEnd(stage) {
  return !STAGES[stage + 1] || STAGES[stage + 1].chapter !== STAGES[stage].chapter;
}
export function nextLoadout(stage, ranks) {
  return isChapterEnd(stage) ? [0, 0, 0, 0, 0] : [...ranks];
}
