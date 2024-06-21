<template>
    <div class="grid">
    <div v-for="player in players" class="player-loading">
        <div class="player-loading-content">
            <n-avatar size="large" :src="player.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
            <div>{{ player.name }}</div>
        </div>
        <div class="progress">
            <n-progress type="line" :percentage="round(playerStatus[player.id] / maximum * 100)" 
            :status="playerStatus[player.id]>=maximum?'success':'info'"
            :show-indicator="false">
            </n-progress>
        </div>
    </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useGameHubStore } from '@/stores/gamehub'
import { useUserStore } from '@/stores/user'
import type { SignalrResponse } from '@/api/signalr'
import type { GamePlayer } from '@/def/players'

const gameHub = useGameHubStore()
const user = useUserStore()

const emits = defineEmits<{
    (e: 'onLoadingComplete'): void
}>()

export interface LoadingProps {
    roomId: string
    value: number
    maximum: number
    players: GamePlayer[]
}

const props = defineProps<LoadingProps>()

const playerStatus = ref<Record<string, number>>({})

watch(() => props.value, (newValue, oldValue) => {

    if (newValue > 0 && (!oldValue || oldValue == 0)) {
        gameHub.invokeGameHub('RallyPointCreate', props.roomId, JSON.stringify({ Name: "GameInitialLoading-Maximum" }));
    }

    gameHub.invokeGameHub('RallyPointCreate', props.roomId, JSON.stringify({ Name: "GameInitialLoading-V" + newValue }));
    gameHub.invokeGameHub('RallyPointReached', props.roomId, JSON.stringify({ Name: "GameInitialLoading-V" + newValue }));

    if (newValue >= props.maximum) {
        gameHub.invokeGameHub('RallyPointReached', props.roomId, JSON.stringify({ Name: "GameInitialLoading-Maximum" }));
    }
})

function round(value: number) {
    if (value > 100) {
        return 100;
    }
    return Math.round(value);
}

function rallyPointStatusListener(response: SignalrResponse) {
    if (response.Name.includes('GameInitialLoading-V')) {
        //更新对应玩家的加载进度
        if (response.Players) {
            for (const playerId of response.Players) {
                const currentVal = playerStatus.value[playerId] || 0;
                const newVal = parseInt(response.Name.replace('GameInitialLoading-V', ''));
                if (newVal > currentVal) {
                    playerStatus.value[playerId] = newVal;
                }
            }
        }
    } else if (response.Name.includes('GameInitialLoading-Maximum')) {
        // 这是第一次进入时，CreateRallyPoint的返回
        // 用来同步已加载状态
        if (response.Players) {
            for (const playerId of response.Players) {
                //排除我自己
                if (playerId == user.userInfo?.id??"") {
                    continue;
                }
                playerStatus.value[playerId] = props.maximum;
            }
        }
    }
}

function rallyPointReachedListener(response: SignalrResponse) {
    if (response.Name.includes('GameInitialLoading-Maximum')) {
        console.log('加载完成');
        emits('onLoadingComplete')
    }
}

onMounted(() => {
    gameHub.addGameHubListener('RallyPointStatus', rallyPointStatusListener);
    gameHub.addGameHubListener('RallyPointReached', rallyPointReachedListener);
})

onUnmounted(() => {
    gameHub.removeGameHubListener('RallyPointStatus', rallyPointStatusListener);
    gameHub.removeGameHubListener('RallyPointReached', rallyPointReachedListener);
})

</script>

<style lang="scss" scoped>

.grid{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 10px;

    .player-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;

    .player-loading-content{
        display: flex;
        width: 90%;
        flex-direction: row;
        align-items: center;
        justify-content: start;
    }

    .progress{
        margin: 5px;
        width: 90%;
    }
}
}

</style>
