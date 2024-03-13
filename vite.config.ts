import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from 'path'
import dts from 'vite-plugin-dts'
import libInjectCss from './libInjectCss'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader(), dts(), libInjectCss()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.ts'),
      name: 'mapbox-embed',
      fileName: format => (format === 'es' ? 'mapbox-embed.mjs' : 'mapbox-embed.cjs')
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
