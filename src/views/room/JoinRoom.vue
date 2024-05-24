<template>
    <div style="display: none">这个页面不需要显示</div>
</template>

<script lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { addGameHubListener, removeGameHubListener, invokeGameHub } from '@/api/signalR'
import type { SignalrResponse } from '@/api/signalR'
import { getGame } from '@/api/game'
import { getData, setData, toast } from '@/utils'
import { useRouter } from 'vue-router'

export default {
    setup() {
        const router = useRouter()

        async function join(joinCode: string) {
            console.log(`加入房间号为 ${joinCode} 的房间`)
            invokeGameHub('JoinGame', joinCode)
        }

        async function gameJoinListener(response: SignalrResponse) {
            const playerJoined = response.UserId
            if (playerJoined != getData('user-id')) {
                // 意外收到别人的消息,不处理
                return
            }

            const gameId = response.GameId
            setData('current-game-id', gameId)
            await router.push('/regular-home/room-waiting/' + gameId)
        }

        onMounted(async () => {
            addGameHubListener('PlayerJoined', gameJoinListener)
            addGameHubListener('Alert', async (response: SignalrResponse) => {
                await toast(response.Message, 'error')
            })

            const gameId = getData<string>('current-game-id')
            if (gameId) {
                const game = await getGame(gameId)
                if (game) {
                    invokeGameHub('JoinGame', game.joinCode)
                }
            }
        })

        onUnmounted(() => {
            removeGameHubListener('PlayerJoined', gameJoinListener)
            removeGameHubListener('Alert', async (response: SignalrResponse) => {
                await toast(response.Message, 'error')
            })
        })

        return {
            join
        }
    }
}
</script>

<style lang="scss" scoped></style>
