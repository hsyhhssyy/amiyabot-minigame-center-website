<template>
    <el-container>
        <el-header class="header">
            <h2>房间列表</h2>
            <div class="button-groups">
                <el-input v-model="searchQuery" placeholder="搜索房间" clearable @clear="handleSearch"
                    @input="handleSearch"></el-input>
                <el-button type="primary" @click="fetchRooms">刷新房间列表</el-button>
                <el-button type="default" @click="handleBackHome">返回首页</el-button>
            </div>
        </el-header>
        <el-main>
            <div>
                <el-pagination @current-change="handlePageChange" :current-page="currentPage" :page-size="pageSize"
                    :total="filteredRooms.length" layout="prev, pager, next">
                </el-pagination>
            </div>
            <el-row :gutter="20">
                <el-col :span="isMobile ? 24 : 8"  v-for="room in paginatedRooms" :key="room.id">
                    <RoomCard :room="room" @joinRoom="joinRoom" />
                </el-col>
            </el-row>
            <div>
                <el-pagination @current-change="handlePageChange" :current-page="currentPage" :page-size="pageSize"
                    :total="filteredRooms.length" layout="prev, pager, next">
                </el-pagination>
            </div>
        </el-main>

        <el-dialog v-model="isJoinDialogVisible" title="加入房间" :center="true" :show-close="false">
            <div style="text-align: center;">要加入{{roomToJoin?.creator}}的房间吗</div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="secondary" @click="handleCancelJoin">取消</el-button>
                    <el-button type="primary" @click="handleJoin">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </el-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { listGame } from '@src/api/Game'
import RoomCard from '@src/components/RoomCard.vue'
import { Room } from '@src/api/GamesData.ts';

const router = useRouter()

// 使用假数据
const rooms = ref<Room[]>([])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const isJoinDialogVisible = ref(false)
const roomToJoin = ref<Room | null>(null)
const isMobile = ref(window.innerWidth <= 768)

const filteredRooms = computed(() => {
    return rooms.value.filter(room =>
        room.creator.includes(searchQuery.value)
    )
})

const paginatedRooms = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredRooms.value.slice(start, end)
})

const fetchRooms = async () => {
    try {
        const response = await listGame()
        rooms.value = response.map((room: any) => {
            return {
                id: room.id,
                creator: room.creatorNickname,
                creatorAvatar: room.creatorAvatar??"/ceobe.jpeg",
                createTime: new Date(room.createTime),
                isStarted: room.isStarted,
                isCompleted: room.isCompleted,
                isClosed: room.isClosed,
                gameType: room.gameType,
                playerCount: Object.keys(room.playerList).length,
                isPrivate: room.isPrivate,
            }
        })
        ElMessage.success('房间列表已刷新')
    } catch (error) {
        ElMessage.error('获取房间列表失败')
    }
}

const joinRoom = (room: any) => {
    roomToJoin.value = room
    isJoinDialogVisible.value = true
}

const handlePageChange = (page: number) => {
    currentPage.value = page
}

const handleSearch = () => {
    currentPage.value = 1
}

const handleCancelJoin = () => {
    isJoinDialogVisible.value = false
    roomToJoin.value = null
}

const handleJoin = () => {
    const roomId = roomToJoin.value?.id
    if (!roomId) {
        ElMessage.error('加入房间出错')
        return
    }
    localStorage.setItem('current-game-id', roomId)
    isJoinDialogVisible.value = false
    roomToJoin.value = null
    router.push('/regular-home/join-room')
}

const handleBackHome = () => {
    router.push('/regular-home');
}

onMounted(() => {
    fetchRooms()
    window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth <= 768
    })
})
</script>

<style scoped>
.header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: auto;
}

.el-main {
    padding: 0px;
}

.button-groups {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.button-groups .el-input {
    margin-right: 10px;
}

.el-pagination {
    text-align: center;
}

.el-container {
    padding: 20px;
}



@media (max-width: 768px) {
    .el-container {
        padding: 10px;
    }

    .el-header {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 10px;
    }

    .button-groups {
        flex-direction: column;
    }

    .button-groups .el-button {
        width: 100%;
        margin-bottom: 10px;
    }

    .button-groups .el-button+.el-button {
        margin-left: 0px;
    }

    .button-groups .el-input {
        width: 100%;
        margin-right: 0px;
        margin-bottom: 10px;
    }
}
</style>