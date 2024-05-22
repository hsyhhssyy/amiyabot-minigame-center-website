<template>
    <div class="button-group">
      <el-button class="button" @click="handleEndCurrentGame" v-if="isHost && !isGameCompleted">结束<br />游戏</el-button>
      <el-button class="button" @click="handleReturnToHomePage" v-if="!isHost || isGameCompleted">退出<br />房间</el-button>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invokeGameHub, addGameHubListener, removeGameHubListener } from '@src/api/SignalR.ts';

const route = useRoute();
const router = useRouter();

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const isGameCompleted = ref(false);
const isHost = ref(false);

var handleEndCurrentGame = () => {
  console.log('结束游戏');
  invokeGameHub('CloseGame', roomId);
}

var handleReturnToHomePage = () => {
  console.log('返回首页');
  localStorage.removeItem('current-game-id');
  router.push('/regular-home');
}

var gameInfoListener = (response: any) => {  
  isGameCompleted.value = response.GameCompleted;
  isHost.value = response.CreatorId === localStorage.getItem('user-id');
}

var gameCompletedListener = (response: any) => {
  isGameCompleted.value = true;
}

onMounted(() => {
  addGameHubListener('GameInfo', gameInfoListener);
  addGameHubListener('GameCompleted', gameCompletedListener);
  addGameHubListener('GameClosed', gameCompletedListener);
})

onUnmounted(() => {
  removeGameHubListener('GameInfo', gameInfoListener);
  removeGameHubListener('GameCompleted', gameCompletedListener);
  removeGameHubListener('GameClosed', gameCompletedListener);
})

</script>

<style scoped>

.button-group {
  display: flex;
  height: auto;
  flex-grow: 1;
}

.button {
  height: auto;
}


</style>