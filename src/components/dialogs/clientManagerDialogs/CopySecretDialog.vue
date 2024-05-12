<template>
    <el-dialog class="custom-dialog" v-model="localShowDialog">
        <div class="content-container">
            <h3>请复制并保存以下应用Id和Secret</h3>
            <p>警告：关闭对话框后将无法再次查看该应用对应的Secret。请不要泄露Secret给任何第三方。</p>
            <label for="clientId">应用Id:</label>
            <div id="clientId" class="client-secret">{{ localClientId }}</div>
            <label for="clientSecret">应用Secret:</label>
            <div id="clientSecret" class="client-secret">{{ localClientSecret }}</div>
        </div>
        <template #footer>
            <el-button class="dialog-button" @click="closeDialog">已复制，关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const localShowDialog = ref(false)
const localClientId = ref("")
const localClientSecret = ref("")
let resolveDialog: any = null;

const closeDialog = () => {
    localShowDialog.value = false;
    resolveDialog && resolveDialog(true);
};

const showDialog = async (clientId: string, clientSecret: string) => {
    return new Promise<boolean>((resolve) => {
        resolveDialog = resolve;
        localShowDialog.value = true;
        localClientId.value = clientId;
        localClientSecret.value = clientSecret;
    });
};

defineExpose({ showDialog });
</script>
  
<style scoped>
.client-secret {
    padding: 10px;
    border: 1px solid #ccc;
    font-family: monospace;
}
</style>
  