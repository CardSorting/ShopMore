/**
 * [LAYER: INFRASTRUCTURE]
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['better-sqlite3'],
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@core': path.resolve(__dirname, './src/core'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})