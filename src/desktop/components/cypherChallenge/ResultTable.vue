<template>
    <n-table striped class="answer-table" size="small">
        <thead>
            <tr>
                <th>干员</th>
                <th v-for="header in headers">{{ header }}</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="answer in currentAnswers">
                <td>{{ answer.CharacterName }}</td>
                <td v-for="header in headers">
                    <template v-if="answer.CharacterPropertiesResult[header]">
                        {{ currentQuestion.CharacterProperties[header] }}
                    </template>
                    <template v-else>
                        ---
                    </template>
                </td>
                <td style="padding-top: 0px; padding-bottom: 0px;">
                    <div class="player-shown" v-if="playersMap[answer.PlayerId]">
                        <n-avatar :src="playersMap[answer.PlayerId].avatar" size="small"
                            :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                        {{ playersMap[answer.PlayerId].name }}
                    </div>
                    <div v-else>
                        兔兔的提示
                    </div>
                </td>
            </tr>
            <tr v-for="n in (10 - currentAnswers.length)">
                <td>---</td>
                <td>---</td>
                <td>---</td>
                <td>---</td>
                <td>---</td>
                <td>---</td>
                <td>---</td>
            </tr>
            <tr v-if="currentQuestion?.IsCompleted||currentQuestion?.GuessChanceLeft==0" class="final-answer">
                <td>{{ currentQuestion.CharacterName }}</td>
                <td v-for="header in headers">
                    <template v-if="currentQuestion.CharacterProperties[header]">
                        {{ currentQuestion.CharacterProperties[header] }}
                    </template>
                </td>
                <td></td>
            </tr>
        </tbody>
    </n-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props{
    currentQuestion: any;
    playersMap: any;
    headers: any;
}

const props = defineProps<Props>();

const currentAnswers = computed(() => {
    if (!props.currentQuestion) {
        return []
    }

    return props.currentQuestion.AnswerList
})

</script>

<style scoped lang="scss">

.final-answer {
    background-color: #f0f0f0;
}

</style>