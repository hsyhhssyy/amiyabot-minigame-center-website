<template>
    <game-base ref="base" :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load">
        <div style="height: 100%" class="game-card">
            <n-modal v-model:show="settlementDialogShown" :mask-closable="false">
                <div class="overlay-card">
                    <n-flex justify="center">
                        <div class="correct-answer">
                            正确答案：{{ lastQuestion?.CharacterName }}
                        </div>
                    </n-flex>
                    <result-table :currentQuestion="lastQuestion" :playersMap="playersMap" :headers="headers"
                        :showAnswer="true"></result-table>
                    <next-question :room-id="roomId" :active="settlementCountdownActive"
                        @on-next-question="moveToNextQuestion" :show-close="true"
                        @on-close-result-popup="closeResultPopup" :game="game" :players="players"></next-question>

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
            <div style="height: 0;">
                <amiya-face @on-hit="onFaceHit" :v-show="false"></amiya-face>
            </div>
        </div>
        <template v-slot:players>
            <player-ranking></player-ranking>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import { listToDict } from '@/utils'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { GamePlayer, Player } from '@/def/players'
import type { HitType } from '@/mobile/components/effects/HitEffect.vue'
import HitEffect from '@/mobile/components/effects/HitEffect.vue'
import GameBase from '@/mobile/views/GameBase.vue'
import ResultTable from '@/mobile/components/cypherChallenge/ResultTable.vue'
import NextQuestion from '@/universal/components/NextQuestion.vue'
import type { Question } from '@/def/cypher-challenge'
import type { Message } from '@/def/signalr-common'
import PlayerRanking from '@/desktop/components/PlayerRanking.vue'
import AmiyaFace from '@/desktop/components/AmiyaFace.vue'

const route = useRoute()
const gameHub = useGameHubStore()

const players = ref<GamePlayer[]>([])
const currentQuestionIndex = computed<number>(() => {
    if (game?.value?.CurrentQuestionIndex == null) {
        return null
    }
    return game.value.CurrentQuestionIndex
})
const currentQuestion = computed<Question>(() => {
    if (game?.value?.QuestionList == null) {
        return null
    }
    if (currentQuestionIndex.value === null) {
        return game.value.QuestionList[0]
    }
    if (currentQuestionIndex.value >= game.value.QuestionList.length) {
        return game.value.QuestionList[game.value.QuestionList.length - 1]
    }
    return game.value.QuestionList[currentQuestionIndex.value]
})
const lastQuestion = computed<Question>(() => {
    if (game?.value?.QuestionList == null) {
        return null
    }
    if (currentQuestionIndex.value === null) {
        return game.value.QuestionList[0]
    }

    if (game.value.IsCompleted || game.value.IsClosed) {
        return game.value.QuestionList[currentQuestionIndex.value]
    }
    return game.value.QuestionList[currentQuestionIndex.value - 1]
})
const game = ref<any>()

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()
const countdown = ref()

const settlementDialogShown = ref(false)
const settlementCountdownActive = ref(false)

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
            if (currentQuestion.value?.CharacterPropertiesRevealed[key]) {
                return key
            } else {
                return '未知线索'
            }
        }
    )

    return headersValue
}
)

const playersMap = computed(() => {
    var playersMapVal = listToDict<GamePlayer>(players.value, 'id')
    return playersMapVal
})

function closeResultPopup() {
    settlementDialogShown.value = false
}

function prepareNextQuestion() {
    if (settlementCountdownActive.value == true) {
        return
    }
    settlementDialogShown.value = true
    countdown.value?.reset()
    settlementCountdownActive.value = true
}

function moveToNextQuestion() {
    settlementDialogShown.value = false
    settlementCountdownActive.value = false

}

function onFaceHit(face: HitType, chat: string) {
    hit.value.hit(face, chat)
}

function sendMove(content: string) {
    if (settlementCountdownActive.value == true) {
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

function receiveMoveListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.Payload.PlayerId)

    if (response.Payload.Game) {
        game.value = response.Payload.Game
    }

    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    let content = characterName

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: content,
        style: result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/avatar.webp'
    } as Message)

    if (result === 'Correct') {
        //回答正确
        prepareNextQuestion()
    } else if (response.Payload.MoveTonextQuestion) {
        //没有回答机会了
        prepareNextQuestion()
    }
    else if (game.value.IsClosed || game.value.IsCompleted) {
        //游戏已结束
        prepareNextQuestion()
    }
}

function gameInfoListener(response: SignalrResponse) {
    if (response.Game) {
        game.value = response.Game
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

function gameCompletedListener(response: SignalrResponse) {
    game.value = response.Payload.Game
    prepareNextQuestion()
}

function load(roomData: GameRoom, gameData: SignalrResponse) {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener)

    gameInfoListener(gameData)

    if (roomData.isClosed || roomData.isCompleted) {
        prepareNextQuestion()
    }
}

onUnmounted(() => {
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)

})
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
