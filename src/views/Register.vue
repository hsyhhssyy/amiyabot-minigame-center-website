<template>
    <div class="container">
        <div class="register-card">
            <h1>兔兔小游戏中心-用户注册</h1>
            <el-radio-group class="toggle-group" v-model="accountType">
                <el-radio-button label="普通账户">普通账户</el-radio-button>
                <el-radio-button label="开发者账户" v-if="false">开发者账户</el-radio-button>
            </el-radio-group>

            <p></p>

            <!-- 普通账户表单 -->
            <el-form v-if="accountType === '普通账户'" @submit.native.prevent="register" label-width="100px">
                <el-form-item label="用户名：">
                    <el-input v-model="username"></el-input>
                </el-form-item>
                <el-form-item label="密码：">
                    <el-input type="password" v-model="password"></el-input>
                </el-form-item>
                <el-form-item label="重复密码：">
                    <el-input type="password" v-model="confirmPassword"></el-input>
                </el-form-item>
                <el-button type="primary" @click="register">注册</el-button>
            </el-form>

            <!-- 开发者账户表单 -->
            <el-form v-if="accountType === '开发者账户'" @submit.native.prevent="register" label-width="100px">
                <el-form-item label="邮箱">
                    <el-input v-model="email"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                    <el-input type="password" v-model="password"></el-input>
                </el-form-item>
                <el-form-item label="重复密码">
                    <el-input type="password" v-model="confirmPassword"></el-input>
                </el-form-item>
                <el-button type="primary" @click="register">注册</el-button>
            </el-form>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios'; // 导入axios库
import { useRouter } from 'vue-router'; // 导入useRouter
import { ElMessage } from 'element-plus'; // 导入Toast组件

const router = useRouter(); // 获取router实例
const accountType = ref('普通账户');
const email = ref(''); // 用于存储用户输入的邮箱
const password = ref(''); // 用于存储用户输入的密码
const confirmPassword = ref(''); // 用于存储用户输入的确认密码
const username = ref(''); // 用于存储用户输入的用户名

const register = async () => {
    try {

        if (confirmPassword.value !== password.value) {
            ElMessage({
                message: '两次输入的密码不一致',
                type: 'error',
            });
            return
        }

        const registerModel = {
            Email: accountType.value === '开发者账户' ? email.value : '',
            Password: password.value,
            ClaimedRole: accountType.value,
        };

        if (accountType.value === '普通账户') {
            registerModel.Email = username.value;
        }

        const response = await axios.post('/api/account/register', registerModel);
        if (response.data.message === '用户注册成功') {
            router.push('/login');
        }
    } catch (error: any) {
        // 初始化一个默认的错误消息
        let message = '注册失败';

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