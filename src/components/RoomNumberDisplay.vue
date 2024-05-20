<template>
    <div class="room-number" @click="copyToClipboard">
            <i class="fa-solid fa-house room-number-icon"></i> {{ joinCode }}
          </div>
</template>

<script lang="ts" setup>
import { copyInviteLinkToClipboard } from '@src/utils/Clipboard';

interface Props {
    roomId: string;
    joinCode: string;
}

var props = defineProps<Props>();

var copyToClipboard = () => {
  copyInviteLinkToClipboard(props.roomId,props.joinCode)
}

</script>

<style scoped>
.room-number {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
  font-size: 20px;
  margin-right: 10px;
  cursor: pointer;
}
</style>