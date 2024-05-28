<template>
    <div style="display: none">加入房间</div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, watch } from 'vue'
import type { SignalrResponse } from '@/api/signalr'
import { getData, removeData, setData, toast } from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import { getGame } from '@/api/game'
import { useDialog } from 'naive-ui'
import { useGameHubStore } from '@/stores/gamehub'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const gameHub = useGameHubStore()

async function join(joinCode: string) {
    console.log(`加入房间号为 ${joinCode} 的房间`)
    gameHub.invokeGameHub('JoinGame', joinCode)
}

async function gameJoinListener(response: SignalrResponse) {
    const playerJoined = response.UserId
    if (playerJoined != getData('user-id')) {
        // 意外收到别人的消息,不处理
        return
    }

    const gameId = response.GameId
    setData('current-game-id', gameId)
    await router.push('/regular-home/waiting-room/' + gameId)
}

async function initJoinRoom() {
    gameHub.addGameHubListener('PlayerJoined', gameJoinListener)
    gameHub.addGameHubListener('Alert', async (response: SignalrResponse) => {
        await toast(response.Message, 'error')
    })

    if (getData('current-game-id')) {
        // 重连检查
        const gameId = getData<string>('current-game-id') ?? ''

        try {
            const game = await getGame(gameId)

            if (game.isClosed) {
                removeData('current-game-id')
                return
            }

            if (route.name == 'waiting-room') {
                return
            }

            const playerList = game.playerList
            const player = Object.keys(playerList).find((key) => key == getData('user-id'))

            if (player) {
                dialog.warning({
                    title: '断线重连',
                    content: '检测到您有一局正在进行的游戏，是否重新连接？',
                    positiveText: '好的',
                    negativeText: '算了',
                    maskClosable: false,
                    onPositiveClick: async () => {
                        await router.push('/regular-home/waiting-room/' + getData('current-game-id'))
                    },
                    onNegativeClick: async () => removeData('current-game-id')
                })
            } else {
                dialog.success({
                    title: '加入游戏',
                    content: '您是否要加入由 ' + game.creatorNickname + ' 创建的游戏？',
                    positiveText: '好的',
                    negativeText: '算了',
                    maskClosable: false,
                    onPositiveClick: async () => {
                        await join(game.joinCode)
                    },
                    onNegativeClick: async () => removeData('current-game-id')
                })
            }
        } catch (e) {
            console.log('RegularHome 读取房间失败，清理房间')
            removeData('current-game-id')
        }
    }
}

async function delJoinRoom() {
    gameHub.removeGameHubListener('PlayerJoined', gameJoinListener)
    gameHub.removeGameHubListener('Alert', async (response: SignalrResponse) => {
        await toast(response.Message, 'error')
    })
}

watch(
    computed(() => gameHub.isConnected),
    async (value: boolean) => {
        if (value) {
            await initJoinRoom()
        } else {
            await delJoinRoom()
        }
    },
    {
        immediate: true
    }
)

defineExpose({ join })

onUnmounted(async () => {
    await delJoinRoom()
})
</script>

<style lang="scss" scoped></style>
