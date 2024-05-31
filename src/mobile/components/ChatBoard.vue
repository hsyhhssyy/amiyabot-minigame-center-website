<template>
    <n-card class="chat">
        <div class="chat-input-container">
            <n-input
                class="chat-input"
                :placeholder="props.placeholder || '输入干员名称...'"
                v-model:value="inputMessage"
                @keydown.enter="sendMessage"
            />
            <icon-button class="chat-button" :icon="SendOne" type="success" @click="sendMessage"></icon-button>
            <n-badge :value="unreadMessage" :max="99">
                <icon-button class="chat-button" :icon="Communication" type="info" @click="openChatLog"></icon-button>
            </n-badge>
            <icon-button class="chat-button" :icon="Peoples" type="warning"  @click="openPlayerList"></icon-button>
        </div>
    </n-card>
    <n-modal class="create-collection" v-model:show="showChatLog">
        <n-card class="message-window" embedded :bordered="false">
            <div style="height: 100%; overflow: auto;" ref="chatBoard">
                <n-space
                    style="margin-bottom: 10px"
                    v-for="(item, index) in messages"
                    :key="index"
                    :size="6"
                    :justify="userId === item.userId ? 'end' : 'start'"
                >
                    <n-avatar
                        :src="item.avatar"
                        size="large"
                        v-if="userId !== item.userId"
                        :img-props="{ referrerpolicy: 'no-referrer' }"
                    />
                    <n-space vertical :size="0" :align="userId === item.userId ? 'end' : 'start'">
                        {{ item.nickname }}
                        <n-card class="message-content" size="small">
                            <component :is="item.content" v-if="item.isComponent" />
                            <span v-else>{{ item.content }}</span>
                        </n-card>
                    </n-space>
                    <n-avatar
                        :src="item.avatar"
                        size="large"
                        v-if="userId === item.userId"
                        :img-props="{ referrerpolicy: 'no-referrer' }"
                    />
                </n-space>
            </div>
        </n-card>
    </n-modal>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { SendOne,Communication,Peoples } from '@icon-park/vue-next'
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

async function openChatLog() 
{
    unreadMessage.value = 0
    showChatLog.value = true
}

async function openPlayerList() 
{
    emits('onShowPlayerList')
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
    
    if(getData('user-id')!==msg.userId){
        unreadMessage.value++
    }
}

defineExpose({ pushMessage })

watch(
    messages,
    () => {
        nextTick(() => (chatBoard.value.scrollTop = chatBoard.value.scrollHeight))
    },
    { deep: true }
)

onMounted(async () => {
    !props.inputHandler && gameHub.addGameHubListener('Chat', chatListener)
})

onUnmounted(async () => {
    !props.inputHandler && gameHub.removeGameHubListener('Chat', chatListener)
})
</script>

<style lang="scss" scoped>
.chat {

    .chat-input-container{
        display: flex;
        align-items: center;
    }

    .chat-button{
        flex-grow: 1;
    }

    .chat-button{
        margin-left: 5px;
    }
}



.message-window {
    height: calc(80vh);
    width: 80vw;

    .message-content {
        box-shadow: var(--n-box-shadow);
    }
}
</style>
