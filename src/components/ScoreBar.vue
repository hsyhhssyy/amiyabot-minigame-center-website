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

interface GamePlayer {
    id: string;
    name: string;
    avatar: string;
    score: number;
}

interface Props{
    players: GamePlayer[];
}

defineProps<Props>();

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