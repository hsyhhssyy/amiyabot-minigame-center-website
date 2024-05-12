<template>
    <div class="join-room-page">
        <h2>加入房间</h2>
        <div class="input-group">
            <input v-model="roomNumber" type="text" placeholder="请输入房间号" />
        </div>
        <button @click="joinRoom" class="join-room-button">加入房间</button>
        <button @click="goBack" class="back-button">返回首页</button>
    </div>
</template>

<script lang="ts" setup>
import { ref ,onMounted,onUnmounted} from 'vue';
import { useRouter } from 'vue-router';
import { invokeGameHub,addGameHubListener,removeGameHubListener } from '@src/api/SignalR.ts';

const router = useRouter();

const roomNumber = ref('');

function joinRoom() {
    console.log(`加入房间号为 ${roomNumber.value} 的房间`);
    invokeGameHub('JoinGame', roomNumber.value);
}

var gameJoinListener = (response:any) => {
    
    var playerJoined = response.UserId;
    if(playerJoined != localStorage.getItem('user-id')){
        //意外收到别人的消息,不处理
        return;
    }

    var gameId = response.GameId;
    localStorage.setItem('current-game-id', gameId);    
    // 跳转到房间等待页面
    router.push('/regular-home/room-waiting/'+gameId);
}

onMounted(() => {
    addGameHubListener('PlayerJoined', gameJoinListener);
});

onUnmounted(() => {
    removeGameHubListener('PlayerJoined', gameJoinListener);
});

function goBack() {
    console.log('返回首页');
    router.push('/regular-home');
}
</script>

<style scoped>
.join-room-page {
    text-align: center;
    padding: 20px;
}

.input-group {
    margin: 20px;
}

input {
    padding: 10px;
    width: 200px;
    margin-bottom: 20px;
    font-size: 16px;
}

button {
    padding: 10px 20px;
    margin: 5px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.back-button {
    background-color: #D32F2F;
}

button:hover {
    background-color: #45a049;
}

.back-button:hover {
    background-color: #C62828;
}
</style>