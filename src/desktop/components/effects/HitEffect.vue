<template>
    <div class="popup hit-effect" :style="style" v-if="show"></div>
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

const style = computed<CSSProperties>(() => {
    return {
        backgroundImage: `url(/face/amiya/amiya_${type.value}.webp)`
    }
})

async function hit(t: HitType = 'expectation') {
    show.value = false
    type.value = t
    show.value = true
    await sleep(1000)
    show.value = false
}

defineExpose({ hit })
</script>

<style lang="scss" scoped>
.popup {
    width: 180px;
    height: 180px;
    background: center / 100% no-repeat;
    position: absolute;
    top: 50%;
    left: 50%;
    opacity: 0;
    transform: translate(-50%, -50%);
    z-index: 999;
}

.popup.hit-effect {
    display: block;
    animation: fadeInAndOut 1s ease-in-out forwards;
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
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.2);
    }
}
</style>
