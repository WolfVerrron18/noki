import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // базовый путь: на GitHub Pages сайт живёт в /<репозиторий>/ (BASE_PATH задаёт workflow)
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8090',
    },
  },
})
