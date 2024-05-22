<template>
<div class="player-list">
    <GameOperatorZone/>
    <ScoreBar/>
</div>
</template>

<script setup lang="ts">
import GameOperatorZone from '@src/components/game-room-components/GameOperatorZone.vue';
import ScoreBar from '@src/components/game-room-components/ScoreBar.vue';

</script>

<style scoped>

.player-list {
  display: flex;
  justify-content: left;
  gap: 10px;
  margin-bottom: 10px;
  max-width: 100%;
}

</style>