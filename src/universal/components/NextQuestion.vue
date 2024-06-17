<template>
    <n-flex justify="center" style="margin-top: 20px;" align="center" v-if="hasNextQuestion">
        <div>
            <n-badge color="green" v-for="player in players" style="margin-right: 5px;">
                <template #value>
                    <icon :icon="Check" v-if="playersReadyList.includes(player.id)" />
                </template>
                <n-avatar :src="player.avatar" size="small" :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
            </n-badge>
        </div>
        <icon-button :icon="SendOne" type="success" @click="nextQuestionButton">下一题</icon-button>
        <div class="countdown">
            <n-countdown :duration="10000" :active="clockActive" :render="renderCountdown" ref="countdown"
                @finish="onCountdownFinish"></n-countdown>
        </div>
    </n-flex>
    <n-flex justify="center" style="margin-top: 20px;" align="center" v-if="!hasNextQuestion">
        <div class="countdown">
            游戏已结束
        </div>
        <icon-button :icon="Close" type="error" @click="closeResultPopup" v-if="showClose">关闭</icon-button>
    </n-flex>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { Check, SendOne, Close } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import type { SignalrResponse } from '@/api/signalr';
import type { Player } from '@/def/players';
import { listToDict } from '@/utils';
import IconButton from '@/universal/components/IconButton.vue'
import Icon from '@/universal/components/Icon.vue'


const gameHub = useGameHubStore()

const props = withDefaults(defineProps<{
    roomId: string
    active: boolean
    showClose: boolean
}>(), {
    showClose: false // 这里设置 showClose 的默认值
})

// 该Emit触发时，指示外部控件可以进行下一题，传入参数为当前正在进行题目的Index（也就是下一题的Index）
const emits = defineEmits<{
    (e: 'onNextQuestion', currentQuestionIndex: number): void
    (e: 'onCloseResultPopup'): void
}>()

interface GamePlayer extends Player {
    score: number
}

const players = ref<GamePlayer[]>([])
const playersMap = computed(() => {
    var playersMapVal = listToDict<GamePlayer>(players.value, 'id')
    return playersMapVal
})
const clockActive = ref<boolean>(props.active)
const playersReadyList = ref<string[]>([])
const game = ref<any>()
const currentQuestionIndex = ref<number | null>(null)
const hasNextQuestion = computed(() => {
    if (game?.value?.IsCompleted) {
        return false
    }

    if (currentQuestionIndex.value === 10) {
        return false
    }

    return true
})
const renderCountdown = ({ seconds }: { seconds: number }) => {
    return `${seconds}秒`;
};

const rallyPointHistory = ref<any[] | null>(null)

watch(computed(() => props.active), (newVal, oldVal) => {
    if (newVal) {
        //启动计时器
        clockActive.value = true
    }
})

function onCountdownFinish() {
    if(game.value.CurrentQuestionIndex !== currentQuestionIndex.value) {
        return
    }
    moveToNextQuestion()
}

function closeResultPopup() {
    emits('onCloseResultPopup')
}

function getRallyPointData() {
    return "PrepareNextQuestion:" + currentQuestionIndex.value;
}

function nextQuestionButton() {
    gameHub.invokeGameHub('RallyPointReached', props.roomId, JSON.stringify({ Name: getRallyPointData() }));
    gameHub.invokeGameHub('RallyPointStatus', props.roomId, JSON.stringify({ Name: getRallyPointData() }))
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

    if (currentQuestionIndex.value === null) {
        currentQuestionIndex.value = response.Payload.Game.CurrentQuestionIndex-1
    }

    if (!rallyPointHistory.value) {
        //开始逐个查询RallyPoint是否存在
    }
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

function moveToNextQuestion() {
    playersReadyList.value = []

    if (game.value.QuestionList.length > game.value.CurrentQuestionIndex) {
        currentQuestionIndex.value = game.value.CurrentQuestionIndex
    }

    if (currentQuestionIndex.value !== null) {
        emits('onNextQuestion', currentQuestionIndex.value!)
    }
}


onMounted(() => {
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('RallyPointStatus', rallyPointStatusListener)
    gameHub.addGameHubListener('RallyPointReached', rallyPointReachedListener)
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('RallyPointStatus', rallyPointStatusListener)
    gameHub.removeGameHubListener('RallyPointReached', rallyPointReachedListener)
})

</script>

<style scoped lang="scss">
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
</style>