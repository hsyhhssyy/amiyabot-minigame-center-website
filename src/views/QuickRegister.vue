<template>
    <div class="container">
        <div class="register-card">
            <h1>兔兔小游戏中心-输入昵称快速开玩</h1>
            <p></p>
            <el-form @submit.native.prevent="register" label-width="100px">
                <el-form-item label="昵称：">
                    <el-input v-model="nickname"></el-input>
                </el-form-item>
                <el-button type="primary" @click="register">直接开玩</el-button>
                <el-button type="secondary" @click="backToLogin">返回登录</el-button>
            </el-form>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // 导入useRouter
import { ElMessage } from 'element-plus'; // 导入Toast组件
import { quickLoginAPI,quickRegisterAPI } from '../api/Account';

const router = useRouter(); // 获取router实例
const nickname = ref(''); // 用于存储用户输入的昵称

var backToLogin = () => {
    router.push('/login');
}

const register = async () => {

        if(nickname.value === '') {
            ElMessage({
                message: '请输入昵称',
                type: 'error',
            });
            return;
        }

        const response = await quickRegisterAPI(nickname.value);
        if (response&&response.token) {            
            const success = await quickLoginAPI(response.token,response.email);
            if (success) {
                router.push('/');
            }
        }
};
</script>

<style scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f2f2f2;
}

.register-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
    width: 400px;
    text-align: center;
}

.toggle-group {
    display: flex;
    justify-content: center;
}
</style>