<template>
    <n-button :type="props.type || 'default'" :size="props.size || 'medium'" :text="text" @click="handleClick" :loading="loading">
        <template #icon>
            <icon :icon="props.icon" />
        </template>
        <slot></slot>
    </n-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { Size, Type } from 'naive-ui/lib/button/src/interface'
import Icon from '@/universal/components/Icon.vue'

const props = defineProps<{
    icon: any
    type?: Type
    size?: Size
    text?: boolean
}>()

const loading = ref(false)

const emit = defineEmits(['click'])

let timeout: NodeJS.Timeout | undefined
let lastTime = 0
const wait = 300 // 防抖等待时间


async function handleClick(): Promise<void> {
  const now = Date.now()
  if (now - lastTime < wait) {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      lastTime = now
      await emit('click')
    }, wait)
  } else {
    lastTime = now
    await emit('click')
  }
}


</script>

<style lang="scss" scoped></style>
