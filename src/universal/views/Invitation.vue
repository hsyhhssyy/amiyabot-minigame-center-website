<template>
    <div>正在解析邀请链接......</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId

onMounted(async () => {
    user.currentRoomId = roomId
    await router.push('/regular-home')
})

</script>