<template>
    <div>
      <el-button type="primary" @click="addTask">创建任务</el-button>
    </div>
</template>

<script setup lang="ts">
import emitter from '@src/emitter'

const addTask = ()=>{
    emitter.emit('MAATaskListToolbar-addTask', { message: 'New task added!' });
}

</script>