<template>
  <div class="schulte-grid">
    <div class="template">
      <!-- 左侧格子显示区域 -->
      <div class="left-pannel">
        <div class="grid-container">
          <div v-for="col in expanded_data" class="cell">
            <div class="text_div">
              <div v-if="col.fade == false && col.recent == false && col.placeholder == false" class="text">
                {{ col.char }}
              </div>
              <img v-if="col.placeholder == true" class="img" src="/amiya.png" />
              <div v-if="col.fade == true" class="text_fade">
                {{ col.char }}
              </div>
              <div v-if="col.recent == true" class="text_fade_recent">
                {{ col.char }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧区域 -->
      <div class="right-panel">
        <div class="player-list">
          <div class="operate-zone">
            <GameControlButtonGroup />
            <GameTimer />
          </div>
          <ScoreBar />
        </div>
        <!-- 聊天信息显示区域 -->
        <div class="chat-display-with-notification">
          <SystemNotificationCarousel class="banner" />
          <ChatArea :messages="messages" />
        </div>
        <div class="message-input-with-room-number">
          <RoomNumberDisplay />
          <MessageInput class="message-input" />
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
import ChatArea, { Message } from '@src/components/ChatArea.vue';
import RoomNumberDisplay from '@src/components/game-room-components/RoomNumberDisplay.vue';
import GameTimer from '@src/components/game-room-components/GameTimer.vue';
import GameControlButtonGroup from '@src/components/game-room-components/GameControlButtonGroup.vue';
import MessageInput from '@src/components/MessageInput.vue';

const route = useRoute();
const router = useRouter();

const x = ref(2);
const y = ref(2);
const font_factor = ref(10);

const expanded_data = ref([{
  'char': 'A',
  'fade': false,
  'recent': false,
  'placeholder': false
}]);
expanded_data.value = []

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
  if (expanded_data.value.length == 0) {
    const grid = response.Payload.Grid
    if (grid.length > 0) {
      expanded_data.value = []
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
          expanded_data.value.push({
            'char': grid[i][j],
            'fade': false,
            'recent': false,
            'placeholder': grid[i][j] === '❤'
          })
        }
      }

      font_factor.value = 6 / Math.max(x.value, y.value);

      y.value = grid.length;
      x.value = grid[0] ? grid[0].length : 0; // 默认data的每个子数组长度是相同的
    }
  }

  var playerList = response.PlayerList;

  players.value = playerList.map((p: any) => {
    return {
      id: p.UserId,
      name: p.UserName,
      avatar: p.UserAvatar ? p.UserAvatar : "/ceobe.jpeg",
      score: p.Score
    }
  });

  //检查一下答案
  var answers = response.Payload.AnswerList

  answers.forEach((element: any) => {
    for (var point of element.GridPointList) {
      var loc = point.Y * y.value + point.X
      var current = expanded_data.value[loc]
      if (current.fade == false && current.recent == false) {
        current.fade = true
      }
    }
  });

}

var receiveMoveListener = (response: any) => {
  const player = players.value.find(p => p.id === response.Payload.PlayerId);
  const result = response.Payload.Result
  var content = response.Payload.CharacterName;


  if (result === 'Correct') {
    var dataArray = [...expanded_data.value]

    //调整Grid,将Answer中GridPointList的点标记为♣
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i].recent) {
        dataArray[i].fade = true;
        dataArray[i].recent = false;
      }
    }

    content = content + ' - '

    response.Payload.Answer.forEach((answer: any) => {
      for (var point of answer.GridPointList) {
        var loc = point.Y * y.value + point.X
        dataArray[loc].recent = true
        dataArray[loc].fade = false
      }
      content = content + answer.SkillName + ' '
    });

    expanded_data.value = dataArray
    console.log(dataArray.length)
  }

  messages.value.push({
    content: content,
    style: result,
    nickname: player?.name || 'Unknown',
    avatar: player?.avatar || '/ceobe.jpg'
  });
}

var gameClosedListener = (response: any) => {

  const answers = response.Payload.RemainingAnswers
  for (var i = 0; i < answers.length; i++) {
    messages.value.push({
      content: answers[i].CharacterName + ' - ' + answers[i].SkillName,
      style: "Correct",
      nickname: '管理员兔兔',
      avatar: '/amiya.png'
    });
  }
  const endWord = '游戏结束' +
    (response.Payload.RemainingAnswers.length == 0 ? "，恭喜所有干员全部猜出。" : "，未答出的答案如上。")
  messages.value.push({
    content: endWord,
    style: "Correct",
    nickname: '管理员兔兔',
    avatar: '/amiya.png'
  });


}

var getGameInterval: NodeJS.Timeout

onMounted(() => {
  addGameHubListener('ReceiveMove', receiveMoveListener);
  addGameHubListener('GameInfo', gameInfoListener);
  addGameHubListener('GameCompleted', gameClosedListener);
  addGameHubListener('GameClosed', gameClosedListener);

  invokeGameHub('GetGame', roomId);

  // 间隔一段时间获取一次房间信息
  getGameInterval = setInterval(() => {
    invokeGameHub('GetGame', roomId);
  }, 4000);
});

onUnmounted(() => {
  removeGameHubListener('ReceiveMove', receiveMoveListener);
  removeGameHubListener('GameInfo', gameInfoListener);
  removeGameHubListener('GameCompleted', gameClosedListener);
  removeGameHubListener('GameClosed', gameClosedListener);

  clearInterval(getGameInterval);
});
</script>

<style scoped>
.schulte-grid {
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
  width: auto;
  display: grid;
  background-color: #2196F3;
  grid-gap: 4px;
  padding: 10px;
  border-radius: 8px;
  width: 100%;

  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
}

.right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}


.message-input-with-room-number {
  display: flex;
  flex-direction: row;
}

.message-input {
  flex-grow: 1;
}

.banner {
  border-radius: 5px;
  margin-bottom: 10px;
}



.cell {
  list-style: none;
  display: block;
  aspect-ratio: 1 / 1;
  background-color: #fbf8cd;
  border-radius: 4px;
  position: relative;
  font-size: calc(1em);
}

.text_div {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  /* background-color: green; */
  display: flex;
  align-items: center;
  justify-content: center;
}

.text {
  display: block;
  text-align: center;
  /* background-color: red; */
  color: black;
}

.text_fade {
  display: block;
  text-align: center;
  /* background-color: red; */
  color: rgba(0, 0, 0, 0.2);
}

.text_fade_recent {
  display: block;
  text-align: center;
  color: #4caf50;
}

.img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  padding: 10px;
  display: block;
  object-fit: fill;
}

.chat-display-with-notification {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.banner {
  margin-bottom: 5px;
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

@media (min-width: 1000px) {
  .cell {
    font-size: calc(1em + 1vw);
  }
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

  .message-input {
    margin-bottom: 10px;
  }

  .cell {
    font-size: 7vw;
  }
}
</style>