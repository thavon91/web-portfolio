import { defineConfig } from 'vite';
import { resolve, sep } from 'node:path';
import { rmSync } from 'node:fs';
import { preservePdf } from '../../build/preserve-pdf.js';
export default defineConfig({
  // The game is served from /uro_game/ locally and /web-portfolio/uro_game/ on Pages.
  base: './',
  build: { outDir: '../../public/uro_game', emptyOutDir: true },
  plugins: [preservePdf(new URL('../assets/pdf/URO GDD.pdf', import.meta.url), 'assets/URO GDD-O2U4JKTq.pdf'), {
    name: 'exclude-private-public-assets',
    writeBundle(options) {
      const output = resolve(options.dir);
      for (const name of ['background.jpg.png', 'vfx']) {
        const target = resolve(output, name);
        if (!target.startsWith(output + sep)) throw new Error('Unexpected build cleanup path');
        rmSync(target, { recursive: true, force: true });
      }
    },
  }],
});
