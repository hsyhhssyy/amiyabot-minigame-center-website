<template>
  <div class="puzzle-container">
    <div id="template" class="template" :style="{ backgroundColor: backcolor, display: 'flex' }">
      <!-- 左侧格子显示区域 -->
      <div class="grid-container" :style="{ 'grid-template-columns': '1fr '.repeat(x) }"
        v-if="expanded_data.length > 0">
        <div v-for="col in expanded_data" class="cell">
          <div class="text_div">
            <div v-if="col.fade == false && col.recent == false && col.placeholder == false" class="text"
              :style="{ 'font-size': '' + (100 / x * font_factor) + 'px' }">
              {{ col.char }}
            </div>
            <img v-if="col.placeholder == true" class="img" src="/amiya.png" />
            <div v-if="col.fade == true" class="text_fade"
              :style="{ 'font-size': '' + (100 / x * font_factor) + 'px' }">
              {{ col.char }}
            </div>
            <div v-if="col.recent == true" class="text_fade_recent"
              :style="{ 'font-size': '' + (100 / x * font_factor) + 'px' }">
              {{ col.char }}
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧区域 -->
      <div class="right-panel">
        <div class="player-list hide-on-very-low-height">
          <el-button class="button" @click="handleEndCurrentGame" v-if="isHost && !isGameEnded">结束<br />游戏</el-button>
          <el-button class="button" @click="handleReturnToHomePage" v-if="!isHost || isGameEnded">退出<br />房间</el-button>
          <div v-for="player in players" :key="player.id" class="player">
            <img :src="player.avatar" alt="Player Avatar" class="avatar">
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score">
              <i class="fa-solid fa-star"></i>
              {{ player.score }}
            </span>
          </div>
        </div>
        <!-- 聊天信息显示区域 -->
        <div class="chat-display hide-on-low-height">
          <div class="chat-message" v-for="message in messages">
            <img :src="message.avatar" class="chat-avatar" />
            <div
              :class="{ 'chat-right-container': true, 'correct': message.result === 'Correct', 'wrong': message.result !== 'Correct' }">
              <div class="nickname">{{ message.nickname }}</div>
              <div class="chat-bubble">{{ message.content }}
              </div>
            </div>

            <span class="chat-icon" v-if="message.result === 'Correct'"><i class="fas fa-check"></i></span>
            <span class="chat-icon" v-if="message.result === 'Wrong'"><i class="fas fa-times"></i></span>
            <span class="chat-icon" v-if="message.result === 'Answered'"><i class="fas fa-poop"></i></span>
          </div>
          <div class="chat-message" v-for="message in remainingAnswers" v-if="isGameEnded">
            <img src="/amiya.png" class="chat-avatar" />
            <div class="chat-right-container correct">
              <div class="nickname">管理员兔兔</div>
              <div class="chat-bubble">{{ message }}.</div>
            </div>
          </div>
          <div class="chat-message" v-if="isGameEnded">
            <img src="/amiya.png" class="chat-avatar" />
            <div class="chat-right-container correct">
              <div class="nickname">管理员兔兔</div>
              <div class="chat-bubble">游戏结束{{ remainingAnswers.length == 0 ? "，恭喜所有干员全部猜出。" : "，未答出的答案如上。" }}</div>
            </div>
          </div>
        </div>
        <!-- 消息输入区域 -->
        <div class="message-input">
          <div class="room-number" @click="copyToClipboard">
            <i class="fa-solid fa-house room-number-icon"></i> {{ joinCode }}
          </div>
          <el-input type="text" class="message-to-send" v-model="messageToSend" @keyup.enter="handleSendMessage"
            placeholder="输入一个干员名..." />
          <el-button type="secondary" class="button" @click="handleSendMessage">发送</el-button>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watchEffect, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getGame } from '@src/api/SchulteGrid';
import { invokeGameHub, addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const backcolor = ref('white');
const x = ref(2);
const y = ref(2);
const font_factor = ref(10);
const joinCode = ref('');
const expanded_data = ref([{
  'char': 'A',
  'fade': false,
  'recent': false,
  'placeholder': false
}]);
const messages = ref([
  { content: '', result: '', nickname: '', avatar: '' }
]);
const messageToSend = ref('');
const isHost = ref(false);
const players = ref([
  { id: '', name: '', avatar: '', score: 0 },
]);
const isGameEnded = ref(false);
const remainingAnswers = ref<string[]>([]);



var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;
messages.value = []

localStorage.setItem('current-game-id', roomId);

var check_connection = () => {
  if (!isConnected()) {
    router.push('/regular-home');
    return;
  }
  setTimeout(check_connection, 500);
}

check_connection()

watchEffect(() => {
  nextTick(() => {
    const container = document.querySelector('.chat-display');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
});

var copyToClipboard = () => {
  const url = "https://game.anonymous-test.top/#/regular-home/games/schulte-grid/"+roomId+"?joinCode="+joinCode.value;
      navigator.clipboard.writeText(url).then(() => {
        ElMessage({
          message: '已复制加入链接到剪贴板',
          type: 'success'
        });
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    }

var gameInfoListener = (response: any) => {
  isHost.value = response.CreatorId === localStorage.getItem('user-id');
  joinCode.value = response.GameJoinCode;
  var playerList = response.PlayerList;
  players.value = playerList.map((p: any) => {
    return {
      id: p.UserId,
      name: p.UserName,
      avatar: "/ceobe.jpeg",//p.UserAvatar,
      score: p.Score
    }
  });

  //检查一下答案
  var answers = response.CurrentStatus.AnswerList

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
  const player = players.value.find(p => p.id === response.PlayerId);
  const result = response.Result
  var content = response.CharacterName;


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

    response.Answer.forEach((answer: any) => {
      for (var point of answer.GridPointList) {
        var loc = point.Y * y.value + point.X
        dataArray[loc].recent = true
        dataArray[loc].fade = false
      }
      content = content + answer.SkillName + ' '
    });

    expanded_data.value = dataArray
    console.log(dataArray.length)

    isGameEnded.value = response.Completed;
  }

  messages.value.push({
    content: content,
    result: result,
    nickname: player?.name || 'Unknown',
    avatar: player?.avatar || 'path_to_avatar.jpg'
  });

  nextTick(() => {
    const container = document.querySelector('.chat-display');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

var gameClosedListener = (response: any) => {
  console.log('游戏已关闭');
  isGameEnded.value = true;
  remainingAnswers.value = []
  const answers = response.RemainingAnswers
  for (var i = 0; i < answers.length; i++) {
    remainingAnswers.value.push(answers[i].CharacterName + ' - ' + answers[i].SkillName)
  }


  nextTick(() => {
    const container = document.querySelector('.chat-display');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

var handleEndCurrentGame = () => {
  console.log('结束游戏');
  invokeGameHub('CloseGame', roomId);
}

var handleReturnToHomePage = () => {
  console.log('返回首页');
  localStorage.removeItem('current-game-id');
  router.push('/regular-home');
}

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

var getGameInterval: NodeJS.Timeout

onMounted(() => {
  addGameHubListener('ReceiveMove', receiveMoveListener);
  addGameHubListener('GameInfo', gameInfoListener);
  addGameHubListener('GameClosed', gameClosedListener);

  invokeGameHub('GetGame', roomId);

  // 间隔一段时间获取一次房间信息
  getGameInterval = setInterval(() => {
    invokeGameHub('GetGame', roomId);
  }, 4000);

  getGame(roomId).then((responseObj) => {
    var grid = responseObj.grid

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

  })
});

onUnmounted(() => {
  removeGameHubListener('ReceiveMove', receiveMoveListener);
  removeGameHubListener('GameInfo', gameInfoListener);
  removeGameHubListener('GameClosed', gameClosedListener);

  clearInterval(getGameInterval);
});
</script>

<style scoped>
.puzzle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* 左右布局样式 */
.template {
  display: flex;
  width: 100%;
  width: 1000px;
  border: 1px solid red;
  /* 红色边框方便看到效果 */
}

.grid-container {
  width: 50%;
  display: grid;
  grid-gap: 5px;
  background-color: #2196F3;
  padding: 10px;
  border-radius: 8px;
}

.right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.answer-container {
  margin-bottom: 20px;
}

.message-input {
  display: flex;
}

.message-input input {
  flex-grow: 1;
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
}

.message-input button {
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  cursor: pointer;
}

.button {
  height: auto;
}


.grid-container {
  display: grid;
  grid-gap: 5px;
  background-color: #2196F3;
  padding: 10px;
  border-radius: 8px;
}

.cell {
  list-style: none;
  display: block;
  aspect-ratio: 1 / 1;
  background-color: #fbf8cd;
  border-radius: 4px;
  position: relative;
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

.answer-container {
  max-width: 100%;
  overflow-x: auto;
  /* 确保表格在小屏幕上也能完整显示 */
}

.answer-table {
  display: table;
  width: 100%;
  /* 表格宽度占满容器 */
  border-collapse: collapse;
  /* 合并边框 */
  background-color: white;
  /* 设置表格背景色为白色 */
}

.answer-table-row {
  display: flex;
  justify-content: space-between;
  border: 1px solid #ccc;
  /* 每一行添加浅灰色的边框 */
}

.answer-entry {
  flex: 1;
  /* 让每个答案条目平分容器宽度 */
  margin: 0 10px;
  /* 添加一些间距 */
}

.answer-avatar,
.answer-skill-icon {
  display: table-cell;
  text-align: center;
  /* 图片居中显示 */
  padding: 10px;
  /* 添加一些内边距以避免内容挤在一起 */
  vertical-align: middle;
  /* 垂直居中 */
  width: 5vw;
  /* 图标宽度也基于视口宽度动态调整 */
  height: auto;
  /* 高度自适应 */
  min-width: 30px;
  /* 设置图标的最小宽度 */
  max-width: 60px;
  /* 设置图标的最大宽度 */
  border: 1px solid #ccc;
  /* 图标添加浅灰色的边框 */
}

.answer-name,
.answer-skill-name {
  display: table-cell;
  padding: 10px;
  /* 添加一些内边距 */
  vertical-align: middle;
  /* 垂直居中 */
  text-align: left;
  /* 文本左对齐 */
  font-size: 4vw;
  /* 基于视口宽度的动态字体大小 */
  color: black;
  /* 文字颜色设置为黑色 */
}

.answer-skill-name {
  font-weight: bold;
  /* 技能名字加粗 */
  max-width: 300px;
  /* 设置技能名字的最大宽度，避免过长 */
  word-wrap: break-word;
  /* 如果技能名太长，允许换行 */
}

.chat-display {
  flex-grow: 1;
  background-color: #f4f4f4;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ccc;
  height: 100px;
  /* 示例高度，根据需要调整 */
  overflow-y: auto;
  /* 添加垂直滚动条 */
  margin-bottom: 20px;
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

.player-list {
  display: flex;
  justify-content: left;
  gap: 10px;
  margin-bottom: 10px;
}

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

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
}

.player-name {
  font-size: 12px;
}

.player-score {
  font-size: 16px;
}

@media (min-width: 600px) {

  .answer-name,
  .answer-skill-name {
    font-size: 12px;
    /* 视口宽度大于600px时的最小字体大小 */
  }
}

@media (max-width: 1200px) {

  .answer-name,
  .answer-skill-name {
    font-size: 18px;
    /* 视口宽度小于1200px时的最大字体大小 */
  }
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  #template {
    flex-direction: column;
    border: none;
    align-items: center;
  }

  .grid-container,
  .right-panel {
    width: 100%;
  }

  .right-panel {
    flex-direction: column-reverse;
  }

  .message-input {
    margin-bottom: 10px;
  }
}
</style>