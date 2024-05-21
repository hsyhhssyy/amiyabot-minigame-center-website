<template>
    <div class="timer">{{ elapsedMinutes }}:{{ elapsedSeconds }}:{{ elapsedTenPrecentSeconds }}</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'


interface Props {
    startTime: number | null
    endTime: number | null
}

const props = defineProps<Props>();

const elapsedMinutes = ref("00")
const elapsedSeconds = ref("00")
const elapsedTenPrecentSeconds = ref("00")



const updateElapsedTime = () => {
  if (props.startTime !== null) {
    var elapsed = 0;
    if (props.endTime !== null) {
      elapsed = Math.floor((props.endTime - props.startTime) / 10);
    } else {
      const now = Date.now();
      const serverTimeDiff = Number(localStorage.getItem('server-time-diff'));
      elapsed = Math.floor((now - props.startTime - serverTimeDiff) / 10);
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

var countTimer: NodeJS.Timeout

onMounted(() => {
  countTimer = setInterval(() => {
    updateElapsedTime();
  }, 10);
});

onUnmounted(() => {
  clearInterval(countTimer);
});

</script>

<style scoped>

.timer {
  margin-top: 2px;
  text-align: center;
}

</style>