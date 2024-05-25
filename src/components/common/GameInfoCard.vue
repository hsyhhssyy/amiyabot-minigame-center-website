<template>
    <n-card class="game-info">
        <n-space justify="space-between" align="center">
            <n-space align="center">
                <img class="game-logo" :src="gameTypeMap[props.roomData.gameType].image" alt="" />
                <div>
                    <div style="font-size: 16px; font-weight: bold">
                        {{ gameTypeMap[props.roomData.gameType].name }}
                    </div>
                    <div style="font-size: 12px; color: #898989">#{{ props.roomData.joinCode }}</div>
                </div>
            </n-space>
            <n-space align="center">
                <slot name="tags"></slot>
                <n-tag type="primary" v-if="props.roomData.isPrivate">私人房间</n-tag>
                <n-tag type="success" v-else>公开房间</n-tag>
            </n-space>
        </n-space>
        <div class="game-actions" style="margin-top: 20px">
            <slot name="buttons"></slot>
        </div>
    </n-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { GameRoom } from '@/api/game'
import type { GameTypes } from '@/views/def/Games'
import { getGameTypeMap } from '@/views/def/Games'

const props = defineProps<{
    roomData: GameRoom
}>()

const gameTypeMap = ref<GameTypes>(getGameTypeMap())
</script>

<style lang="scss">
.game-info {
    .game-logo {
        width: 50px;
        border-radius: 4px;
    }

    .game-actions {
        display: flex;

        & > button {
            flex: 2;

            &:not(:last-child) {
                margin-right: 10px;
            }
        }
    }
}
</style>
