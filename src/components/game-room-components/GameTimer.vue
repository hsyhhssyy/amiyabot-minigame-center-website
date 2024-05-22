<template>
    <div class="timer">{{ elapsedMinutes }}:{{ elapsedSeconds }}:{{ elapsedTenPrecentSeconds }}</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { addGameHubListener, removeGameHubListener } from '@src/api/SignalR.ts';

const startTime = ref<number|null>(null)
const completeTime = ref<number|null>(null)

const elapsedMinutes = ref("00")
const elapsedSeconds = ref("00")
const elapsedTenPrecentSeconds = ref("00")

const receiveMoveListener = (response: any) => {
  if (response.Result === 'Correct') {
    if (response.Completed == true) {
      const utcTimeComplete = new Date(response.CompleteTime);
      completeTime.value = utcTimeComplete.getTime();
    }
  }
};

var gameInfoListener = (response: any) => {

  if (response.GameCompleted == true) {
    const utcTimeComplete = new Date(response.GameCompleteTime);
    completeTime.value = utcTimeComplete.getTime();
  }else{
    completeTime.value = null;
  }


  const utcTimeStart = new Date(response.GameStartTime);
  startTime.value = utcTimeStart.getTime();

}


const updateElapsedTime = () => {
  if (startTime.value !== null) {
    var elapsed = 0;
    if (completeTime.value !== null) {
      elapsed = Math.floor((completeTime.value  - startTime.value) / 10);
    } else {
      const now = Date.now();
      const serverTimeDiff = Number(localStorage.getItem('server-time-diff'));
      elapsed = Math.floor((now - startTime.value - serverTimeDiff) / 10);
    }
    const formatNumber = (num: number) => {
      if (num < 0) {
        num = 0
      }
      return num < 10 ? `0${num}` : `${num}`;
    };
    elapsedMinutes.value = formatNumber(Math.floor(elapsed / 6000));
    elapsedSeconds.value = formatNumber(Math.floor(elapsed % 6000 / 100));
    elapsedTenPrecentSeconds.value = formatNumber(Math.floor(elapsed % 60));
  }
};

const gameClosedListener = (response: any) => {
  const utcTimeComplete = new Date(response.CompleteTime);
  completeTime.value = utcTimeComplete.getTime();
}

var countTimer: NodeJS.Timeout

onMounted(() => {
  addGameHubListener('ReceiveMove', receiveMoveListener);
  addGameHubListener('GameInfo', gameInfoListener);
  addGameHubListener('GameCompleted', gameClosedListener);
  addGameHubListener('GameClosed', gameClosedListener);

  countTimer = setInterval(() => {
    updateElapsedTime();
  }, 10);
});

onUnmounted(() => {
  removeGameHubListener('ReceiveMove', receiveMoveListener);
  removeGameHubListener('GameInfo', gameInfoListener);
  removeGameHubListener('GameCompleted', gameClosedListener);
  removeGameHubListener('GameClosed', gameClosedListener);

  clearInterval(countTimer);
});

</script>

<style scoped>

.timer {
  margin-top: 2px;
  text-align: center;
}

</style>