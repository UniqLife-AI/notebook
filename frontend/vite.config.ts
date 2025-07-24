// File: frontend/vite.config.ts
// Намерение: Вернуть alias для 'wailsjs', но с ПРАВИЛЬНЫМ путем.
// Wails генерирует папку 'wailsjs' ВНУТРИ 'frontend', поэтому
// путь должен быть разрешен из текущей директории (__dirname).

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ИСПРАВЛЕНИЕ: Это правильный alias. Он указывает на папку 'wailsjs',
      // которая находится в той же директории, что и этот конфиг.
      'wailsjs': path.resolve(__dirname, './wailsjs'),
    },
  },
})