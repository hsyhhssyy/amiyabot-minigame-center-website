<template>
    <div class="game-base" v-if="!isLoading && gameRoomData" :style="{ minWidth: props.minWidth + 'px' }">
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
                    <slot name="players">
                        <div class="play-item" v-for="(item, index) in players" :key="index">
                            <n-avatar round :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
                            <span style="padding-left: 5px">{{ item.name }}</span>
                        </div>
                    </slot>
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
import type { ChatProps, Message } from '@/universal/components/ChatBoard.vue'
import ChatBoard from '@/universal/components/ChatBoard.vue'
import GameInfoCard from '@/universal/components/GameInfoCard.vue'
import IconButton from '@/universal/components/IconButton.vue'
import { removeData } from '@/utils'

interface GameProps extends ChatProps {
    minWidth: number
}

const emits = defineEmits<{
    (e: 'onLoaded'): void
    (e: 'onRoomData', data: GameRoom): void
    (e: 'onGameClosed', response: SignalrResponse): void
    (e: 'onGameCompleted', response: SignalrResponse): void
}>()

const props = defineProps<GameProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const isLoading = ref(true)
const chat = ref()

async function leaveRoom() {
    removeData('current-game-id')
    gameHub.invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

function gameClosedListener(response: SignalrResponse) {
    emits('onGameClosed', response)
}

function gameCompletedListener(response: SignalrResponse) {
    emits('onGameCompleted', response)
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
            gameHub.addGameHubListener('GameCompleted', gameCompletedListener)
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
    emits('onRoomData', gameRoomData.value as GameRoom)
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameClosedListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    clearInterval(getGameInterval)
})
</script>

<style lang="scss" scoped>
$gap: 4px;

.game-base {
    width: 100%;
    height: 100%;
    padding: 50px;
    background-color: rgb(250, 250, 252);
    display: flex;
    justify-content: space-between;
    overflow: auto;

    & > div {
        width: calc(50% - $gap / 2);
    }

    .game-info {
        margin-bottom: $gap;
    }

    .player-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .chat-area {
            height: calc(100% - 156px);
            display: flex;

            & > div {
                height: 100%;
            }

            .player-list {
                width: 280px;
                margin-left: $gap;

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
