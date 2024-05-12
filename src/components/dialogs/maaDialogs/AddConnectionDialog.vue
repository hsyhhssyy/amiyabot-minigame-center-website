<template>
  <el-dialog class="complete-connection-dialog" v-model="dialogVisible" title="创建连接" :close-on-click-modal="false" width="700px">
    <div class="dialog-content">
      <div class="dialog-row">
        <label for="connectionName" class="dialog-label">自定义名称:</label>
        <el-input v-model="connectionName" id="connectionName" placeholder="请输入连接名称"></el-input>
      </div>
      <div class="dialog-row">
        <label for="deviceIdentity" class="dialog-label">设备标识符:</label>
        <el-input v-model="deviceIdentity" id="deviceIdentity" placeholder="请输入设备标识符"></el-input>
      </div>
      <div class="dialog-row">
        <label for="userIdentity" class="dialog-label">用户标识符:</label>
        <el-input v-model="userIdentity" id="userIdentity" readonly></el-input>
        <el-button type="primary" @click="copyUserIdentity">复制</el-button>
      </div>
      <div class="dialog-row">
        <label for="userIdentity" class="dialog-label">获取任务端点:</label>
        <el-input v-model="getTaskEndpoint" id="getTaskEndpoint" readonly></el-input>
        <el-button type="primary" @click="copyGetTaskEndpoint">复制</el-button>
      </div>
      <div class="dialog-row">
        <label for="userIdentity" class="dialog-label">汇报任务端点:</label>
        <el-input v-model="reportStatusEndpoint" id="reportStatusEndpoint" readonly></el-input>
        <el-button type="primary" @click="copyReportStatusEndpoint">复制</el-button>
      </div>
      <!-- 一段说明 -->
      <div class="tips-text">
        <p>请将用户标识符，获取任务端点，汇报任务端点填写到您的MAA中，然后将MAA中的设备标识符复制填进对话框，然后点击MAA的测试连接。</p>
        <p>MAA端提示连接成功后，为您的连接起一个好记的名字，然后点击对话框的提交按钮。</p>
        <p>您可以在连接列表中查看您的设备的连接状态。</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitIdentity">提交</el-button>
    </template>
  </el-dialog>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';
import { completeConnection } from '../../../api/MAAConnection';
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false);
const userIdentity = ref('');
const connectionId = ref('');
const deviceIdentity = ref('');
const connectionName = ref('');
const getTaskEndpoint = ref('https://amiya-bot-service.hsyhhssyy.net/api/maa/getTask')
const reportStatusEndpoint = ref('https://amiya-bot-service.hsyhhssyy.net/api/maa/reportStatus')

// 用于解析对话框关闭时的Promise
let resolveDialog: ((value: boolean | PromiseLike<boolean>) => void) | null = null;

const cancel = () => {
  dialogVisible.value = false;
  resolveDialog && resolveDialog(false);
};

const copyUserIdentity = async () => {
  await navigator.clipboard.writeText(userIdentity.value);
  ElMessage.success(`复制成功`);
};
const copyGetTaskEndpoint = async () => {
  await navigator.clipboard.writeText(getTaskEndpoint.value);
  ElMessage.success(`复制成功`);
};
const copyReportStatusEndpoint = async () => {
  await navigator.clipboard.writeText(reportStatusEndpoint.value);
  ElMessage.success(`复制成功`);
};

const submitIdentity = () => {
  if (deviceIdentity.value.trim() === '') {
    ElMessage.error(`请输入设备标识符`);
    return;
  }

  if (connectionName.value.trim() === '') {
    ElMessage.error(`请输入连接名称`);
    return;
  }

  completeConnection(connectionId.value,deviceIdentity.value,connectionName.value).then(() => {
    dialogVisible.value = false;
    resolveDialog && resolveDialog(true);
  }).catch((error:any) => {
    ElMessage.error(`连接列表获取失败: ${error.message}`);
  });
};

const showDialog = (id:string, userIdentityValue: string) => {
  return new Promise<boolean>((resolve) => {
    resolveDialog = resolve;
    dialogVisible.value = true;
    userIdentity.value = userIdentityValue;
    connectionId.value = id;
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
  align-items: center;
  margin-bottom: 10px;
}

.dialog-label {
  margin-right: 10px;
  min-width: 100px;
}

.el-input,
.el-button {
  margin-right: 10px;
}

/* 根据实际需要调整样式 */
</style>
  