<template>
    <div class="popup hit-effect" :class="type" v-if="show"></div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { sleep } from '@/utils'

export type HitType = 'joy' | 'refuse' | 'sweat'

const type = ref<HitType>('joy')
const show = ref(false)

async function hit(t: HitType = 'joy') {
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
    width: 30%;
    height: 30%;
    background: url(../../assets/face/amiya/amiya_joy.webp) center / 100% no-repeat;
    position: absolute;
    top: 50%;
    left: 50%;
    opacity: 0;
    transform: translate(-50%, -50%);
}

.popup.refuse {
    background-image: url(../../assets/face/amiya/amiya_refuse.webp);
}

.popup.sweat {
    background-image: url(../../assets/face/amiya/amiya_sweat.webp);
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
