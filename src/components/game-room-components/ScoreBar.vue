<template>
    <div class="player-icon-list">
        <div v-for="player in players" :key="player.id" class="player">
            <img :src="player.avatar" alt="Player Avatar" class="avatar">
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score">
                <i class="fa-solid fa-star"></i>
                {{ player.score }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { addGameHubListener, removeGameHubListener } from '@src/api/SignalR.ts';

const players = ref([
  { id: '', name: '', avatar: '', score: 0 },
]);

players.value=[]

var gameInfoListener = (response: any) => {
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

onMounted(() => {
  addGameHubListener('GameInfo', gameInfoListener);
})

onUnmounted(() => {
  removeGameHubListener('GameInfo', gameInfoListener);
})

</script>

<style scoped>

.player-icon-list {
  display: flex;
  width: 100%;
  overflow-x: auto;

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
</style>