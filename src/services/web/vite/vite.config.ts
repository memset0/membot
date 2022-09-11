import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'pinia',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
        },
      ],
      dirs: [
        './src/data',
      ],
      resolvers: [
        ArcoResolver()
      ],
    }),
    Components({
      dirs: [
        path.join(__dirname, 'src/layout'),
        path.join(__dirname, 'src/components'),
      ],
      resolvers: [
        ArcoResolver({
          sideEffect: true,
          resolveIcons: true,
        }),
      ],
    })
  ]
})