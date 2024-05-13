<template>
    <div class="room-page">
        <h2>游戏房间 {{ joinCode }}</h2>
        <div class="player-list">
            <div v-for="player in players" :key="player.id" @click="handleKickPlayer(player.id)" class="player">
                <img :src="player.avatar" alt="Player Avatar" class="avatar">
                <span>{{ player.name }}</span>
            </div>
        </div>
        <div :hidden="!isHost">
            <button @click="handleStartGame" class="start-game-button">开始游戏</button>
            <button @click="handleCloseRoom" class="close-room-button">关闭房间</button>
        </div>
        <div :hidden="isHost">
            <button @click="handleExitRoom" class="close-room-button">离开房间</button>
        </div>
    </div>
    <ConfirmDialog :visible="showConfirm" message="确定要踢出这位玩家吗？" @confirm="handleKickPlayerConfirmed" @cancel="handleCancelKickPlayer" />
    <AlertDialog :visible="showAlert" :message="alertMessage" @confirm="handleAlertConfirmed"/>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@src/views/dialogs/ConfirmDialog.vue';
import AlertDialog from '@src/views/dialogs/AlertDialog.vue';
import { invokeGameHub, addGameHubListener, removeGameHubListener,isConnected } from '@src/api/SignalR.ts';
//import { on } from 'events';

const route = useRoute();
const router = useRouter();

var roomId = route.params.roomId

const joinCode = ref("")
const showConfirm = ref(false);
const selectedPlayerId = ref("");
const isHost = ref(false);

const showAlert = ref(false);
const alertMessage = ref('');

if(!isConnected()){
  router.push('/regular-home');
}


const players = ref([
    { id: "", connection: "", name: '', avatar: '' },
]);

var handleAlertConfirmed = () => {
    showAlert.value = false;
    router.push('/regular-home');
}

var handleKickPlayer =(playerId: string)=>{
    if (!isHost.value) {
        return;
    }
    console.log(`踢出玩家 ${playerId}`);
    
    selectedPlayerId.value = playerId;
    showConfirm.value = true;
}

var handleStartGame = ()=>{
    console.log('开始游戏');
    invokeGameHub('StartGame', roomId);
}

var handleCloseRoom = () => {
    console.log('关闭房间');
    invokeGameHub('CloseGame', roomId);
    router.push('/regular-home');
}

var handleExitRoom = () => {
    console.log('退出房间');
    invokeGameHub('LeaveGame', roomId);
    router.push('/regular-home');
}

var handleKickPlayerConfirmed = () => {
    console.log(`确认踢出玩家 ${selectedPlayerId.value}`);
    invokeGameHub('KickPlayer', roomId, selectedPlayerId.value);
    players.value = players.value.filter(p => p.id !== selectedPlayerId.value);
    showConfirm.value = false;
}

var handleCancelKickPlayer = ()=>{
    showConfirm.value = false;
}

var playerJoinedListener = (_: any) => {
    invokeGameHub('GetGame', roomId);
}

var gameInfoListener = (response: any) => {
    var playerList = response.PlayerList;
    isHost.value = response.CreatorId == localStorage.getItem('user-id');
    joinCode.value = response.GameJoinCode;
    players.value = playerList.map((p: any) => {
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: "/ceobe.jpeg"//p.UserAvatar
        }
    });

    if(response.GameStarted){
        router.push('/regular-home/games/schulte-grid/' + roomId);
    }
}

var playerLeftListener = (response: any) => {
    var playerId = response.LeavingPlayerId;
    var method = response.LeavingMethod;
    players.value = players.value.filter(p => p.id !== playerId);

    //如果是自己被踢，弹出提示并返回首页
    if (playerId == localStorage.getItem('user-id')&&method == 'Kicked') {
        alertMessage.value = '您已被房主踢出房间';
        showAlert.value = true;
    }
}

var gameStartedListener = (_: string) => {
    router.push('/regular-home/games/schulte-grid/' + roomId);
}

var gameClosedListener = (_: string) => {
    alertMessage.value = '房间已关闭';
    showAlert.value = true;
}

var getGameInterval:NodeJS.Timeout

onMounted(() => {
    addGameHubListener('GameInfo', gameInfoListener);
    addGameHubListener('PlayerJoined', playerJoinedListener);
    addGameHubListener('PlayerLeft', playerLeftListener);
    addGameHubListener('PlayerKicked', playerLeftListener);
    addGameHubListener('GameClosed', gameClosedListener);
    addGameHubListener('GameStarted', gameStartedListener);

    invokeGameHub('GetGame', roomId);

    // 间隔一段时间获取一次房间信息
    getGameInterval = setInterval(() => {
        invokeGameHub('GetGame', roomId);
    }, 4000);
});

onUnmounted(() => {
    removeGameHubListener('GameInfo', gameInfoListener);
    removeGameHubListener('PlayerJoined', playerJoinedListener);
    removeGameHubListener('PlayerLeft', playerLeftListener);
    removeGameHubListener('PlayerKicked', playerLeftListener);
    removeGameHubListener('GameClosed', gameClosedListener);
    removeGameHubListener('GameStarted', gameStartedListener);

    clearInterval(getGameInterval);
});
</script>

<style scoped>
.room-page {
    text-align: center;
    padding: 20px;
}

.player-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

.player {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 5px;
}

.start-game-button,
.close-room-button {
    padding: 10px 20px;
    margin: 5px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.close-room-button {
    background-color: #D32F2F;
}

.start-game-button:hover {
    background-color: #45a049;
}

.close-room-button:hover {
    background-color: #C62828;
}
</style>