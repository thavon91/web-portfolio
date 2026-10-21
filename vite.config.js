
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* global process */

export default defineConfig({
  plugins: [react()],
  // Use '/' for Netlify, '/web-portfolio/' for GitHub Pages
  base: process.env.VITE_BASE_PATH || '/',
})
