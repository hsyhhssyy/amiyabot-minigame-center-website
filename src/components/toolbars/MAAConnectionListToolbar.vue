<template>
    <div>
      <el-button type="primary" @click="addConnection">创建连接</el-button>
    </div>
</template>

<script setup lang="ts">
import emitter from '@src/emitter'

const addConnection = ()=>{
    emitter.emit('MAAConnectionListToolbar-addConnection', { message: 'New connection added!' });
}

</script>