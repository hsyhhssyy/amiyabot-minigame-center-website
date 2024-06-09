<template>
    <div class="answer-table">
        <div class="table-header-row">
            <div class="table-header-no-bg"></div>
            <div v-for="header in headers" class="table-header">{{ header == "未知线索" ? "???" : header }}</div>
            <div class="table-header-no-bg"></div>
        </div>
        <div v-if="showAnswer" class="table-content-row">
            <div class="operator-name-cell left-align">
                <n-avatar :src="getOperatorUrl(currentQuestion?.CharacterId)" size="large"
                    :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                <div class="operator-name one-line-text">
                    {{ currentQuestion?.CharacterName }}
                </div>
            </div>
            <div v-for="header in headers" class="property-cell">
                <template v-if="currentQuestion?.CharacterProperties[header]">
                    {{ currentQuestion.CharacterProperties[header] }}
                </template>
            </div>
            <div class="operator-name-cell">
                <div class="operator-name one-line-text">
                    正确答案
                </div>
            </div>
        </div>
        <div v-for="answer in currentAnswers" class="table-content-row">
            <div class="operator-name-cell left-align">
                <n-avatar :src="getOperatorUrl(answer?.CharacterId)" size="large"
                    :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                <div class="operator-name one-line-text">
                    {{ answer.CharacterName }}
                </div>
            </div>
            <div v-for="header in headers" class="property-cell">
                <template v-if="!showAnswer">
                    <template v-if="answer.CharacterPropertiesResult[header]">
                        <img :src="ThumbsUp" width="28px" height="28px">
                    </template>
                    <template v-else>
                        <img :src="ThumbsDown" width="28px" height="28px">
                        <div class="two-line-text">
                        </div>
                    </template>
                </template>
                <template v-else>
                    <template v-if="answer.CharacterPropertiesResult[header]">
                        <img :src="ThumbsUp" width="28px" height="28px">
                    </template>
                    <template v-else>
                        <div class="two-line-text">
                            {{ answer?.CharacterProperties?.[header] ?? "" }}
                        </div>
                    </template>
                </template>
            </div>
            <div class="operator-name-cell left-align">
                <template v-if="playersMap[answer.PlayerId]">
                    <n-avatar :src="playersMap[answer.PlayerId].avatar" size="small" class="operator-avatar"
                        :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                    <div class="operator-name two-line-text">
                        {{ playersMap[answer.PlayerId].name }}
                    </div>
                </template>
                <template v-else>
                    <div class="operator-name one-line-text">
                        兔兔的提示
                    </div>
                </template>
            </div>
        </div>
        <div v-for="n in blankRows" class="empty-row">
        </div>
    </div>
</template>

<script setup lang="ts">
import ThumbsUp from '@/assets/images/cypherChallenge/icon/thumbs-up.svg';
import ThumbsDown from '@/assets/images/cypherChallenge/icon/thumbs-down.svg';
import { computed } from 'vue'

interface Props {
    currentQuestion: any;
    playersMap: any;
    headers: any;
    showAnswer: any;
}

const props = defineProps<Props>();

function getOperatorUrl(CharacterId: string) {
    return `https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/${CharacterId}%231.png`
}

const currentAnswers = computed(() => {
    if (!props.currentQuestion) {
        return []
    }

    return props.currentQuestion.AnswerList
})

const blankRows = computed(() => {
    let rowCount = 10 - (currentAnswers.value?.length ?? 0)
    if (rowCount < 0) {
        rowCount = 0
    }
    return Array(rowCount).fill("");
})

</script>

<style scoped lang="scss">
.answer-table {

    background: transparent;
    color: #f0f0f0;
    flex-grow: 1;

    .table-header-row {
        display: flex;
        flex-direction: row;

        align-items: center;
        justify-content: center;

        height: 35px;
        width: 100%;


        .table-header {
            text-align: center;
            font-size: 16px;
            height: 26px;

            background-image: url(@/assets/images/cypherChallenge/again.8b9776.png);
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;

            width: 70px;
            margin-left: 5px;
            margin-right: 5px;
        }

        .table-header-no-bg {
            text-align: left;
            flex-grow: 1;
        }
    }

    .table-content-row {
        display: flex;
        flex-direction: row;

        align-items: center;
        justify-content: center;

        width: 100%;

        background-color: rgb(50, 50, 50, 0.8);
        border-radius: 10px;
        margin-bottom: 5px;

        .operator-name-cell {
            flex-grow: 1;
            flex-shrink: 1;
            flex-basis: 0;

            display: flex;
            flex-direction: row;
            align-items: center;

            overflow: hidden;
            margin-left: 5px;

            .operator-name {
                margin-left: 5px;
            }
        }

        .left-align {
            justify-content: flex-start
        }

        .right-align {
            justify-content: end;
        }

        .property-cell {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;

            width: 80px;
            margin-left: 5px;
            margin-right: 5px;
        }

        .one-line-text {
            font-size: 16px;
            max-width: 100px;
            white-space: nowrap;
            overflow: hidden;
        }

        .two-line-text {
            max-width: 70px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
            line-height: 14px;
        }
    }

    .empty-row{        
        min-height: 40px;
        margin-bottom: 5px;
    }
}
</style>