import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await' // <-- ДОБАВЛЕН ИМПОРТ

export default defineConfig({
  plugins: [
  	react(),
  	wasm(),
  	topLevelAwait() // <-- ДОБАВЛЕН ПЛАГИН
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})