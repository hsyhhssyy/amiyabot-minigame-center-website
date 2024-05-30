<template>
    <game-base :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load" ref="base">
        <div style="height: 100%; ">
            <div class="game-body">
                <n-card embedded :bordered="false" style="width: fit-content">
                    <n-grid :x-gap="2" :y-gap="2" :cols="x" style="width: fit-content">
                        <n-grid-item v-for="(item, index) in expandedData" :key="index">
                            <n-button
                                size="small"
                                class="char"
                                :class="{ active: !item.recent && !item.fade }"
                                :dashed="item.fade"
                                :strong="!item.fade"
                                :disabled="item.fade"
                                :secondary="item.recent"
                                :type="colors(item)"
                            >
                                {{ item.char }}
                            </n-button>
                        </n-grid-item>
                    </n-grid>
                </n-card>
                <hit-effect ref="hit"></hit-effect>
            </div>
            <div class="game-guide">
                <div class="amiya-face" :style="amiyaFaceStyle"></div>
                <n-card class="amiya-chat" embedded content-style="padding: 0;">{{ amiyaChat }}</n-card>
            </div>
        </div>
    </game-base>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { onUnmounted, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import type { SignalrResponse } from '@/api/signalr'
import type { Player } from '@/def/players'
import GameBase from '@/mobile/views/GameBase.vue'
import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import HitEffect from '@/desktop/components/effects/HitEffect.vue'

interface GamePlayer extends Player {
    score: number
}

interface Message {
    userId: string
    nickname: string
    content: string
    avatar: string
    style?: string
}

interface ExpandedDataItem {
    char: string
    fade: boolean
    recent: boolean
    placeholder: boolean
}

const route = useRoute()
const gameHub = useGameHubStore()

const x = ref(2)
const y = ref(2)
const font_factor = ref(10)
const players = ref<GamePlayer[]>([])
const expandedData = ref<ExpandedDataItem[]>([])

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()

const amiyaFace = ref('smile')
const amiyaChat = ref(
    '博士们，欢迎参加本场比赛，我是你们的向导：兔兔！比赛已经开始啦，请博士在上面的表中找到干员的【技能名】，然后在聊天框里发送【干员名】进行竞猜。'
)
const amiyaFaceStyle = computed<CSSProperties>(() => {
    return {
        backgroundImage: `url(/face/amiya/amiya_${amiyaFace.value}.webp)`
    }
})

let timeRecord = 0
let timeRecordChat = 0
let timeRecordInterval: any = null

function colors(item: ExpandedDataItem) {
    if (item.fade) {
        return 'tertiary'
    }
    if (item.recent) {
        return 'success'
    }
}

async function sendMove(content: string) {
    gameHub.invokeGameHub(
        'SendMove',
        roomId,
        JSON.stringify({
            CharacterName: content
        })
    )
}

function receiveMoveListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.Payload.PlayerId)
    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    let content = characterName

    const effects: { [key: string]: HitType } = {
        Correct: 'joy',
        Answered: 'sweat',
        Wrong: 'refuse'
    }
    if (result in effects) {
        const face = effects[result]

        timeRecord = 0
        amiyaFace.value = face
        switch (result) {
            case 'Correct':
                const dataArray = [...expandedData.value]
                const skills = []

                for (let i = 0; i < dataArray.length; i++) {
                    if (dataArray[i].recent) {
                        dataArray[i].fade = true
                        dataArray[i].recent = false
                    }
                }

                for (const answer of response.Payload.Answer) {
                    for (let point of answer.GridPointList) {
                        const loc = point.Y * y.value + point.X
                        dataArray[loc].recent = true
                        dataArray[loc].fade = false
                    }
                    skills.push(answer.SkillName)
                }

                expandedData.value = dataArray

                amiyaChat.value =
                    `正确！是干员【${characterName}】的技能【${skills.join('】【')}】！` +
                    `Dr.${player?.name} 加 200 分！太棒啦！`
                break
            case 'Answered':
                amiyaChat.value = `Dr.${player?.name}，干员【${characterName}】已经猜过啦！`
                break
            case 'Wrong':
                amiyaChat.value = `答案不正确，再仔细看看吧，Dr.${player?.name}~`
                break
        }

        hit.value.hit(face)
    }
    timeRecordChat = 0

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: content,
        style: result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/avatar.webp'
    } as Message)
}

async function gameInfoListener(response: SignalrResponse) {
    if (expandedData.value.length == 0) {
        const grid = response.Payload.Grid
        if (grid.length > 0) {
            expandedData.value = []
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    expandedData.value.push({
                        char: grid[i][j],
                        fade: false,
                        recent: false,
                        placeholder: grid[i][j] === '❤'
                    })
                }
            }

            font_factor.value = 6 / Math.max(x.value, y.value)

            y.value = grid.length
            x.value = grid[0] ? grid[0].length : 0 // 默认data的每个子数组长度是相同的
        }
    }

    players.value = response.PlayerList.map((p: any) => {
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: p.UserAvatar ? p.UserAvatar : '/avatar.webp',
            score: p.Score
        }
    })

    // 检查一下答案
    for (const element of response.Payload.AnswerList) {
        for (let point of element.GridPointList) {
            const loc = point.Y * y.value + point.X
            const current = expandedData.value[loc]
            if (current.fade == false && current.recent == false) {
                current.fade = true
            }
        }
    }
}

function load() {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
}

onMounted(() => {
    timeRecordInterval = setInterval(() => {
        timeRecord += 1
        timeRecordChat += 1

        let face = ''
        let chat = ''

        /**
         * 骚话环节！这里的判断有点多，要在有人说话和有人回答之间做判断（有人说话不一定有人回答）
         */

        if (timeRecord >= 3) {
            if (timeRecordChat < timeRecord) {
                face = 'tea'
                chat = '博士们在讨论什么呢？有没有想好答案了呀~'
            } else {
                face = 'emmm'
                chat = '博士们在思考吗？怎么没有博士说话了呢？'
            }
        }
        if (timeRecord >= 6) {
            face = 'nervous'
            chat = '博士们，欢迎参加本场比赛，我是你们的向导：兔兔！比赛已经开始啦，请博士在上面的表中找到干员的【技能名】，然后在聊天框里发送【干员名】进行竞猜。'
        }

        if (face && chat) {
            amiyaFace.value = face
            amiyaChat.value = chat
        }
    }, 1000)
})

onUnmounted(() => {
    clearInterval(timeRecordInterval)
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
})
</script>

<style lang="scss" scoped>
$guideHeight: 60px;

.game-body {
    height: calc(100% - $guideHeight);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .char {
        width: calc( 10vw - 5px);
        height: calc( 10vw - 5px);
        font-size: 20px;
        font-weight: bold;
        padding: 0;

        &.active {
            color: black;
        }
    }
}

.game-guide {
    height: $guideHeight;
    display: flex;
    align-items: flex-end;
    padding-left: 10px;

    .amiya-face {
        width: 60px;
        height: 100%;
        background: center bottom / 100% no-repeat;
        margin-right: 10px;
    }

    .amiya-chat {
        height: fit-content;
        padding: 0px;
    }
    
    .amiya-chat-content{
        padding: 0px;
    }
}
</style>
