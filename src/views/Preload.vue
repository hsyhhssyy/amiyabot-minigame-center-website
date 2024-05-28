<template>
    <div style="display: none"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const preloadedImages = ref([])

function preloadImages() {
    const imageUrls = [
        '/face/amiya/amiya_angry.webp',
        '/face/amiya/amiya_doubt.webp',
        '/face/amiya/amiya_emmm.webp',
        '/face/amiya/amiya_expectation.webp',
        '/face/amiya/amiya_grievance.webp',
        '/face/amiya/amiya_joy.webp',
        '/face/amiya/amiya_nervous.webp',
        '/face/amiya/amiya_refuse.webp',
        '/face/amiya/amiya_shock.webp',
        '/face/amiya/amiya_shy.webp',
        '/face/amiya/amiya_smile.webp',
        '/face/amiya/amiya_sorry.webp',
        '/face/amiya/amiya_sweat.webp',
        '/face/amiya/amiya_tea.webp',
        '/face/amiya/amiya_wuwu.webp',
        '/face/amiya/amiya_ye.webp',
        '/face/doctor/doctor_10.webp',
        '/face/doctor/doctor_asleep.webp',
        '/face/doctor/doctor_eat.webp',
        '/face/doctor/doctor_fat.webp',
        '/face/doctor/doctor_fear.webp',
        '/face/doctor/doctor_fully.webp',
        '/face/doctor/doctor_haha.webp',
        '/face/doctor/doctor_hope.webp',
        '/face/doctor/doctor_like.webp',
        '/face/doctor/doctor_run.webp',
        '/face/doctor/doctor_scare.webp',
        '/face/doctor/doctor_sleepy.webp',
        '/face/doctor/doctor_sweat.webp',
        '/face/doctor/doctor_think.webp',
        '/face/doctor/doctor_tired.webp',
        '/face/doctor/doctor_tremble.webp',
        '/face/9c69a5976fd72bd8b404fa1064bec87a36816755.gif',
        '/face/31ebcd457ec04b3b712e417c926a0dba36816755.gif'
    ]

    imageUrls.forEach((url) => {
        const img = new Image()
        img.src = url
        preloadedImages.value.push(img)
    })
}

onMounted(() => {
    preloadImages()
})
</script>

<style lang="scss" scoped></style>
