// 時刻・敵の並び・出現間隔をページごとに設計する。番号から敵やボスを推測しない。
const wave = (at, enemies, label, spacing = 2.3) => ({
  at, label, spacing, enemies: [...enemies].map(glyph => 'ABCDEFG'.indexOf(glyph)),
});
export const CHAPTERS = ['はじまりの余白', '折り目の向こう'];
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
].map((stage, i) => ({ ...stage, chapter: Math.floor(i / 3), waves: stage.wavePlan.length }));

export function isChapterEnd(stage) {
  return !STAGES[stage + 1] || STAGES[stage + 1].chapter !== STAGES[stage].chapter;
}
export function nextLoadout(stage, ranks) {
  return isChapterEnd(stage) ? [0, 0, 0, 0, 0] : [...ranks];
}
