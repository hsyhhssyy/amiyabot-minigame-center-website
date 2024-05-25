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
                <n-input v-model:value="email" type="text" placeholder="请输入邮箱" @keydown.enter="action">
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
import { quickLoginAPI, quickRegisterAPI } from '@/api/account'
import IconButton from '@/components/IconButton.vue'
import Icon from '@/components/Icon.vue'

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

async function action() {
    if (props.type === 'user') {
        await login()
    } else {
        await register()
    }
}

async function login() {
    // todo 登录
}

async function register() {
    // todo 注册
}

async function quickRegister() {
    const res = await quickRegisterAPI(nickname.value)
    if (res && res.token) {
        if (await quickLoginAPI(res.token, res.email)) {
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
