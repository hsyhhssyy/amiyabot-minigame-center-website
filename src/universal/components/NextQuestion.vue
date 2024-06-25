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
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
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
    game: any
    players: any
    active: boolean
    showClose: boolean
}>(), {
    showClose: false // 这里设置 showClose 的默认值
})

// 该Emit触发时，指示外部控件可以进行下一题
const emits = defineEmits<{
    (e: 'onNextQuestion'): void
    (e: 'onCloseResultPopup'): void
}>()

interface GamePlayer extends Player {
    score: number
}

const players = computed(() => {
    return props.players
})

const game = computed(() => {
    return props.game
})
const countdown = ref<any>()
const clockActive = ref<boolean>(props.active)
const playersReadyList = ref<string[]>([])
const currentQuestionIndex = ref<number | null>(null)
const hasNextQuestion = computed(() => {
    if (game?.value?.IsCompleted) {
        return false
    }

    return true
})
const renderCountdown = ({ seconds }: { seconds: number }) => {
    return `${seconds}秒`;
};

const rallyPointHistory = ref<any[] | null>(null)

watch(computed(() => props.active), (newVal, oldVal) => {
    clockActive.value = newVal
    console.log('props.active changed', newVal, oldVal)
    if (newVal) {
        countdown.value.reset()
    }
})

watch(computed(() => props.game), (newVal:any, oldVal) => {
    if (newVal !== null) {
        if (currentQuestionIndex.value === null) {
            currentQuestionIndex.value = newVal.CurrentQuestionIndex-1
        }
    }
})

watch(currentQuestionIndex, (newVal, oldVal) => {
    console.log('currentQuestionIndex changed', newVal, oldVal)
})

function onCountdownFinish() {
    if(clockActive){
        moveToNextQuestion()
    }
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

function rallyPointStatusListener(response: SignalrResponse) {
    if(response.Name !== getRallyPointData()) {
        return
    }
    //console.log('rally st', response)
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
    if(response.Name !== getRallyPointData()) {
        return
    }
    clockActive.value = false
    console.log('rally reached, clock deactive', response)
    moveToNextQuestion()
}

function moveToNextQuestion() {
    playersReadyList.value = []

    console.log('NextQuestion moveToNextQuestion 1')
    // if (game.value.QuestionList.length > game.value.CurrentQuestionIndex) {
    //     currentQuestionIndex.value = game.value.CurrentQuestionIndex
    // }
    // 因为这里立即为CurrentIndex加了1，所以后续RallyPointReach也不会再次触发了
    currentQuestionIndex.value = currentQuestionIndex.value! + 1

    if (currentQuestionIndex.value !== null) {
        console.log('NextQuestion moveToNextQuestion 2')
        emits('onNextQuestion')
    }
}


onMounted(() => {
    gameHub.addGameHubListener('RallyPointStatus', rallyPointStatusListener)
    gameHub.addGameHubListener('RallyPointReached', rallyPointReachedListener)
})

onUnmounted(() => {
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