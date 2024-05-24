<template>
    <div class="waiting-room" v-if="gameRoomData">
        <div>
            <n-card class="room-info">
                <n-space justify="space-between" align="center">
                    <n-space align="center">
                        <img class="game-logo" :src="gameTypeMap[gameRoomData.gameType].image" alt="" />
                        <div>
                            <div style="font-size: 16px; font-weight: bold">
                                {{ gameTypeMap[gameRoomData.gameType].name }}
                            </div>
                            <div style="font-size: 12px; color: #898989">#{{ gameRoomData.joinCode }}</div>
                        </div>
                    </n-space>
                    <n-space align="center">
                        <n-tag type="info">等待中</n-tag>
                        <n-tag type="primary" v-if="gameRoomData.isPrivate">私人房间</n-tag>
                        <n-tag type="success" v-else>公开房间</n-tag>
                    </n-space>
                </n-space>
                <div class="game-actions" style="margin-top: 20px">
                    <template v-if="isHost">
                        <icon-button :icon="Play" type="success" @click="startGame">开始游戏</icon-button>
                        <icon-button :icon="Close" type="error" @click="closeRoom">关闭房间</icon-button>
                    </template>
                    <icon-button :icon="Logout" type="warning" @click="leaveRoom">退出房间</icon-button>
                </div>
            </n-card>
            <n-card>
                <template #header>
                    玩家列表
                    <n-tag type="default">
                        <n-space :size="0">
                            <icon :icon="Peoples" />
                            {{ Object.keys(players).length }}
                        </n-space>
                    </n-tag>
                </template>
                <template #header-extra>
                    <icon-button :icon="ShareOne" type="primary" @click="shareRoom">邀请玩家</icon-button>
                </template>
                <n-space :size="20" style="padding-top: 10px">
                    <n-space v-for="(item, index) in players" :key="index" vertical align="center" :size="0">
                        <n-popover :trigger="isHost ? 'hover' : 'manual'">
                            <template #trigger>
                                <n-badge
                                    :type="item.id === hostId ? 'error' : 'info'"
                                    :value="item.id === hostId ? '房主' : '玩家'"
                                >
                                    <n-avatar size="large" :src="item.avatar" />
                                </n-badge>
                            </template>
                            <span>I wish they all could be California girls</span>
                        </n-popover>
                        <span>{{ item.name }}</span>
                    </n-space>
                </n-space>
            </n-card>
        </div>
        <div style="height: 100%">
            <n-card style="height: 100%" title="赛前交流">
                <n-card class="message-window" embedded :bordered="false">
                    <n-space
                        style="margin-bottom: 10px"
                        v-for="(item, index) in messages"
                        :key="index"
                        :size="6"
                        :justify="userId === item.userId ? 'end' : 'start'"
                    >
                        <n-avatar :src="item.avatar" size="large" v-if="userId !== item.userId" />
                        <n-space vertical :size="0" :align="userId === item.userId ? 'end' : 'start'">
                            {{ item.nickname }}
                            <n-card class="message-content" size="small">{{ item.content }}</n-card>
                        </n-space>
                        <n-avatar :src="item.avatar" size="large" v-if="userId === item.userId" />
                    </n-space>
                </n-card>
                <n-input-group>
                    <n-input
                        placeholder="输入内容，按回车键发送"
                        v-model:value="inputMessage"
                        @keydown.enter="sendMessage"
                    />
                    <icon-button :icon="SendOne" type="success" @click="sendMessage">发送</icon-button>
                </n-input-group>
            </n-card>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Peoples, ShareOne, Play, Close, Logout, SendOne } from '@icon-park/vue-next'
import { getData, removeData, toast } from '@/utils'
import { GameTypes, getGameTypeMap } from '@/views/room/Games'
import { getGame, getShortenUrl } from '@/api/game'
import type { GameRoom } from '@/api/game'
import { addGameHubListener, removeGameHubListener, invokeGameHub } from '@/api/signalR'
import type { SignalrResponse } from '@/api/signalR'
import IconButton from '@/components/IconButton.vue'
import Icon from '@/components/Icon.vue'

interface Player {
    id: string
    connection: string
    name: string
    avatar: string
}

interface Message {
    userId: string
    nickname: string
    content: string
    avatar: string
}

const route = useRoute()
const router = useRouter()

const userId = getData<string>('user-id')
const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const joinCode = ref('')
const isHost = ref(false)
const hostId = ref('')
const gameType = ref('')
const gameLoaded = ref(false)
const gameRoomData = ref<GameRoom>()
const gameTypeMap = ref<GameTypes>({})

const inputMessage = ref('')

const players = ref<Player[]>([])
const messages = ref<Message[]>([
    {
        userId: '123',
        nickname: '123123',
        content: '123123123123',
        avatar: '/avatar.webp'
    },
    {
        userId: '123',
        nickname: '123123',
        content: '123123123123',
        avatar: '/avatar.webp'
    }
])

let getGameInterval = null

async function gameInfoListener(response: SignalrResponse) {
    const playerList = response.PlayerList

    isHost.value = response.CreatorId == userId
    hostId.value = response.CreatorId
    joinCode.value = response.GameJoinCode
    gameLoaded.value = true
    gameType.value = response.GameType
    players.value = playerList.map((p: SignalrResponse) => {
        const avatar = p.UserAvatar ? p.UserAvatar : '/avatar.webp'
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: avatar
        }
    })

    if (response.GameStarted) {
        await startGame()
    }
}

async function playerJoinedListener() {
    invokeGameHub('GetGame', roomId)
}

async function playerLeftListener(response: SignalrResponse) {
    const playerId = response.LeavingPlayerId
    const method = response.LeavingMethod

    players.value = players.value.filter((p) => p.id !== playerId)

    // 如果是自己被踢，弹出提示并返回首页
    if (playerId == userId && method == 'Kicked') {
        await toast('您已被房主踢出房间', 'warning')
    }
}

async function gameStartedListener() {
    await startGame()
}

async function gameClosedListener() {
    await toast('房间已关闭', 'warning')
    await router.push('/regular-home')
}

async function chatListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.UserId)
    if (player) {
        messages.value.push({
            userId: response.UserId,
            nickname: player.name,
            content: response.Message,
            avatar: player.avatar
        })
    }
}

async function startGame() {
    const gameData = gameTypeMap.value[gameRoomData.value?.gameType]
    await router.push(gameData.route + roomId)
}

async function closeRoom() {
    invokeGameHub('CloseGame', roomId)
}

async function leaveRoom() {
    removeData('current-game-id')
    invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

async function sendMessage() {
    if (inputMessage.value === '') {
        return
    }
    invokeGameHub('Chat', roomId, inputMessage.value)
    inputMessage.value = ''
}

async function shareRoom() {
    const sUrl = await getShortenUrl(roomId)
    await navigator.clipboard.writeText(`快来和大家一起玩游戏吧，点击链接: ${sUrl} 立刻加入房间。`)
    await toast('已复制加入链接到剪贴板', 'success')
}

onMounted(async () => {
    gameTypeMap.value = getGameTypeMap()
    gameRoomData.value = await getGame(roomId)

    addGameHubListener('GameInfo', gameInfoListener)
    addGameHubListener('PlayerJoined', playerJoinedListener)
    addGameHubListener('PlayerLeft', playerLeftListener)
    addGameHubListener('PlayerKicked', playerLeftListener)
    addGameHubListener('GameClosed', gameClosedListener)
    addGameHubListener('GameStarted', gameStartedListener)
    addGameHubListener('Chat', chatListener)

    invokeGameHub('GetGame', roomId)

    // 间隔一段时间获取一次房间信息
    getGameInterval = setInterval(() => {
        invokeGameHub('GetGame', roomId)
    }, 4000)
})

onUnmounted(async () => {
    removeGameHubListener('GameInfo', gameInfoListener)
    removeGameHubListener('PlayerJoined', playerJoinedListener)
    removeGameHubListener('PlayerLeft', playerLeftListener)
    removeGameHubListener('PlayerKicked', playerLeftListener)
    removeGameHubListener('GameClosed', gameClosedListener)
    removeGameHubListener('GameStarted', gameStartedListener)

    clearInterval(getGameInterval)
})
</script>

<style lang="scss" scoped>
.waiting-room {
    height: 100%;
    display: flex;

    & > div {
        width: 50%;
        padding: 10px;
    }

    .room-info {
        margin-bottom: 10px;
    }
}

.game-logo {
    width: 50px;
    border-radius: 4px;
}

.game-actions {
    display: flex;

    & > button {
        flex: 2;

        &:not(:last-child) {
            margin-right: 10px;
        }
    }
}

.message-window {
    height: calc(100% - 34px - 10px);
    margin-bottom: 10px;
    overflow: auto;

    .message-content {
        box-shadow: var(--n-box-shadow);
    }
}
</style>
