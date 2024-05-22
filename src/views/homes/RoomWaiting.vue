<template>
    <div class="room-page">
        <NotificationBanner class="banner" />
        <h2>游戏房间 {{ joinCode }}</h2>
        <div class="player-list">
            <div v-for="player in players" :key="player.id" @click="handleKickPlayer(player.id)"
                :class="{ owner: player.id == hostId, player: true }">
                <div class="avatar-wrapper">
                    <img :src="player.avatar" alt="Player Avatar" class="avatar">
                    <span class="kick-mask" v-show="player.id != hostId">踢出</span>
                </div>
                <span>{{ player.name }}</span>
            </div>
            <div>
                <div class="avatar-wrapper" @click="handleCopyLink()">
                    <div class="plus-button">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
                <span>等待玩家...</span>
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

        <!-- 聊天信息显示区域 -->
        <ChatArea class="chat-area" :messages="messages" />

        <!-- 消息输入区域 -->
        <div class="message-input">
            <el-input type="text" class="message-to-send" v-model="messageToSend" @keyup.enter="handleSendMessage"
                placeholder="说点什么吧..." />
            <el-button type="primary" class="button" @click="handleSendMessage">发送</el-button>
        </div>

        <el-dialog v-model="showConfirm" title="踢出玩家" center="true" show-close="false">
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
import { games } from '@src/api/GamesData.ts';
import { invokeGameHub, addGameHubListener, removeGameHubListener, isConnected } from '@src/api/SignalR.ts';
import { ElMessage } from 'element-plus';
import {copyInviteLinkToClipboard} from '@src/utils/Clipboard.ts';
import NotificationBanner from '@src/components/SystemNotificationCarousel.vue';
import ChatArea from '@src/components/ChatArea.vue';

const route = useRoute();
const router = useRouter();

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId;

const joinCode = ref("")
const showConfirm = ref(false);
const selectedPlayerId = ref("");
const isHost = ref(false);
const hostId = ref("");
const gameType = ref("");
const gameLoaded = ref(false);

const showAlert = ref(false);
const alertMessage = ref('');

const messages = ref([
    { nickname: '玩家1', content: '这是一条消息', avatar: '/ceobe.jpeg',style:"" }
]);

messages.value = []

const messageToSend = ref('');

localStorage.setItem('current-game-id', roomId);

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

var handleCopyLink = async ()=>{
   await copyInviteLinkToClipboard(roomId);
}

var handleAlertConfirmed = () => {
    showAlert.value = false;
    router.push('/regular-home');
}

var handleKickPlayer = (playerId: string) => {
    if (!isHost.value) {
        return;
    }

    if (playerId == localStorage.getItem('user-id')) {
        console.log('不能踢出自己');
        return;
    }

    selectedPlayerId.value = playerId;
    showConfirm.value = true;

    console.log(`踢出玩家 ${playerId}`);
}

const handleSendMessage = () => {
    if (messageToSend.value === '') {
        return;
    }
    invokeGameHub('Chat', roomId, messageToSend.value);
    messageToSend.value = '';
}

var handleStartGame = () => {
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

var handleCancelKickPlayer = () => {
    showConfirm.value = false;
}

const startGame = () => {
    var gameData = games.find(g => g.type == gameType.value);
    if (!gameData) {
        gameData = games.find(g => g.type == "SchulteGrid");
    }

    if (!gameData) {
        ElMessage({
            message: '未找到游戏数据，请退出房间重试。',
            type: 'error'
        });
        return
    }

    router.push(gameData.route + roomId);

}

var playerJoinedListener = (_: any) => {
    invokeGameHub('GetGame', roomId);
}

var gameInfoListener = (response: any) => {
    var playerList = response.PlayerList;
    isHost.value = response.Game.CreatorId == localStorage.getItem('user-id');
    hostId.value = response.Game.CreatorId;
    joinCode.value = response.Game.JoinCode;
    gameLoaded.value = true
    gameType.value = response.Game.GameType;
    players.value = playerList.map((p: any) => {
        var avatar = p.UserAvatar ? p.UserAvatar:"/ceobe.jpeg";
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: avatar,
        }
    });

    if (response.Game.IsStarted) {
        startGame()
    }
}

var playerLeftListener = (response: any) => {
    var playerId = response.LeavingPlayer.Id;
    var method = response.LeavingMethod;
    players.value = players.value.filter(p => p.id !== playerId);

    //如果是自己被踢，弹出提示并返回首页
    if (playerId == localStorage.getItem('user-id') && method == 'Kicked') {
        alertMessage.value = '您已被房主踢出房间';
        showAlert.value = true;
    }
}

var gameStartedListener = (_: string) => {
    startGame()
}

var gameClosedListener = (_: string) => {
    alertMessage.value = '房间已关闭';
    showAlert.value = true;
}

var chatListener = (response: any) => {
    const userId = response.UserId;
    const player = players.value.find(p => p.id === userId);
    if(player){
        messages.value.push({
            nickname: player.name,
            content: response.Message,
            avatar: player.avatar,
            style: "Correct"
        });
    }
}

var getGameInterval: NodeJS.Timeout

onMounted(() => {
    addGameHubListener('GameInfo', gameInfoListener);
    addGameHubListener('PlayerJoined', playerJoinedListener);
    addGameHubListener('PlayerLeft', playerLeftListener);
    addGameHubListener('PlayerKicked', playerLeftListener);
    addGameHubListener('GameClosed', gameClosedListener);
    addGameHubListener('GameStarted', gameStartedListener);
    addGameHubListener('Chat',chatListener);

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
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 20px;
    align-items: center;
    width: 100%;
}

.banner {
    width: 100%;
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
    background-color: rgba(0, 0, 0, 0.5);
    /* 半透明黑色背景 */
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 50%;
    font-size: 14px;
}

.avatar-wrapper:hover .kick-mask {
    opacity: 1;
    /* 当鼠标悬停时显示遮罩 */
}

.plus-button{
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #f4f4f4;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
}

.owner {
    border: 2px solid gold;
    /* 房主的特殊边框 */
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

.chat-area{
    width: 50%;
}

.message-input {
    display: flex;
    width: 50%;
}

.message-to-send {
    flex-grow: 1;
    margin-right: 10px;
}

@media (max-width: 768px) {
    .message-input {
        width: 100%;
        max-width: 720px;
    }

    .chat-area{
        width: 100%;
    }
}
</style>