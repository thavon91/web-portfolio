import { defineConfig } from 'vite';
import process from 'node:process';
export default defineConfig({
  base: `${process.env.VITE_BASE_PATH || '/'}uro_game/`,
  build: { outDir: '../../public/uro_game', emptyOutDir: true },
});
