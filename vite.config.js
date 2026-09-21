import { defineConfig } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';

// コンセプト比較用の大きな制作資料は配信せず、ゲームに必要な素材だけを出力する。
export default defineConfig(({ command }) => ({
  base: './',
  publicDir: command === 'build' ? false : 'public',
  plugins: [{
    name: 'game-assets', apply: 'build',
    async closeBundle() {
      await mkdir('dist/assets', { recursive: true });
      await Promise.all([
        ...['classroom-notebook.png', 'eraser-soft.png', 'base-home.png', 'base-enemy.png'].map(name => copyFile(`public/assets/${name}`, `dist/assets/${name}`)),
        copyFile('public/favicon.svg', 'dist/favicon.svg'),
      ]);
    },
  }],
}));
