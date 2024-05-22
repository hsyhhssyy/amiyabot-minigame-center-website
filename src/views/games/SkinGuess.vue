<template>
    <div class="outer-grid">
        <div class="template">
            <!-- 左侧格子显示区域 -->
            <div class="left-pannel">
                <div class="question-grid">
                    <div class="answered-question" v-for="(item, index) in questionList" :key="index">
                        <div class="notification-item">
                            <img v-if="item.Completed" :src="item.ImageUrl" alt="Image" class="answered-image">
                        </div>
                    </div>
                </div>
                <div class="current-question" v-show="visibility">
                    <div class="question-display">
                        <div v-if="!slicedImages?.get(currentQuestionIndex)">正在加载题目....</div>
                        <canvas id="masked-image" class="masked-image"></canvas>
                    </div>
                </div>
                <el-button @click="toggleVisibility" class="eye-button" type="primary">
                    <i class="fa-solid fa-eye" v-if="visibility"></i>
                    <i class="fa-solid fa-eye-slash" v-if="!visibility"></i>
                </el-button>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invokeGameHub, addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import SystemNotificationCarousel from '@src/components/SystemNotificationCarousel.vue';
import ScoreBar from '@src/components/game-room-components/ScoreBar.vue';
import RoomNumberDisplay from '@src/components/game-room-components/RoomNumberDisplay.vue';
import ChatArea, { Message } from '@src/components/ChatArea.vue';
import MessageInput from '@src/components/MessageInput.vue';
import GameTimer from '@src/components/game-room-components/GameTimer.vue';
import GameControlButtonGroup from '@src/components/game-room-components/GameControlButtonGroup.vue';

const route = useRoute();
const router = useRouter();

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const currentQuestionIndex = ref(-1);
const questionList = ref<any[]>([])
const slicedImages = ref<Map<number, HTMLCanvasElement> | null>(null);
const cachedFullImages = ref<Map<string, HTMLImageElement>>(new Map());

const messages = ref<Message[]>([]);

const players = ref([
    { id: '', name: '', avatar: '', score: 0 },
]);
players.value = []

const visibility = ref(true);

const answeredQuestions = computed(() => {
    return questionList.value.filter((q) => q.Completed == true);
});

//记录RoomId是为了在回到主页后能够弹出重连
localStorage.setItem('current-game-id', roomId);

var check_connection = () => {
    if (!isConnected()) {
        router.push('/regular-home');
        return;
    }
    setTimeout(check_connection, 500);
}

check_connection()

const toggleVisibility = () => {
    visibility.value = !visibility.value;
}

async function fetchImage(url: any) {
    const response = await fetch(url);
    const blob = await response.blob();
    const img = new Image();
    const objectURL = URL.createObjectURL(blob);
    img.src = objectURL;
    await new Promise((resolve) => img.onload = resolve);
    return img;
}

function getRandomSquare(randomNum: any, imgWidth: any, imgHeight: any) {
    const maxSize = Math.min(imgWidth, imgHeight) * 0.2;
    const minSize = Math.min(imgWidth, imgHeight) * 0.1;
    const size = Math.floor(minSize + (randomNum % (maxSize - minSize)));

    const x = Math.floor((randomNum * 9301 + 49297) % imgWidth);
    const y = Math.floor((randomNum * 49297 + 9301) % imgHeight);

    return { x: x % (imgWidth - size), y: y % (imgHeight - size), size: size };
}

function isUniformColor(imageData: any) {
    const { data, width, height } = imageData;
    let r = data[0], g = data[1], b = data[2];
    for (let i = 0; i < width * height * 4; i += 4) {
        if (data[i] !== r || data[i + 1] !== g || data[i + 2] !== b) {
            return false;
        }
    }
    return true;
}

async function generateMaskedImage(url: any, randomNum: any) {
    const img = await fetchImage(url);
    cachedFullImages.value.set(url, img);
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')! as CanvasRenderingContext2D;
    canvas.width = img.width;
    canvas.height = img.height;

    let square, imageData;

    do {
        square = getRandomSquare(randomNum, img.width, img.height);
        ctx.drawImage(img, square.x, square.y, square.size, square.size, 0, 0, square.size, square.size);
        imageData = ctx.getImageData(0, 0, square.size, square.size);
        randomNum++;
    } while (isUniformColor(imageData));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = square.size;
    canvas.height = square.size;
    ctx.drawImage(img, square.x, square.y, square.size, square.size, 0, 0, square.size, square.size);

    return canvas;
}

async function preprocessImages() {

    if (slicedImages.value != null) {
        return;
    }

    slicedImages.value = new Map();

    const imageUrlCurrent = questionList.value[currentQuestionIndex.value].ImageUrl;
    const randomNumCurrent = questionList.value[currentQuestionIndex.value].RandomNumber;
    const canvasCurrent = await generateMaskedImage(imageUrlCurrent, randomNumCurrent);
    slicedImages.value.set(currentQuestionIndex.value, canvasCurrent);
    updateImage();

    for (let i = 0; i < questionList.value.length; i++) {
        if (slicedImages.value.has(i)) {
            continue;
        }
        const imageUrl = questionList.value[i].ImageUrl;
        const randomNum = questionList.value[i].RandomNumber;
        const canvas = await generateMaskedImage(imageUrl, randomNum);
        slicedImages.value.set(i, canvas);
        updateImage();
    }
}

const updateImage = function () {
    if (slicedImages.value == null) {
        return;
    }

    const canvas = slicedImages.value.get(currentQuestionIndex.value);
    if (canvas) {
        const refCanvas = document.querySelector(`.masked-image`) as HTMLCanvasElement;
        if (refCanvas) {
            const ctx = refCanvas.getContext('2d');
            if (ctx) {
                refCanvas.width = canvas.width;
                refCanvas.height = canvas.height;
                ctx.drawImage(canvas, 0, 0);
            }
        }
    }
}

const gameInfoListener = (response: any) => {
    questionList.value = response.Payload.AnswerList;

    if (response.Payload.CurrentQuestionIndex != currentQuestionIndex.value) {
        currentQuestionIndex.value = response.Payload.CurrentQuestionIndex;
    }

    preprocessImages();
    updateImage();

    console.log(response);

    var playerList = response.PlayerList;

    players.value = playerList.map((p: any) => {
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: p.UserAvatar ? p.UserAvatar : "/ceobe.jpeg",
            score: p.Score
        }
    });
}

const receiveMoveListener = (response: any) => {
    const player = players.value.find(p => p.id === response.Payload.PlayerId);

    if (response.Result == 'Correct') {
        currentQuestionIndex.value = response.Payload.currentQuestionIndex;
        updateImage();
    }


    messages.value.push({
        content: response.Payload.CharacterName,
        style: response.Payload.Result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/ceobe.jpeg'
    });
}

var getGameInterval: NodeJS.Timeout

onMounted(() => {
    addGameHubListener('ReceiveMove', receiveMoveListener);
    addGameHubListener('GameInfo', gameInfoListener);

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
    width: 50%;
    aspect-ratio: 1 / 1;
    display: block;
    position: relative;
}

.question-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 1px;

    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    z-index: -1;
}

.answered-question {
  height: auto;
  box-sizing: border-box;
  border: 4px dashed gray;
}

.masked-image {
    width: 200px;
    height: 200px;
}

.eye-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
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

.current-question {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.question-display{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50;
    border: 1px solid black;
}

.message-input {
    flex-grow: 1;
}

.answered-image {

    max-width: 100%;
    /* 图片最大宽度为容器宽度 */
    max-height: 100%;
    /* 图片最大高度为容器高度 */
}

::v-deep .el-carousel__container {
    height: 100%;
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