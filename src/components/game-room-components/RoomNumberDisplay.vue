<template>
  <div class="room-number" @click="copyToClipboard">
    <i class="fa-solid fa-house room-number-icon"></i> {{ joinCode }}
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { copyInviteLinkToClipboard } from '@src/utils/Clipboard';
import { addGameHubListener, removeGameHubListener } from '@src/api/SignalR.ts';

const route = useRoute();

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const joinCode = ref('');

var copyToClipboard = async () => {
  await copyInviteLinkToClipboard(roomId)
}

var gameInfoListener = (response: any) => {
  joinCode.value = response.Game.JoinCode;
}

onMounted(() => {
  addGameHubListener('GameInfo', gameInfoListener);
})

onUnmounted(() => {
  removeGameHubListener('GameInfo', gameInfoListener);
})

</script>

<style scoped>
.room-number {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
  font-size: 20px;
  margin-right: 10px;
  cursor: pointer;
}
</style>