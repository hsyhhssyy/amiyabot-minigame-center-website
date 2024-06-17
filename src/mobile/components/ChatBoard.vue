<template>
    <n-card class="chat">
        <div class="chat-input-container">
            <n-input class="chat-input" :placeholder="props.placeholder || '输入干员名称...'" v-model:value="inputMessage"
                @keydown.enter="sendMessage" />
            <icon-button class="chat-button" :icon="SendOne" type="success" @click="sendMessage"></icon-button>
            <n-badge :value="unreadMessage" :max="99">
                <icon-button class="chat-button" :icon="Communication" type="info" @click="openChatLog"></icon-button>
            </n-badge>
            <icon-button class="chat-button" :icon="Peoples" type="warning" @click="openPlayerList"></icon-button>
        </div>

        <n-modal v-model:show="showChatLog" @on-after-enter="onModalShow" title="消息列表" preset="dialog">
            <n-card role="dialog" aria-modal="true" class="message-window" embedded size="small">
                <div style="height: 100%; overflow: auto;" ref="chatBoard">
                    <n-flex style="margin-bottom: 5px" v-for="(item, index) in messages"
                        :key="index" :wrap="false" :justify="userId === item.userId ? 'end' : 'start'">
                        <n-flex>
                            <n-avatar :src="item.avatar" size="large" v-if="userId !== item.userId"
                                :img-props="{ referrerpolicy: 'no-referrer' }" />
                        </n-flex>
                        <div class="message-card-with-name" >
                            {{ item.nickname }}
                            <n-card class="message-content" size="small">
                                <component :is="item.content" v-if="item.isComponent" />
                                <span v-else>{{ item.content }}</span>
                            </n-card>
                        </div>
                        <n-flex>
                            <n-avatar :src="item.avatar" size="large" v-if="userId === item.userId"
                                :img-props="{ referrerpolicy: 'no-referrer' }" />
                        </n-flex>
                    </n-flex>
                </div>
            </n-card>
        </n-modal>
    </n-card>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { SendOne, Communication, Peoples } from '@icon-park/vue-next'
import { getData } from '@/utils'
import { useGameHubStore } from '@/stores/gamehub'
import IconButton from '@/universal/components/IconButton.vue'
import type { SignalrResponse } from '@/api/signalr'
import type { Player } from '@/def/players'

export interface Message {
    userId: string
    nickname: string
    content: string
    avatar: string
    style?: string
    isComponent?: boolean
}

export interface ChatProps {
    roomId: string
    players: Player[]
    placeholder?: string
    inputHandler?: (content: string) => void
}

const props = defineProps<ChatProps>()

const emits = defineEmits<{
    (e: 'onShowPlayerList'): void
}>()

const gameHub = useGameHubStore()

const userId = getData<string>('user-id')
const messages = ref<Message[]>([])
const inputMessage = ref('')
const chatBoard = ref()
const showChatLog = ref(false)
const unreadMessage = ref(0)

function openChatLog() {
    unreadMessage.value = 0
    showChatLog.value = true
    nextTick(() => {
        chatBoard.value.scrollTop = chatBoard.value.scrollHeight
    })
}

async function openPlayerList() {
    emits('onShowPlayerList')
}

function onModalShow() {

}

async function sendMessage() {
    const content = inputMessage.value.trim()
    if (content === '') {
        return
    }
    if (props.inputHandler) {
        props.inputHandler(content)
    } else {
        gameHub.invokeGameHub('Chat', props.roomId, content)
    }
    inputMessage.value = ''
}

async function chatListener(response: SignalrResponse) {
    const player = props.players.find((p) => p.id === response.UserId)
    if (player) {

        pushMessage({
            userId: response.UserId,
            nickname: player.name,
            content: response.Message,
            avatar: player.avatar
        })
    }
}

function pushMessage(msg: Message) {
    messages.value.push(msg)

    if (getData('user-id') !== msg.userId) {
        if (!showChatLog.value) {
            unreadMessage.value++
        }
    }
}

defineExpose({ pushMessage })

watch(
    messages,
    () => {
        nextTick(() => {
            if (chatBoard.value) {
                chatBoard.value.scrollTop = chatBoard.value.scrollHeight
            }
        })
    },
    { deep: true }
)

onMounted(async () => {
    gameHub.addGameHubListener('Chat', chatListener)
})

onUnmounted(async () => {
    gameHub.removeGameHubListener('Chat', chatListener)
})
</script>

<style lang="scss" scoped>
.chat {

    .chat-input-container {
        display: flex;
        align-items: center;
    }

    .chat-button {
        flex-grow: 1;
    }

    .chat-button {
        margin-left: 5px;
    }
}



.message-window {
    height: calc(80vh);
    width: 80vw;
    margin: 0;

    .message-card-with-name {
        display: flex;
        flex-direction: column;
        gap: 0;

        .message-content {
            box-shadow: var(--n-box-shadow);
        }
    }
}
</style>
