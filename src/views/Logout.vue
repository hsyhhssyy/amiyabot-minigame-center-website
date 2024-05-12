<template>
    <!-- 页面内容并不重要，因为用户会被重定向 -->
    <div>
      正在登出...
    </div>
  </template>
  
  <script lang="ts">
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  
  export default {
    setup() {
      const router = useRouter();
  
      // 组件挂载时执行登出逻辑
      onMounted(() => {
        // 删除存储的令牌和用户角色
        localStorage.removeItem('jwt-token');
        localStorage.removeItem('user-role');
  
        // 重定向到登录页面
        router.push('/login');
      });
  
      return {};
    },
  };
  </script>
  