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
                        <n-popconfirm :trigger="(isHost && item.id!=user.userInfo?.id ) ? 'hover' : 'manual'"
                            positive-text="踢!"
                            :negative-text="null"
                            @positive-click="handleKickPlayer(item)"
                            >
                            <template #trigger>
                                <n-badge
                                    :type="item.id === hostId ? 'error' : 'info'"
                                    :value="item.id === hostId ? '房主' : '玩家'"
                                >
                                    <n-avatar
                                        size="large"
                                        :src="item.avatar"
                                        :img-props="{ referrerpolicy: 'no-referrer' }"
                                    />
                                </n-badge>
                            </template>
                            <span>是否踢出玩家{{item.name}}？</span>
                        </n-popconfirm>
                        <span>{{ item.name }}</span>
                    </n-space>
                </n-space>
            </n-card>
            <div ref="roomSettingsSlot">
                <n-card>
                    <template #header>
                    房间设置
                    </template>
                    <slot></slot>
                </n-card>
            </div>
        </n-space>
        <div style="height: 100%">
            <chat-board :players="players" :room-id="roomId" placeholder="说点什么吧...."/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch,computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, Logout, Peoples, Play, ShareOne } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { useUserStore } from '@/stores/user'
import { getData, removeData, setData, toast } from '@/utils'
import type { GameTypes } from '@/def/games'
import { getGameTypeMap } from '@/def/games'
import type { GameRoom } from '@/api/game'
import { getGame, getShortenUrl } from '@/api/game'
import type { Player } from '@/def/players'
import type { SignalrResponse } from '@/api/signalr'
import IconButton from '@/universal/components/IconButton.vue'
import Icon from '@/universal/components/Icon.vue'
import ChatBoard from '@/desktop/components/ChatBoard.vue'
import GameInfoCard from '@/universal/components/GameInfoCard.vue'

interface WaitingRoomProps {
    settings: any
}

const emits = defineEmits<{
    (e: 'onSettingsLoaded', settings:any): void
}>()
const props = defineProps<WaitingRoomProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()
const user = useUserStore()

const userId = user.userInfo?.id || ''
const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const isHost = ref(false)
const hostId = ref('')
const gameRoomData = ref<GameRoom>()
const gameTypeMap = ref<GameTypes>(getGameTypeMap())

const players = ref<Player[]>([])

const roomSettingsSlot = ref<any>()

watch( computed(() => props.settings), (value:any) => {
    console.log('settings changed', value)
    gameHub.invokeGameHub('ChangeGameSettings', roomId, JSON.stringify(value))
})

let getGameInterval: any = null

async function handleKickPlayer(params:Player) {
    gameHub.invokeGameHub('KickPlayer', roomId, params.id)
}

async function gameInfoListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }
    const playerList = response.PlayerList

    isHost.value = response.Game.CreatorId == userId
    hostId.value = response.Game.CreatorId
    players.value = playerList.map((p: SignalrResponse) => {
        const avatar = p.UserAvatar ? p.UserAvatar : '/avatar.webp'
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: avatar
        }
    })

    if (response.Game.IsStarted) {
        await gameStartedListener(response)
    }
}

async function playerJoinedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }
    gameHub.invokeGameHub('GetGame', roomId)
}

async function playerLeftListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }

    const playerId = response.LeavingPlayerId
    const method = response.LeavingMethod

    players.value = players.value.filter((p) => p.id !== playerId)

    // 如果是自己被踢，弹出提示并返回首页
    if (playerId == userId && method == 'Kicked') {
        await toast('您已被房主踢出房间', 'warning')
        //弹回首页
        user.currentRoomId = null
        await router.push('/regular-home')
    }
}

async function gameSettingsChangedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }

    const settings = response.Settings
    emits('onSettingsLoaded', settings)
}

async function gameStartedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }

    if (gameRoomData.value?.gameType) {
        const gameData = gameTypeMap.value[gameRoomData.value?.gameType]
        await router.push(gameData.route + "game/" + roomId)
    }
}

async function gameClosedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) {
        //多标签页环境可能出现多个房间同开的情况
        return
    }

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
    user.currentRoomId = null
    gameHub.invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

async function shareRoom() {
    const sUrl = await getShortenUrl(roomId)
    await navigator.clipboard.writeText(`快来和大家一起玩游戏吧，点击链接: ${sUrl} 立刻加入房间。房间号[${gameRoomData.value?.joinCode}]。`)
    await toast('已复制加入链接到剪贴板', 'success')
}

watch(
    computed(() => gameHub.isConnected),
    async (value: boolean) => {

        if (value) {
            gameRoomData.value = await getGame(roomId)

            gameHub.addGameHubListener('GameInfo', gameInfoListener)
            gameHub.addGameHubListener('PlayerJoined', playerJoinedListener)
            gameHub.addGameHubListener('PlayerLeft', playerLeftListener)
            gameHub.addGameHubListener('PlayerKicked', playerLeftListener)
            gameHub.addGameHubListener('GameClosed', gameClosedListener)
            gameHub.addGameHubListener('GameStarted', gameStartedListener)
            gameHub.addGameHubListener('GameSettingsChanged', gameSettingsChangedListener)

            gameHub.invokeGameHub('GetGame', roomId)

            // 间隔一段时间获取一次房间信息
            getGameInterval = setInterval(() => {
                gameHub.invokeGameHub('GetGame', roomId)
            }, 4000)

        } else {
            clearInterval(getGameInterval)
        }
    },
    {
        immediate: true
    }
)

onMounted(async () => {

})

onUnmounted(async () => {
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('PlayerJoined', playerJoinedListener)
    gameHub.removeGameHubListener('PlayerLeft', playerLeftListener)
    gameHub.removeGameHubListener('PlayerKicked', playerLeftListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    gameHub.removeGameHubListener('GameStarted', gameStartedListener)
    gameHub.removeGameHubListener('GameSettingsChanged', gameSettingsChangedListener)

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
}
</style>
