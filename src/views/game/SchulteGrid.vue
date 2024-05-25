<template>
    <game-base :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load" ref="base">
        <n-card style="height: 100%">
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
        </n-card>
    </game-base>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onUnmounted, ref } from 'vue'
import { useGameHubStore } from '@/stores/gameHub'
import type { SignalrResponse } from '@/api/signalR'
import type { Player } from '@/views/def/Players'
import GameBase from '@/views/GameBase.vue'
import type { HitType } from '@/components/effects/HitEffect.vue'
import HitEffect from '@/components/effects/HitEffect.vue'

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
    let content = response.Payload.CharacterName

    const effects: { [key: string]: HitType } = {
        Correct: 'joy',
        Answered: 'sweat',
        Wrong: 'refuse'
    }
    hit.value.hit(effects[result])

    if (result === 'Correct') {
        const dataArray = [...expandedData.value]

        // 调整Grid,将Answer中GridPointList的点标记为♣
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].recent) {
                dataArray[i].fade = true
                dataArray[i].recent = false
            }
        }

        content = content + ' - '

        for (const answer of response.Payload.Answer) {
            for (let point of answer.GridPointList) {
                const loc = point.Y * y.value + point.X
                dataArray[loc].recent = true
                dataArray[loc].fade = false
            }
            content = content + answer.SkillName + ' '
        }

        expandedData.value = dataArray
    }

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

onUnmounted(() => {
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
})
</script>

<style lang="scss" scoped>
.game-body {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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
</style>
