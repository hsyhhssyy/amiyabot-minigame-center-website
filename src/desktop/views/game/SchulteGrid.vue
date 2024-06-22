<template>
    <game-base ref="base" :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load">
        <n-card style="height: 100%">
            <n-spin :show="expandedData?.length<100">
                <template #description>
                    正在加载题目，请稍候
                </template>
            <div class="game-body">
                <n-card embedded :bordered="false" size="small" class="answer-list" :content-style="{ padding: 0 }">
                    <div class="answer-list-container" ref="asd">
                        <n-button class="skill-item" tertiary v-for="(item, index) in answersDisplay" 
                            :type="item.PlayerId ? 'default' : 'error'" :key="index" @click="selectedSkill = item">
                            <div class="button-content">
                                <div class="badge" :class="{ leaved: !playersMap[item.PlayerId] }"
                                    v-if="item.PlayerId">
                                    <template v-if="playersMap[item.PlayerId]">
                                        <icon :icon="Check" />
                                        {{ playersMap[item.PlayerId].name }}
                                    </template>
                                    <template v-else>
                                        <icon :icon="Close" />
                                        已离开
                                    </template>
                                </div>
                                <div class="badge system" 
                                v-if="!item.PlayerId"
                                >兔兔的提示</div>
                                <div class="one-line">
                                    <n-avatar :src="getOperatorUrl(item.CharacterId)" size="small"
                                        :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                                    <div class="ellipsis-text">
                                        <div class="text">{{ item.CharacterName }}</div>
                                        <div class="text">{{ item.SkillName }}</div>
                                    </div>
                                    <n-avatar :src="getSkillUrl(item.SkillId)" size="small"
                                        :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                                </div>

                            </div>
                        </n-button>
                    </div>
                </n-card>
                <n-card embedded :bordered="false" size="small" style="width: fit-content; margin-right: 20px;">
                    <div class="char-grid">
                        <n-grid :x-gap="2" :y-gap="2" :cols="x" style="width: fit-content">
                            <n-grid-item v-for="(item, index) in expandedData" :key="index">
                                <n-button size="small" class="char"
                                    :class="[!item.recent && !item.fade ? 'active' : '', item.pos]" :dashed="item.fade"
                                    :strong="!item.fade" :disabled="item.fade" :secondary="item.recent"
                                    :type="colors(item)">
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
            </n-spin>
        </n-card>
        <template v-slot:players>
            <player-ranking></player-ranking>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Close } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { listToDict } from '@/utils'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { Player } from '@/def/players'
import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import HitEffect from '@/desktop/components/effects/HitEffect.vue'
import GameBase from '@/desktop/views/GameBase.vue'
import Icon from '@/universal/components/Icon.vue'
import PlayerRanking from '@/desktop/components/PlayerRanking.vue'
import { getOperatorUrl, getSkillUrl } from '@/arknights'

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
    SkillId: string
    CharacterName: string
    CharacterId: string
    GridPointList: { X: number; Y: number }[]
    AnswerTime: string
}

const route = useRoute()
const gameHub = useGameHubStore()

const x = ref(10)
const y = ref(10)
//const font_factor = ref(10)
const players = ref<GamePlayer[]>([])
const answerList = ref<Answer[]>([])
const remainingAnswerList = ref<Answer[]>([])
const expandedData = ref<ExpandedDataItem[]>([])
//填充100个问号

const isCompleted = ref(false)

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

watch(
    computed(() => answersDisplay.value.length),
    () => {
        nextTick(() => {
            if (asd.value) {
                asd.value.scrollTop = asd.value.scrollHeight
            }
        })
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
    if (isCompleted.value == true) {
        gameHub.invokeGameHub(
            'Chat',
            roomId,
            content
        )
    } else {
        gameHub.invokeGameHub(
            'SendMove',
            roomId,
            JSON.stringify({
                CharacterName: content
            })
        )
    }
}

function gameCompletedListener(response: SignalrResponse) {
    isCompleted.value = true
    const answers = response.Payload.RemainingAnswers

    remainingAnswerList.value = answers

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

    isCompleted.value = response.Game.IsCompleted

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

            //font_factor.value = 6 / Math.max(x.value, y.value)

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

    response.Payload.AnswerList.sort(
        (a: Answer, b: Answer) => new Date(a.AnswerTime).getTime() - new Date(b.AnswerTime).getTime()
    )

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

function load(roomData: GameRoom, gameData: SignalrResponse) {

    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener);

    gameInfoListener(gameData)

    if (roomData.isClosed) {
        amiyaFace.value = 'wuwu'
        amiyaChat.value = '博士，游戏已经结束了……下次请早点来吧~'
    } else {
        timeRecordInterval = setInterval(chatting, 1000)
    }
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
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
})
</script>

<style lang="scss" scoped>
$guideHeight: 160px;

.game-body {
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
        width: 180px;
        height: 462px;
        overflow: auto;
        margin-right: 20px;
        margin-left: 20px;

        .answer-list-container {
            height: 100%;
            overflow: auto;
            padding: 5px;
            padding-top: 10px;
            overflow-y: scroll;
        }

        .skill-item {
            width: 100%;
            position: relative;
            padding: 5px;
            justify-content: start;
            height: 50px;

            .button-content{                
                width: 100%;
            }
            
            .badge {
                font-size: 12px;
                padding: 2px 5px;
                border-radius: 4px;
                color: #fff;
                background: #7b40f2;
                display: flex;
                position: absolute;
                top: -8px;
                left: 0px;

                &.leaved {
                    background-color: #e91e63;
                }

                &.system {
                    background-color: gray;
                }
            }

            .one-line {
                display: flex;
                flex-direction: row;
                width: 100%;

                .ellipsis-text {
                    flex-grow: 1;
                    flex-shrink: 1;
                    flex-basis: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;

                    .text {
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-align: center;
                        font-size: 14px;
                        line-height: 14px;
                        height: 14px;
                    }
                }
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

<style lang="scss">

.skill-item .n-button__content{
    width: 100%;
}

.answer-list-container{
    scrollbar-width: unset !important;
}

</style>