<template>
    <el-dialog class="complete-connection-dialog" v-model="dialogVisible" title="任务完成截图" :close-on-click-modal="false"
        width="80%">
        <div class="dialog-content">
            <!-- 显示图片 -->
            <div class="dialog-row">
                <img v-if="screenshot" :src="`data:image/jpeg;base64,${screenshot}`" class="screenshot" />
            </div>
        </div>
        <template #footer>
            <el-button @click="closeDialog">关闭</el-button>
        </template>
    </el-dialog>
</template>
    
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getTaskImage,getRepetitiveTaskImage } from '@src/api/MAAConnection';

const dialogVisible = ref(false);
const taskId = ref('');
const connectionId = ref('');
const screenshot = ref('');

// 用于解析对话框关闭时的Promise
let resolveDialog: ((value: boolean | PromiseLike<boolean>) => void) | null = null;

onMounted(async () => {
    // 加载图片

});

const closeDialog = () => {
    dialogVisible.value = false;
    resolveDialog && resolveDialog(false);
};

const showDialog = (cid: string, tid: string, type:string = "maaTasks") => {
    return new Promise<boolean>(async (resolve) => {
        resolveDialog = resolve;
        dialogVisible.value = true;
        connectionId.value = cid
        taskId.value = tid
        if(type==="maaTask"){
            var imgBase64 = await getTaskImage(connectionId.value, taskId.value)
        }else{
            var imgBase64 = await getRepetitiveTaskImage(connectionId.value, taskId.value)
        }
        if (imgBase64) {
            screenshot.value = imgBase64;
        }
    });
};

defineExpose({ showDialog });

</script>
    
<style scoped>
.complete-connection-dialog {
    border-radius: 20px;
}


.dialog-content {
    margin: 0;
    padding: 20px;
}

.dialog-row {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
}

.dialog-label {
    margin-right: 10px;
    min-width: 100px;
}

.screenshot {
    margin: 10px;
    border-radius: 15px;
    /* 添加柔和边框 */
    border: 5px solid rgba(171, 60, 60, 0.5);
    /* 调整颜色和透明度以得到期望的效果 */

    /* 添加浮雕效果 */
    box-shadow: 5px 5px 5px #ccc, -5px -5px 5px #fff;

    /* 保持图片四角不受圆角影响 */
    overflow: hidden;
}

/* 根据实际需要调整样式 */
</style>
    