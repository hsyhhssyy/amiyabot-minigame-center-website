<template>
  <el-carousel height="auto" autoplay v-if="validNotification.length>0" indicator-position="none" arrow="never">
    <el-carousel-item v-for="(item, index) in validNotification" :key="index" style="height: 30px">
      <div class="notification-item" style="height: 30px">
        {{ item.message }}
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts">
import { ref,onMounted,onUnmounted,computed } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';
import { addGameHubListener, removeGameHubListener,addConnectListener, invokeGameHub } from '@src/api/SignalR.ts';

const notifications = ref([
  { id: "", message: '通知1: 欢迎来到我们的网站！', expiredAt: new Date(new Date().setDate(new Date().getDate() - 1))},
]);

const validNotification = computed(() => {
  return notifications.value.filter((item) => item.expiredAt > new Date());
});

const systemNotificationHandler = (jsonObject: any) => {

  var dateStr = jsonObject.ExpiredAt;
  var date = new Date(dateStr);

  if(date < new Date()){
    return;
  }

  //判断是否存在
  var index = notifications.value.findIndex((item) => item.id == jsonObject.Id);
  if(index != -1){
    return;
  }

  notifications.value.push({ 
    id: jsonObject.Id,
    message: jsonObject.Message, 
    expiredAt: date});
};

var timer : NodeJS.Timeout

onMounted(() => {
  addConnectListener(() => {
    addGameHubListener('SystemNotification',systemNotificationHandler);
  });

  timer = setInterval(() => {
    invokeGameHub('GetNotification');
  }, 1000);
});

onUnmounted(() => {
  removeGameHubListener('SystemNotification',systemNotificationHandler);
  clearInterval(timer);
});

</script>

<style>
.notification-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  background-color: #409EFF;
}
</style>