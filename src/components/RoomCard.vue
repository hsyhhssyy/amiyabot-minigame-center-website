<template>
    <el-card :style="{ maxWidth: '700px', margin: 'auto', marginBottom: '10px' }">
        <div style="display: flex; justify-content: space-between;">
            <div class="card-left">
                <div class="avatar-and-nickname">
                <img :src="room.creatorAvatar" alt="Player Avatar" class="avatar" >
                <h3>{{ room.creator }}</h3>
            </div>
                <div>
                    <i class="far fa-calendar-alt"></i> {{ createdAt }}
                </div>
                <div><i class="fas fa-user"></i> {{ room.playerCount }}
                </div>
            </div>
            <div class="card-right">
                <div>
                    <i class="fas fa-gamepad"></i> {{ gameType }}
                </div>
                <div>
                    <span style="margin-left: 20px;"><i class="fas fa-circle"
                            :style="{ color: (status === '等待中'||status === '进行中') ? 'green' : 'red' }"></i> {{
                                status }}</span>
                </div>
                <div style="flex-grow: 1; width: 100%;">
                    <el-button @click="joinRoom(room)" type="primary"
                        style="height: 100%; width: 100%; margin: 10px;">加入</el-button>
                </div>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { Room,games } from '@src/api/GamesData.ts';
import { computed } from 'vue';


interface Props {
  room: Room;
}

const {room} = defineProps<Props>();

const emit = defineEmits(['joinRoom'])

const status = computed(() => {
    return room.isClosed? '已关闭' : (room.isCompleted? '已完成' : (room.isStarted? '进行中' : '等待中'))
});

const gameType = computed(() => {
    return games.find(game => game.type === room.gameType)?.name
});

const createdAt = computed(() => {
    return new Date(room.createTime).toLocaleString()
});

const joinRoom = (room: Room) => {
    emit('joinRoom', room)
}

</script>

<style scoped>
.card-left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
}

.card-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
}

.avatar-and-nickname{
    display: flex;
    align-items: center;
    flex-direction: row;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 5px;
}
</style>