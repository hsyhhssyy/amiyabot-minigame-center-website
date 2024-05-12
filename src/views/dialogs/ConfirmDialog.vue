<!-- ConfirmDialog.vue -->
<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal">
      <p>{{ message }}</p>
      <button @click="confirm">确定</button>
      <button @click="cancel">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

// 定义 props 和 emits
defineProps<{ visible: boolean; message: string }>()
const emit = defineEmits(['confirm', 'cancel'])

// 方法
const confirm = () => emit('confirm')
const cancel = () => emit('cancel')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

button {
  margin: 10px;
}
</style>