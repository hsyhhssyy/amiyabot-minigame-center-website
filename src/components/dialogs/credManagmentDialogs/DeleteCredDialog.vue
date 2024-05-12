<template>
    <el-dialog class="custom-dialog" v-model="localShowDialog" width="600px">
        <div class="content-container">
            <h3 class="dialog-title">确认删除</h3>
            <p class="dialog-text">你确定要删除以下凭据吗？</p>
            <div class="dialog-item">角色名: <span class="dialog-item-value">{{ localCredName }}</span></div>
            <div class="dialog-item">凭据值: <span class="dialog-item-value">{{ localCredValue }}</span></div>
        </div>
        <template #footer>
            <el-button class="dialog-button" type="danger" @click="confirm">删除</el-button>
            <el-button class="dialog-button" @click="cancel">取消</el-button>
        </template>
    </el-dialog>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';

const localShowDialog = ref(false)
const localCredName = ref("")
const localCredValue = ref("")
let resolveDialog: any = null;

const cancel = () => {
    localShowDialog.value = false;
    resolveDialog && resolveDialog(false); 
};

const confirm = () => {
    localShowDialog.value = false;
    resolveDialog && resolveDialog(true); 
};

const showDialog = async (credName:string,credValue:string) => {
  return new Promise<boolean>((resolve) => {
    resolveDialog = resolve; 
    localShowDialog.value = true; 
    localCredName.value=credName;
    localCredValue.value=credValue;
  });
};

// 向外暴露方法
defineExpose ({ showDialog });

</script>
  
<style scoped>
.custom-dialog {
    border-radius: 12px;
}

.content-container {
    padding: 20px;
}

.dialog-title {
    font-size: 24px;
    margin-bottom: 16px;
}

.dialog-text {
    font-size: 18px;
    margin-bottom: 16px;
}

.dialog-item {
    font-size: 16px;
    margin-bottom: 8px;
}

.dialog-item-value {
    font-weight: 600;
}

.dialog-button {
    margin-right: 8px;
}
</style>
  
  