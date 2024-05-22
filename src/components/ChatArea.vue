<template>
  <div class="chat-display">
    <div class="chat-message" v-for="message in messages">
      <img :src="message.avatar" class="chat-avatar" />
      <div :class="{
        'chat-right-container': true,
        'correct': message.style === 'Correct',
        'wrong': message.style !== 'Correct'
      }">
        <div class="nickname">{{ message.nickname }}</div>
        <div class="chat-bubble">{{ message.content }}
        </div>
      </div>

      <span class="chat-icon" v-if="message.style === 'Correct'"><i class="fas fa-check"></i></span>
      <span class="chat-icon" v-if="message.style === 'Wrong'"><i class="fas fa-times"></i></span>
      <span class="chat-icon" v-if="message.style === 'Answered'"><i class="fas fa-poop"></i></span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, nextTick } from 'vue';

export interface Message {
  avatar: string;
  nickname: string;
  content: string;
  style: string;
}

interface Props {
  messages: Message[];
}

const props = defineProps<Props>();

watch(
  () => props.messages, 
  () => {
    nextTick(() => {
      const container = document.querySelector('.chat-display');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  },
  { immediate: true, deep: true }
);

</script>

<style scoped>
.chat-display {
  flex-grow: 1;
  background-color: #f4f4f4;
  overflow-y: auto;
  padding: 10px;
  height: 100px;
  border: 1px solid #ccc;
  overflow-y: auto;
  margin-bottom: 20px;  
  box-sizing: border-box;
}

.chat-message {
  display: flex;
  width: 100%;
  align-items: center;
  margin-bottom: 10px;
  margin-bottom: 20px;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}


.chat-right-container {
  width: 100%;
  border-radius: 5px;
  padding: 2px;
  padding-left: 5px;
}

.nickname {
  font-weight: bold;
}

.chat-bubble {
  border-radius: 16px;
  color: white;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-icon {
  margin-left: 10px;
  /* 在文字和图标之间添加一些间隔 */
  font-size: 30px;
  width: 40px;
  text-align: center;
}

.correct {
  background-color: #4CAF50;
  /* Green */
}

.wrong {
  background-color: #F44336;
  /* Red */
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .chat-display {
    height: 100px;
    width: 100%;
    max-width: 700px;
  }
}
</style>