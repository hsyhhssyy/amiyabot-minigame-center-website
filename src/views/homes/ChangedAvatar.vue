<template>
    <div class="app">
        <header>
            <h1>编辑头像与昵称</h1>
            <img :src="defaultGravatar" alt="Player Avatar" class="avatar">
            <el-input>{{ nickname }}</el-input>
            <div v-if="!email.endsWith('@amiyabot.com')">{{ email }}</div>
            <div v-if="email.endsWith('@amiyabot.com')">临时账户</div>
        </header>
        <main>
            <button class="button" @click="handleSave">保存</button>
            <button class="button" @click="handleCancel">取消</button>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref(localStorage.getItem('email') || '');
const nickname = ref(localStorage.getItem('nickname') || '');
const defaultGravatar = "/ceobe.jpeg"

//https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/char_2015_dusk%232.png
//https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/char_293_thorns@it%231.png

onMounted(async () => {
    
});

const handleSave = () => {
    console.log('save');
    router.push('/regular-home');
}

const handleCancel = () => {
    console.log('cancel');
    router.push('/regular-home');
}

</script>

<style scoped>
.app {
    text-align: center;
}

header {
    background-color: #f0f0f0;
    padding: 20px;
    font-size: 20px;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
}


.logout-button {
    width: 150px;
    height: 60px;
    margin: 10px;
    font-size: 18px;
    padding: 10px 20px;
    background-color: #D32F2F;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.logout-button:hover {
    background-color: #C62828;
}


.main {
    margin-top: 20px;
}

.button {
    width: 150px;
    height: 60px;
    margin: 10px;
    font-size: 18px;
    cursor: pointer;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    transition: background-color 0.3s;
}

.button:hover {
    background-color: #45a049;
}
</style>