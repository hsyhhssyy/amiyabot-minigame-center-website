<template>
    <game-base
        ref="base"
        :min-width="1630"
        :room-id="roomId"
        :input-handler="sendMove"
        :players="players"
        @on-loaded="load"
        @on-room-data="gameInfo"
        @on-game-completed="gameCompleted"
    >
        <n-card style="height: 100%">
            <div class="game-body">
                <n-card embedded :bordered="false" size="small" class="answer-list" :content-style="{ padding: 0 }">
                    <div class="answer-list-container" ref="asd">
                        <n-space vertical :size="10">
                            <n-button
                                class="skill-item"
                                size="medium"
                                tertiary
                                v-for="(item, index) in answersDisplay"
                                :type="item.PlayerId ? 'default' : 'error'"
                                :key="index"
                                @click="selectedSkill = item"
                            >
                                <div class="badge" v-if="item.PlayerId">
                                    <icon :icon="Check" />
                                    {{ playersMap[item.PlayerId].name }}
                                </div>
                                <span>{{ item.CharacterName }} - {{ item.SkillName }}</span>
                            </n-button>
                        </n-space>
                    </div>
                </n-card>
                <n-card embedded :bordered="false" size="small" style="width: fit-content">
                    <div class="char-grid">
                        <n-grid :x-gap="2" :y-gap="2" :cols="x" style="width: fit-content">
                            <n-grid-item v-for="(item, index) in expandedData" :key="index">
                                <n-button
                                    size="small"
                                    class="char"
                                    :class="[!item.recent && !item.fade ? 'active' : '', item.pos]"
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
                        <hit-effect ref="hit"></hit-effect>
                    </div>
                </n-card>
            </div>
            <div class="game-guide">
                <div class="amiya-face" :style="amiyaFaceStyle"></div>
                <n-card class="amiya-chat" embedded>{{ amiyaChat }}</n-card>
            </div>
        </n-card>
        <template v-slot:players>
            <template v-for="(items, name) in playersRanking" :key="name">
                <template v-if="items.length">
                    <div class="rank-title">{{ playersRankingNames[name] }}</div>
                    <div class="play-item" v-for="(item, index) in items" :key="index">
                        <template v-if="name != 'others'">
                            <n-avatar
                                size="large"
                                round
                                :src="item.avatar"
                                :img-props="{ referrerpolicy: 'no-referrer' }"
                            />
                            <div style="padding-left: 5px">
                                <div>{{ item.name }}</div>
                                <div class="score">得分: {{ item.score }}</div>
                            </div>
                        </template>
                        <template v-else>
                            <n-avatar round :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
                            <span style="padding-left: 5px">{{ item.name }}</span>
                        </template>
                    </div>
                </template>
            </template>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { listToDict } from '@/utils'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { Player } from '@/def/players'
import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import HitEffect from '@/desktop/components/effects/HitEffect.vue'
import GameBase from '@/desktop/views/GameBase.vue'
import Icon from '@/universal/components/Icon.vue'

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
    skill: string
    pos: string
}

interface Answer {
    PlayerId: string
    SkillName: string
    CharacterName: string
    GridPointList: { X: number; Y: number }[]
}

type RankNames = 'golden' | 'silver' | 'bronze' | 'others'

const playersRankingNames: { [key in RankNames]: string } = {
    golden: '🏅 金榜',
    silver: '🥈 银榜',
    bronze: '🥉 铜榜',
    others: '🍉 吃瓜群众'
}

const route = useRoute()
const gameHub = useGameHubStore()

const x = ref(2)
const y = ref(2)
const font_factor = ref(10)
const players = ref<GamePlayer[]>([])
const answerList = ref<Answer[]>([])
const remainingAnswerList = ref<Answer[]>([])
const expandedData = ref<ExpandedDataItem[]>([])
const selectedSkill = ref<Answer>()

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()
const asd = ref()

const amiyaFace = ref<HitType>('smile')
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

const answersDisplay = computed<Answer[]>(() => {
    return [...answerList.value, ...remainingAnswerList.value]
})

const playersMap = computed(() => {
    return listToDict<GamePlayer>(players.value, 'id')
})

const playersRanking = computed(() => {
    const playerList = players.value
    const sortedData = [...playerList]

    sortedData.sort((a, b) => b.score - a.score)

    const result: { [key in RankNames]: GamePlayer[] } = { golden: [], silver: [], bronze: [], others: [] }

    if (sortedData.length) {
        let goldScore = sortedData[0].score || -1 // 金榜分数线
        let silverScore = -1 // 银榜分数线

        for (const item of sortedData) {
            if (item.score && item.score < goldScore) {
                silverScore = item.score
                break
            }
        }

        for (const item of playerList) {
            if (item.score === goldScore) {
                result.golden.push(item)
            } else if (item.score === silverScore) {
                result.silver.push(item)
            } else if (item.score > 0) {
                result.bronze.push(item)
            } else {
                result.others.push(item)
            }
        }
    }
    return result
})

watch(
    computed(() => answersDisplay.value.length),
    () => {
        nextTick(() => (asd.value.scrollTop = asd.value.scrollHeight))
    },
    { deep: true }
)

function isSelected(item: ExpandedDataItem) {
    if (selectedSkill.value) {
        return selectedSkill.value?.GridPointList.map((n) => `${n.Y}-${n.X}`).indexOf(item.pos) >= 0
    }
    return false
}

function colors(item: ExpandedDataItem) {
    if (isSelected(item)) {
        return 'warning'
    }
    if (item.fade) {
        return 'tertiary'
    }
    if (item.recent) {
        return 'success'
    }
}

function sendMove(content: string) {
    gameHub.invokeGameHub(
        'SendMove',
        roomId,
        JSON.stringify({
            CharacterName: content
        })
    )
}

function gameInfo(data: GameRoom) {
    if (data.isClosed) {
        amiyaFace.value = 'wuwu'
        amiyaChat.value = '博士，游戏已经结束了……下次请早点来吧~'
    } else {
        timeRecordInterval = setInterval(chatting, 1000)
    }
}

function gameCompleted(response: SignalrResponse) {
    const answers = response.Payload.RemainingAnswers

    clearInterval(timeRecordInterval)

    amiyaFace.value = answers.length ? 'ye' : 'joy'
    amiyaChat.value =
        '游戏结束，' +
        (!answers.length
            ? '博士们真不愧是罗德岛的领导人，将所有干员全部猜出来了呢！最喜欢博士了！比心心~❤️'
            : '博士们还没有完成全部答案呢，作为罗德岛的领导人，要继续努力哦！')
}

function receiveMoveListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.Payload.PlayerId)
    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    let content = characterName

    const effects: { [key: string]: HitType } = {
        Correct: 'expectation',
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
                amiyaChat.value = `答案不正确……Dr.${player?.name}，再仔细看看吧~`
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

function gameInfoListener(response: SignalrResponse) {
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
                        skill: '',
                        pos: `${i}-${j}`
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

    answerList.value = response.Payload.AnswerList || []
    remainingAnswerList.value = response.Payload.RemainingAnswers || []

    // 检查一下答案
    for (const element of answerList.value) {
        for (let point of element.GridPointList) {
            const loc = point.Y * y.value + point.X
            const current = expandedData.value[loc]
            if (current.fade == false && current.recent == false) {
                current.fade = true
            }
            current.skill = element.SkillName
        }
    }
}

function load() {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
}

function chatting() {
    timeRecord += 1
    timeRecordChat += 1

    let face: HitType = 'doubt'
    let chat = ''

    /**
     * 骚话环节！这里的判断有点多，要在有人说话和有人回答之间做判断（有人说话不一定有人回答）
     */

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

onUnmounted(() => {
    clearInterval(timeRecordInterval)
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
})
</script>

<style lang="scss" scoped>
$guideHeight: 160px;

.game-body {
    height: calc(100% - $guideHeight);
    background: url(../../../assets/images/bg.ac9e0a.jpg) center / cover no-repeat;
    border-radius: 4px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .char-grid {
        width: 100%;
        height: 100%;
        position: relative;

        .char {
            width: 100%;
            height: 42px;
            font-size: 22px;
            font-weight: bold;

            &.active {
                color: black;
            }
        }
    }

    .answer-list {
        width: 240px;
        height: 100%;
        overflow: auto;
        margin-right: 20px;

        .answer-list-container {
            height: 100%;
            overflow: auto;
            padding: 20px;
        }

        .skill-item {
            width: 100%;
            position: relative;

            .badge {
                font-size: 12px;
                padding: 2px 5px;
                border-radius: 4px;
                color: #fff;
                background: #7b40f2;
                display: flex;
                position: absolute;
                top: -8px;
                left: -8px;
            }
        }
    }
}

.game-guide {
    height: $guideHeight;
    display: flex;
    align-items: flex-end;
    padding-bottom: 30px;

    .amiya-face {
        width: 120px;
        height: 100%;
        background: center bottom / 100% no-repeat;
        margin-right: 10px;
    }

    .amiya-chat {
        height: fit-content;
    }
}

.rank-title {
    font-size: 16px;
    margin: 15px 0 10px 0;

    &:first-child {
        margin-top: 0;
    }
}

.play-item {
    display: flex;
    align-items: center;
    margin-bottom: 3px;

    .score {
        color: #ff3d00;
        font-size: 12px;
    }
}
</style>
