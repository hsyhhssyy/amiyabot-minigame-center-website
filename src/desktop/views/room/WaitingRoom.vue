<template>
    <waiting-room-base :on-on-settings-loaded="onSettingsChange" :settings="roomSettings">
        <div class="waiting-room">
            <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                    <n-switch :rail-style="railStyle" v-model:value="isPrivateRoom">
                        <template #checked>私人房间</template>
                        <template #unchecked>公开房间</template>
                    </n-switch>
                </template>
                <span>私人房间只能通过房间号或邀请链接加入，不能从游戏大厅搜到。</span>
            </n-popover>
        </div>
    </waiting-room-base>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { ref,watch } from 'vue'
import WaitingRoomBase from '@/desktop/views/room/WaitingRoomBase.vue'

const roomSettings = ref<any>()
const isPrivateRoom = ref(false)

watch(isPrivateRoom, (value) => {
    roomSettings.value = {
        IsPrivate: value
    }
    console.log('isPrivateRoom', value)
})

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

function onSettingsChange(Settings:any){
    isPrivateRoom.value = Settings.isPrivateRoom
}

</script>

<style lang="scss" scoped>
.waiting-room {
    height: 100%;
    display: flex;
}
</style>
