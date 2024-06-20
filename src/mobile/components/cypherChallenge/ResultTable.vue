<template>
    <div class="answer-table">
        <div class="table-header-row">
            <div class="table-header-no-bg"></div>
            <div v-for="header in headers" class="table-header">{{ header == "未知线索" ? "???" : header }}</div>
        </div>
        <div v-if="showAnswer" class="table-content-row">
            <div class="operator-name-cell left-align">
                <n-tooltip placement="bottom" trigger="click">
                    <template #trigger>

                        <n-avatar :src="getOperatorUrl(currentQuestion?.CharacterId)" size="large"
                            :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                    </template>
                    <span> {{ currentQuestion?.CharacterName }} </span>
                </n-tooltip>
            </div>
            <div v-for="header in headers" class="property-cell">
                <template v-if="currentQuestion?.CharacterProperties[header]">
                    {{ currentQuestion.CharacterProperties[header] }}
                </template>
            </div>
        </div>
        <div v-for="answer in currentAnswers" class="table-content-row">
            <div class="operator-name-cell left-align">
                <n-tooltip placement="bottom" trigger="click">
                    <template #trigger>
                        <n-avatar :src="getOperatorUrl(answer?.CharacterId)" size="large"
                            :img-props="{ referrerpolicy: 'no-referrer' }"></n-avatar>
                    </template>
                    <span> {{ answer?.CharacterName }} </span>
                </n-tooltip>
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
        </div>
        <div v-for="n in blankRows" class="empty-row">
        </div>
    </div>
</template>

<script setup lang="ts">
import ThumbsUp from '@/assets/images/cypherChallenge/icon/thumbs-up.svg';
import ThumbsDown from '@/assets/images/cypherChallenge/icon/thumbs-down.svg';
import { computed } from 'vue'
import { getOperatorUrl } from '@/arknights'

interface Props {
    currentQuestion: any;
    playersMap: any;
    showAnswer: any;
}

const props = defineProps<Props>();

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

const headers = computed(() => {
    if (!props.currentQuestion) {
        return []
    }

    const entries = Object.entries(props.currentQuestion.CharacterPropertiesUsed);

    const headersValue = entries.filter(
        ([, value]) => {
            return value == true
        }
    ).map(
        ([key]) => {
            if (props.currentQuestion?.CharacterPropertiesRevealed[key] || props.showAnswer) {
                return key
            } else {
                return '未知线索'
            }
        }
    )

    return headersValue
}
)

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
            font-size: 12px;
            height: 20px;

            background-image: url(@/assets/images/cypherChallenge/again.8b9776.png);
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;

            width: 50px;
            margin-left: 2px;
            margin-right: 2px;
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

            width: 50px;
            margin-left: 2px;
            margin-right: 2px;
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

    .empty-row {
        min-height: 40px;
        margin-bottom: 5px;
    }
}
</style>