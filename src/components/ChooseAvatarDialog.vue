<template>
  <el-dialog v-model="model" title="选择头像" :center="true" :show-close="false" width="80%">
    <div class="avatar-list-container">
      <div class="avatar-list">
        <div v-for="(avatar, index) in avatars" :key="index" @click="handleAvatarClick(avatar)"
          :class="{ 'selected': selectedAvatar === avatar }">
          <img :src="loadedAvatarImages.includes(avatar.url) ? avatar.url : ''"
            v-if="loadedAvatarImages.includes(avatar.url)" />
          <div class="alt-div" v-if="!loadedAvatarImages.includes(avatar.url)">{{ avatar.alt }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="secondary" @click="handleCancelClick">取消</el-button>
        <el-button type="primary" @click="handleOkClick" :disabled="selectedAvatar == null">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted,watch } from 'vue';
import { jmesPathQuery } from '@src/api/Arknights';

interface Emits {
  (event: 'ok', selectedAvatar: string): void;
}

const model = defineModel({ type: Boolean })

const emit: Emits = defineEmits();

interface Avatar {
  url: string;
  alt: string;
}

const avatars = ref<Avatar[]>([]);
const selectedAvatar = ref<Avatar | null>();
const loadedAvatarImages = ref<string[]>([])
const loadIndex = ref(0)

//watch model
watch(model, (newVal) => {
  if (newVal==true&&loadIndex.value<=0) {
    loadImagesSequentially()
  }
})

const handleAvatarClick = (avatar: Avatar) => {
  selectedAvatar.value = avatar;
};

const handleOkClick = () => {
  model.value = false;
  if (selectedAvatar.value) {
    emit('ok', selectedAvatar.value.url);
  }
};

const handleCancelClick = () => {
  model.value = false;
};

const loadImage = (url:string) => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
  });
}

const loadImagesSequentially = async () => {
  while (loadIndex.value < avatars.value.length) {
    const index = loadIndex.value 
    loadIndex.value++;
    const url = avatars.value[index].url;
    await loadImage(url);
    loadedAvatarImages.value.push(url);
  }
}

onMounted(async () => {
  var response = await jmesPathQuery("character_table_full.json", "map(&{\"charId\":@.charId, \"name\":@.name, \"skin\":to_array(@.skins)[0].skinId},values(@))");
  console.log(response);
  avatars.value = response.map((item: any) => {
    // urlencode
    const itemSkinPath = encodeURIComponent(item.skin);
    return {
      url: `https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/${itemSkinPath}.png`,
      alt: item.name
    }
  });

});

</script>

<style scoped>
.avatar-list-container {
  max-height: 50vh;
  overflow-y: auto;
}

.avatar-list {
  display: flex;
  flex-wrap: wrap;
}

.avatar-list>div {
  margin: 5px;
  cursor: pointer;
  border: 2px solid lightgray;
  border-radius: 50%;

}

.avatar-list>div.selected {
  border: 2px solid green;
  border-radius: 50%;
}

.avatar-list img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.alt-div {
  width: 50px;
  height: 50px;

  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  /* 确保 padding 和 border 包含在宽度和高度内 */
  word-wrap: break-word;
  /* 自动换行 */
}
</style>
