# 背景素材

`classroom-notebook.png` は `public/concepts/selected/03-clean.png` を元に、内蔵 image_gen で文字とその影だけを除去したゲーム用背景。実行時の画像生成・外部通信は不要。

生成プロンプト:

Use case: precise-object-edit. Asset type: photorealistic background plate for a browser game. Edit target: supplied selected concept 03. Remove ALL ten standing handwritten letters (あいうえお ABCDE) and their cast shadows, reconstruct clean ruled notebook paper in their places. Preserve everything else: exact very low camera angle, open notebook paper fibers, gently curved left page, subtle blue-gray ruled lines, layered page edge, wooden desk, strongly blurred empty nostalgic Japanese classroom, dark green chalkboard, warm natural window light from the left. No text, no characters, no objects added, no dust or graphite debris. Retain the exact original composition and wide aspect ratio. Photorealistic clean empty notebook stage, not illustration.

## イラスト素材の制作記録

内蔵 `image_gen` で3点をそれぞれ生成し、透過PNGのアルファを保ったまま保存。生成プロンプト全文は [illustration-prompts.json](illustration-prompts.json)。

- `base-home.png`：瓦屋根の木造門・見張り台を描いた自軍の鉛筆画。
- `base-enemy.png`：角塔・丸塔・石の城門を描いた敵軍の鉛筆画。自軍とは異なる輪郭。
- `eraser-soft.png`：淡い灰色のスリーブの消しゴム。写真調を避けた柔らかいイラスト。

拠点はユーザーの指定により以前の落書き風の城（Canvasの鉛筆パス）へ戻した。`base-home.png`・`base-enemy.png` は制作記録として残し、読み込み・配信しない。消しゴムは小さく一度だけ表示し、0.55秒で消える。画面全体を往復してこする演出や消しかすは使用しない。動きを減らす設定では移動せずフェードのみ。

## 旧消しゴム `eraser.png`（未使用・制作記録）

内蔵 `image_gen` で生成した旧素材。現在のゲームでは読み込み・配信しない。

生成プロンプト：

> Use case: illustration-story. Asset type: transparent PNG sprite for a Japanese notebook tower defense game. Create one small realistic softly illustrated rectangular off-white rubber eraser in a plain muted gray-blue paper sleeve, no text or logo. Three-quarter side view, long axis horizontal, slightly worn rounded edges, natural classroom daylight from upper left, subtle graphite marks on rubber end. Low saturation, nostalgic quiet classroom, restrained realistic colored-pencil illustration, clean readable silhouette. Isolated centered object on genuinely transparent background, generous transparent margins. No hands, no pencil, no paper, no eraser crumbs, no scattered dots, no cast shadow outside the object, no decorative elements. Save as a game asset.
