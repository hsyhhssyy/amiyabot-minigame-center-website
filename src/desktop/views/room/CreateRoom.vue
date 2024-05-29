<template>
    <div class="create-room">
        <div class="game-list">
            <n-space>
                <n-card
                    class="game-item"
                    hoverable
                    embedded
                    size="small"
                    content-style="overflow:hidden"
                    v-for="(item, index) in gameList"
                    :key="index"
                    @click="selectGame(item)"
                >
                    <div class="item">
                        <img :src="item.image" :alt="item.name" />
                        {{ item.name }}
                    </div>
                </n-card>
            </n-space>
        </div>
        <div class="game-options">
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-switch :rail-style="railStyle" v-model:value="isPrivateRoom">
                        <template #checked>私人房间</template>
                        <template #unchecked>公开房间</template>
                    </n-switch>
                </template>
                <span>私人房间只能通过房间号或邀请链接加入，不能从游戏大厅搜到。</span>
            </n-popover>
            <icon-button :icon="Back" @click="goBack" type="error">返回</icon-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import { setData } from '@/utils'
import type { GameItem } from '@/def/games'
import { gameList } from '@/def/games'
import { Back } from '@icon-park/vue-next'
import IconButton from '@/desktop/components/IconButton.vue'

const router = useRouter()
const gameHub = useGameHubStore()

const isGameCreating = ref(false)
const isPrivateRoom = ref(false)

function railStyle({ focused, checked }: { focused: boolean; checked: boolean }) {
    const style: CSSProperties = {
        margin: '0 10px'
    }
    if (checked) {
        style.background = '#7b40f2'
        if (focused) {
            style.boxShadow = '0 0 0 2px #d0305040'
        }
    } else {
        style.background = '#18a058'
        if (focused) {
            style.boxShadow = '0 0 0 2px #2080f040'
        }
    }
    return style
}

async function selectGame(game: GameItem) {
    // 创建房间并跳转到房间等待页面
    gameHub.invokeGameHub('CreateGame', game.type, JSON.stringify({ IsPrivate: isPrivateRoom.value }))
    isGameCreating.value = true
}

async function goBack() {
    await router.push('/regular-home')
}

function gameCreateListener(response: { GameId: string }) {
    isGameCreating.value = false

    console.log(response)

    const gameId = response.GameId
    setData('current-game-id', gameId)

    // 跳转到房间等待页面
    router.push('/regular-home/waiting-room/' + gameId)
}

onMounted(() => {
    gameHub.addGameHubListener('GameCreated', gameCreateListener)
})

onUnmounted(() => {
    gameHub.removeGameHubListener('GameCreated', gameCreateListener)
})
</script>

<style lang="scss" scoped>
.create-room {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.game-list {
    display: flex;

    .game-item {
        width: 150px;
        height: 150px;
        margin-bottom: 30px;
        cursor: pointer;

        .item {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-weight: bold;
        }

        img {
            width: 100px;
            margin-bottom: 5px;
        }
    }
}

.game-options {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
