<template>
  <el-dialog :visible="!visible" :title="title">
    <p>{{ message }}</p>
      <span class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { ElDialog, ElButton } from 'element-plus'

// 定义 props 和 emits
defineProps<{ visible: boolean; message: string; title:string }>()
const emit = defineEmits(['confirm', 'cancel'])

// 方法
const confirm = () => {
  emit('confirm')
}
const cancel = () => {
  emit('cancel')
}
const handleClose = () => {
  emit('cancel')
}
</script>

<style scoped>
/* 可以根据需要添加自定义样式，Element-Plus 的样式已经足够美观，通常不需要额外修改 */
</style>
