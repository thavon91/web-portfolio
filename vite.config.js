
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base: '/web-portfolio/', // <-- IMPORTANT // <-- your repo name
  base: '/', // Changed from '/web-portfolio/' for Fly.io deployment
})
