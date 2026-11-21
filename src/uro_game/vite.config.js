import { defineConfig } from 'vite';
import process from 'node:process';
import { resolve, sep } from 'node:path';
import { rmSync } from 'node:fs';
export default defineConfig({
  base: `${process.env.VITE_BASE_PATH || '/'}uro_game/`,
  build: { outDir: '../../public/uro_game', emptyOutDir: true },
  plugins: [{
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
