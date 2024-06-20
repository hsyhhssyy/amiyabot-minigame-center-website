import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        sourcemap: true, // 启用 source map
      },
    plugins: [
        vue(),
        AutoImport({
            imports: [
                'vue',
                {
                    'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
                }
            ]
        }),
        Components({
            resolvers: [NaiveUiResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})
