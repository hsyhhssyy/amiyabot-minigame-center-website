<template>
    <n-button :type="props.type || 'default'" :size="props.size || 'medium'" :text="text" @click="handleClick">
        <template #icon>
            <icon :icon="props.icon" />
        </template>
        <slot></slot>
    </n-button>
</template>

<script lang="ts" setup>
import type { Size, Type } from 'naive-ui/lib/button/src/interface'
import Icon from '@/universal/components/Icon.vue'

const props = defineProps<{
    icon: any
    type?: Type
    size?: Size
    text?: boolean
}>()

const emit = defineEmits(['click'])

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | undefined
  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  } as T
}

const debouncedClick = debounce(() => {
  console.log('debounced click')
  emit('click')
}, 300)

function handleClick() {
  debouncedClick()
}


</script>

<style lang="scss" scoped></style>
