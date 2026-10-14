import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// ~/ — код сервера, @/ — общий код фронта (расчёт слотов, типы, телефон), как в tsconfig
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('../frontend/src', import.meta.url)),
    },
  },
  test: {
    testTimeout: 20000,
  },
})
