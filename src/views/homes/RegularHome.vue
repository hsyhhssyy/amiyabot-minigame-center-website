<template>
  <div class="app">
    <NotificationBanner />
    <div v-if="isLoading" class="overlay">
      <p>{{ loadingText }}</p>
    </div>
    <header>
      <h1>兔兔小游戏中心</h1>
      <img :src="defaultGravatar" alt="Player Avatar" class="avatar">
      <div>{{ nickname }}</div>
      <div v-if="!email.endsWith('@amiyabot.com')">{{ email }}</div>
      <div v-if="email.endsWith('@amiyabot.com')">临时账户</div>
    </header>
    <main>
      <button class="button" @click="createGame">创建游戏</button>
      <button class="button" @click="joinGame">加入游戏</button>
    </main>
    <footer>
      <button @click="logout" class="logout-button">登出</button>
    </footer>
    <el-dialog v-model="showReconnectDialog" :title="reconnectDialogTitle" :center="true" :show-close="false">
      <div style="text-align: center;">{{ reconnectDialogContent }}</div>
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
import { getGame } from '@src/api/SchulteGrid';
import { describeAPI } from '@src/api/Account.ts';
import NotificationBanner from '@src/components/SystemNotificationCarousel.vue';

const router = useRouter();

const email = ref(localStorage.getItem('email') || '');
const nickname = ref(localStorage.getItem('nickname') || '');
const showReconnectDialog = ref(false);
const defaultGravatar = "/ceobe.jpeg"//'https://www.gravatar.com/avatar/' + CryptoJS.MD5(email.value.trim().toLowerCase()) + '?d=identicon';
const reconnectDialogTitle = ref('断线重连');
const reconnectDialogContent = ref('检测到您有一局正在进行的游戏，是否重新连接？');
var reconnectAction = "Connect"
const isLoading = ref(true);
const loadingText = ref("连接服务器中，请稍候...");

var connect = async () => {
  const descRet = await describeAPI();
  if(!descRet){
    router.push('/logout');
    return;
  }

  const ret = await connectToGameHub();

  if (ret) {
    console.log('RegularHome 连接成功');

    //检查已有房间
    if (localStorage.getItem('current-game-id') && localStorage.getItem('current-game-id') !== "") {
      // 重连检查
      const gameId = localStorage.getItem('current-game-id') ?? "";

      try {

        const game = await getGame(gameId);

        if (game.isClosed) {
          localStorage.removeItem('current-game-id');
          isLoading.value = false;
          return;
        }

        const playerList = game.playerList;
        const player = Object.keys(playerList).find(key => key == localStorage.getItem('user-id'));

        if (player) {
          console.log('RegularHome 重连');
          reconnectDialogTitle.value = '断线重连';
          reconnectDialogContent.value = '检测到您有一局正在进行的游戏，是否重新连接？';
          isLoading.value = false;
          reconnectAction = "Connect"
        } else {
          console.log('RegularHome Join');
          var playerNickname = game.creatorNickname
          reconnectDialogTitle.value = '加入游戏';
          reconnectDialogContent.value = '您是否要加入由 ' + playerNickname + ' 创建的游戏？';
          isLoading.value = false;
          reconnectAction = "Join"
        }

        showReconnectDialog.value = true;
      }
      catch (e) {
        localStorage.removeItem('current-game-id');
        console.log('RegularHome 读取房间失败，清理房间');
      }
    }
    isLoading.value = false;

  } else {
    console.log('RegularHome 连接失败');
    loadingText.value = "连接服务器失败，正在尝试重连...";
    setTimeout(connect, 1000);
  }
}

var handleCancelReconnect = () => {
  localStorage.removeItem('current-game-id');
  showReconnectDialog.value = false;
}

var handleReconnect = () => {
  showReconnectDialog.value = false;
  if (reconnectAction == "Connect") {
    router.push('/regular-home/room-waiting/' + localStorage.getItem('current-game-id'));
  } else {
    router.push('/regular-home/join-room');
  }
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

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.5);
  /* 灰色半透明 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.overlay p {
  font-size: 2rem;
  color: white;
}
</style>
