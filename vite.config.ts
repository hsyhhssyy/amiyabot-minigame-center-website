import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  define: {
    // 'import.meta.env.VITE_BACKEND_BASE_URL': JSON.stringify('https://amiya-bot-service.hsyhhssyy.net'),
    // 'import.meta.env.VITE_BACKEND_BASE_URL': JSON.stringify('http://localhost:5003'),
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
  },
}));
