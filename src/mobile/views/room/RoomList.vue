<template>
    <n-card class="room-list" >
        <div class="room-list-body">
            <n-space justify="space-evenly" style="padding: 0 5px">
                <n-space>
                    <icon-button :icon="Refresh" type="info" @click="getList">刷新房间列表</icon-button>
                    <icon-button :icon="Back" @click="goBack" type="error">返回</icon-button>
                </n-space>
                <n-input-group>
                    <n-input placeholder="输入关键字以搜索" />
                    <icon-button :icon="Search" type="primary">搜索房间</icon-button>
                </n-input-group>
            </n-space>
            <div class="room-list-content">
                <div class="room-item" v-for="(item, index) in currList" :key="index">
                    <n-card size="small" embedded>
                        <div class="room-card-content" :class="{ activated: item.isStarted }">
                            <n-space justify="space-between">
                                <n-space>
                                    <img class="game-logo" :src="gameTypeMap[item.gameType].image" alt="" />
                                    <div>
                                        <div style="font-size: 16px; font-weight: bold">
                                            {{ gameTypeMap[item.gameType].name }}
                                        </div>
                                        <n-space align="center" :size="6">
                                            <n-tag :bordered="false" type="primary" size="small">
                                                <div class="info-item">
                                                    <icon :icon="KeyOne" />
                                                    {{ item.joinCode }}
                                                </div>
                                            </n-tag>
                                            <n-tag :bordered="false" type="default" size="small">
                                                <div class="info-item">
                                                    <icon :icon="Peoples" />
                                                    {{ Object.keys(item.playerList).length }}
                                                </div>
                                            </n-tag>
                                        </n-space>
                                    </div>
                                </n-space>
                                <n-space>
                                    <n-tag type="warning" v-if="item.isStarted">进行中</n-tag>
                                    <n-tag type="info" v-else>等待中</n-tag>
                                </n-space>
                            </n-space>
                            <div class="room-info">
                                <div class="info-item creator">
                                    <icon :icon="UserBusiness" />
                                    创建人：
                                    <n-avatar :size="25" :src="item.creatorAvatar || '/avatar.webp'" />
                                    {{ item.creatorNickname }}
                                </div>
                                <div class="info-item">
                                    <icon :icon="CalendarThirty" />
                                    创建日期：{{ formatDate(item.createTime) }}
                                </div>
                            </div>
                            <n-space align="center">
                                <icon-button size="small" :icon="Lightning" type="success" @click="join(item)">
                                    加入
                                </icon-button>
                            </n-space>
                        </div>
                    </n-card>
                </div>
            </div>
            <div>
                <n-pagination v-model:page="currPage" :page-count="pageCount" />
            </div>
        </div>
    </n-card>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Back, CalendarThirty, KeyOne, Lightning, Peoples, Refresh, Search, UserBusiness } from '@icon-park/vue-next'
import type { GameRoom } from '@/api/game'
import { listGame } from '@/api/game'
import { formatDate } from '@/utils'
import type { GameTypes } from '@/def/games'
import { getGameTypeMap } from '@/def/games'
import IconButton from '@/universal/components/IconButton.vue'
import Icon from '@/universal/components/Icon.vue'

const emits = defineEmits<{
    (e: 'onJoin', code: string): void
}>()

const router = useRouter()

const currPage = ref(1)
const pageSize = ref(8)
const pageCount = ref(0)
const roomList = ref<GameRoom[]>([])
const gameTypeMap = ref<GameTypes>({})

const currList = computed(() => {
    const pos = (currPage.value - 1) * pageSize.value
    return roomList.value.slice(pos, pos + pageSize.value)
})

async function goBack() {
    await router.push('/regular-home')
}

async function join(room: GameRoom) {
    emits('onJoin', room.joinCode)
}

async function getList() {
    roomList.value = await listGame()
    currPage.value = 1
    pageCount.value = Math.ceil(roomList.value.length / pageSize.value)
}

onMounted(async () => {
    gameTypeMap.value = getGameTypeMap()
    await getList()
})
</script>

<style lang="scss" scoped>
.room-list {
    height: 100%;

    .room-list-body {
        height: 100%;
        display: flex;
        flex-direction: column;

        .room-list-content {
            height: calc(100% - 34px - 28px - 20px);
            margin: 10px 0;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            overflow: auto;

            .room-item {
                width: 100%;
                padding: 10px 0px;
                

                .room-card-content {
                    background: url(/face/doctor/doctor_asleep.webp) bottom right / 80px no-repeat;
                }

                .room-card-content.activated {
                    background-image: url(/face/doctor/doctor_10.webp);
                }

                .game-logo {
                    width: 50px;
                    border-radius: 4px;
                }

                .room-info {
                    margin-bottom: 20px;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                }
            }
        }
    }
}
</style>
