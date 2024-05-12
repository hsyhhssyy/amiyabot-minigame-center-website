<template>
    <div class="room-page">
        <h2>游戏房间 {{ roomId }}</h2>
        <div class="player-list">
            <div v-for="player in players" :key="player.id" @click="kickPlayer(player.id)" class="player">
                <img :src="player.avatar" alt="Player Avatar" class="avatar">
                <span>{{ player.name }}</span>
            </div>
        </div>
        <div :hidden="!isHost">
            <button @click="startGame" class="start-game-button">开始游戏</button>
            <button @click="closeRoom" class="close-room-button">关闭房间</button>
        </div>
        <div :hidden="isHost">
            <button @click="exitRoom" class="close-room-button">离开房间</button>
        </div>
    </div>
    <ConfirmDialog :visible="showConfirm" message="确定要踢出这位玩家吗？" @confirm="kickPlayerConfirmed" @cancel="hideConfirm" />
    <AlertDialog :visible="showAlert" :message="alertMessage" @confirm="alertConfirmed"/>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@src/views/dialogs/ConfirmDialog.vue';
import AlertDialog from '@src/views/dialogs/AlertDialog.vue';
import CryptoJS from 'crypto-js';
import { invokeGameHub, addGameHubListener, removeGameHubListener } from '@src/api/SignalR.ts';
//import { on } from 'events';

const route = useRoute();
const router = useRouter();

var roomId = route.params.roomId

const showConfirm = ref(false);
const selectedPlayerId = ref("");
const isHost = ref(false);

const showAlert = ref(false);
const alertMessage = ref('');

var alertConfirmed = () => {
    showAlert.value = false;
    router.push('/regular-home');
}

const players = ref([
    { id: localStorage.getItem("signalrId")||"", name: localStorage.getItem("nickname"), avatar: 'https://www.gravatar.com/avatar/' + CryptoJS.MD5(localStorage.getItem('email') ?? "".trim().toLowerCase()) + '?d=identicon' },
]);

function kickPlayer(playerId: string) {
    if (!isHost.value) {
        return;
    }
    console.log(`踢出玩家 ${playerId}`);
    
    selectedPlayerId.value = playerId;
    showConfirm.value = true;
}

function startGame() {
    console.log('开始游戏');
    // 实现开始游戏的逻辑
    invokeGameHub('StartGame', roomId);
    router.push('/regular-home/games/schulte-grid/' + roomId);
}

function closeRoom() {
    console.log('关闭房间');
    invokeGameHub('CloseGame', roomId);
    router.push('/regular-home');
}

function exitRoom() {
    console.log('退出房间');
    invokeGameHub('LeaveGame', roomId);
    router.push('/regular-home');
}

var playerJoinedListener = (response: string) => {
    var responseObj = JSON.parse(response);
    var player = {
        id: responseObj.UserSignalRId,
        name: responseObj.UserName,
        avatar: 'https://www.gravatar.com/avatar/' + CryptoJS.MD5(responseObj.UserEmail.trim().toLowerCase()) + '?d=identicon'
    }
    players.value.push(player);
}

var gameInfoUpdatedListener = (response: string) => {
    var responseObj = JSON.parse(response);
    var playerList = responseObj.PlayerList;
    isHost.value = responseObj.CreatorSignalRId === localStorage.getItem('signalrId');
    players.value = playerList.map((p: any) => {
        return {
            id: p.UserSignalRId,
            name: p.UserName,
            avatar: 'https://www.gravatar.com/avatar/' + CryptoJS.MD5(p.UserEmail.trim().toLowerCase()) + '?d=identicon'
        }
    });
}

var playerLeftListener = (response: string) => {
    var responseObj = JSON.parse(response);
    var playerId = responseObj.LeavingPlayerSignalRId;
    var method = responseObj.LeavingMethod;
    players.value = players.value.filter(p => p.id !== playerId);

    //如果是自己被踢，弹出提示并返回首页
    if (playerId == localStorage.getItem('signalrId')&&method == 'Kicked') {
        alertMessage.value = '您已被房主踢出房间';
        showAlert.value = true;
    }
}

var gameClosedListener = (_: string) => {
    alertMessage.value = '房间已关闭';
    showAlert.value = true;
}

onMounted(() => {
    addGameHubListener('GameInfo', gameInfoUpdatedListener);
    addGameHubListener('PlayerJoined', playerJoinedListener);
    addGameHubListener('PlayerLeft', playerLeftListener);
    addGameHubListener('PlayerKicked', playerLeftListener);
    addGameHubListener('GameClosed', gameClosedListener);

    invokeGameHub('GetGame', roomId);

    // 间隔一段时间获取一次房间信息
    setInterval(() => {
        invokeGameHub('GetGame', roomId);
    }, 4000);
});

onUnmounted(() => {
    removeGameHubListener('GameInfo', gameInfoUpdatedListener);
    removeGameHubListener('PlayerJoined', playerJoinedListener);
    removeGameHubListener('PlayerLeft', playerLeftListener);
    removeGameHubListener('PlayerKicked', playerLeftListener);
    removeGameHubListener('GameClosed', gameClosedListener);
});


function kickPlayerConfirmed() {
    console.log(`确认踢出玩家 ${selectedPlayerId.value}`);
    invokeGameHub('KickPlayer', roomId, selectedPlayerId.value);
    players.value = players.value.filter(p => p.id !== selectedPlayerId.value);
    showConfirm.value = false;
}

function hideConfirm() {
    showConfirm.value = false;
}

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