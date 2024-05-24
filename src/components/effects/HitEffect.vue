<template>
    <div class="popup hit-effect" :class="{ refuse: isRefuse }" v-if="isShow"></div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { sleep } from '@/utils'

export default {
    setup() {
        const isRefuse = ref(false)
        const isShow = ref(false)

        async function show(refuse = false) {
            isShow.value = false
            isRefuse.value = refuse
            isShow.value = true
            await sleep(500)
            isShow.value = false
        }

        return {
            isRefuse,
            isShow,
            show
        }
    }
}
</script>

<style lang="scss" scoped>
.popup {
    width: 100px;
    height: 100px;
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

.popup.hit-effect {
    display: block;
    animation: fadeInAndOut 0.5s ease-in-out forwards;
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
