import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // 98.css uses @media (not(hover)) which lightningcss (used by Vite 8/rolldown)
    // cannot parse. Disable CSS minification to prevent build failure.
    cssMinify: false,
  },
})
