<template>
    <div class="app">
        <header>
            <h1>兔兔小游戏中心 - 创建房间</h1>
        </header>
        <div class="create-game-page">
            <div class="game-list">
                <button v-for="game in games" :key="game.id" @click="selectGame(game.id)" class="game-button">
                    <img :src="game.image" :alt="game.name" class="game-image">
                    <div class="game-name">{{ game.name }}</div>
                </button>
            </div>
            <button @click="goBack" class="back-button">返回首页</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref,onMounted,onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { invokeGameHub,addGameHubListener,removeGameHubListener,isConnected } from '@src/api/SignalR.ts';

const router = useRouter();

// 示例游戏数据，应从后端或其他数据源获取
const games = ref([
    { id: 2, image: '/SchulteGrid.png' , name: '技能方格'},
    // 添加更多游戏
]);

var check_connection = () => {
  if (!isConnected()) {
    router.push('/regular-home');
    return;
  }
  setTimeout(check_connection, 500);
}

check_connection()

function selectGame(gameId: number) {
    console.log(`选择游戏 ${gameId}`);
    
    // 创建房间并跳转到房间等待页面
    invokeGameHub('CreateGame', "SchulteGrid","{}");
}

var gameCreateListener = (response:any) => {    
    var gameId = response.GameId;
    localStorage.setItem('current-game-id', gameId);
    
    // 跳转到房间等待页面
    router.push('/regular-home/room-waiting/'+gameId);
}

onMounted(() => {
    addGameHubListener('GameCreated', gameCreateListener);
});

onUnmounted(() => {
    removeGameHubListener('GameCreated', gameCreateListener);
});

function goBack() {
    console.log('返回首页');
    localStorage.removeItem('current-game-id');
    router.push('/regular-home');
}
</script>

<style scoped>
.app {
  text-align: center;
}

.create-game-page {
    text-align: center;
    padding: 20px;
}

.game-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}

.game-button {
    border: none;
    background-color: #ffffff;
}

.game-image {
    width: 100px;
    height: 100px;
    border: none;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    object-fit: cover;
}

.game-name {
    font-size: 20px;
    font-weight: bold;
}

.back-button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #D32F2F;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.back-button:hover {
    background-color: #C62828;
}
</style>