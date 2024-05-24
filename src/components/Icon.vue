<template>
    <n-icon :style="styles">
        <component
            :is="props.icon"
            :size="props.size || 20"
            :strokeWidth="props.strokeWidth || 3"
            :theme="props.theme || 'outline'"
        />
    </n-icon>
</template>

<script lang="ts" setup>
import { computed, CSSProperties } from 'vue'

const props = defineProps<{
    icon: any
    size?: number
    theme?: string
    strokeWidth?: number
}>()

const styles = computed<CSSProperties>(() => {
    return {
        marginRight: '3px'
    }
})
</script>

<style lang="scss" scoped></style>
