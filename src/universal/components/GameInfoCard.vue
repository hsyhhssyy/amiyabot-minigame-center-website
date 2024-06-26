<template>
    <n-card class="game-info">
        <n-space justify="space-between" align="center">
            <n-space align="center">
                <img class="game-logo" :src="gameTypeMap[props.roomData.gameType].image" alt="" />
                <div>
                    <div style="font-size: 16px; font-weight: bold">
                        {{ gameTypeMap[props.roomData.gameType].name }}
                    </div>
                    <n-button text @click="roomNumberClickHandler">
                        <div style="font-size: 12px; color: #898989">#{{ props.roomData.joinCode }}</div>
                    </n-button>
                </div>
            </n-space>
            <div class="buttons">
                <slot name="tags"></slot>
                <n-tag type="primary" v-if="props.roomData.isPrivate">私人房间</n-tag>
                <n-tag type="success" v-else>公开房间</n-tag>
                <n-tag type="info" @click="ruleClick">查看规则</n-tag>
            </div>
        </n-space>
        <div class="game-actions" style="margin-top: 20px">
            <slot name="buttons"></slot>
        </div>
        <n-modal v-model:show="isModalVisible" title="游戏规则" @close="isModalVisible = false" preset="dialog">
            <div v-html="gameRules"></div>
        </n-modal>
    </n-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { marked } from 'marked'
import type { Tokens } from 'marked'
import type { GameRoom } from '@/api/game'
import type { GameTypes } from '@/def/games'
import { getGameTypeMap } from '@/def/games'
import { toast } from '@/utils'
import { getShortenUrl } from '@/api/game'

const props = defineProps<{
    roomData: GameRoom
}>()

const gameTypeMap = ref<GameTypes>(getGameTypeMap())
const isModalVisible = ref(false)
const gameRules = ref<string>('暂无规则。')

async function roomNumberClickHandler(){
    const sUrl = await getShortenUrl(props.roomData.id)
    await navigator.clipboard.writeText(`快来和大家一起玩游戏吧，点击链接: ${sUrl} 立刻加入房间。房间号[${props.roomData.joinCode}]。`)
    await toast('已复制加入链接到剪贴板', 'success')
}

const renderer = new marked.Renderer()
renderer.image = function ({ href, title, text }: Tokens.Image) {
    return `
        <div 
            style="
                background-image: url('${href}'); 
                background-size: contain; 
                background-repeat: no-repeat; 
                background-position: center; 
                width: 100%; 
                height: 0; 
                padding-bottom: 56.25%;
            " 
            title="${title || text}">
        </div>
    `;
}


async function ruleClick(){
    const response = await fetch('/rules/'+props.roomData.gameType+'.md')
    const text = await response.text()
    gameRules.value = await marked(text, { renderer })
    isModalVisible.value = true
}

</script>

<style lang="scss">
.game-info {
    .game-logo {
        width: 50px;
        border-radius: 4px;
    }

    .buttons{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;

        @media (min-width: 360px) {
            flex-direction: row;
        }
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
