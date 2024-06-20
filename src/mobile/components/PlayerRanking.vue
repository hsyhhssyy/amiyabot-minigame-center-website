<template>
    <template v-for="(items, name) in playersRanking" :key="name">
        <template v-if="items.length">
            <div class="rank-title">{{ playersRankingNames[name] }}</div>
            <div class="play-item" v-for="(item, index) in items" :key="index">
                <template v-if="name != 'others'">
                    <n-avatar size="large" round :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
                    <div style="padding-left: 5px">
                        <div>{{ item.name }}</div>
                        <div class="score">得分: {{ item.score }}</div>
                    </div>
                </template>
                <template v-else>
                    <n-avatar round :src="item.avatar" :img-props="{ referrerpolicy: 'no-referrer' }" />
                    <span style="padding-left: 5px">{{ item.name }}</span>
                </template>
            </div>
        </template>
    </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { playersRankingNames } from '@/def/games'

import type { GamePlayer } from '@/def/players'
import type { RankNames } from '@/def/games'

export interface ChatProps {
    players: GamePlayer[]
}

const props = defineProps<ChatProps>()

const playersRanking = computed(() => {
    const playerList = props.players
    const sortedData = [...playerList]

    sortedData.sort((a, b) => b.score - a.score)

    const result: { [key in RankNames]: GamePlayer[] } = { golden: [], silver: [], bronze: [], others: [] }

    if (sortedData.length) {
        let goldScore = sortedData[0].score || -1 // 金榜分数线
        let silverScore = -1 // 银榜分数线

        for (const item of sortedData) {
            if (item.score && item.score < goldScore) {
                silverScore = item.score
                break
            }
        }

        for (const item of playerList) {
            if (item.score === goldScore) {
                result.golden.push(item)
            } else if (item.score === silverScore) {
                result.silver.push(item)
            } else if (item.score > 0) {
                result.bronze.push(item)
            } else {
                result.others.push(item)
            }
        }
    }
    return result
})

</script>


<style scoped lang="scss">

.rank-title {
    font-size: 16px;
    margin: 15px 0 10px 0;

    &:first-child {
        margin-top: 0;
    }
}

.play-item {
    display: flex;
    align-items: center;
    margin-bottom: 3px;

    .score {
        color: #ff3d00;
        font-size: 12px;
    }
}

</style>