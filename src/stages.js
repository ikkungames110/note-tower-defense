// 時刻・敵の並び・出現間隔をページごとに設計する。番号から敵やボスを推測しない。
const wave = (at, enemies, label, spacing = 2.3) => ({
  at, label, spacing, enemies: [...enemies].map(glyph => 'ABCDEFG'.indexOf(glyph)),
});
export const STAGES = [
  {
    name: 'はじまりの1ページ', subtitle: 'まずは、余白からはじめよう。',
    tip: '群れには「あ」、遠くの敵には「う」。ボスEは三連撃のあとが好機。',
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
    hp: 2200, strength: 1.2, boss: { kind: 5 },
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
    name: 'さいごの見開き', subtitle: 'このノートの、主役になろう。',
    tip: '折り目で足を止められる前に前衛を補充。消しゴムは敵が集まる瞬間に。',
    hp: 3000, strength: 1.4, boss: { kind: 6 },
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
].map(stage => ({ ...stage, waves: stage.wavePlan.length }));
