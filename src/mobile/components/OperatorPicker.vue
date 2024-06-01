<template>
    <n-tabs v-model:value="currentProfession" type="segment" class="avatar-tab">
        <n-tab-pane class="avatar-tab-pane" v-for="profession in allProfessions" :tab="profession"
            :name="profession">
            <template #tab>
                <img class="profession-image" :src="`./classes/${profession}.png`" />
            </template>
            <div class="avatar-list-container">
                <div class="avatar-list">
                    <div v-for="(avatar, index) in avatars.filter(a => a.profession === profession)" :key="index"
                        @click="handleAvatarClick(avatar)" :class="{ 'avatar-cell':true, 'selected': selectedAvatar === avatar }">
                        <img :src="loadedAvatarImages.includes(avatar.url) ? avatar.url : ''"
                            v-if="loadedAvatarImages.includes(avatar.url)" />
                        <div class="alt-div" v-if="!loadedAvatarImages.includes(avatar.url)">{{ avatar.alt }}</div>
                    </div>
                </div>
            </div>
        </n-tab-pane>
    </n-tabs>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { jmesPathQuery } from '@/api/game';
import { computed } from '@vue/reactivity';
import type { Avatar } from '@/def/avatar';

const allProfessions = [
    'PIONEER',
    'WARRIOR',
    'TANK',
    'SNIPER',
    'CASTER',
    'MEDIC',
    'SUPPORT',
    'SPECIAL',
];

const model = defineModel<Avatar>()

const avatars = ref<Avatar[]>([]);
const selectedAvatar = computed(
    () => avatars.value.find(avatar => avatar.characterId === model.value?.characterId)
);
const loadedAvatarImages = ref<string[]>([])
const loadIndex = ref(0)
const currentProfession = ref('PIONEER')

const handleAvatarClick = (avatar: Avatar) => {
    model.value = avatar;
};

const loadImage = (url: string) => {
    return new Promise(resolve => {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
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
    var response = await jmesPathQuery("character_table_full.json",
        "map(&{\"charId\":@.charId, \"name\":@.name,\"profession\":@.profession, \"skin\":to_array(@.skins)[0].skinId},values(@))");
    console.log(response);
    avatars.value = response.map((item: any) => {
        // urlencode
        const itemSkinPath = encodeURIComponent(item.skin);
        return {
            url: `https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/${itemSkinPath}.png`,
            alt: item.name,
            characterId: item.charId,
            profession: item.profession
        }
    });

    await loadImagesSequentially();
});

</script>

<style lang="scss" scoped>
.avatar-tab {

    .avatar-tab-pane {

        .avatar-list-container {
            margin-bottom: 20px;
            overflow-y: scroll;

            .avatar-list {
                display: flex;
                flex-wrap: wrap;
            }

            .avatar-list>div {
                cursor: pointer;
                border: 2px solid lightgray;
                width: 25%;
            }

            .avatar-list>div.selected {
                border: 2px solid green;
            }

            .avatar-list img {
                width: 100%;
                aspect-ratio: 1/1;
            }
        }
    }
}

.profession-image {
    width: 100%;
    margin: 1px;
}

.alt-div {
    width: 50px;
    height: 50px;

    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    word-wrap: break-word;
}
</style>

<style lang="scss">
.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab {
    padding: 0;
}
</style>