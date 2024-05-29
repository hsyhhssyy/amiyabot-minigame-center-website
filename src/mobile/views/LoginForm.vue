<template>
    <div class="login-form">
        <template v-if="props.type === 'visitor'">
            <n-form-item label="昵称">
                <n-input v-model:value="nickname" type="text" placeholder="请输入昵称" @keydown.enter="quickRegister">
                    <template #prefix>
                        <icon :icon="UserIcon" />
                    </template>
                </n-input>
            </n-form-item>
        </template>
        <template v-else>
            <n-form-item label="邮箱">
                <n-input v-model:value="email" type="text" placeholder="请输入邮箱" @keydown.enter="action" autocomplete="username">
                    <template #prefix>
                        <icon :icon="Mail" />
                    </template>
                </n-input>
            </n-form-item>
            <n-form-item label="密码">
                <n-input v-model:value="password" type="password" placeholder="请输入密码" @keydown.enter="action">
                    <template #prefix>
                        <icon :icon="KeyOne" />
                    </template>
                </n-input>
            </n-form-item>
            <n-form-item label="重复密码" v-if="props.type === 'register'">
                <n-input v-model:value="repeatPassword" type="password" placeholder="请输入密码" @keydown.enter="action">
                    <template #prefix>
                        <icon :icon="KeyOne" />
                    </template>
                </n-input>
            </n-form-item>
        </template>
        <div class="button-group">
            <icon-button :icon="LoginIcon" type="success" v-if="props.type === 'user'" @click="action">
                登录
            </icon-button>
            <icon-button :icon="DoneAll" type="info" v-if="props.type === 'register'" @click="action">
                注册
            </icon-button>
            <icon-button :icon="Game" type="warning" v-if="props.type === 'visitor'" @click="quickRegister">
                直接开玩！
            </icon-button>
            <icon-button :icon="Back" @click="goBack" class="back">返回</icon-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Back, DoneAll, Game, KeyOne, Login as LoginIcon, Mail, User as UserIcon } from '@icon-park/vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { verifyTokenApi, quickRegisterApi, loginApi, registerApi } from '@/api/account'
import IconButton from '@/universal/components/IconButton.vue'
import Icon from '@/universal/components/Icon.vue'
import { toast } from '@/utils'

const props = defineProps<{
    type: string
}>()

const emit = defineEmits<{
    (e: 'back'): void
}>()

const router = useRouter()

const email = ref('')
const password = ref('')
const nickname = ref('')
const repeatPassword = ref('')

async function action() {
    if (props.type === 'user') {
        await login()
    } else {
        await register()
    }
}

async function login() {
    const res = await loginApi(email.value,password.value)
    if (res && res.token) {
        if (await verifyTokenApi(res.token)) {
            await router.push('/')
        }
    }
}

async function register() {
    if (password.value !== repeatPassword.value) {
        await toast('两次密码不一致')
        return
    }
    if(email.value === '') {
        await toast('邮箱不能为空')
        return
    }
    if(password.value === '') {
        await toast('密码不能为空')
        return
    }
    const nickname = '游客博士#' + Math.floor(Math.random() * 10000)
    const res = await registerApi(email.value,password.value,nickname)
    if (res && res.message) {
        await toast(res.message)
        await goBack()
    }
}

async function quickRegister() {
    if(nickname.value === '') {
        await toast('昵称不能为空')
        return
    }
    const res = await quickRegisterApi(nickname.value)
    if (res && res.token) {
        if (await verifyTokenApi(res.token)) {
            await router.push('/')
        }
    }
}

async function goBack() {
    emit('back')
}
</script>

<style lang="scss" scoped>
.login-form {
    display: flex;
    flex-direction: column;
    width: 300px;
}

.button-group {
    width: 100%;
    display: flex;

    .back {
        width: 80px;
        margin-left: 10px;
    }

    & > button:not(.back) {
        flex: 2;
    }
}
</style>
