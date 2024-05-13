<template>
  <div class="app">
    <header>
      <h1>兔兔小游戏中心</h1>
      <img :src="defaultGravatar" alt="Player Avatar" class="avatar">
      <div>{{nickname}}</div>
      <div v-if="!email.endsWith('@amiyabot.com')">{{ email }}</div>
      <div v-if="email.endsWith('@amiyabot.com')">临时账户</div>
    </header>
    <main>
      <button class="button" @click="createGame">创建游戏</button>
      <button class="button"  @click="joinGame">加入游戏</button>
    </main>
    <footer>
      <button @click="logout" class="logout-button">登出</button>
    </footer>
    <el-dialog v-model="showReconnectDialog" title="断线重连" center="true" show-close="false">
        <div style="text-align: center;">检测到您有一局正在进行的游戏，是否重新连接？</div>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="secondary" @click="handleCancelReconnect">取消</el-button>
                <el-button type="primary" @click="handleReconnect">确定</el-button>
            </span>
        </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
//import CryptoJS from 'crypto-js';
import { connectToGameHub } from '@src/api/SignalR.ts';

const router = useRouter();

const email = ref(localStorage.getItem('email') || '');
const nickname = ref(localStorage.getItem('nickname') || '');
const showReconnectDialog = ref(false);
const defaultGravatar = "/ceobe.jpeg"//'https://www.gravatar.com/avatar/' + CryptoJS.MD5(email.value.trim().toLowerCase()) + '?d=identicon';

var connect=async ()=>{
  const ret = await connectToGameHub();
  if(ret){
    console.log('RegularHome 连接成功');

    //检查已有房间
    if(localStorage.getItem('current-game-id')){
      showReconnectDialog.value = true;
    }

  }else{
    console.log('RegularHome 连接失败');
    setTimeout(connect, 1000);
  }  
}

var handleCancelReconnect = () => {
  localStorage.removeItem('current-game-id');
  showReconnectDialog.value = false;
}

var handleReconnect = () => {
  showReconnectDialog.value = false;
  router.push('/regular-home/room-waiting/'+localStorage.getItem('current-game-id'));
}

onMounted(async () => {
  if (!email.value) {
    router.push('/login');
  }
  
  await connect();
});

function createGame() {
  console.log('创建游戏');
  router.push('/regular-home/create-room');
}

function joinGame() {
  console.log('加入游戏');
  router.push('/regular-home/join-room');
}


function logout() {
  router.push('/logout');
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
