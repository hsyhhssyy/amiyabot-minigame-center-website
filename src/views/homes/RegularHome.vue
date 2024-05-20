<template>
  <div class="app">
    <NotificationBanner />
    <div v-if="isLoading" class="overlay">
      <p>{{ loadingText }}</p>
    </div>
    <div class="header">
      <h1>兔兔小游戏中心</h1>
      <div @click="handleChooseAvatar" class="avatar-wrapper">
        <img :src="defaultGravatar" alt="Player Avatar" class="avatar">
        <span class="kick-mask"><i class="fa-regular fa-pen-to-square"></i></span>
      </div>
      <div class="nickname-bar">
      <div>{{ nickname }}</div>
      <el-button type="text" @click="handleChangeNickname"><i class="fa-regular fa-pen-to-square"></i></el-button>
      </div>
      <div v-if="!email.endsWith('@amiyabot.com')">{{ email }}</div>
      
      <div v-if="email.endsWith('@amiyabot.com')">临时账户</div>
    </div>
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
    <ChooseAvatarDialog v-model="isChooseAvatarDialogVisible" @ok="handleAvatarChoose" />
    <el-dialog v-model="isChangeNicknameDialogVisible" title="修改昵称" :center="true" :show-close="false">
          <el-input v-model="changedNickname" placeholder="请输入新昵称"></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="secondary" @click="handleCancelChangeNickname">取消</el-button>
          <el-button type="primary" @click="handleChangeNicknameConfirm">确定</el-button>
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
import { describeAPI, changeUserInfoApi } from '@src/api/Account.ts';
import NotificationBanner from '@src/components/SystemNotificationCarousel.vue';
import ChooseAvatarDialog from '@src/components/ChooseAvatarDialog.vue';

const router = useRouter();

const email = ref(localStorage.getItem('email') || '');
const nickname = ref('');
const showReconnectDialog = ref(false);
const defaultGravatar = ref("/ceobe.jpeg")
const reconnectDialogTitle = ref('断线重连');
const reconnectDialogContent = ref('检测到您有一局正在进行的游戏，是否重新连接？');
var reconnectAction = "Connect"
const isLoading = ref(true);
const loadingText = ref("连接服务器中，请稍候...");

const isChooseAvatarDialogVisible = ref(false);
const isChangeNicknameDialogVisible = ref(false);
const changedNickname = ref("");

var connect = async () => {
  const descRet = await describeAPI();
  if (!descRet) {
    router.push('/logout');
    return;
  }

  if (descRet.avatar) {
    defaultGravatar.value = descRet.avatar;
  }

  if(descRet.nickname){
    nickname.value = descRet.nickname;
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

const handleChooseAvatar = () => {
  console.log('选择头像');
  isChooseAvatarDialogVisible.value = true;
}

const handleChangeNickname = () => {
  console.log('修改昵称');
  isChangeNicknameDialogVisible.value = true;
}

const handleCancelChangeNickname = () => {
  isChangeNicknameDialogVisible.value = false;
}

const handleChangeNicknameConfirm = async () => {
  if (changedNickname.value == "") {
    return;
  }

  await changeUserInfoApi(changedNickname.value, "", "");
  nickname.value = changedNickname.value;
  isChangeNicknameDialogVisible.value = false;
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

const handleAvatarChoose = async (avatar: string) => {
  await changeUserInfoApi("", avatar, "");
  defaultGravatar.value = avatar;
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

.header {
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.avatar-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
}

.nickname-bar{
  display: flex;
  align-items: center;
  flex-direction: row;
}

.kick-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 50%;
    font-size: 18px;
}

.avatar-wrapper:hover .kick-mask {
    opacity: 1;
    /* 当鼠标悬停时显示遮罩 */
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
