<template>
    <game-base ref="base" :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load">
        <n-card style="height: 100%" class="game-card">
            <div v-if="settlementDialogShown" class="overlay">
                <n-card class="overlay-card">
                    <n-flex justify="center">
                        <div class="correct-answer">
                            正确答案：{{ currentQuestion?.CharacterName }}
                        </div>
                    </n-flex>
                    <result-table :currentQuestion="currentQuestion" :playersMap="playersMap" :headers="headers"
                        :showAnswer="true"></result-table>
                    <next-question :room-id="roomId" :active="settlementCountdownActive" @on-next-question="moveToNextQuestion"></next-question>
                    
                </n-card>
            </div>
            <div>
                <div class="game-panel">
                    <hit-effect ref="hit"></hit-effect>
                    <n-steps :current="(currentQuestionIndex ?? 0) + 1" class="game-step" v-if="false">
                        <n-step v-for="index in 10" :disabled="index > (currentQuestionIndex ?? 0)" title=""></n-step>
                    </n-steps>
                    <div class="game-body">
                        <n-card :bordered="false" size="small" class="answer-list">
                            <div class="game-title"></div>
                            <!-- <icon-button :icon="SendOne" type="success" @click="test">test</icon-button> -->
                            <div class="property-revealed">
                                <!-- <div label="干员" class="property-header">
                                    <div class="property-value">
                                        {{ currentCharacter }}
                                    </div>
                                </div> -->
                                <div v-for="header in headers" class="property-header">
                                    <div class="property-value">
                                        {{ header + ":" }}  {{ currentQuestion.CharacterProperties[header] || '???' }}
                                    </div>
                                </div>
                            </div>
                        </n-card>
                        <result-table :currentQuestion="currentQuestion" :playersMap="playersMap" :headers="headers"
                            :showAnswer="false"></result-table>

                    </div>
                </div>
                <div class="game-guide">
                    <amiya-face @on-hit="onFaceHit"></amiya-face>
                </div>
            </div>
        </n-card>
        <template v-slot:players>
            <player-ranking></player-ranking>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed,  onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import { listToDict } from '@/utils'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { Message } from '@/def/signalr-common'
import type { GamePlayer } from '@/def/players'
import type { Question } from '@/def/cypher-challenge'
import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import HitEffect from '@/desktop/components/effects/HitEffect.vue'
import GameBase from '@/desktop/views/GameBase.vue'
import ResultTable from '@/desktop/components/cypherChallenge/ResultTable.vue'
import NextQuestion from '@/universal/components/NextQuestion.vue'
import PlayerRanking from '@/desktop/components/PlayerRanking.vue'
import AmiyaFace from '@/desktop/components/AmiyaFace.vue'

const route = useRoute()
const gameHub = useGameHubStore()

const players = ref<GamePlayer[]>([])
const currentQuestionIndex = ref<number | null>(null)
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
const game = ref<any>()

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()

const settlementDialogShown = ref(false)
const settlementCountdownActive = ref(false)
const hasNextQuestion = computed(() => {
    if (game?.value?.IsCompleted) {
        return false
    }

    if (currentQuestionIndex.value === 10) {
        return false
    }

    return true
})


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

const playersMap = computed(() => {
    var playersMapVal = listToDict<GamePlayer>(players.value, 'id')
    return playersMapVal
})

function onFaceHit(face: HitType, _ : string) {
    hit.value.hit(face)
}

function prepareNextQuestion() {
    if(settlementDialogShown.value==true){
        return
    }

    settlementDialogShown.value = true
    settlementCountdownActive.value = true
}

function moveToNextQuestion(newQuestionIndex: number) {
    settlementDialogShown.value = false

    currentQuestionIndex.value = newQuestionIndex
}

function sendMove(content: string) {
    if(settlementDialogShown.value==true){
        gameHub.invokeGameHub(
            'Chat',
            roomId,
            content
        )
    }else{
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

    const effects: { [key: string]: HitType } = {
        Correct: 'expectation',
        Answered: 'sweat',
        Wrong: 'refuse'
    }

    if (result in effects) {
        const face = effects[result]
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

function gameCompletedListener(response: SignalrResponse) {
    game.value = response.Payload.Game
    prepareNextQuestion()
}

function load(roomData: GameRoom, gameData: SignalrResponse) {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener)

    gameInfoListener(gameData)
    currentQuestionIndex.value = game.value.CurrentQuestionIndex

    if (roomData.isClosed || roomData.isCompleted) {
        prepareNextQuestion()
    }

}


onUnmounted(() => {
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)

})

// function test(){
//     console.log('current index:', currentQuestionIndex.value)
//     currentQuestionIndex.value = ( currentQuestionIndex.value??0 ) - 1
//     console.log('current index:', currentQuestionIndex.value)
//     prepareNextQuestion()
// }

</script>

<style lang="scss" scoped>
$guideHeight: 160px;

.game-card {
    position: relative;
    overflow: hidden;
    width: 1080px; // 此处固定宽度,是因为amiya face，会改变宽度，因此偷懒临时固定宽度


    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        .overlay-card {
            width: 90%;
            background-color: white;
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
        }
    }



    .game-panel {
        height: calc(100% - $guideHeight);
        background: url(@/assets/images/cypherChallenge/loading.jpg) center / cover no-repeat;
        border-radius: 4px;
        padding: 10px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;

        .game-step {
            margin-left: 40px;
        }

        .game-body {
            display: flex;
            flex-direction: row;
            width: 100%;
            margin-top: 10px;
            flex-grow: 1;
            flex-shrink: 1;

            .answer-list {
                margin-right: 5px;
                margin-left: 5px;
                width: 200px;
                
                background: rgba(0, 0, 0, 0);
                
                .game-title{
                    width: 100%;
                    aspect-ratio: 10/4;
                    background: url(@/assets/images/cypherChallenge/title_content.png) center / contain no-repeat;
                    margin-bottom: 20px;
                }

                .property-revealed {
                    overflow: auto;
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);

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
                margin-right: 20px;
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

</style>
