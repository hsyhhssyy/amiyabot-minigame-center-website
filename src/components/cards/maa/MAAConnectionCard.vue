<template>
  <el-card :class="{ 'connection-card': true, 'selected': isSelected }">
    <div class="connection-content">
      <div class="text-content">
        <div class="connection-id">{{ connection.name }}</div>
        <el-button class="delete-icon" v-if="deleteConnection" @click="deleteConnection(connection.id)">
          <el-icon>
            <Delete />
          </el-icon>
        </el-button>
      </div>
      <img v-if="connection.screenshot" :src="`data:image/jpeg;base64,${connection.screenshot}`" class="screenshot" />
      <div v-else class="icon-container">
        <el-icon class="default-icon">
          <Picture />
        </el-icon>
      </div>
    </div>
  </el-card>
</template>
  
<script setup lang="ts">
import { onMounted } from "vue";
import { getConnectionThumbnail } from "@src/api/MAAConnection";

export interface MAAConnection {
  id: string;
  deviceIdentity?: string;
  userIdentity: string;
  name: string;
  screenshot?: string;
}

const props = defineProps<{
  connection: MAAConnection;
  deleteConnection?: (id: string) => void;
  isSelected?: boolean;
}>();

onMounted(async () => {
  var imgBase64 = await getConnectionThumbnail(props.connection.id)
  if (imgBase64) {
      props.connection.screenshot = imgBase64;
  }
});

const { connection, deleteConnection, isSelected = false } = props;
</script>
  
<style scoped>
/* General Styles for Connection Card */
.connection-card {
  margin: 10px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.selected {
  border: 2px solid #409eff;
  /* Using Element UI's primary color */
}

/* Connection Content Layout */
.connection-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Screenshot Styles */
.screenshot {
  width: 192px;
  height: 108px;
  /* Adjust height automatically */
  object-fit: cover;
  border-bottom: 1px solid #efefef;
  /* A light border under the image */
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* 调整为你想要的圆角大小 */
  border: 1px solid #dcdfe6; /* 边框颜色，可以根据需要更改 */
  width: 192px;
  height: 108px;
  background-color: #f5f7fa; /* 背景颜色，可以根据需要更改 */
}

.default-icon {
  font-size: 40px; /* 图标大小，可以根据需要调整 */
  color: #c0c4cc; /* 图标颜色，可以根据需要更改 */
}

/* Text Content */
.text-content {
  margin-bottom: 10px;
  width: 100%;
  display: flex;
  justify-content: space-between
}

.connection-id {
  font-size: 20px;
  text-align: center;
}

/* Icons and Buttons */
.delete-icon {
  
}
</style>
  