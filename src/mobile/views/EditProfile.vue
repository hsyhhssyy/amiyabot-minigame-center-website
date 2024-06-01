<template>
    <n-card size="small" role="dialog" aria-modal="true" style="height: 100%;">
        <n-flex style="height: 100%;" vertical>
            <n-form style="flex-grow: 1;">
                <div style="display: flex; flex-direction: row; ">
                    <n-form-item label="昵称" style="flex-shrink: 1; flex-grow: 1; margin-right: 5px">
                        <n-input v-model:value="nickname"></n-input>
                    </n-form-item>
                    <n-button text @click="showEditAvatar = true">
                        <img class="editing-avatar" :src="showingAvatar" alt="avatar" referrerpolicy="no-referrer" />
                    </n-button>
                </div>
                <n-form-item label="修改密码">
                    <n-switch v-model:value="changePassword">
                        <template #checked>修改密码</template>
                        <template #unchecked>修改密码</template>
                    </n-switch>
                </n-form-item>
                <n-form-item label="旧密码" v-if="changePassword">
                    <n-input type="password" v-model:value="oldPassword"></n-input>
                </n-form-item>
                <n-form-item label="新密码" v-if="changePassword">
                    <n-input type="password" v-model:value="newPassword"></n-input>
                </n-form-item>
                <n-form-item label="确认密码" v-if="changePassword">
                    <n-input type="password" v-model:value="confirmPassword" ></n-input>
                </n-form-item>
            </n-form>
            <n-flex justify="end">
                <icon-button :icon="Save" type="success" @click="save">确认修改</icon-button>
                <icon-button :icon="Back" type="error" @click="goBack">返回</icon-button>
            </n-flex>
        </n-flex>
    </n-card>
    <n-modal class="select-avatar-modal" v-model:show="showEditAvatar" style="width: 80vw; height: 80vh;">
        <n-card size="small" title="选择头像" role="dialog" aria-modal="true">
            <n-flex justify="space-between" style="height: 100%;">
                <n-card class="avatar-picker">
                    <operator-picker v-model="selectedAvatar" /></n-card>
                <n-flex justify="end" style="width: 100%;">
                    <icon-button :icon="Save" type="success" @click="selectAvatar">确认修改</icon-button>
                    <icon-button :icon="Back" type="error" @click="cancelSelectAvatar">返回</icon-button>
                </n-flex>
            </n-flex>
        </n-card>
    </n-modal>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Save,Back } from '@icon-park/vue-next'
import OperatorPicker from '@/mobile/components/OperatorPicker.vue'
import IconButton from '@/universal/components/IconButton.vue'
import type { Avatar } from '@/def/avatar';
import {toast} from '@/utils'
import { changeUserInfoApi,changePasswordApi } from '@/api/account';

const router = useRouter()

const changePassword = ref(false)
const showEditAvatar = ref(false)

const lastSelectedAvatar = ref<Avatar>()
const selectedAvatar = ref<Avatar>()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showingAvatar = computed(() => {
 
    if (lastSelectedAvatar.value) {
        return lastSelectedAvatar.value.url;
    }    
 
    return user.userAvatar
    
})

const user = useUserStore()
const nickname = ref(user.userName)


const selectAvatar = () => {
    lastSelectedAvatar.value = selectedAvatar.value
    showEditAvatar.value = false
}

const cancelSelectAvatar = () => {
    showEditAvatar.value = false
}

const goBack = () => {
    router.push('/m/regular-home')
}

const save = async () => {
    if( changePassword.value === true && newPassword.value !== confirmPassword.value){
        await toast('两次输入的密码不一致')
        return
    }

    if( changePassword.value === true && oldPassword.value === ''){
        await toast('请输入旧密码')
        return
    }

    if( changePassword.value === true && newPassword.value === ''){
        await toast('请输入新密码')
        return
    }

    const ret = await changeUserInfoApi(nickname.value,lastSelectedAvatar.value?.url??'','YJCDN')

    if (ret) {
        var passRet:any;
        if( changePassword.value === true){
            passRet = await changePasswordApi(oldPassword.value,newPassword.value)
        }

        if (changePassword.value !== true || passRet) {
            await user.init()
            router.push('/m/regular-home')
        }

    }
}

</script>

<style lang="scss" scoped>
.editing-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 10px;
}

.select-avatar-modal{

    .avatar-picker{
        height: calc( 100% - 60px );
        overflow: hidden
    }

}
</style>