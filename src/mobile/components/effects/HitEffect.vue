<template>
    <div class="popup chat-container hit-effect" v-if="show">
        <div class="chat-bubble" v-if="bubbleMessage!==''">
            <p>{{ bubbleMessage }}</p>
        </div>
        <div class="image" :style="style"></div>
    </div>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, ref } from 'vue'
import { sleep } from '@/utils'

export type HitType =
    | 'angry'
    | 'doubt'
    | 'emmm'
    | 'expectation'
    | 'grievance'
    | 'joy'
    | 'nervous'
    | 'refuse'
    | 'shock'
    | 'shy'
    | 'smile'
    | 'sorry'
    | 'sweat'
    | 'tea'
    | 'wuwu'
    | 'ye'

const type = ref<HitType>('expectation')
const show = ref(false)
const bubbleMessage = ref('')

const style = computed<CSSProperties>(() => {
    return {
        backgroundImage: `url(/face/amiya/amiya_${type.value}.webp)`
    }
})

async function hit(t: HitType = 'expectation', message: string = '') {
    show.value = false
    type.value = t
    show.value = true
    bubbleMessage.value=message
    await sleep(1000)
    show.value = false
}

defineExpose({ hit })
</script>

<style lang="scss" scoped>
.popup {
    position: absolute;
    top: 50%;
    left: 50%;
    opacity: 0;
}

.image {
    background: center / 100% no-repeat;
    width: 180px;
    height: 180px;
}

.hit-effect {
    display: block;
    animation: fadeInAndOut 1s ease-in-out forwards;
}

.chat-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .chat-bubble {
        position: relative;
        background-color: #f5f5f5;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 5px 10px;
    }
}



@keyframes fadeInAndOut {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
    }

    20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    80% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
    }
}
</style>
