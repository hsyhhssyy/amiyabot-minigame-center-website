<template>
    <el-dialog v-model="localShowDialog">
        <div class="dialog-content">
            <div class="left-content">
                <label for="avatarUploader">应用图标</label>
                <el-upload class="avatar-uploader" :show-file-list="false" :auto-upload="false"
                    :on-change="beforeAvatarUpload">
                    <img v-if="localImageUrl" :src="localImageUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon">
                        <Plus />
                    </el-icon>
                </el-upload>
            </div>
            <div class="right-content flex-container">
                <div class="input-section">
                    <label for="friendlyName">应用名称</label>
                    <el-input id="friendlyName" v-model="localNewClient.friendlyName"
                        placeholder="请输入 Friendly Name"></el-input>
                </div>
                <div class="input-section">
                    <label for="redirectUri">重定向地址</label>
                    <el-input id="redirectUri" v-model="localNewClient.redirectUri"
                        placeholder="请输入 Redirect Uri"></el-input>
                </div>
                <div class="input-section flex-item">
                    <label for="clientId">应用描述</label>
                    <el-input id="clientId" type="textarea" v-model="localNewClient.description" placeholder="请输入应用描述"
                        class="textarea-expand" resize="none" input-style="height: 100%"></el-input>
                </div>
            </div>
        </div>
        <template #footer>
            <el-button @click="cancel">取消</el-button>
            <el-button type="primary" @click="confirm">确认添加</el-button>
        </template>
    </el-dialog>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';

const localShowDialog = ref(false);

const localNewClient = ref({
    friendlyName: '',
    description: '',
    iconBase64: '',
    redirectUri: ''
});

const localImageUrl = ref('');

// 处理图片上传前的逻辑
const beforeAvatarUpload = (file: any) => {
    // const isJPG = file.type === 'image/jpeg';
    // const isPNG = file.type === 'image/png';
    // const isLt2M = file.size / 1024 / 1024 < 2;

    // if (!isJPG && !isPNG) {
    //   ElMessage.error('Avatar picture must be JPG or PNG format!');
    //   return false;
    // }

    // if (!isLt2M) {
    //   ElMessage.error('Avatar picture size cannot exceed 2MB!');
    //   return false;
    // }

    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;

            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, 128, 128);

            const dataURL = canvas.toDataURL();
            localNewClient.value.iconBase64 = dataURL.split(',')[1];
            localImageUrl.value = dataURL;
        };
    };

    reader.readAsDataURL(file.raw);

    return true;
};

let resolveDialog: any = null;
const clearInput = () => {
    localNewClient.value.friendlyName = "";
    localNewClient.value.description = "";
    localNewClient.value.iconBase64 = "";
    localNewClient.value.redirectUri = "";
};

const cancel = () => {
    localShowDialog.value = false;
    resolveDialog && resolveDialog(false);
    clearInput();
};

const confirm = () => {
    localShowDialog.value = false;
    resolveDialog && resolveDialog(localNewClient.value);
    clearInput();
};

const showDialog = async () => {
    return new Promise<any>((resolve) => {
        resolveDialog = resolve;
        localShowDialog.value = true;
    });
};

defineExpose({ showDialog });

</script>
  
<style scoped>
/* Header */
.header {
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.header .title {
    margin: 0;
    margin-right: 20px;
}

/* Dialog */
.dialog-content {
    display: flex;
}

.dialog-content .left-content {
    width: 200px;
    text-align: center;
}

.dialog-content .right-content {
    flex: 1;
    padding-left: 20px;
}

.right-content .input-section {
    margin-bottom: 20px;
}

.right-content .textarea-expand {
    height: 100%;
}

/* Client List */
.client-list {
    display: flex;
    flex-wrap: wrap;
}

.client-list .client-card {
    width: 350px;
    margin: 10px;
    border-radius: 10px;
    overflow: hidden;
}

.client-card .client-content {
    display: flex;
    align-items: center;
    margin: -10px;
    position: relative;
}

.client-content .avatar {
    width: 50px;
    height: 50px;
    object-fit: cover;
}

.client-content .text-content {
    margin-left: 10px;
    margin-right: 50px;
}

.text-content .nickname {
    font-size: 16px;
    line-height: 1.2;
}

.text-content .client-id {
    font-size: 12px;
    line-height: 1.2;
}

.text-content .description {
    font-size: 12px;
    min-height: 28.8px;
    line-height: 1.2;
    color: #888;
    display: -webkit-box;
    /* 使用旧版 flexbox */
    -webkit-line-clamp: 2;
    /* 截断文本的行数 */
    -webkit-box-orient: vertical;
    /* 设置或检索伸缩盒对象的子元素的排列方式 */
    overflow: hidden;
    /* 隐藏超出的文本 */
    text-overflow: ellipsis;
    /* 使用省略号（...）表示被修剪的文本 */
    white-space: normal;
    /* 文本自动换行 */
}

.client-content .delete-icon {
    cursor: pointer;
    width: 20px;
    position: absolute;
    /* 设置为绝对定位 */
    right: 10px;
    /* 设置在最右侧并留一点间隔 */
    top: 50%;
    /* 垂直居中 */
    transform: translateY(-50%);
    /* 垂直居中偏移修正 */
}

/* Upload */
.avatar-uploader .avatar {
    width: 128px;
    height: 128px;
    display: block;
}

.client-secret {
    padding: 10px;
    border: 1px solid #ccc;
    font-family: monospace;
}
</style>
  
  <!-- Global CSS -->
<style>
/* Avatar Upload */
.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
}
</style>
  
  