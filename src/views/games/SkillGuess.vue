<template>
  <div class="outer-grid">
    <div class="template">
      <!-- 左侧格子显示区域 -->
      <div class="left-pannel">
        <div class="grid-container">
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
          <div class="operate-zone">            
            <GameControlButtonGroup />
            <GameTimer/>
          </div>
          <ScoreBar/>
        </div>
        <!-- 聊天信息显示区域 -->
        <div class="chat-display-with-notification">
          <SystemNotificationCarousel class="banner" />
          <ChatArea :messages="messages" />
        </div>
        <div class="message-input-with-room-number">
          <RoomNumberDisplay />
          <MessageInput class="message-input"/>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invokeGameHub, addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import SystemNotificationCarousel from '@src/components/SystemNotificationCarousel.vue';
import ScoreBar from '@src/components/game-room-components/ScoreBar.vue';
import RoomNumberDisplay from '@src/components/game-room-components/RoomNumberDisplay.vue';
import ChatArea,{Message} from '@src/components/ChatArea.vue';
import MessageInput from '@src/components/MessageInput.vue';
import GameTimer from '@src/components/game-room-components/GameTimer.vue';
import GameControlButtonGroup from '@src/components/game-room-components/GameControlButtonGroup.vue';

const route = useRoute();
const router = useRouter();

const currentQuestionIndex = ref(0)
const questions = ref<any[]>([])

const messages = ref<Message[]>([]);

const players = ref([
  { id: '', name: '', avatar: '', score: 0 },
]);
players.value = []

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

  currentQuestionIndex.value = response.Payload.CurrentQuestionIndex
  console.log(response.Payload.AnswerList.map((a: any) => {
    return a.CharacterName
  }))
  questions.value = response.Payload.AnswerList.map((a: any) => {
    return {
      playerId: a.PlayerId,
      imageUrl: a.ImageUrl
    }
  })

  var playerList = response.PlayerList;

  players.value = playerList.map((p: any) => {
    return {
      id: p.UserId,
      name: p.UserName,
      avatar: p.UserAvatar ? p.UserAvatar:"/ceobe.jpeg",
      score: p.Score
    }
  });
}

var receiveMoveListener = (response: any) => {
  const player = players.value.find(p => p.id === response.Payload.PlayerId);
  var content = response.Payload.CharacterName;
  const result = response.Payload.Result

  if (response.Payload.Result == 'Correct') {
    currentQuestionIndex.value = response.Payload.CurrentQuestionIndex;    
    content = content + ' - ' + response.Payload.Answer.SkillName;
  }

  if (response.Game.IsCompleted) {
    currentQuestionIndex.value = -1
  }

  messages.value.push({
    content: content,
    style: result,
    nickname: player?.name || 'Unknown',
    avatar: player?.avatar || '/ceobe.jpeg'
  });
}

var getGameInterval: NodeJS.Timeout

onMounted(() => {
  addGameHubListener('ReceiveMove', receiveMoveListener);
  addGameHubListener('GameInfo', gameInfoListener);

  invokeGameHub('GetGame', roomId);

  // 间隔一段时间获取一次房间信息
  getGameInterval = setInterval(() => {
    invokeGameHub('GetGame', roomId);
  }, 4000);
});

onUnmounted(() => {
  removeGameHubListener('ReceiveMove', receiveMoveListener);
  removeGameHubListener('GameInfo', gameInfoListener);

  clearInterval(getGameInterval);
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

.left-pannel {
  display: flex;
  width: 50%;
  aspect-ratio: 1 / 1;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  position: relative;

  box-sizing: border-box;
  padding: 10px;
  border-radius: 8px;
/* 
  background-color: rgba(245, 222, 179, 0.2);
  
  background-image: url('https://media.prts.wiki/archive/4/41/20210120051637%21Logo_%E7%BD%97%E5%BE%B7%E5%B2%9B.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center; */

  width: 100%;
  aspect-ratio: 1 / 1;

}

.grid-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://media.prts.wiki/archive/4/41/20210120051637%21Logo_%E7%BD%97%E5%BE%B7%E5%B2%9B.png');
    background-size: cover; /* 图片大小适应容器 */
    filter: blur(2px); /* 模糊效果，调整为你想要的程度 */
    z-index: -1; /* 确保模糊层在底部 */
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
  border: 4px dashed gray;
  filter: blur(2px);
}

.skill-image-future {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  border: 4px dashed gray;
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

.player-list {
  display: flex;
  justify-content: left;
  gap: 10px;
  margin-bottom: 10px;
  max-width: 100%;
}

.operate-zone {
  height: auto;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

.chat-display-with-notification {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.message-input-with-room-number {
  display: flex;
  flex-direction: row;
}

.message-input {
  flex-grow: 1;
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

  .left-pannel,
  .right-panel {
    width: 100%;
  }

  .grid-container {
    grid-gap: 2px;
    padding: 4px;
  }
  
  .right-panel {
    flex-direction: column-reverse;
  }
  
  .message-input-with-room-number {
    margin-bottom: 10px;
  }
}
</style>