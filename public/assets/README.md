# 背景素材

`classroom-notebook.png` は `public/concepts/selected/03-clean.png` を元に、内蔵 image_gen で文字とその影だけを除去したゲーム用背景。実行時の画像生成・外部通信は不要。

生成プロンプト:

Use case: precise-object-edit. Asset type: photorealistic background plate for a browser game. Edit target: supplied selected concept 03. Remove ALL ten standing handwritten letters (あいうえお ABCDE) and their cast shadows, reconstruct clean ruled notebook paper in their places. Preserve everything else: exact very low camera angle, open notebook paper fibers, gently curved left page, subtle blue-gray ruled lines, layered page edge, wooden desk, strongly blurred empty nostalgic Japanese classroom, dark green chalkboard, warm natural window light from the left. No text, no characters, no objects added, no dust or graphite debris. Retain the exact original composition and wide aspect ratio. Photorealistic clean empty notebook stage, not illustration.

## 消しゴム `eraser.png`

内蔵 `image_gen` で生成。低彩度の青灰色のスリーブと白いゴム。透過PNGをそのまま保存し、Canvas上で往復させて使用する。

生成プロンプト：

> Use case: illustration-story. Asset type: transparent PNG sprite for a Japanese notebook tower defense game. Create one small realistic softly illustrated rectangular off-white rubber eraser in a plain muted gray-blue paper sleeve, no text or logo. Three-quarter side view, long axis horizontal, slightly worn rounded edges, natural classroom daylight from upper left, subtle graphite marks on rubber end. Low saturation, nostalgic quiet classroom, restrained realistic colored-pencil illustration, clean readable silhouette. Isolated centered object on genuinely transparent background, generous transparent margins. No hands, no pencil, no paper, no eraser crumbs, no scattered dots, no cast shadow outside the object, no decorative elements. Save as a game asset.
