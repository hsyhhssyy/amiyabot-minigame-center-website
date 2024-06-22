<template>
    <div class="game-base" v-if="!isGameHubLoading && gameRoomData" ref="gameBase">
        <div ref="gameSlot">
            <slot></slot>
        </div>
        <div class="player-panel">
            <game-info-card class="game-info" :room-data="gameRoomData">
                <template #buttons>
                    <icon-button :icon="Sport" type="warning" @click="endGame"
                        v-if="isHost && !isCompleted">放弃游戏</icon-button>
                    <icon-button :icon="Logout" type="error" @click="leaveRoom"
                        v-if="!isHost || isCompleted">退出房间</icon-button>
                </template>
            </game-info-card>
            <div class="chat-area">
                <chat-board :room-id="props.roomId" :players="props.players" :input-handler="props.inputHandler"
                    ref="chat" />
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
import { Logout, Sport } from '@icon-park/vue-next'
import type { SignalrResponse } from '@/api/signalr'
import { useGameHubStore } from '@/stores/gamehub'
import { useUserStore } from '@/stores/user'
import type { GameRoom } from '@/api/game'
import { getGame } from '@/api/game'
import type { ChatProps, Message } from '@/desktop/components/ChatBoard.vue'
import ChatBoard from '@/desktop/components/ChatBoard.vue'
import GameInfoCard from '@/universal/components/GameInfoCard.vue'
import IconButton from '@/universal/components/IconButton.vue'
import { removeData } from '@/utils'

interface GameProps extends ChatProps {

}

const emits = defineEmits<{
    (e: 'onLoaded', roomData: GameRoom, gameData: SignalrResponse): void
    // (e: 'onRoomData', data: GameRoom): void
    // (e: 'onGameClosed', response: SignalrResponse): void
    // (e: 'onGameCompleted', response: SignalrResponse): void
}>()

const props = defineProps<GameProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()
const user = useUserStore()

const gameSlot = ref()
const gameBase = ref()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const gameInfoData = ref<SignalrResponse>()

const isGameHubLoading = ref(true) //GameHub的连接
const isMounting = ref(true) //GameBase的OnMount
const isGameInfoReceiving = ref(true) // 第一次接收到GameInfo
const chat = ref()

const isCompleted = ref(false)
const isHost = computed(() => gameRoomData.value?.creatorId == user.userInfo?.id)

async function leaveRoom() {
    removeData('current-game-id')
    gameHub.invokeGameHub('LeaveGame', roomId)
    await router.push('/regular-home')
}

async function endGame() {
    gameHub.invokeGameHub('CompleteGame', roomId)
}

function gameInfoListener(response: SignalrResponse) {
    gameInfoData.value = response;
    if (isGameInfoReceiving.value == true) {
        isGameInfoReceiving.value = false
    }
}

function gameClosedListener(response: SignalrResponse) {
    // emits('onGameClosed', response)
}

function gameCompletedListener(response: SignalrResponse) {
    isCompleted.value = true
    // emits('onGameCompleted', response)
}

function pushMessage(msg: Message) {
    chat.value.pushMessage(msg)
}

defineExpose({ pushMessage })

let getGameInterval: any = null

watch(
    computed(() => gameHub.isConnected),
    (value: boolean) => {
        isGameHubLoading.value = !value

        if (value) {
            gameHub.addGameHubListener('GameCompleted', gameCompletedListener)
            gameHub.addGameHubListener('GameClosed', gameClosedListener)
            gameHub.addGameHubListener('GameInfo', gameInfoListener)
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

watch(
    chat,
    (newVal, oldValue) => {
        if (newVal && !oldValue) {
            onLoadedCheck()
        }
    }
)

watch(
    isGameHubLoading,
    (newVal, oldValue) => {
        if (!newVal && oldValue) {
            onLoadedCheck()
        }
    }
)

watch(
    isMounting,
    (newVal, oldValue) => {
        if (!newVal && oldValue) {
            onLoadedCheck()
        }
    }
)

watch(
    isGameInfoReceiving,
    (newVal, oldValue) => {
        if (!newVal && oldValue) {
            onLoadedCheck()
        }
    }
)

function onLoadedCheck() {
    adjustLayout()
    console.log("onLoadedCheck", !isGameHubLoading.value, !!chat.value, !isMounting.value, !isGameInfoReceiving.value)
    if (isGameHubLoading.value == false && chat.value && isMounting.value == false && isGameInfoReceiving.value == false) {
        emits('onLoaded', gameRoomData.value!, gameInfoData.value!)
    }
}

function adjustLayout() {
    if (!gameSlot.value || !gameBase.value) return;

    const gameSlotElement = gameSlot.value;
    const gameBaseElement = gameBase.value;

    const firstChild = gameSlotElement.firstElementChild as HTMLElement;

    let minWidth = 1000;

    if (firstChild) {
        minWidth = parseFloat(window.getComputedStyle(firstChild).minWidth);
        if (!minWidth || minWidth === 0) {
            minWidth = firstChild.offsetWidth;
            firstChild.style.minWidth = `${minWidth}px`;
        }
    }

    const actualWidth = gameBaseElement.clientWidth;

    if (actualWidth > minWidth * 2 + 100) {
        const gap = getComputedStyle(gameBaseElement).getPropertyValue('--gap').trim();
        gameSlotElement.style.width = `calc(50% - ${gap} / 2)`;
        console.log('set width by calc', gameSlotElement.style.width)
    } else {
        gameSlotElement.style.removeProperty('width')
        console.log('remove width')
    }
}

onMounted(async () => {
    window.addEventListener('resize', adjustLayout);
    adjustLayout()
    gameRoomData.value = await getGame(roomId)
    isCompleted.value = gameRoomData.value?.isCompleted || false
    // emits('onRoomData', gameRoomData.value as GameRoom)
    isMounting.value = false;
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    clearInterval(getGameInterval)
    isMounting.value = true;
    window.removeEventListener('resize', adjustLayout);
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

    --gap: #{$gap};

    .game-info {
        margin-bottom: $gap;
    }

    .player-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0;

        .chat-area {
            height: calc(100% - 156px);
            display: flex;

            &>div {
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
