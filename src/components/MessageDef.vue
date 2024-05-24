<template>
    <div style="display: none"></div>
</template>

<script lang="ts" setup>
import { useNotification } from 'naive-ui'
import { onMounted } from 'vue'

const notification = useNotification()

onMounted(() => {
    window['notification'] = notification
})
</script>

<style lang="scss" scoped></style>
