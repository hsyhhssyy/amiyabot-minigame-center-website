<template>
    <div class="amiya-face" :style="amiyaFaceStyle"></div>
    <n-card class="amiya-chat" embedded>{{ amiyaChat }}</n-card>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

import { useGameHubStore } from '@/stores/gamehub'

import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import type { SignalrResponse } from '@/api/signalr'
import type { GamePlayer } from '@/def/players'

// 定义Emit onHit
const emits = defineEmits<{
    (e: 'onHit', face: HitType, text: string): void
}>()

const gameHub = useGameHubStore()

let timeRecord = 0
let timeRecordChat = 0
let timeRecordInterval: any = null

interface AmiyaFaceProps {
    players: GamePlayer[]
}

const props = defineProps<AmiyaFaceProps>()

const amiyaFace = ref<HitType>('smile')
const amiyaChat = ref(
    '博士们，欢迎参加本场比赛，我是你们的向导：兔兔！比赛已经开始啦，谜底是一位干员。请博士在聊天框里发送【干员名】猜测他是谁。如果您发送的干员和目标干员有相同的属性，这个属性会被标记为绿色并被揭示出来。'
)
const amiyaFaceStyle = computed<CSSProperties>(() => {
    return {
        backgroundImage: `url(/face/amiya/amiya_${amiyaFace.value}.webp)`
    }
})

function chatting() {
    timeRecord += 1
    timeRecordChat += 1

    let face: HitType = 'doubt'
    let chat = ''

    if (timeRecord >= 20) {
        if (timeRecordChat < timeRecord) {
            face = 'tea'
            chat = '博士们在讨论什么呢？有没有想好答案了呀~'
        } else {
            face = 'emmm'
            chat = '博士们在思考吗？怎么没有博士说话了呢？'
        }
    }
    if (timeRecord >= 60) {
        face = 'nervous'
        chat = '博士，实在不行，先随便猜一个试试吧……'
    }

    if (chat) {
        amiyaFace.value = face
        amiyaChat.value = chat
    }
}

function gameCompletedListener(response: SignalrResponse) {
    clearInterval(timeRecordInterval)

    amiyaFace.value = 'joy'
    amiyaChat.value = '游戏结束。'
}

function gameInfoListener(response: SignalrResponse) {
    if (timeRecordInterval === null) {
        if (response.Game) {
            if (response.Game.IsCompleted) {
                amiyaFace.value = 'wuwu'
                amiyaChat.value = '博士，游戏已经结束了……下次请早点来吧~'
            } else {
                timeRecordInterval = setInterval(chatting, 1000)
            }
        }
    }
}

function receiveMoveListener(response: SignalrResponse) {
    const player = props.players.find((p) => p.id === response.Payload.PlayerId)

    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    const effects: { [key: string]: HitType } = {
        Correct: 'expectation',
        Answered: 'sweat',
        Wrong: 'refuse'
    }

    timeRecordChat = 0
    if (result in effects) {
        const face = effects[result]

        timeRecord = 0
        amiyaFace.value = face
        switch (result) {
            case 'Correct':
                amiyaChat.value =
                    `正确！是干员【${characterName}】` +
                    `Dr.${player?.name} 加 200 分！太棒啦！`
                break
            case 'Answered':
                amiyaChat.value = `Dr.${player?.name}，干员【${characterName}】已经猜过啦！`
                break
            case 'Wrong':
                amiyaChat.value = `答案不正确……Dr.${player?.name}，再仔细看看吧~`
                break
        }

        emits('onHit', face, amiyaChat.value)
    }
}

onMounted(() => {
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)

    clearInterval(timeRecordInterval)
})
</script>

<style scoped lang="scss">
.amiya-face {
    width: 120px;
    height: 100%;
    background: center bottom / 100% no-repeat;
    margin-right: 10px;
}

.amiya-chat {
    height: fit-content;
}
</style>
