<template>
    <div class="waiting-room" v-if="gameRoomData">
        <n-space vertical>
            <game-info-card :room-data="gameRoomData">
                <template #tags>
                    <n-tag type="info">等待中</n-tag>
                </template>
                <template #buttons>
                    <template v-if="isHost">
                        <icon-button :icon="Play" type="success" @click="startGame">开始游戏</icon-button>
                        <icon-button :icon="Close" type="error" @click="closeRoom">关闭房间</icon-button>
                    </template>
                    <template v-else>
                        <icon-button :icon="Logout" type="warning" @click="leaveRoom">退出房间</icon-button>
                    </template>
                </template>
            </game-info-card>
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
                    <n-space vertical align="center" v-for="(item, index) in players" :key="index" :size="0">
                        <n-popover :trigger="isHost ? 'hover' : 'manual'">
                            <template #trigger>
                                <n-badge
                                    :type="item.id === hostId ? 'error' : 'info'"
                                    :value="item.id === hostId ? '房主' : '玩家'"
                                >
                                    <n-avatar size="large" :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }"/>
                                </n-badge>
                            </template>
                            <span>I wish they all could be California girls</span>
                        </n-popover>
                        <span>{{ item.name }}</span>
                    </n-space>
                </n-space>
            </n-card>
        </n-space>
        <div style="height: 100%">
            <chat-board :players="players" :room-id="roomId" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, Logout, Peoples, Play, ShareOne } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { getData, removeData, toast } from '@/utils'
import type { GameTypes } from '@/def/games'
import { getGameTypeMap } from '@/def/games'
import type { GameRoom } from '@/api/game'
import { getGame, getShortenUrl } from '@/api/game'
import type { Player } from '@/def/players'
import type { SignalrResponse } from '@/api/signalr'
import IconButton from '@/universal/components/IconButton.vue'
import Icon from '@/universal/components/Icon.vue'
import ChatBoard from '@/desktop/components/ChatBoard.vue' //注意这里是有意使用桌面端ChatBoard的
import GameInfoCard from '@/universal/components/GameInfoCard.vue'

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()

const userId = getData<string>('user-id')
const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const isHost = ref(false)
const hostId = ref('')
const gameRoomData = ref<GameRoom>()
const gameTypeMap = ref<GameTypes>(getGameTypeMap())

const players = ref<Player[]>([])

let getGameInterval: any = null

async function gameInfoListener(response: SignalrResponse) {
    const playerList = response.PlayerList

    isHost.value = response.CreatorId == userId
    hostId.value = response.CreatorId
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
    gameHub.invokeGameHub('GetGame', roomId)
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
    if (gameRoomData.value?.gameType) {
        const gameData = gameTypeMap.value[gameRoomData.value?.gameType]
        await router.push(gameData.route + "game/" + roomId)
    }
}

async function gameClosedListener() {
    await toast('房间已关闭', 'warning')
    await router.push('/regular-home')
}

async function startGame() {
    gameHub.invokeGameHub('StartGame', roomId)
}

async function closeRoom() {
    gameHub.invokeGameHub('CloseGame', roomId)
}

async function leaveRoom() {
    removeData('current-game-id')
    gameHub.invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

async function shareRoom() {
    const sUrl = await getShortenUrl(roomId)
    await navigator.clipboard.writeText(`快来和大家一起玩游戏吧，点击链接: ${sUrl} 立刻加入房间。房间号[${gameRoomData.value?.joinCode}]。`)
    await toast('已复制加入链接到剪贴板', 'success')
}

onMounted(async () => {
    gameRoomData.value = await getGame(roomId)

    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('PlayerJoined', playerJoinedListener)
    gameHub.addGameHubListener('PlayerLeft', playerLeftListener)
    gameHub.addGameHubListener('PlayerKicked', playerLeftListener)
    gameHub.addGameHubListener('GameClosed', gameClosedListener)
    gameHub.addGameHubListener('GameStarted', gameStartedListener)

    gameHub.invokeGameHub('GetGame', roomId)

    // 间隔一段时间获取一次房间信息
    getGameInterval = setInterval(() => {
        gameHub.invokeGameHub('GetGame', roomId)
    }, 4000)
})

onUnmounted(async () => {
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('PlayerJoined', playerJoinedListener)
    gameHub.removeGameHubListener('PlayerLeft', playerLeftListener)
    gameHub.removeGameHubListener('PlayerKicked', playerLeftListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    gameHub.removeGameHubListener('GameStarted', gameStartedListener)

    clearInterval(getGameInterval)
})
</script>

<style lang="scss" scoped>
.waiting-room {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;

    & > div {
        margin-bottom: 10px;
    }
}
</style>
