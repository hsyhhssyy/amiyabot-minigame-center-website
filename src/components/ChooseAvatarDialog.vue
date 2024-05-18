<template>
  <el-dialog v-model="model" title="选择头像" :center="true" :show-close="false">
    <div class="avatar-list-container">
      <div class="avatar-list">
        <div v-for="(avatar, index) in avatars" :key="index" @click="selectAvatar(avatar)"
          :class="{ 'selected': selectedAvatar === avatar }">
          <img :src="avatar" alt="Avatar" />
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="secondary" @click="cancelClicked">取消</el-button>
        <el-button type="primary" @click="okClicked">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { jmesPathQuery } from '@src/api/Arknights';

interface Emits {
  (event: 'ok', selectedAvatar: string): void;
}

const model = defineModel({ type: Boolean })

const emit: Emits = defineEmits();

const avatars = ref([
  'avatar1.jpg',
  'avatar2.jpg',
  'avatar3.jpg',
  // Add more avatar URLs as needed
]);
const selectedAvatar = ref('');

const selectAvatar = (avatar: string) => {
  selectedAvatar.value = avatar;
};

const okClicked = () => {
  model.value = false;
  emit('ok', selectedAvatar.value);
};

const cancelClicked = () => {
  model.value = false;
};

onMounted(async () => {
  var response = await jmesPathQuery("character_table_full.json", "map(&{\"charId\":@.charId, \"name\":@.name, \"skin\":to_array(@.skins)[0].skinId},values(@))");
  console.log(response);
  avatars.value = response.map((item: any) => {
    // urlencode
    const itemSkinPath = encodeURIComponent(item.skin);
    return `https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/${itemSkinPath}.png`;
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
</style>
