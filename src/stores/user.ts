import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UserInfo } from '@/api/account'
import { describeApi } from '@/api/account'
import store from '@/stores/index'

export const useUserStore = defineStore('user', () => {
    const router = useRouter()

    const userInfo = ref<UserInfo>()
    const userName = ref('')
    const userAvatar = ref('/avatar.webp')

    const currentRoomId = ref<string | null>(null)

    function reset() {
        userInfo.value = undefined
        userName.value = ''
        userAvatar.value = '/avatar.webp'
        currentRoomId.value = null
    }

    async function init() {
        const descRet = await describeApi()
        if (!descRet) {
            await router.push('/logout')
            return
        }

        reset()

        userInfo.value = descRet
        userName.value = descRet.nickname
        if (descRet.avatar) {
            userAvatar.value = descRet.avatar
        }
    }

    init().then()

    return { userInfo, userName, userAvatar, currentRoomId, init , reset }
})

export function useUser() {
    return useUserStore(store)
}
