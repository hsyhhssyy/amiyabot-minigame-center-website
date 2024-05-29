<template>
    <n-button :type="props.type || 'default'" :size="props.size || 'medium'" :text="text">
        <template #icon>
            <icon :icon="props.icon" />
        </template>
        <slot></slot>
    </n-button>
</template>

<script lang="ts" setup>
import type { Size, Type } from 'naive-ui/lib/button/src/interface'
import Icon from '@/desktop/components/Icon.vue'

const props = defineProps<{
    icon: any
    type?: Type
    size?: Size
    text?: boolean
}>()
</script>

<style lang="scss" scoped></style>
