import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: 'static',
  build: {
    outDir: 'public',
    emptyOutDir: true,
  },
})
