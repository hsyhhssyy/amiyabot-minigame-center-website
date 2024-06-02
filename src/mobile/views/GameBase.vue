<template>
    <div class="game-base" v-if="!isGameHubLoading && gameRoomData">
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
                    <icon-button :icon="Sport" type="warning" @click="endGame" v-if="isHost&&!isCompleted">放弃游戏</icon-button>
                    <icon-button :icon="Logout" type="error" @click="leaveRoom" v-if="!isHost||isCompleted">退出房间</icon-button>
                </template>
            </game-info-card>
        </div>
    </div>       
    <n-modal class="player-list-modal" v-model:show="showPlayerList" title="排行榜" preset="dialog">
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
import { Logout,Sport } from '@icon-park/vue-next'
import type { SignalrResponse } from '@/api/signalr'
import { useGameHubStore } from '@/stores/gamehub'
import { useUserStore } from '@/stores/user'
import type { GameRoom } from '@/api/game'
import { getGame } from '@/api/game'
import type { ChatProps, Message } from '@/mobile/components/ChatBoard.vue'
import ChatBoard from '@/mobile/components/ChatBoard.vue'
import GameInfoCard from '@/universal/components/GameInfoCard.vue'
import IconButton from '@/universal/components/IconButton.vue'
import { removeData } from '@/utils'

interface GameProps extends ChatProps {}

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
const user = useUserStore()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const isGameHubLoading = ref(true)
const isMounted = ref(false)
const chat = ref()

const isCompleted = ref(false)
const isHost = computed(() => gameRoomData.value?.creatorId == user.userInfo?.id)

const showPlayerList = ref(false)

async function endGame(){
    gameHub.invokeGameHub('CompleteGame', roomId)
}

function gameCompletedListener(response: SignalrResponse) {
    isCompleted.value = true
    emits('onGameCompleted', response)
}

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
        isGameHubLoading.value = !value

        if (value) {
            onLoadedCheck()

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

watch(
    chat,
    (newVal,oldValue) => {
        if(newVal && !oldValue){
            onLoadedCheck()
        }
    }
)

function onLoadedCheck(){
    console.log(isGameHubLoading.value, chat.value, isMounted.value)
    if(isGameHubLoading.value==false && chat.value && isMounted.value==true){
        emits('onLoaded')
    }
}

onMounted(async () => {
    isMounted.value = true
    onLoadedCheck()

    gameRoomData.value = await getGame(roomId)
    isCompleted.value = gameRoomData.value?.isCompleted
    emits('onRoomData', gameRoomData.value as GameRoom)

})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
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
