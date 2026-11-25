
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preservePdf } from './build/preserve-pdf.js'

/* global process */

const projectRoot = dirname(fileURLToPath(import.meta.url))

// Public game HTML needs an explicit directory route in Vite's dev server;
// otherwise /uro_game/ falls through to the portfolio's SPA entry.
function serveUroDirectory(server) {
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    const directory = `${server.config.base}uro_game/`
    if (url.pathname === directory.slice(0, -1)) {
      res.writeHead(302, { Location: `${directory}${url.search}` })
      res.end()
      return
    }
    if (url.pathname === directory) {
      req.url = `${directory}index.html${url.search}`
    }
    next()
  })
}

export default defineConfig(({ mode }) => {
  const gameEnv = loadEnv(mode, resolve(projectRoot, 'src/uro_game'), 'VITE_')
  const rootEnv = loadEnv(mode, projectRoot, 'VITE_')
  return {
  define: Object.fromEntries(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'].map((key) => [
    `import.meta.env.${key}`, JSON.stringify(process.env[key] || rootEnv[key] || gameEnv[key] || ''),
  ])),
  plugins: [react(), preservePdf(resolve(projectRoot, 'src/2000_game/GDD/2000 GDD.pdf'), 'assets/2000 GDD-DYBJECpF.pdf'), {
    name: 'uro-directory-route',
    configureServer: serveUroDirectory,
    configurePreviewServer: serveUroDirectory,
  }],
  // Use '/' for root hosting, '/web-portfolio/' for GitHub Pages.
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    rollupOptions: {
      input: {
        portfolio: resolve(projectRoot, 'index.html'),
        game2000: resolve(projectRoot, 'src', '2000_game', 'index.html'),
      },
    },
  },
  }
})
