import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Относительные пути — сборка работает из любой папки (GitHub Pages, Netlify и т.п.)
  base: './',
  plugins: [react()],
})
