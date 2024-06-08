<template>
    <div class="container">
        <img src="/face/doctor/doctor_hope.webp" alt="移动端不支持" class="cute-image" />
        <p class="message">Opps... 这个页面的手机版还没做呢。<br/>先用电脑浏览器访问看看吧。</p>
    </div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f5f5f5;
    text-align: center;
}

.cute-image {
    max-width: 100%;
    height: auto;
    margin-bottom: 20px;
}

.message {
    font-size: 1.2em;
    color: #333;
}
</style>