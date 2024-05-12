<template>
  <el-dialog title="任务设置" v-model="dialogVisible" :close-on-click-modal="false" width="800px">
    <div class="dialog-content">
      <div class="dialog-row">
        <label for="togglePeriodic" class="dialog-label">周期重复:</label>
        <el-switch v-model="isPeriodic" id="togglePeriodic"></el-switch>
      </div>
      <div class="dialog-row" v-if="isPeriodic">
        <label for="settingsTaskName" class="dialog-label">任务名称:</label>
        <el-input v-model="settingsTaskName" id="settingsTaskName"
          placeholder="请输入任务名称"></el-input>
      </div>
      <div class="dialog-row">
        <label for="taskType" class="dialog-label">任务类型:</label>
        <el-select v-model="taskType" id="taskType" placeholder="请选择" @change="handleTaskTypeChange">
          <el-option label="截图任务 (CaptureImage)" value="CaptureImage"></el-option>
          <el-option label="启动一键长草任务 (LinkStart)" value="LinkStart"></el-option>
          <el-option label="单次抽卡任务 (Toolbox-GachaOnce)" value="Toolbox-GachaOnce"></el-option>
          <el-option label="十连抽卡任务 (Toolbox-GachaTenTimes)" value="Toolbox-GachaTenTimes"></el-option>
          <el-option label="修改连接地址设置 (Settings-ConnectAddress)" value="Settings-ConnectAddress"></el-option>
          <el-option label="立即截图任务 (CaptureImageNow)" value="CaptureImageNow"></el-option>
          <el-option label="结束当前任务 (StopTask)" value="StopTask"></el-option>
          <el-option label="一键长草-基建任务 (LinkStart-Base)" value="LinkStart-Base"></el-option>
          <el-option label="一键长草-唤醒任务 (LinkStart-WakeUp)" value="LinkStart-WakeUp"></el-option>
          <el-option label="一键长草-战斗任务 (LinkStart-Combat)" value="LinkStart-Combat"></el-option>
          <el-option label="一键长草-公招任务 (LinkStart-Recruiting)" value="LinkStart-Recruiting"></el-option>
          <el-option label="一键长草-商店购物任务 (LinkStart-Mall)" value="LinkStart-Mall"></el-option>
          <el-option label="一键长草-领取奖励任务 (LinkStart-Mission)" value="LinkStart-Mission"></el-option>
          <el-option label="一键长草-自动肉鸽任务 (LinkStart-AutoRoguelike)" value="LinkStart-AutoRoguelike"></el-option>
          <el-option label="一键长草-生息演算任务 (LinkStart-ReclamationAlgorithm)"
            value="LinkStart-ReclamationAlgorithm"></el-option>
        </el-select>
      </div>
      <div class="dialog-row" v-if="false">
        <label for="linkStartCombatStage" class="dialog-label">战斗关卡:</label>
        <el-select v-model="linkStartCombatStage" id="linkStartCombatStage" placeholder="请选择关卡">
          <el-option label="1-7" value="1-7"></el-option>
          <el-option label="CE-6" value="CE-6"></el-option>
          <el-option label="ZT-8" value="ZT-8"></el-option>
          <el-option label="ZT-9" value="ZT-9"></el-option>
          <el-option label="ZT-10" value="ZT-10"></el-option>
        </el-select>
      </div>
      <div class="dialog-row" v-if="taskType === 'Settings-ConnectAddress'">
        <label for="settingsConnectionAddressStr" class="dialog-label">连接地址:</label>
        <el-input v-model="settingsConnectionAddressStr" id="settingsConnectionAddressStr"
          placeholder="请输入连接地址"></el-input>
      </div>

      <div class="dialog-row" v-if="isPeriodic">
        <label for="startTime" class="dialog-label">开始时间:</label>
        <el-config-provider :locale="zhCn">
          <el-date-picker v-model="startTime" type="datetime" placeholder="从特定时间开始重复" id="startTime"
            format="YYYY-MM-DD HH:mm:ss">
          </el-date-picker>
        </el-config-provider>
      </div>      
      <div class="dialog-row" v-if="isPeriodic">
        <label for="toggleNeverStop" class="dialog-label">永不停止:</label>
        <el-switch v-model="neverStop" id="toggleNeverStop"></el-switch>
      </div>
      <div class="dialog-row" v-if="isPeriodic && !neverStop">
        <label for="endTime" class="dialog-label">结束时间:</label>
        <el-config-provider :locale="zhCn">
          <el-date-picker v-model="endTime" type="datetime" placeholder="到特定时间为止" id="endTime"
            format="YYYY-MM-DD HH:mm:ss">
          </el-date-picker>
        </el-config-provider>
      </div>
      <div class="dialog-row" v-if="isPeriodic">
        <label for="endTime" class="dialog-label">周期:</label>
        <cron-element-plus v-model="cronExpression" :button-props="{ type: 'primary' }" locale="cn"
          :custom-locale="cn.dict" @error="cronError = $event" />
      </div>
    </div>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </template>
  </el-dialog>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';
import '@vue-js-cron/element-plus/dist/element-plus.css';
import { CronElementPlus } from '@vue-js-cron/element-plus';
import { getLocale } from '@vue-js-cron/core';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { ElDatePicker } from 'element-plus';

const cn = getLocale('zh-CN');
const dialogVisible = ref(false);
const taskType = ref('');
const linkStartCombatStage = ref('');
const settingsTaskName = ref('');
const settingsConnectionAddressStr = ref('');
const cronExpression = ref('* * * * *');
const cronError = ref('');
const isPeriodic = ref(false);
const startTime = ref();
const endTime = ref();
const neverStop = ref();

interface CreateTaskData {
  name:string;
  taskType: string;
  parameters: string;
  isPeriodic: boolean;
  startTime: Date;
  endTime: Date;
  cronExpression: string;
}

// 处理任务类型变化的函数
const handleTaskTypeChange = (value: string) => {
  taskType.value = value
}

const cancel = () => {
  dialogVisible.value = false;
  resolveDialog && resolveDialog(null);
};

// 表单提交的函数
const submitForm = () => {

  const dataToReturn: CreateTaskData = {
    name: settingsTaskName.value,
    taskType: taskType.value,
    parameters: '',
    isPeriodic: isPeriodic.value,
    startTime: startTime.value,
    endTime: endTime.value,
    cronExpression: cronExpression.value,
  }

  switch (taskType.value) {
    case 'Settings-ConnectAddress':
      dataToReturn.parameters = settingsConnectionAddressStr.value;
      break;
    default:
      break;
  }

  if (validateForm(dataToReturn)) {
    dialogVisible.value = false
    resolveDialog && resolveDialog([dataToReturn]);
  } else {

  }
}

// 假设的表单验证函数
const validateForm = (data: CreateTaskData): boolean => {
  if (!data.taskType) {
    return false;
  }
  return true
}

// 用于解析对话框关闭时的Promise
let resolveDialog: ((value: CreateTaskData[] | PromiseLike<CreateTaskData[]> | null) => void) | null = null;

const showDialog = () => {
  return new Promise<CreateTaskData[] | null>((resolve) => {
    resolveDialog = resolve;
    dialogVisible.value = true;
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
.el-select {
  margin-right: 10px;
  width: 100%;
}

.el-button {
  margin-right: 10px;
}

/* 根据实际需要调整样式 */
</style>