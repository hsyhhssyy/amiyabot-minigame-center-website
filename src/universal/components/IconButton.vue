<template>
    <n-button :type="props.type || 'default'" :size="props.size || 'medium'" :text="text" @click="handleClick">
        <template #icon>
            <icon :icon="loading ? Loading : props.icon" />
        </template>
        <slot></slot>
    </n-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { Size, Type } from 'naive-ui/lib/button/src/interface'
import Icon from '@/universal/components/Icon.vue'
import { Loading } from '@icon-park/vue-next';

const props = defineProps<{
    icon: any
    type?: Type
    size?: Size
    text?: boolean
}>()

const loading = ref(false)

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
  try{
    emit('click')
    loading.value = false
  }catch(e){
    loading.value = false
    throw e
  }
}, 300)

function handleClick() {
  loading.value = true
  debouncedClick()
}


</script>

<style lang="scss" scoped></style>
