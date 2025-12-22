import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "./", // Required for GitHub Pages
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
})
