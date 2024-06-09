<template>
    <game-base ref="base" :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load">
        <div style="height: 100%" class="game-card">
            <n-modal v-model:show="nextQuestionShown" :mask-closable="false">
                <div class="overlay-card">
                    <n-flex justify="center">
                        <div class="correct-answer">
                            正确答案：{{ currentQuestion?.CharacterName }}
                        </div>
                    </n-flex>
                    <result-table :currentQuestion="currentQuestion" :playersMap="playersMap" :headers="headers"
                        :showAnswer="true"></result-table>
                    <n-flex justify="center" style="margin-top: 20px;" align="center" v-if="hasNextQuestion">
                        <div>
                            <n-badge color="green" v-for="player in players" style="margin-right: 5px;">
                                <template #value>
                                    <icon :icon="Check" v-if="playersReadyList.includes(player.id)" />
                                </template>
                                <n-avatar :src="player.avatar" size="small"
                                    :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                            </n-badge>
                        </div>
                        <icon-button :icon="SendOne" type="success" @click="nextQuestionButton">下一题</icon-button>
                        <div class="countdown">
                            <n-countdown :duration="10000" :active="countDownActive" :render="renderCountdown" ref="countdown"
                                @finish="onCountdownFinish"></n-countdown>
                        </div>

                    </n-flex>
                    <n-flex justify="center" style="margin-top: 20px;" align="center" v-if="!hasNextQuestion">
                        <div class="countdown">
                            游戏已结束
                        </div>
                    </n-flex>
                </div>
            </n-modal>
            <div>
                <div class="game-panel">
                    <hit-effect ref="hit"></hit-effect>
                    <div class="game-body">
                        <div :bordered="false" size="small" class="answer-list">
                            <!-- <icon-button :icon="SendOne" type="success" @click="test">test</icon-button> -->
                            <div class="property-revealed">
                                <div v-for="header in headers" class="property-header">
                                    <div class="property-value">
                                        {{ header + ":" }} {{ currentQuestion.CharacterProperties[header] || '???' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <result-table :currentQuestion="currentQuestion" :playersMap="playersMap" :headers="headers"
                            :showAnswer="false"></result-table>

                    </div>
                </div>
            </div>
        </div>
        <template v-slot:players>
            <template v-for="(items, name) in playersRanking" :key="name">
                <template v-if="items.length">
                    <div class="rank-title">{{ playersRankingNames[name] }}</div>
                    <div class="play-item" v-for="(item, index) in items" :key="index">
                        <template v-if="name != 'others'">
                            <n-avatar size="large" round :src="item.avatar"
                                :img-props="{ referrerpolicy: 'no-referrer' }" />
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
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Check, SendOne } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { listToDict } from '@/utils'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { Player } from '@/def/players'
import type { HitType } from '@/mobile/components/effects/HitEffect.vue'
import HitEffect from '@/mobile/components/effects/HitEffect.vue'
import GameBase from '@/mobile/views/GameBase.vue'
import Icon from '@/universal/components/Icon.vue'
import ResultTable from '@/mobile/components/cypherChallenge/ResultTable.vue'
import IconButton from '@/universal/components/IconButton.vue'

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

interface Answer {
    CharacterName: string;
    CharacterId: string;
    CharacterPropertiesResult: { [key: string]: string };
    AnswerTime: Date;
    PlayerId?: string;
    IsAnswerCorrect: boolean;
}

interface Question {
    GuessChanceLeft: number;
    CharacterName: string;
    CharacterId: string;
    IsHinted: boolean;
    IsCompleted: boolean;
    CharacterProperties: { [key: string]: string };
    CharacterPropertiesRevealed: { [key: string]: boolean };
    CharacterPropertiesUsed: { [key: string]: boolean };
    AnswerList: Answer[];
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

const players = ref<GamePlayer[]>([])
const playersReadyList = ref<string[]>([])
const currentQuestionIndex = ref<number | null>(null)
const currentQuestion = computed<Question>(() => {
    if (game?.value?.QuestionList == null) {
        return null
    }
    if (currentQuestionIndex.value === null) {
        return game.value.QuestionList[0]
    }
    return game.value.QuestionList[currentQuestionIndex.value]
})
const game = ref<any>()

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()
const countdown = ref()
const renderCountdown = ({ seconds }: { seconds: number }) => {
    return `${seconds}秒`;
};
const countDownActive = ref(false)
const nextQuestionShown = ref(false)
const hasNextQuestion = computed(() => {
    if (game?.value?.IsCompleted) {
        return false
    }

    if (currentQuestionIndex.value === 9) {
        return false
    }

    return true
})

const amiyaFace = ref<HitType>('smile')
const amiyaChat = ref(
    '博士们，欢迎参加本场比赛，我是你们的向导：兔兔！比赛已经开始啦，谜底是一位干员。请博士在聊天框里发送【干员名】猜测他是谁。如果您发送的干员和目标干员有相同的属性，这个属性会被标记为绿色并被揭示出来。'
)
const amiyaFaceStyle = computed<CSSProperties>(() => {
    return {
        backgroundImage: `url(/face/amiya/amiya_${amiyaFace.value}.webp)`
    }
})

let timeRecord = 0
let timeRecordChat = 0
let timeRecordInterval: any = null

const headers = computed(() => {
    if (!currentQuestion.value) {
        return []
    }

    const entries = Object.entries(currentQuestion.value.CharacterPropertiesUsed);

    const headersValue = entries.filter(
        ([, value]) => {
            return value == true
        }
    ).map(
        ([key]) => {
            if (currentQuestion.value?.CharacterPropertiesRevealed[key] //属性已被揭示
                || game.value.CurrentQuestionIndex !== currentQuestionIndex.value //不是当前问题
                || !hasNextQuestion.value //游戏已结束
            ) {
                return key
            } else {
                return '未知线索'
            }
        }
    )

    return headersValue
}
)
const currentCharacter = computed(() => {
    if (!currentQuestion.value) {
        return ''
    }

    if (currentQuestion.value.CharacterName != "") {
        return currentQuestion.value.CharacterName
    }

    return "---"
})

const playersMap = computed(() => {
    var playersMapVal = listToDict<GamePlayer>(players.value, 'id')
    return playersMapVal
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

function onCountdownFinish() {
    //console.log('CountDown结束，强制跳转下一题')
    if(countDownActive.value == true){
        moveToNextQuestion()
    }
}

function getRallyPointData() {
    return "PrepareNextQuestion:" + currentQuestionIndex.value;
}

function prepareNextQuestion() {
    nextQuestionShown.value = true
    countdown.value?.reset()
    countDownActive.value=true

    if (hasNextQuestion.value) {
        gameHub.invokeGameHub('RallyPointCreate', roomId, JSON.stringify({ Name: getRallyPointData() }))
        gameHub.invokeGameHub('RallyPointStatus', roomId, JSON.stringify({ Name: getRallyPointData() }))
    }
}

function nextQuestionButton() {
    gameHub.invokeGameHub('RallyPointReached', roomId, JSON.stringify({ Name: getRallyPointData() }));
    gameHub.invokeGameHub('RallyPointStatus', roomId, JSON.stringify({ Name: getRallyPointData() }))
}

function moveToNextQuestion() {
    playersReadyList.value = []
    nextQuestionShown.value = false
    countDownActive.value = false

    if (game.value.QuestionList.length > game.value.CurrentQuestionIndex) {
        currentQuestionIndex.value = game.value.CurrentQuestionIndex
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

function receiveMoveListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.Payload.PlayerId)

    if (response.Payload.Game) {
        game.value = response.Payload.Game
    }

    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    let content = characterName

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

        hit.value.hit(face)
    }

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: content,
        style: result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/avatar.webp'
    } as Message)

    if (result === 'Correct') {
        prepareNextQuestion()
    } else {
        if (game.value.CurrentQuestionIndex != currentQuestionIndex.value) {
            prepareNextQuestion()
        }
    }
}

function gameInfoListener(response: SignalrResponse) {
    if (response.Payload.Game) {
        game.value = response.Payload.Game
    }

    players.value = response.PlayerList.map((p: any) => {
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: p.UserAvatar ? p.UserAvatar : '/avatar.webp',
            score: p.Score
        }
    })
}

function rallyPointStatusListener(response: SignalrResponse) {
    console.log('rally st', response)
    if (response.Name == getRallyPointData()) {
        for (let i = 0; i < players.value.length; i++) {
            if (response.Players.includes(players.value[i].id)) {
                if (!playersReadyList.value.includes(players.value[i].id)) {
                    playersReadyList.value.push(players.value[i].id)
                }
            }
        }
    }
}

function rallyPointReachedListener(response: SignalrResponse) {
    moveToNextQuestion()
}

function gameCompletedListener(response: SignalrResponse) {
    clearInterval(timeRecordInterval)

    amiyaFace.value = 'joy'
    amiyaChat.value =
        '游戏结束。'

    game.value = response.Payload.Game

    prepareNextQuestion()
}

function load(roomData: GameRoom, gameData: SignalrResponse) {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('RallyPointStatus', rallyPointStatusListener)
    gameHub.addGameHubListener('RallyPointReached', rallyPointReachedListener)
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener)

    gameInfoListener(gameData)
    currentQuestionIndex.value = game.value.CurrentQuestionIndex

    if (roomData.isClosed || roomData.isCompleted) {
        amiyaFace.value = 'wuwu'
        amiyaChat.value = '博士，游戏已经结束了……下次请早点来吧~'

        prepareNextQuestion()
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
    gameHub.removeGameHubListener('RallyPointStatus', rallyPointStatusListener)
    gameHub.removeGameHubListener('RallyPointReached', rallyPointReachedListener)
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)

})

function test() {
    console.log('current index:', currentQuestionIndex.value)
    currentQuestionIndex.value = (currentQuestionIndex.value ?? 0) - 1
    console.log('current index:', currentQuestionIndex.value)
    prepareNextQuestion()
}

</script>

<style lang="scss" scoped>
$guideHeight: 160px;

.game-card {
    position: relative;
    overflow: hidden;

    .game-panel {
        height: calc(100% - $guideHeight);
        background: url(@/assets/images/cypherChallenge/loading.jpg) center / cover no-repeat;
        border-radius: 4px;
        padding: 5px 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;

        .game-body {
            display: flex;
            flex-direction: column;
            width: 100%;
            flex-grow: 1;
            flex-shrink: 1;

            .answer-list {
                background: rgba(0, 0, 0, 0);
                display: flex;
                flex-direction: row;

                .game-title {
                    width: 30%;
                    aspect-ratio: 10/4;
                    background: url(@/assets/images/cypherChallenge/title_content.png) center / contain no-repeat;
                }

                .property-revealed {
                    width: 100%;
                    overflow: auto;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);

                    .property-header {
                        margin-left: -10px;
                        aspect-ratio: 36/10;

                        background: url(@/assets/images/cypherChallenge/advanced_tag_bg_1.png) center / contain no-repeat;

                        .property-value {
                            padding-left: 10px;
                            text-align: center;
                            font-size: 16px;
                            color: black;
                        }
                    }
                }
            }

            .answer-table {
                font-size: 12px;

                .player-shown {
                    display: flex;
                    align-items: center;
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
}

.overlay-card {
    border-radius: 5px;
    border: 5px solid wheat;
    background: url(@/assets/images/cypherChallenge/loading.jpg) center / cover no-repeat;

    .correct-answer {
        font-size: 24px;
        color: bisque;
        text-shadow:
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000;
        /* 描边颜色和方向 */
    }

    .countdown {
        font-size: 20px;
        color: bisque;
        text-shadow:
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000;
        /* 描边颜色和方向 */
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
