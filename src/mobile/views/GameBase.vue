<template>
    <div class="game-base" v-if="!isLoading && gameRoomData">
        <div>
            <slot></slot>
        </div>
        <div class="player-panel">
            <chat-board
                :room-id="props.roomId"
                :players="props.players"
                :input-handler="props.inputHandler"
                @on-show-player-list="openPlayerList"
                ref="chat"
            />
            <game-info-card class="game-info" :room-data="gameRoomData">
                <template #buttons>
                    <icon-button :icon="Logout" type="error" @click="leaveRoom">退出房间</icon-button>
                </template>
            </game-info-card>
        </div>
    </div>       
    <n-modal class="player-list-modal" v-model:show="showPlayerList">
        <n-card title="玩家列表" size="small" class="player-list" embedded>
            <slot name="players">
                <div class="play-item" v-for="(item, index) in players" :key="index">
                    <n-avatar round :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
                    <span style="padding-left: 5px">{{ item.name }}</span>
                </div>
            </slot>
        </n-card>
    </n-modal>
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
import ChatBoard from '@/mobile/components/ChatBoard.vue'
import GameInfoCard from '@/universal/components/GameInfoCard.vue'
import IconButton from '@/universal/components/IconButton.vue'
import { removeData } from '@/utils'

interface GameProps extends ChatProps {}

const emits = defineEmits<{
    (e: 'onLoaded'): void;
    (e: 'onGameClosed', response: SignalrResponse): void;
}>()

const props = defineProps<GameProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const isLoading = ref(true)
const chat = ref()
const debugDisplay = ref('1111')
const showPlayerList = ref(false)

// if ("virtualKeyboard" in navigator) {
//   debugDisplay.value = "virtualKeyboard is supported";
//   (navigator as any).virtualKeyboard.overlaysContent = true;

//   (navigator as any).virtualKeyboard.addEventListener("geometrychange", (event:any) => {
//     const { x, y, width, height } = event.target.boundingRect;
//     debugDisplay.value = `x: ${x}, y: ${y}, width: ${width}, height: ${height}`;
//   });
// }


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

function openPlayerList() {
    showPlayerList.value = true
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

const handleResize = () => {
    debugDisplay.value = `innerWidth: ${window.innerWidth}, innerHeight: ${window.innerHeight}`
}

onMounted(async () => {
    gameRoomData.value = await getGame(roomId)
    
    window.addEventListener('resize', handleResize)
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
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    & > div {
        width: calc(100% - 5px);
    }

    .game-info {
        margin-bottom: 10px;
    }

    .player-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .chat-area {
            display: flex;
        }
        
        .player-list {
            width: 280px;

            .play-item {
                display: flex;
                align-items: center;
                margin-bottom: 3px;
            }
        }
    }

}

.player-list-modal {
    width: 80vw;
    height: 80vh;
}
</style>
