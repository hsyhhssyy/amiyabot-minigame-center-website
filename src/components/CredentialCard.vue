<template>
  <el-card :class="{ 'cred-card': true, 'selected': isSelected }">
    <div class="cred-content">
      <img :src="cred.avatarUrl" class="avatar" />
      <div class="text-content">
        <div class="nickname">{{ cred.nickname }}</div>
        <div class="refresh-status">
          <span :class="{ 'green-light': cred.refreshSuccess, 'red-light': !cred.refreshSuccess }"></span>
          <div class="refreshed-at">最后更新：{{ formattedRefreshedAt }}</div>
        </div>
        <div class="cred-value-row">
          <el-tooltip content="复制Cred到剪贴板">
            <el-button class="eye-icon" @click="copyCred" circle size="small" tooltips="S">
              <el-icon>
                <DocumentCopy size="12" />
              </el-icon>
            </el-button></el-tooltip>
          <div class="cred-value">{{ formatedCredValue }}</div>
        </div>
      </div>
      <el-button class="delete-icon" v-if="deleteCred" @click="deleteCred(cred.id)">
        <el-icon>
          <Delete />
        </el-icon>
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Cred {
  id: string;
  nickname: string;
  avatarUrl: string;
  credential: string;
  refreshedAt: string;
  refreshSuccess: boolean;
}

const formattedRefreshedAt = computed(() => {
  if (!cred.refreshedAt) {
    return 'N/A';
  }

  const date = new Date(cred.refreshedAt);

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);

  const findPart = (type: any) => {
    const part = parts.find(p => p.type === type);
    return part ? part.value : '00';
  };

  const formattedDate = `${findPart('year')}-` +
    `${findPart('month')}-` +
    `${findPart('day')} ` +
    `${findPart('hour')}:` +
    `${findPart('minute')}:` +
    `${findPart('second')}`;

  return formattedDate;
})

const formatedCredValue = computed(() => {
  const str = cred.credential;
  if (str.length <= 8) return str;  // 如果字符串太短，直接返回
  return str.slice(0, 4) + '******' + str.slice(-4);
})

const copyCred = async () => {
  await navigator.clipboard.writeText(cred.credential);
};

const props = defineProps<{
  cred: Cred;
  deleteCred?: (id: string) => void;
  isSelected?: boolean;
}>();

const { cred, deleteCred, isSelected = false } = props;

</script>
  
<style scoped>
/* General Styles for Cred Card */
.cred-card {
  width: 320px;
  margin: 10px;
  border-radius: 10px;
  overflow: hidden;
}
.selected {
  border: 2px solid green;
}

/* Cred Content Layout */
.cred-content {
  display: flex;
  align-items: center;
  margin: -10px;
  position: relative;
}

/* Avatar Styles */
.avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

/* Text Content */
.text-content {
  margin-left: 10px;
}
.nickname {
  font-size: 16px;
  line-height: 1.2;
}

/* Refresh Status and Cred Value Row */
.refresh-status,
.cred-value-row {
  display: flex;
  align-items: center;
}
.refreshed-at {
  font-size: 12px;
  line-height: 1.2;
  color: #888;
  margin-top: 2px;
}

/* Cred Value */
.cred-value {
  font-size: 12px;
  line-height: 1.2;
}

/* Refresh Status Light */
.green-light,
.red-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 2px;
}
.green-light {
  background-color: green;
}
.red-light {
  background-color: red;
}

/* Icons and Buttons */
.eye-icon {
  margin-right: 8px;
}
.delete-icon {
  cursor: pointer;
  width: 20px;
  margin: auto 5px;
}
</style>
  