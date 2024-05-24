import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const userName = ref('Unknown')
    const userAvatar = ref('')

    return { userName, userAvatar }
})
