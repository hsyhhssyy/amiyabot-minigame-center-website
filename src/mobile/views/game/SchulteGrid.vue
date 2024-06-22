<template>
    <game-base :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="onBaseLoaded"
        ref="base">
        <div style="height: 100%; ">
            <n-spin :show="expandedData?.length < 100">
                <div class="game-body">
                    <n-card embedded :bordered="false" style="width: fit-content">
                        <n-grid :x-gap="2" :y-gap="2" :cols="x" style="width: fit-content">
                            <n-grid-item v-for="(item, index) in expandedData" :key="index">
                                <n-button size="small" class="char" :class="{ active: !item.recent && !item.fade }"
                                    :dashed="item.fade" :strong="!item.fade" :disabled="item.fade"
                                    :secondary="item.recent" :type="colors(item)">
                                    {{ item.char }}
                                </n-button>
                            </n-grid-item>
                        </n-grid>
                    </n-card>
                    <hit-effect ref="hit"></hit-effect>
                </div>
            </n-spin>
        </div>
        <template v-slot:players>
            <player-ranking :players="players"></player-ranking>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import type { SignalrResponse } from '@/api/signalr'
import type { Player } from '@/def/players'
// import type { GameRoom } from '@/api/game'
import GameBase from '@/mobile/views/GameBase.vue'
import type { HitType } from '@/mobile/components/effects/HitEffect.vue'
import HitEffect from '@/mobile/components/effects/HitEffect.vue'
import PlayerRanking from '@/mobile/components/PlayerRanking.vue'
import { useUser } from '@/stores/user'

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
const user = useUser()

const x = ref(2)
const y = ref(2)
const font_factor = ref(10)
const players = ref<GamePlayer[]>([])
const expandedData = ref<ExpandedDataItem[]>([])
const isCompleted = ref(false)
const RemainingAnswerPushed = ref(false)

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()
const baseLoaded = ref(false)

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
    if (response.Game.Id != roomId) return //多标签页环境可能出现多个房间同开的情况

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
        var hitMessage = ""

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

                if (player?.id === user.userInfo?.id) {
                    hitMessage = "恭喜你猜对了！"
                } else {
                    hitMessage = "恭喜" + player?.name + "猜出干员：" + characterName
                }

                break
            case 'Answered':
                if (player?.id === user.userInfo?.id) {
                    hitMessage = "该干员已被猜过了。"
                } else {
                    hitMessage = "玩家" + player?.name + "猜测是干员" + characterName + "，但是他已经被猜过了。"
                }
                break
            case 'Wrong':
                if (player?.id === user.userInfo?.id) {
                    hitMessage = "猜错了！" + characterName + "不在谜题中。"
                } else {
                    hitMessage = "玩家" + player?.name + "猜测是干员" + characterName + "，但是他猜错了。"
                }
                break
        }

        if (hitMessage !== "") {
            hit.value.hit(face, hitMessage)
        }
    }

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: content,
        style: result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/avatar.webp'
    } as Message)
}


function gameCompletedListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) return //多标签页环境可能出现多个房间同开的情况

    const answers = response.Payload.RemainingAnswers
    if (isCompleted.value === false) {
        isCompleted.value = true
        RemainingAnswerPushed.value = false
        pushRemainingAnswers(answers)
    }
}

function pushRemainingAnswers(answers: any) {
    if (RemainingAnswerPushed.value) {
        return
    }
    if (!base.value || !baseLoaded.value) {
        return
    }

    RemainingAnswerPushed.value = true

    if (isCompleted.value) {
        base.value.pushMessage({
            userId: "",
            content: "该局游戏已经结束了" + (answers.length ? "，未猜出的答案如下：" : "。"),
            style: "Correct",
            nickname: '阿米娅',
            avatar: '/amiya.jpg'
        } as Message)

        for (const answer of answers) {
            base.value.pushMessage({
                userId: "",
                content: answer.CharacterName + " - " + answer.SkillName,
                style: "Correct",
                nickname: '阿米娅',
                avatar: '/amiya.jpg'
            } as Message)
        }

    }
}

async function gameInfoListener(response: SignalrResponse) {
    if (response.Game.Id != roomId) return //多标签页环境可能出现多个房间同开的情况
    
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

    isCompleted.value = response.Game.IsCompleted
    pushRemainingAnswers(response.Payload.RemainingAnswers)

}


function onBaseLoaded() {
    baseLoaded.value = true;
    base.value.pushMessage({
        userId: "",
        content: "博士们，欢迎参加本场比赛，我是你们的向导：兔兔！比赛已经开始啦，请博士在上面的表中找到干员的【技能名】，然后在聊天框里发送【干员名】进行竞猜。",
        style: "Correct",
        nickname: '阿米娅',
        avatar: '/amiya.jpg'
    } as Message)
}

watch(
    computed(() => gameHub.isConnected),
    (value: boolean) => {

        if (value) {
            gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
            gameHub.addGameHubListener('GameInfo', gameInfoListener)
            gameHub.addGameHubListener('GameCompleted', gameCompletedListener)


        }
    },
    {
        immediate: true
    }
)

onMounted(() => {
})

onUnmounted(() => {
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
})
</script>

<style lang="scss" scoped>
$guideHeight: 0px;

.game-body {
    height: calc(100% - $guideHeight);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .char {
        width: calc(10vw - 5px);
        height: calc(10vw - 5px);
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

    .amiya-chat-content {
        padding: 0px;
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
