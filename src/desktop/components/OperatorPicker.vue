<template>
    <n-tabs v-model:value="currentProfession" type="card" class="avatar-tab" placement="right">
        <n-tab-pane class="avatar-tab-pane" v-for="profession in allProfessions" :tab="profession"
            :name="profession">
            <template #tab>
                <img class="profession-image" :src="`./classes/${profession}.png`"  />
            </template>
            <div class="avatar-list-container">
                <div class="avatar-list">
                    <div v-for="(avatar, index) in avatars.filter(a => a.profession === profession)" :key="index"
                        @click="handleAvatarClick(avatar)" :class="{ 'avatar-cell':true, 'selected': selectedAvatar === avatar }">
                        <img :src="avatar.url" referrerpolicy="no-referrer" alt="请求过于频繁"/>
                        
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
const currentProfession = ref('PIONEER')

const handleAvatarClick = (avatar: Avatar) => {
    model.value = avatar;
};

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
});

</script>

<style lang="scss" scoped>
.avatar-tab {
    height: 100%;

    .avatar-tab-pane {

        .avatar-list-container {
            height: 100%;
            width: 100%;
            overflow-y: scroll;
            scrollbar-width: thin;

            .avatar-list {
                width: 100%;
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: start;
            }

            .avatar-list>div {
                cursor: pointer;
                border: 2px solid lightgray;
                width: 10%;
            }

            .avatar-list>div.selected {
                border: 2px solid green;
            }

            .avatar-list img {
                height: 100%;
                aspect-ratio: 1/1;
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
        }

    }
    
    .profession-image {
        width: calc( 8vh - 24px );
        margin: 1px;
    }
}




</style>

<style lang="scss">
</style>