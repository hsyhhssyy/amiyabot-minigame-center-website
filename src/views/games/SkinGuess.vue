<template>
    <NotificationBanner />
    <img :src="currentImage" class="img"/>
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

const currentQuestionIndex = ref(0);
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

const currentImage = computed(() => {
    if (answerList.value.length <= currentQuestionIndex.value) {
        return '';
    }
    var curentAnswer = answerList.value[currentQuestionIndex.value];
    return curentAnswer.ImageUrl;
});

const currentQuestionSeed = computed(() => {
    if (answerList.value.length <= currentQuestionIndex.value) {
        return '';
    }
    var curentAnswer = answerList.value[currentQuestionIndex.value];
    return curentAnswer.RandomNumber;
});

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
    currentQuestionIndex.value = response.CurrentStatus.CurrentQuestionIndex;
    answerList.value = response.CurrentStatus.AnswerList;
    console.log(response);

    if(response.Result=='Correct'){
        currentQuestionIndex.value = response.CurrentStatus.currentQuestionIndex;
    }

    if(response.Completed){
        //赢了!
    }
}

const receiveMoveListener = (response:any) => {
    receivedMoves.value.push(response);
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