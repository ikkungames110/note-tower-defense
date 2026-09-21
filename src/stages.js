// 時刻・敵の並び・出現間隔をページごとに設計する。番号から敵やボスを推測しない。
const wave = (at, enemies, label, spacing = 2.3) => ({
  at, label, spacing, enemies: [...enemies].map(glyph => 'ABCDEFGHZ'.indexOf(glyph)),
});
export const CHAPTERS = ['はじまりの余白', '折り目の向こう', '書きかけのページ', 'さいごの見開き'];
export const STAGES = [
  {
    name: 'はじまりの1ページ', subtitle: 'まずは、余白からはじめよう。',
    tip: '下のカードで文字を召喚。群れには「あ」、遠くには「う」。Eの三連撃後に攻めよう。',
    hp: 1500, strength: 1, boss: { kind: 4, behavior: 'triple' },
    wavePlan: [
      wave(3, 'AAA', 'まずは前線を作ろう'),
      wave(20, 'AAAA', '「あ」で群れを迎えよう', 1.2),
      wave(37, 'BBACC', '前衛の後ろから「う」で援護'),
      wave(54, 'DAABCC', '頑丈なDに備えよう'),
      wave(71, 'ABACABC', 'ボスE・三連撃のあとに攻めよう'),
    ],
  },
  {
    name: '放課後のらくがき', subtitle: '折り目を越えて、向こう側へ。',
    tip: '折り目では敵も味方も歩く速さが半分に。「お」を先に送り、「う」で援護。',
    hp: 2200, strength: 1.2, boss: { kind: 5, behavior: 'sweep' },
    fold: { from: 550, to: 650, speed: 0.5 },
    wavePlan: [
      wave(3, 'AABA', '折り目での進み方を見よう'),
      wave(19, 'AACAC', '折り目の向こうから遠距離攻撃'),
      wave(35, 'DAAACC', '「お」を先に送り出そう'),
      wave(51, 'AAAABBC', '「あ」で折り目の群れを迎撃', 1.3),
      wave(67, 'DEAACABC', '壁の後ろにいるEに注意'),
      wave(83, 'DBACAEABC', 'ボスF・前衛と後衛を保とう'),
    ],
  },
  {
    name: '夕暮れの見開き', subtitle: 'このノートの、主役になろう。',
    tip: 'Gの輪がゆるむ休止中はダメージ1.5倍。消しゴムを好機に合わせよう。',
    hp: 3000, strength: 1.4, boss: { kind: 6, behavior: 'guard' },
    fold: { from: 550, to: 650, speed: 0.5 },
    wavePlan: [
      wave(3, 'AABAC', '前衛と後衛をそろえよう'),
      wave(18, 'AAABBC', '群れをまとめて迎撃', 1.4),
      wave(33, 'DABACAC', '遠距離の援護を絶やさずに'),
      wave(48, 'DEAACABC', '押し戻して前線を立て直そう'),
      wave(63, 'DFACABACC', 'Fの射程に注意'),
      wave(78, 'DABEAFCABC', '消しゴムで連続攻勢をしのごう', 1.8),
      wave(93, 'DFEABACABCC', 'ボスG・育てた文字で最後の戦い'),
    ],
  },
  {
    name: '向こう側の余白', subtitle: '新しい章を、あいうえおから。',
    tip: 'ここから新しい編成。左寄りの折り目に「お」を先に送り、群れを迎えよう。',
    hp: 2300, strength: 1.2, boss: { kind: 4, behavior: 'triple' },
    fold: { from: 420, to: 520, speed: 0.5 },
    wavePlan: [
      wave(3, 'AAA', '新しい章の前線を作ろう'),
      wave(21, 'AAAABB', '手前の折り目で群れを迎撃', 1.1),
      wave(39, 'DACCAB', '後衛の射程で折り目を越えよう'),
      wave(57, 'AAABACC', '前衛を切らさず「う」を追加'),
      wave(75, 'DABACABC', 'Eの三連撃後に押し返そう'),
    ],
  },
  {
    name: '長い横線', subtitle: '払いの向こうに、隙がある。',
    tip: 'Fは構えてから前方をまとめて押し戻す。「う」を後ろに残し、前衛を補充。',
    hp: 2800, strength: 1.3, boss: { kind: 5, behavior: 'sweep' },
    wavePlan: [
      wave(3, 'ABAC', '前衛の後ろに遠距離の文字を'),
      wave(20, 'AACAC', 'Cとの射程差を生かそう'),
      wave(37, 'DBAACC', '「お」で受けて「う」で援護'),
      wave(54, 'AAABABCC', '援護を守る前衛を補充', 1.5),
      wave(71, 'DEAABACC', '鉛筆を残して払いに備えよう'),
      wave(88, 'DABCABACC', 'Fの構え・後衛を守ろう'),
    ],
  },
  {
    name: '輪のむこうへ', subtitle: 'この章で育った文字と、最後の一押し。',
    tip: 'Gの防御中はダメージ65%減。輪がゆるむ3秒間に攻撃と消しゴムを重ねよう。',
    hp: 3300, strength: 1.4, boss: { kind: 6, behavior: 'guard' },
    fold: { from: 670, to: 770, speed: 0.5 },
    wavePlan: [
      wave(3, 'AABAC', '遠い折り目まで前線を運ぼう'),
      wave(19, 'AABBCC', '群れと遠距離をまとめて迎撃'),
      wave(35, 'DABACAC', '押し戻しで前線を保とう'),
      wave(51, 'DEAACABC', '援護の文字を増やそう'),
      wave(67, 'DFABACACC', '折り目にたまる敵に備えよう'),
      wave(83, 'DABEAFCABC', '最後の消しゴムをためよう', 1.8),
      wave(99, 'DFEABACABCC', 'Gの輪がゆるむ瞬間に総攻撃'),
    ],
  },
  {
    name: '書きかけの文字', subtitle: '完成する前に、もう一歩。',
    tip: '薄い文字は4秒で完成。書かれている間は動きませんが、攻撃で倒せます。',
    hp: 2500, strength: 1.25, boss: { kind: 4, behavior: 'triple' },
    writing: { duration: 4, x: 870 },
    wavePlan: [
      wave(3, 'AAA', '薄い文字は書きかけ'),
      wave(23, 'ABAC', '完成前に前線を押し上げよう'),
      wave(43, 'DAABCC', '守りながら書きかけを狙おう'),
      wave(63, 'AAABBACC', '群れには「あ」の輪を', 1.5),
      wave(83, 'DBACABCC', 'Eの休止中に書きかけも攻撃'),
    ],
  },
  {
    name: '読点でひと休み', subtitle: '小さな点にも、意味がある。',
    tip: 'Hが置く「、」は道をふさぎます。「あ」でまとめて消すか、8秒で消えるのを待とう。',
    hp: 2900, strength: 1.35, boss: { kind: 5, behavior: 'sweep' },
    punctuation: true,
    wavePlan: [
      wave(3, 'AAH', 'Hは前に読点を置く'),
      wave(22, 'ABAHC', '「あ」で読点ごと攻撃'),
      wave(41, 'DACHAC', '後ろのHにも前線を届けよう'),
      wave(60, 'AAHABBCC', '消しゴムでも読点を消せる', 1.7),
      wave(79, 'DAHCEABC', '払いで戻されても前衛を補充'),
    ],
  },
  {
    name: '書き終わるまでに', subtitle: '待つ時間と、攻める時間。',
    tip: '書きかけの敵と読点が重なるページ。Gの隙に消しゴムを合わせ、道を開こう。',
    hp: 3400, strength: 1.45, boss: { kind: 6, behavior: 'guard' },
    writing: { duration: 4, x: 880 }, punctuation: true,
    wavePlan: [
      wave(3, 'AABAC', '完成する前に前線を作ろう'),
      wave(21, 'AHABCC', 'Hが読点を書き始める'),
      wave(39, 'DABHACC', '「あ」で道を開き「う」で援護'),
      wave(57, 'DEAHBACC', '書きかけのEを狙おう'),
      wave(75, 'DFAAHBACC', '消しゴムの好機を待とう'),
      wave(93, 'DFEHABACCC', 'Gの輪がゆるむ3秒に攻めよう'),
    ],
  },
  {
    name: '折り目と書きかけ', subtitle: '覚えたことを、この一行に。',
    tip: '折り目の向こうに書きかけの敵。初期編成から、遠距離の援護を育てよう。',
    hp: 2700, strength: 1.3, boss: { kind: 4, behavior: 'triple' },
    writing: { duration: 4, x: 870 }, fold: { from: 610, to: 710, speed: 0.5 },
    wavePlan: [
      wave(3, 'AAAB', '最後の章の前線を作ろう'),
      wave(23, 'AABACC', '折り目を「う」の射程で越えよう'),
      wave(43, 'DABACCC', '完成前の敵を狙って前進'),
      wave(63, 'DAABABCC', '育てたい役割を考えよう'),
      wave(83, 'DBACABACC', 'Eの三連撃後に押し切ろう'),
    ],
  },
  {
    name: '消さずに残した一行', subtitle: '最後の見開きへ、つなごう。',
    tip: '折り目に読点が重なります。前衛を途切れさせず、範囲攻撃で道を開こう。',
    hp: 3300, strength: 1.45, boss: { kind: 5, behavior: 'sweep' },
    punctuation: true, fold: { from: 500, to: 600, speed: 0.5 },
    wavePlan: [
      wave(3, 'ABAHC', 'Hと折り目に備えよう'),
      wave(21, 'AAHABBCC', '読点は「あ」でまとめて', 1.5),
      wave(39, 'DAHABACC', '後衛を守って前進'),
      wave(57, 'DEAHBACC', '鉛筆を残して前衛を補充'),
      wave(75, 'DABHAEACC', '攻勢の合間に回復を強化'),
      wave(93, 'DFAHBACC', 'Fを倒して最後のページへ'),
    ],
  },
  {
    name: 'さいごの一文字', subtitle: 'チャイムが鳴る、その前に。',
    tip: '最後のZは三連撃。HPが半分になると、払い・守り・三連撃を順に使います。',
    hp: 3800, strength: 1.5, boss: { kind: 8, behavior: 'triple', finale: true },
    writing: { duration: 4, x: 880 }, punctuation: true,
    wavePlan: [
      wave(3, 'AABAC', '育てた文字で前線を作ろう'),
      wave(22, 'AHABCC', '書きかけと読点を越えよう'),
      wave(41, 'DABHACC', '範囲と射程で道を開こう'),
      wave(60, 'DEAHBACC', '前衛を守り、鉛筆をためよう'),
      wave(79, 'DFABHACC', '覚えた戦い方を合わせよう'),
      wave(98, 'DFAEHABACC', '最終ボスZ・構えを見て備えよう'),
    ],
  },
].map((stage, i) => ({ ...stage, chapter: Math.floor(i / 3), waves: stage.wavePlan.length }));

export function isChapterEnd(stage) {
  return !STAGES[stage + 1] || STAGES[stage + 1].chapter !== STAGES[stage].chapter;
}
export function nextLoadout(stage, ranks) {
  return isChapterEnd(stage) ? [0, 0, 0, 0, 0] : [...ranks];
}
