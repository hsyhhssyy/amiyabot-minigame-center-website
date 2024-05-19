<template>
    <NotificationBanner />
    <canvas id="masked-image"></canvas>
    <div>本题的随机数种子 {{ currentQuestionSeed }}，根据他设计一个算法给图片上遮罩</div>
    <div v-for="item in receivedMoves">
        <div>{{ JSON.stringify(item) }}</div>
    </div>
    <input type="text" v-model="answer" placeholder="请输入你的答案"/>
    <button @click="submitAnswer">提交答案</button>
    <button @click="handleReturnToHomePage">返回首页</button>
    <button @click="handleEndCurrentGame">结束游戏</button>
</template>

<script lang="ts" setup>
import { ref ,onMounted,onUnmounted,computed} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invokeGameHub, addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import NotificationBanner from '@src/components/SystemNotificationCarousel.vue';

const route = useRoute();
const router = useRouter();

var roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const currentQuestionIndex = ref(-1);
const answerList = ref<any[]>([])
const answer = ref('');
const receivedMoves = ref<any[]>([]);

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

// const currentImage = computed(() => {
//     if (answerList.value.length <= currentQuestionIndex.value) {
//         return '';
//     }
//     var curentAnswer = answerList.value[currentQuestionIndex.value];
//     return curentAnswer.ImageUrl;
// });

const currentQuestionSeed = computed(() => {
    if (answerList.value.length <= currentQuestionIndex.value) {
        return '';
    }
    if(currentQuestionIndex.value<0){
        return '等待题目中...';
    }
    var curentAnswer = answerList.value[currentQuestionIndex.value];
    return curentAnswer.RandomNumber;
});

async function fetchImage(url:any) {
    const response = await fetch(url);
    const blob = await response.blob();
    const img = new Image();
    const objectURL = URL.createObjectURL(blob);
    img.src = objectURL;
    await new Promise((resolve) => img.onload = resolve);
    return img;
}

function getRandomSquare(randomNum:any, imgWidth:any, imgHeight:any) {
    const maxSize = Math.min(imgWidth, imgHeight) * 0.2;
    const minSize = Math.min(imgWidth, imgHeight) * 0.1;
    const size = Math.floor(minSize + (randomNum % (maxSize - minSize)));

    const x = Math.floor((randomNum * 9301 + 49297) % imgWidth);
    const y = Math.floor((randomNum * 49297 + 9301) % imgHeight);

    return { x: x % (imgWidth - size), y: y % (imgHeight - size), size: size };
}

function isUniformColor(imageData:any) {
    const { data, width, height } = imageData;
    let r = data[0], g = data[1], b = data[2];
    for (let i = 0; i < width * height * 4; i += 4) {
        if (data[i] !== r || data[i + 1] !== g || data[i + 2] !== b) {
            return false;
        }
    }
    return true;
}

async function generateMaskedImage(url:any, randomNum:any) {
    const img = await fetchImage(url);
    const canvas = document.getElementById('masked-image')! as HTMLCanvasElement;
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

const submitAnswer = () => {
    invokeGameHub('SendMove', roomId, JSON.stringify({
        CharacterName: answer.value
    }));
}

const gameInfoListener = (response:any) => {
    answerList.value = response.CurrentStatus.AnswerList;
    if(response.CurrentStatus.CurrentQuestionIndex != currentQuestionIndex.value){
        currentQuestionIndex.value = response.CurrentStatus.CurrentQuestionIndex;
        const imageUrl = answerList.value[currentQuestionIndex.value].ImageUrl;
        const randomNum = answerList.value[currentQuestionIndex.value].RandomNumber;
        generateMaskedImage(imageUrl, randomNum);
    }
    console.log(response);   
}

const receiveMoveListener = (response:any) => {
    receivedMoves.value.push(response);

    if(response.Result=='Correct'){
        currentQuestionIndex.value = response.CurrentStatus.currentQuestionIndex;
    }

    if(response.Completed){
        //赢了!
    }
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
.img{
    width: 200px;
    height: 200px;
}
</style>