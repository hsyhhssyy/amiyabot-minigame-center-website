<template>
  <div class="message-input">
    <el-input type="text" class="message-to-send" v-model="messageToSend" @keyup.enter="handleSendMessage"
      placeholder="输入一个干员名..." />
    <el-button type="primary" class="button" @click="handleSendMessage">发送</el-button>
    <el-button type="primary" class="button" @click="handleRequestHint" v-if="useHint" :disabled="isHintDisabled">提示</el-button>
    <el-button type="primary" class="button" @click="handleGiveUp" v-if="useGiveUp" :disabled="isGiveUpDisabled">放弃</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { invokeGameHub } from '@src/api/SignalR.ts';

const route = useRoute();

interface Props {
  useHint?: boolean;
  useGiveUp?: boolean;
  isHintDisabled?: boolean;
  isGiveUpDisabled?: boolean;
}

const { useHint, useGiveUp } = defineProps<Props>();

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const messageToSend = ref('');

var handleSendMessage = () => {
  console.log('发送消息' + messageToSend.value);
  if (messageToSend.value.trim() === '') {
    return;
  }

  invokeGameHub('SendMove', roomId, JSON.stringify({
    CharacterName: messageToSend.value
  }));
  messageToSend.value = '';
}

var handleRequestHint = () => {
  console.log('请求提示');
  invokeGameHub('RequestHint', roomId);
}

var handleGiveUp = () => {
  console.log('放弃');
  invokeGameHub('GiveUp', roomId);
}

</script>

<style scoped>
.message-input {
  display: flex;
}

.button {
  height: auto;
}

.message-to-send {
  margin-right: 10px;
}
</style>