<template>
    <component :is="layoutComponent" :key="key"></component>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import DesktopApp from "@/desktop/DesktopApp.vue"
import MobileApp from "@/mobile/MobileApp.vue"

const route = useRoute();
const router = useRouter();
const key = ref(0);
const isMobile = ref(window.innerWidth < 768);

const layoutComponent = computed(() => {
if (route.path.startsWith('/m/')) {
    return MobileApp;
  } else {
    return DesktopApp;
  }
})

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value && !route.path.startsWith('/m/')) {
    router.replace(`/m${route.fullPath}`);
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // 初始化检查
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(route, () => {
  key.value++;
});

</script>

<style scoped lang="scss">
.container {
    width: 100%;
    height: 100%;
    font-size: 14px;
    overflow: hidden;
}
</style>
