<template>
  <div id="app" class="full-height">
    <router-view />
  </div>
</template>

<script lang="ts">
export default {
  name: 'App',
};
</script>

<style>

.full-height {
  min-height: calc(100vh - 16px);
  display: flex;
  flex-direction: column;
}

</style>
