<template>
    <div class="container">
        <div class="register-card">
            <h1>兔兔小游戏中心-快速开玩</h1>
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
import axios from 'axios'; // 导入axios库
import { useRouter } from 'vue-router'; // 导入useRouter
import { ElMessage } from 'element-plus'; // 导入Toast组件
import { quickLoginAPI } from '../api/Account';

const router = useRouter(); // 获取router实例
const nickname = ref(''); // 用于存储用户输入的昵称

var backToLogin = () => {
    router.push('/login');
}

const register = async () => {
    try {

        if(nickname.value === '') {
            ElMessage({
                message: '请输入昵称',
                type: 'error',
            });
            return;
        }

        const registerModel = {
            Nickname: nickname.value
        };

        const response = await axios.post('/api/account/quickRegister', registerModel);
        if (response.data.token) {            
            const { success, error } = await quickLoginAPI(response.data.token,response.data.email);
            if (success) {
                router.push('/');
            } else {
                ElMessage.error(error || '快速注册登录失败');
            }
        }
    } catch (error: any) {
        // 初始化一个默认的错误消息
        let message = '快速注册失败';

        // 检查error对象是否有符合预期结构的属性
        // error.response.data可能是数组，如果是数组，需要显示多个toast
        if (error.response &&
            error.response.data &&
            Array.isArray(error.response.data) &&
            error.response.data[0] &&
            error.response.data[0].description) {
            for (const item of error.response.data) {
                message += '\n' + item.description;
            }
        }

        if (error.response &&
            error.response.data &&
            error.response.data.message) {
                message += '\n' + error.response.data.message;
        }

        // 显示红色的toast
        ElMessage({
            message: message,
            type: 'error',
        });


        console.error('注册失败:', error);
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