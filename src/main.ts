import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import App from './App.vue';
import axios from 'axios';
import router from './router'; // 引入 router 对象
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
app.use(ElementPlus)
app.use(router) // 使用 router 对象
app.mount('#app');
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}


// 设置 axios 基础 URL
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_BASE_URL;

axios.interceptors.request.use(
    config => {
      if (!config.url?.endsWith('/login')) {
        const token = localStorage.getItem('jwt-token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

axios.interceptors.response.use(
    response => {
      // 如果响应返回正常，不做任何处理，继续返回响应
      return response;
    },
    error => {
      if (error.response && error.response.status === 401) {
        // 如果返回的 HTTP 状态码为 401，删除可能存在的无效 token，并跳转到登录页
        localStorage.removeItem('jwt-token');
        router.push('/login');
      }
      // 如果不是 401 错误，继续抛出错误让后续的 catch 块处理
      return Promise.reject(error);
    }
  );