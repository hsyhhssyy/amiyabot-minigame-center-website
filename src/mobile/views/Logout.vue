<template>
    <div class="logout">
        <div class="icon"></div>
        <div class="text">正在登出...</div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { removeData } from '@/utils'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user';
import { useGameHubStore } from '@/stores/gamehub';

const router = useRouter()
const user = useUserStore()
const gameHub = useGameHubStore()

onMounted(async () => {
    removeData('jwt-token')
    
    user.reset()
    gameHub.close()

    // 给点延迟让大家看看可爱的兔兔！
    setTimeout(async () => await router.push('/login'), 1500)
})
</script>

<style lang="scss" scoped>
.logout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .icon {
        width: 120px;
        height: 120px;
        background: url(/face/9c69a5976fd72bd8b404fa1064bec87a36816755.gif) center / 100% no-repeat;
    }

    .text {
        margin-top: 10px;
        font-size: 16px;
        font-weight: bold;
    }
}
</style>
