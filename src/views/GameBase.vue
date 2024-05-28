<template>
    <div class="game-base" v-if="!isLoading && gameRoomData">
        <div>
            <slot></slot>
        </div>
        <div class="player-panel">
            <game-info-card class="game-info" :room-data="gameRoomData">
                <template #buttons>
                    <icon-button :icon="Logout" type="error" @click="leaveRoom">退出房间</icon-button>
                </template>
            </game-info-card>
            <div class="chat-area">
                <chat-board
                    :room-id="props.roomId"
                    :players="props.players"
                    :input-handler="props.inputHandler"
                    ref="chat"
                />
                <n-card title="玩家列表" size="small" class="player-list">
                    <div class="play-item" v-for="(item, index) in players" :key="index">
                        <n-avatar round :src="item.avatar"></n-avatar>
                        <span style="padding-left: 5px">{{ item.name }}</span>
                    </div>
                </n-card>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Logout } from '@icon-park/vue-next'
import type { SignalrResponse } from '@/api/signalr'
import { useGameHubStore } from '@/stores/gamehub'
import type { GameRoom } from '@/api/game'
import { getGame } from '@/api/game'
import type { ChatProps, Message } from '@/components/common/ChatBoard.vue'
import ChatBoard from '@/components/common/ChatBoard.vue'
import GameInfoCard from '@/components/common/GameInfoCard.vue'
import IconButton from '@/components/IconButton.vue'
import { removeData } from '@/utils'

interface GameProps extends ChatProps {}

const emits = defineEmits<{
    (e: 'onLoaded')
    (e: 'onGameClosed', response: SignalrResponse)
}>()

const props = defineProps<GameProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const isLoading = ref(true)
const chat = ref()

async function gameClosedListener(response: SignalrResponse) {
    emits('onGameClosed', response)
}

async function leaveRoom() {
    removeData('current-game-id')
    gameHub.invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

function pushMessage(msg: Message) {
    chat.value.pushMessage(msg)
}

defineExpose({ pushMessage })

let getGameInterval: any = null

watch(
    computed(() => gameHub.isConnected),
    (value: boolean) => {
        isLoading.value = !value

        if (value) {
            emits('onLoaded')
            gameHub.addGameHubListener('GameCompleted', gameClosedListener)
            gameHub.addGameHubListener('GameClosed', gameClosedListener)
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
    gameRoomData.value = await getGame(roomId)
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameClosedListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    clearInterval(getGameInterval)
})
</script>

<style lang="scss" scoped>
.game-base {
    width: 100%;
    height: 100%;
    padding: 50px;
    display: flex;
    justify-content: space-between;

    & > div {
        width: calc(50% - 5px);
    }

    .game-info {
        margin-bottom: 10px;
    }

    .player-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .chat-area {
            height: 100%;
            display: flex;

            & > div {
                height: 100%;
            }

            .player-list {
                width: 240px;
                margin-left: 10px;

                .play-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 3px;
                }
            }
        }
    }
}
</style>
