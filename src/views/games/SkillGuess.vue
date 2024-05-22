<template>
  <div class="outer-grid">
    <div class="template">
      <!-- 左侧格子显示区域 -->
      <div class="grid-container">
        <div class="grid">
          <div class="cell" v-for="(question, index) in questions">
            <div :class="{
            'skill-image-answered': index < currentQuestionIndex,
            'skill-image-current': index == currentQuestionIndex,
            'skill-image-future': index > currentQuestionIndex
          }">
              <img :src="question.imageUrl" class="img" />
              
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧区域 -->
      <div class="right-panel">
        <div class="player-list">
          <GameOperatorZone />
          <ScoreBar/>
        </div>
        <!-- 聊天信息显示区域 -->
        <div class="chat-display-with-notification">
          <SystemNotificationCarousel class="banner" />
          <ChatArea :messages="messages" />
        </div>
        <div class="message-input">
          <RoomNumberDisplay />
          <MessageInput />
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import SystemNotificationCarousel from '@src/components/SystemNotificationCarousel.vue';
import GameOperatorZone from '@src/components/game-room-components/GameOperatorZone.vue';
import ScoreBar from '@src/components/game-room-components/ScoreBar.vue';
import RoomNumberDisplay from '@src/components/game-room-components/RoomNumberDisplay.vue';
import ChatArea from '@src/components/ChatArea.vue';
import MessageInput from '@src/components/MessageInput.vue';

const route = useRoute();
const router = useRouter();

const currentQuestionIndex = ref(0)
const questions = ref<any[]>([])

const messages = ref([
  { content: '', style: '', nickname: '', avatar: '' }
]);
messages.value = []

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

localStorage.setItem('current-game-id', roomId);

var check_connection = () => {
  if (!isConnected()) {
    router.push('/regular-home');
    return;
  }
  setTimeout(check_connection, 500);
}

check_connection()

var gameInfoListener = (response: any) => {

  currentQuestionIndex.value = response.CurrentStatus.CurrentQuestionIndex
  console.log(response.CurrentStatus.AnswerList.map((a: any) => {
    return a.CharacterName
  }))
  questions.value = response.CurrentStatus.AnswerList.map((a: any) => {
    return {
      playerId: a.PlayerId,
      imageUrl: a.ImageUrl
    }
  })
}

var receiveMoveListener = (response: any) => {

  if (response.Result == 'Correct') {
    currentQuestionIndex.value = response.CurrentQuestionIndex;
  }

  if (response.Completed) {
    currentQuestionIndex.value = -1
  }

  messages.value.push({
    content: content,
    style: result,
    nickname: player?.name || 'Unknown',
    avatar: player?.avatar || '/ceobe.jpeg'
  });
}

onMounted(() => {
  addGameHubListener('ReceiveMove', receiveMoveListener);
  addGameHubListener('GameInfo', gameInfoListener);

});

onUnmounted(() => {
  removeGameHubListener('ReceiveMove', receiveMoveListener);
  removeGameHubListener('GameInfo', gameInfoListener);
});
</script>

<style scoped>
.outer-grid {
  display: flex;
  justify-content: center;
  align-items: center;
}

.template {
  display: flex;
  width: 50%;
  min-width: 768px;
  border: 1px solid red;
  /* 红色边框方便看到效果 */
}

.grid-container {
  display: flex;
  width: 50%;
  aspect-ratio: 1 / 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;

  box-sizing: border-box;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(245, 222, 179, 0.2);
  background-image: url('https://media.prts.wiki/archive/4/41/20210120051637%21Logo_%E7%BD%97%E5%BE%B7%E5%B2%9B.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;

  width: 100%;
  aspect-ratio: 1 / 1;

}

.cell {
  display: flex;
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.skill-image-answered {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  border: 4px dashed #000; /* 设置虚线边框，2像素宽度，黑色 */
}

.skill-image-future {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  border: 4px dashed #000; /* 设置虚线边框，2像素宽度，黑色 */
}

.skill-image-future img {
  visibility: hidden;
}

.img {
  margin: 5px;
  z-index: 1;
}

.skill-image-current {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  border: 4px solid transparent;
}


.skill-image-current::before {
  content: "";
  background-image: linear-gradient(132deg, green,green 20%, yellow 50%, red 80%, red);
  position: absolute;
  z-index: 0;
            top: -40%; /* 上边框 */
            left: -40%; /* 左边框 */
            width: 180%; /* 宽度为元素宽度的3倍 */
            height: 180%; /* 高度为元素高度的3倍 */
  animation: spin 5s linear infinite;
}

@keyframes spin {
  0% {
    rotate: 0deg;
  }
  100% {
    rotate: 360deg;
  }
}

.banner {
  border-radius: 5px;
  margin-bottom: 10px;
}

.right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .template {
    flex-direction: column;
    border: none;
    align-items: center;
    min-width: auto;
    width: 100%;
  }

  .grid-container
  .right-panel {
    width: 100%;
  }

  .grid {
    grid-gap: 2px;
    padding: 4px;
  }
  
  .right-panel {
    flex-direction: column-reverse;
  }
  
  .message-input {
    margin-bottom: 10px;
  }
}
</style>