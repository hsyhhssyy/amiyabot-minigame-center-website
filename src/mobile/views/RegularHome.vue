<template>
    <div class="home">
        <div class="title">{{ route.meta.pageName }}</div>
        <template v-if="!isLoading && user.userInfo">
            <div class="user-panel" v-if="route.name === 'regular-home-mobile'">
                <n-card class="user-card" size="small">
                    <div class="user-avatar">
                        <img :src="user.userAvatar" alt="avatar" class="avatar" referrerpolicy="no-referrer" />
                        <div class="nickname">
                            <span>{{ user.userName }}</span>
                            <span>通行证ID: {{ user.userInfo?.id }}</span>
                        </div>
                    </div>
                    <n-descriptions label-placement="top" :column="3" size="small">
                        <n-descriptions-item label="总场次">{{ totalGamePlayed }}</n-descriptions-item>
                        <n-descriptions-item label="回答命中率" :span="2">
                            {{ totalAnswerAccuracy }}
                        </n-descriptions-item>
                        <n-descriptions-item label="冠军">{{ totalGameTop1 }}</n-descriptions-item>
                        <n-descriptions-item label="亚军">{{ totalGameTop2 }}</n-descriptions-item>
                        <n-descriptions-item label="季军">{{ totalGameTop3 }}</n-descriptions-item>
                    </n-descriptions>
                    <icon-button class="edit-profile" :icon="Editor" @click="editProfile"></icon-button>
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
            <div v-else class="view-container">
                <router-view @onJoin="joinGame" />
            </div>
        </template>
        <div v-else class="loading">
            <img src="/face/31ebcd457ec04b3b712e417c926a0dba36816755.gif" alt="loading" />
            <div>连接服务器中，请稍候...</div>
            <icon-button :icon="Logout" @click="logout" type="error">退出登录</icon-button>
        </div>
    </div>
    <n-modal class="create-collection" v-model:show="showJoinModal" :mask-closable="false" style="width: 80vw">
        <n-card size="huge" title="加入游戏" role="dialog" aria-modal="true" closable @close="showJoinModal = false">
            <n-form>
                <n-form-item label="房间号">
                    <n-input-group>
                        <n-input placeholder="请输入房间号" v-model:value="joinRoomCode" style="margin-right: 10px"></n-input>
                        <icon-button :icon="Lightning" type="success" @click="joinGame()">确认加入</icon-button>
                    </n-input-group>
                </n-form-item>
            </n-form>
        </n-card>
    </n-modal>
    <join-room ref="joinRoomComp" />
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import { useUserStore } from '@/stores/user'
import { statisticsApi } from '@/api/game'
import { getData } from '@/utils'
import { Lightning, Logout, Editor } from '@icon-park/vue-next'
import IconButton from '@/universal/components/IconButton.vue'
import JoinRoom from '@/desktop/views/room/JoinRoom.vue'

const route = useRoute()
const router = useRouter()

const user = useUserStore()
const gameHub = useGameHubStore()

const email = ref(getData('email') || '')
const isLoading = ref(true)

const joinRoomComp = ref()
const joinRoomCode = ref('')
const showJoinModal = ref(false)
const selectedAvatarId = ref('')

const totalGamePlayed = ref(0)
const totalGameTop3 = ref(0)
const totalGameTop2 = ref(0)
const totalGameTop1 = ref(0)
const totalAnswerAccuracy = ref('100%')

async function createGame() {
    await router.push('/m/regular-home/create-room')
}

async function joinGame(code?: string) {
    await joinRoomComp.value.join(code || joinRoomCode.value)
    showJoinModal.value = false
}

async function editProfile() {
    await router.push('/m/regular-home/edit-profile')
}

async function roomList() {
    await router.push('/m/regular-home/room-list')
}

async function logout() {
    await router.push('/m/logout')
}

watch(
    computed(() => gameHub.isConnected),
    (value: boolean) => {
        isLoading.value = !value
    },
    {
        immediate: true
    }
)

onMounted(async () => {
    if (!email.value) {
        await router.push('/m/login')
        return
    }

    const userId = user.userInfo?.id || ''
    if (userId) {
        const ret = await statisticsApi(userId)
        if (ret) {
            const accu = (ret.totalAnswersCorrect / (ret.totalAnswersCorrect + ret.totalAnswersWrong)) * 100
            totalGamePlayed.value = ret.totalGamesPlayed
            totalGameTop3.value = ret.totalGamesThirdPlace
            totalGameTop2.value = ret.totalGamesSecondPlace
            totalGameTop1.value = ret.totalGamesFirstPlace
            totalAnswerAccuracy.value = ret.totalAnswersCorrect == 0 ? '0%' : accu.toFixed(2) + '%'
        }else{
            await router.push('/m/logout')
        }
    }
})
</script>

<style lang="scss" scoped>
.home {
    width: 100%;
    height: 100%;
    background: url(../../assets/bg.svg) center / cover no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

    .title {
        font-size: 34px;
    }

    .user-panel {
        display: flex;
        flex-direction: column;
        padding: 20px;

        .user-card {
            width: 100%;
            height: 210px;
            background: url(/face/doctor/doctor_think.webp) right bottom / 50px no-repeat;
            margin-bottom: 20px;
        }

        .user-avatar {
            display: flex;
            align-items: center;
            margin-bottom: 15px;

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
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            align-content: flex-start;
            justify-content: space-between;

            .action-item {
                width: calc(50% - 10px);
                height: 100px;
                margin-bottom: 20px;
                cursor: pointer;

                .item {
                    height: 100%;
                    font-size: 16px;
                    font-weight: bold;
                    background: right -5px bottom -5px / 70px no-repeat;

                    &.create {
                        background-image: url(/face/doctor/doctor_haha.webp);
                    }

                    &.join {
                        background-image: url(/face/doctor/doctor_10.webp);
                    }

                    &.room {
                        background-image: url(/face/doctor/doctor_eat.webp);
                    }

                    &.logout {
                        background-image: url(/face/doctor/doctor_run.webp);
                    }
                }

                &:hover {
                    .item {
                        color: var(--main-color);
                    }
                }
            }
        }

        .edit-profile {
            position: absolute;
            right: 10px;
            top: 10px;
        }
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;

        &>img {
            width: 100px;
            height: 100px;
        }

        &>div {
            margin: 10px 0;
        }
    }

}

.view-container {
    width: 100%;
    height: calc(100% - 120px);
    padding: 20px;
}


</style>

<style lang="scss">



</style>