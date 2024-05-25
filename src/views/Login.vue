<template>
    <div class="login-container">
        <el-card class="login-card">
            <div slot="header">
                <h1>兔兔小游戏中心</h1>
            </div>
            <p class="disclaimer">本网站<b style="color: red;">不是</b>鹰角网络下属的官方网站。</p>
            <el-form>
                <el-form-item label="邮箱：">
                    <el-input v-model="email" placeholder="Email"></el-input>
                </el-form-item>
                <el-form-item label="密码：">
                    <el-input type="password" v-model="password" placeholder="Password"></el-input>
                </el-form-item>
                <el-form-item>
                    <div class="button-container">
                        <el-button type="primary" @click="login">登录</el-button>
                        <el-button type="secondary" @click="register">注册</el-button>
                        <el-button type="success" @click="quickRegister">游客登录</el-button>
                    </div>
                </el-form-item>
            </el-form>
            <div class="footer">
                <p>本网站不是鹰角网络官方网站，而是由爱好者自行开发的工具网站。</p>
                <a class="github-link friendly-link" href="https://github.com/hsyhhssyy/amiyabot-minigame-center-website"
                    target="_blank">
                    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                        alt="GitHub Logo" width="12" height="12">
                    GitHub Repository
                </a>
                <a class="beian-link friendly-link" href="https://beian.miit.gov.cn/" target="_blank">
                    <img src="https://img.alicdn.com/tfs/TB1..50QpXXXXX7XpXXXXXXXXXX-40-40.png" alt="Beian Logo"
                        width="12" height="12">
                    京ICP备2022033983号-2
                </a>
            </div>
        </el-card>
        <a class="amiyabot-commercial-link"
            href="https://qun.qq.com/qunpro/robot/qunshare?robot_uin=2854197898&amp;robot_appid=102068219&amp;biz_type=0"> 
            <div class="amiyabot-commercial-text">想要在QQ群里和朋友一起玩？<br/>点击或扫码添加阿米娅机器人到群聊。<br/>还有游戏数据查询等功能哦。</div> 
            <img class="amiyabot-commercial-qrcode"
                src="/amiyabot-qqgroup.png"
                alt="">
        </a>

    </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginAPI } from '../api/Account';

export default {
    setup() {
        const router = useRouter();
        const email = ref('');
        const password = ref('');

        const login = async () => {
            const success = await loginAPI(email.value, password.value);
            if (success) {
                router.push('/');
            }
        };

        const register = () => {
            router.push('/register');
        };

        const quickRegister = () => {
            router.push('/quickRegister');
        };

        return {
            email,
            password,
            login,
            register,
            quickRegister
        };
    },
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.login-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
    width: 400px;
    text-align: center;
}

.friendly-link{
    text-align: center;
    text-decoration: none;
    color: gray;
    font-size: 12px;
}

.amiyabot-commercial-link {
    display: box;
    margin-left: 20px;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
    width: 300px;
    text-decoration: none;
}

.amiyabot-commercial-text {
    display: block;
    margin-top: 20px;
    font-size: 14px;
    word-wrap: break-word;
    color: gray;
    text-align: center;
}

.amiyabot-commercial-qrcode {
    display: block;
    margin: 10px auto;    
    width: 250px;
}

.disclaimer {
    font-size: 14px;
    color: gray;
    text-align: center;
    margin-bottom: 20px;
}

.button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.footer {
    text-align: center;
    font-size: 14px;
    color: gray;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    border: none;
    align-items: center;
    height: auto;
  }

  .login-card {
    margin: 20px;
    width: 350px;
    padding: 0;
  }

  .amiyabot-commercial-link {
    margin-left: 0;
    margin-top: 20px;  
    width: 350px;
  }

  .amiyabot-commercial-qrcode {
    display: block;
    margin: 10px auto;    
    width: 350px;
    }
  .footer {
    flex-direction: column;
    display: flex;
}
}
</style>