<template>
    <template v-if="!isLoading">
        <router-view/>
    </template>
    <div v-else class="loading">
            <img src="/face/31ebcd457ec04b3b712e417c926a0dba36816755.gif" alt="loading" />
            <div>连接服务器中，请稍候...</div>
            <icon-button :icon="Logout" @click="logout" type="error">退出登录</icon-button>
        </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Logout } from '@icon-park/vue-next'
import { useGameHubStore } from '@/stores/gamehub'
import { useRouter } from 'vue-router'
import IconButton from '@/universal/components/IconButton.vue'

const router = useRouter()
const gameHub = useGameHubStore()
const isLoading = ref(true)

watch(
    computed(() => gameHub.isConnected),
    (_) => {
        checkloading()
    },
    {
        immediate: true
    }
)

function checkloading(){

    if(gameHub.isConnected){
        isLoading.value = false
    }

}

async function logout() {
    await router.push('/m/logout')
}

</script>

<style scoped lang="scss">
.loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 50px;

        &>img {
            width: 100px;
            height: 100px;
        }

        &>div {
            margin: 10px 0;
        }
    }
</style>