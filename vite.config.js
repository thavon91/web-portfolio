
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use '/' for Fly.io/Netlify, '/web-portfolio/' for GitHub Pages
  base: process.env.VITE_BASE_PATH || '/',
})
