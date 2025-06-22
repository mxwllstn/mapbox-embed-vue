import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@mxwllstn/mapbox-embed-vue': path.resolve(__dirname, '../package/src'),
    },
  },
})
