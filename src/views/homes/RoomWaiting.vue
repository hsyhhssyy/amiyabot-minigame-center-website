<template>
    <div class="room-page">
        <h2>游戏房间 {{ joinCode }}</h2>
        <div class="player-list">
            <div v-for="player in players" :key="player.id" @click="handleKickPlayer(player.id)" :class="{ owner: player.id == hostId,player:true }">
                <div class="avatar-wrapper">
                <img :src="player.avatar" alt="Player Avatar" class="avatar">
                <span class="kick-mask" v-show="player.id != hostId">踢出</span>
                </div>
                <span>{{ player.name }}</span>
            </div>
        </div>
        <div style="text-align: center;" v-if="!gameLoaded">该局游戏已经结束，无法重连或加入。</div>
        <div :hidden="!isHost">
            <button @click="handleStartGame" class="start-game-button">开始游戏</button>
            <button @click="handleCloseRoom" class="close-room-button">关闭房间</button>
        </div>
        <div :hidden="isHost">
            <button @click="handleExitRoom" class="close-room-button">离开房间</button>
        </div>
        <el-dialog v-model="showConfirm" title="踢出玩家"  center="true" show-close="false">
            <div style="text-align: center;">确定要踢出这位玩家吗？</div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCancelKickPlayer">取消</el-button>
                    <el-button type="primary" @click="handleKickPlayerConfirmed">确定</el-button>
                </span>
            </template>
        </el-dialog>
        
        <el-dialog v-model="showAlert" title="提示" center="true" show-close="false">
            <div style="text-align: center;">{{ alertMessage }}</div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="handleAlertConfirmed">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invokeGameHub, addGameHubListener, removeGameHubListener,isConnected } from '@src/api/SignalR.ts';
//import { on } from 'events';

const route = useRoute();
const router = useRouter();

const roomId =  route.params.roomId

const joinCode = ref("")
const showConfirm = ref(false);
const selectedPlayerId = ref("");
const isHost = ref(false);
const hostId = ref("");
const gameLoaded = ref(false);

const showAlert = ref(false);
const alertMessage = ref('');

var check_connection = () => {
  if (!isConnected()) {
    router.push('/regular-home');
    return;
  }
  setTimeout(check_connection, 500);
}

check_connection()

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
    
    if(playerId == localStorage.getItem('user-id')){
        console.log('不能踢出自己');
        return;
    }

    selectedPlayerId.value = playerId;
    showConfirm.value = true;

    console.log(`踢出玩家 ${playerId}`);
}

var handleStartGame = ()=>{
    console.log('开始游戏');
    invokeGameHub('StartGame', roomId);
}

var handleCloseRoom = () => {
    console.log('关闭房间');
    localStorage.removeItem('current-game-id');
    invokeGameHub('CloseGame', roomId);
    router.push('/regular-home');
}

var handleExitRoom = () => {
    console.log('退出房间');
    localStorage.removeItem('current-game-id');
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
    hostId.value = response.CreatorId;
    joinCode.value = response.GameJoinCode;
    gameLoaded.value = true
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


.avatar-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 5px;
}

.kick-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 50%;
    font-size: 14px;
}

.avatar-wrapper:hover .kick-mask {
    opacity: 1; /* 当鼠标悬停时显示遮罩 */
}

.owner {
    border: 2px solid gold; /* 房主的特殊边框 */
    border-radius: 5px;
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