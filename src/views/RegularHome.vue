<template>
    <div class="home">
        <div class="title">{{ route.meta.pageName }}</div>
        <template v-if="!isLoading && user">
            <template v-if="route.name === 'regular-home'">
                <div class="user-panel">
                    <n-card class="user-card" :title="user.avatar" size="small">
                        <div class="user-avatar">
                            <img :src="defaultAvatar" alt="avatar" class="avatar" />
                            <div class="nickname">
                                <span>{{ user.nickname }}</span>
                                <span>通行证ID: {{ user.id }}</span>
                            </div>
                        </div>
                        <n-descriptions label-placement="top" :column="3" size="small">
                            <n-descriptions-item label="总场次">1000</n-descriptions-item>
                            <n-descriptions-item label="回答命中率" :span="2">100%</n-descriptions-item>
                            <n-descriptions-item label="冠军">0</n-descriptions-item>
                            <n-descriptions-item label="亚军">0</n-descriptions-item>
                            <n-descriptions-item label="季军">0</n-descriptions-item>
                        </n-descriptions>
                    </n-card>
                    <div class="actions">
                        <n-card class="action-item" hoverable embedded size="small" @click="createGame">
                            <div class="item create">创建游戏</div>
                        </n-card>
                        <n-card class="action-item" hoverable embedded size="small" @click="showJoinModal = true">
                            <div class="item join">加入游戏</div>
                        </n-card>
                        <n-card class="action-item" hoverable embedded size="small" @click="roomList">
                            <div class="item room">游戏大厅</div>
                        </n-card>
                        <n-card class="action-item" hoverable embedded size="small" @click="logout">
                            <div class="item logout">登出</div>
                        </n-card>
                    </div>
                </div>
            </template>
            <div v-else class="view-container">
                <router-view />
            </div>
        </template>
        <div v-else class="loading">
            <img src="../assets/face/31ebcd457ec04b3b712e417c926a0dba36816755.gif" alt="loading" />
            <div>{{ loadingText }}</div>
            <icon-button :icon="Logout" @click="logout" type="error">退出登录</icon-button>
        </div>
    </div>
    <n-modal class="create-collection" v-model:show="showJoinModal" :mask-closable="false" style="width: 400px">
        <n-card size="huge" title="加入游戏" role="dialog" aria-modal="true" closable @close="showJoinModal = false">
            <n-form>
                <n-form-item label="房间号">
                    <n-input-group>
                        <n-input placeholder="请输入房间号" v-model:value="joinRoomCode"></n-input>
                        <icon-button :icon="Lightning" type="success" @click="joinGame">确认加入</icon-button>
                    </n-input-group>
                </n-form-item>
            </n-form>
        </n-card>
    </n-modal>
    <join-room ref="joinRoomComp" v-if="!isLoading" />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDialog } from 'naive-ui'
import { getData, removeData } from '@/utils'
import { describeAPI } from '@/api/account'
import { getGame } from '@/api/game'
import { connectToGameHub, isConnected } from '@/api/signalR'
import { Logout, Lightning } from '@icon-park/vue-next'
import IconButton from '@/components/IconButton.vue'

import type { UserInfo } from '@/api/account'
import JoinRoom from '@/views/room/JoinRoom.vue'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()

const email = ref(getData('email') || '')
const user = ref<UserInfo>()
const isLoading = ref(true)
const loadingText = ref('连接服务器中，请稍候...')
const defaultAvatar = ref('/avatar.webp')

const joinRoomComp = ref()
const joinRoomCode = ref('')
const showJoinModal = ref(false)

async function connect() {
    const descRet = await describeAPI()
    if (!descRet) {
        await logout()
        return
    }

    user.value = descRet
    if (descRet.avatar) {
        defaultAvatar.value = descRet.avatar
    }

    const ret = await connectToGameHub()
    if (ret) {
        console.log('RegularHome 连接成功')

        //检查已有房间
        if (getData('current-game-id')) {
            // 重连检查
            const gameId = getData<string>('current-game-id') ?? ''

            try {
                const game = await getGame(gameId)

                if (game.isClosed) {
                    removeData('current-game-id')
                    isLoading.value = false
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
                            await router.push('/regular-home/room-waiting/' + getData('current-game-id'))
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
                            await router.push('/regular-home/join-room')
                        },
                        onNegativeClick: async () => removeData('current-game-id')
                    })
                }
            } catch (e) {
                console.log('RegularHome 读取房间失败，清理房间')
                removeData('current-game-id')
            }
        }
        isLoading.value = false
    } else {
        console.log('RegularHome 连接失败')
        loadingText.value = '连接服务器失败，正在尝试重连...'
        setTimeout(connect, 1000)
    }
}

async function createGame() {
    await router.push('/regular-home/create-room')
}

async function joinGame() {
    await joinRoomComp.value.join(joinRoomCode.value)
    showJoinModal.value = false
}

async function roomList() {
    await router.push('/regular-home/room-list')
}

async function logout() {
    await router.push('/logout')
}

function check_connection() {
    if (!isConnected()) {
        router.push('/regular-home')
        return
    }
    setTimeout(check_connection, 500)
}

onMounted(async () => {
    if (!email.value) {
        await router.push('/login')
        return
    }
    await connect()
    check_connection()
})
</script>

<style lang="scss" scoped>
.home {
    width: 100%;
    height: 100%;
    background: url(../assets/bg.svg) center / cover no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 100px;

    .title {
        font-size: 34px;
        margin-bottom: 20px;
    }

    .user-panel {
        display: flex;

        .user-card {
            width: 400px;
            height: 210px;
            background: url(../assets/face/doctor/doctor_think.webp) right bottom / 50px no-repeat;
        }

        .user-avatar {
            display: flex;
            align-items: center;
            margin-bottom: 20px;

            .avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin-right: 10px;
            }

            .nickname {
                display: flex;
                flex-direction: column;

                span:first-child {
                    font-size: 18px;
                    font-weight: bold;
                }

                span:last-child {
                    font-size: 12px;
                    color: #898989;
                }
            }
        }

        .actions {
            width: 330px;
            margin-left: 20px;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            align-content: flex-start;
            justify-content: space-between;

            .action-item {
                width: 160px;
                height: 100px;
                margin-bottom: 10px;
                cursor: pointer;

                .item {
                    height: 100%;
                    font-size: 16px;
                    font-weight: bold;
                    background: right -5px bottom -5px / 70px no-repeat;

                    &.create {
                        background-image: url(../assets/face/doctor/doctor_haha.webp);
                    }

                    &.join {
                        background-image: url(../assets/face/doctor/doctor_10.webp);
                    }

                    &.room {
                        background-image: url(../assets/face/doctor/doctor_eat.webp);
                    }

                    &.logout {
                        background-image: url(../assets/face/doctor/doctor_run.webp);
                    }
                }

                &:hover {
                    .item {
                        color: var(--main-color);
                    }
                }
            }
        }
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;

        & > img {
            width: 100px;
            height: 100px;
        }

        & > div {
            margin: 10px 0;
        }
    }
}

.view-container {
    width: 100%;
    height: calc(100% - 120px);
    padding: 0 100px;
}
</style>
