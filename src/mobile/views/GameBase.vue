<template>
    <div class="game-base" v-if="!isGameHubLoading && gameRoomData">
        <slot></slot>
        <div class="player-panel">
            <chat-board
                :room-id="props.roomId"
                :players="props.players"
                :input-handler="props.inputHandler"
                @on-show-player-list="openPlayerList"
                ref="chat"
            />
            <game-info-card :class="{
                'game-info-android-edge': browserClass === 'android-edge',
                'game-info': browserClass !== 'android-edge',
            }" :room-data="gameRoomData">
                <template #buttons>
                    <icon-button :icon="Sport" type="warning" @click="endGame" v-if="isHost&&!isCompleted">放弃游戏</icon-button>
                    <icon-button :icon="Logout" type="error" @click="leaveRoom" v-if="!isHost||isCompleted">{{ isHost?'关闭':'退出'}}房间</icon-button>
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
import Bowser from "bowser";

interface GameProps extends ChatProps {}

const emits = defineEmits<{
    (e: 'onLoaded', roomData: GameRoom, gameData: SignalrResponse): void
}>()

const props = defineProps<GameProps>()

const route = useRoute()
const router = useRouter()
const gameHub = useGameHubStore()
const user = useUserStore()

const roomId: string = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

const gameRoomData = ref<GameRoom>()
const gameInfoData = ref<SignalrResponse>()

const isGameHubLoading = ref(true)
const isMounting = ref(true) //GameBase的OnMount
const isGameInfoReceiving = ref(true) // 第一次接收到GameInfo
const chat = ref()
const browserClass = ref("")

const isCompleted = ref(false)
const isHost = computed(() => gameRoomData.value?.creatorId == user.userInfo?.id)

const showPlayerList = ref(false)

async function endGame(){
    gameHub.invokeGameHub('CompleteGame', roomId)
}

function gameCompletedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) return //多标签页环境可能出现多个房间同开的情况
    isCompleted.value = true
}

async function gameClosedListener(response: SignalrResponse) {
    
}

function gameInfoListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) return //多标签页环境可能出现多个房间同开的情况
    
    gameInfoData.value = response;
    if (isGameInfoReceiving.value == true) {
        isGameInfoReceiving.value = false
    }
}

async function leaveRoom() {
    user.currentRoomId = null
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
    (newVal,oldValue) => {
        if(newVal && !oldValue){
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
    console.log("onLoadedCheck", !isGameHubLoading.value, !!chat.value, !isMounting.value, !isGameInfoReceiving.value)
    if (isGameHubLoading.value == false && chat.value && isMounting.value == false && isGameInfoReceiving.value == false) {
        emits('onLoaded', gameRoomData.value!, gameInfoData.value!)
    }
}

onMounted(async () => {
    gameRoomData.value = await getGame(roomId)
    isCompleted.value = gameRoomData.value?.isCompleted

    isMounting.value = false;

    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserInfo = browser.getBrowser();
    const platformInfo = browser.getPlatform();
    const osInfo = browser.getOS();
    
    if (
    browserInfo.name === "Microsoft Edge" &&
    platformInfo.type === "mobile" &&
    osInfo.name === "Android"
    ) {
        browserClass.value = "android-edge";
    }
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.removeGameHubListener('GameClosed', gameClosedListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)

    clearInterval(getGameInterval)
    isMounting.value = true;
})
</script>

<style lang="scss" scoped>
.game-base {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto; /* 允许垂直滚动 */

    .game-info {
        margin-bottom: 50px;
    }

    .game-info-android-edge {
        margin-bottom: 330px;
    }

    .player-panel {
        display: flex;
        flex-direction: column;
        min-height: 230px;

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
