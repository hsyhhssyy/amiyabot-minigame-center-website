<template>
    <div class="app">
        <header>
            <h1>兔兔小游戏中心 - 创建房间</h1>
        </header>
        <div class="create-game-page">
            <div class="game-list">
                <button v-for="game in games" :key="game.id" @click="selectGame(game.id)" class="game-button">
                    <img :src="game.image" :alt="game.name" class="game-image">
                </button>
            </div>
            <button @click="goBack" class="back-button">返回首页</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref,onMounted,onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { invokeGameHub,addGameHubListener,removeGameHubListener } from '@src/api/SignalR.ts';

const router = useRouter();

// 示例游戏数据，应从后端或其他数据源获取
const games = ref([
    { id: 1, image: 'path_to_game_screenshot1.png' , name: '猜干员'},
    { id: 2, image: 'path_to_game_screenshot2.png' , name: '技能方格'},
    { id: 3, image: 'path_to_game_screenshot3.png' , name: '游戏3'},
    // 添加更多游戏
]);

function selectGame(gameId: number) {
    console.log(`选择游戏 ${gameId}`);
    
    // 创建房间并跳转到房间等待页面
    invokeGameHub('CreateGame', "SchulteGrid");
}

var gameCreateListener = (response:string) => {
    
    var responseObj = JSON.parse(response);
    var gameId = responseObj.GameId;
    localStorage.setItem('gameId', gameId);
    
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
    width: 200px;
    height: 200px;
    border: none;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.game-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
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