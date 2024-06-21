<template>
    <game-base ref="base" :room-id="roomId" :input-handler="sendMove" :players="players" @on-loaded="load">
        <n-card style="height: 100%" class="game-card">
            <div :class="{
                'overlay': settlementDialogShown,
                'collapsed': !settlementDialogShown
            }">
                <div class="overlay-card">
                    <div class="correct-answer">
                        正确答案：{{ lastQuestion?.CharacterName }}
                    </div>
                    <div class="correct-answer-image" :style="{
                        'background-image': `url('${lastQuestion?.ImageUrl}')`,
                        'background-position': 'center',
                        'background-size': 'contain',
                        'background-repeat': 'no-repeat'
                    }">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <next-question :room-id="roomId" :active="settlementCountdownActive"            
                            :show-close="false"
                            @on-next-question="moveToNextQuestion" :game="game" :players="players">
                        </next-question>
                    </div>
                </div>
            </div>
            <div>
                <div class="game-panel">
                    <hit-effect ref="hit"></hit-effect>
                    <div class="question-prompt" v-if="rallyReached">
                        这是哪位干员立绘的一部分呢？{{ currentQuestionIndex }} {{ currentQuestion?.CharacterName }} {{game.MaxQuestionCount}}
                    </div>
                    <div class="question-prompt" v-if="!rallyReached">
                        正在加载，请稍等...
                    </div>
                    <div class="game-body">
                        <div class="question-display">
                            <div v-if="!rallyReached">
                                <loading :room-id="roomId" 
                                :value="(slicedImages?.size??0 )+ (slicedHintImages?.size??0)" 
                                :maximum="loadMaximun" :players="players"
                                @on-loading-complete="imageLoadingCompleted"
                                ></loading>
                            </div>
                            <canvas id="masked-image" class="masked-image" v-show="rallyReached"></canvas>
                        </div>
                    </div>
                    <div class="hint-area">
                        <icon-button :icon="Tips" type="info" @click="handleRequestHint"
                            style="margin: 10px;">提示</icon-button>
                        <icon-button :icon="Tips" type="error" 
                            @click="handleGiveUp" 
                            :disabled="giveUpPressed"
                            >放弃</icon-button>
                    </div>
                </div>
                <div class="game-guide">
                    <amiya-face @on-hit="onFaceHit"></amiya-face>
                </div>
            </div>
        </n-card>
        <template v-slot:players>
            <player-ranking></player-ranking>
        </template>
    </game-base>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGameHubStore } from '@/stores/gamehub'
import { Tips } from '@icon-park/vue-next'
import type { SignalrResponse } from '@/api/signalr'
import type { GameRoom } from '@/api/game'
import type { Message } from '@/def/signalr-common'
import type { GamePlayer } from '@/def/players'
import type { Question } from '@/def/skin-guess'
import type { HitType } from '@/desktop/components/effects/HitEffect.vue'
import HitEffect from '@/desktop/components/effects/HitEffect.vue'
import GameBase from '@/desktop/views/GameBase.vue'
import NextQuestion from '@/universal/components/NextQuestion.vue'
import PlayerRanking from '@/desktop/components/PlayerRanking.vue'
import AmiyaFace from '@/desktop/components/AmiyaFace.vue'
import IconButton from '@/universal/components/IconButton.vue'
import Loading from '@/universal/components/Loading.vue'

const route = useRoute()
const gameHub = useGameHubStore()

const players = ref<GamePlayer[]>([])
const currentQuestionIndex = computed<number | null>(() => game.value?.CurrentQuestionIndex)

const giveUpPressed = ref(false)

const currentQuestion = computed<Question>(() => {
    if (game?.value?.QuestionList == null) {
        return null
    }
    if (currentQuestionIndex.value === null) {
        return game.value.QuestionList[0]
    }
    if (currentQuestionIndex.value >= game.value.QuestionList.length) {
        return game.value.QuestionList[game.value.QuestionList.length - 1]
    }
    return game.value.QuestionList[currentQuestionIndex.value]
})
const lastQuestion = computed<Question>(() => {
    if (game?.value?.QuestionList == null) {
        return null
    }
    if (currentQuestionIndex.value === null) {
        return game.value.QuestionList[0]
    }


    if (game.value.IsCompleted || game.value.IsClosed) {
        console.log('currentQuestionIndex IsCompleted:', currentQuestionIndex.value)
        return game.value.QuestionList[currentQuestionIndex.value]
    }
    console.log('currentQuestionIndex:', currentQuestionIndex.value)
    return game.value.QuestionList[currentQuestionIndex.value - 1]
})

const loadMaximun = computed(() => {
    if(currentQuestionIndex.value == null){
        return 6 // 三道题
    }
    
    if(game.value.MaxQuestionCount-currentQuestionIndex.value < 3){
        return (game.value.MaxQuestionCount-currentQuestionIndex.value)*2
    }

    return 6
})

const game = ref<any>()
const questionList = computed(() => {
    return game.value?.QuestionList ?? []
})

const rallyReached = ref(false);
const rallyText = ref('正在加载题目....');

const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.join(',') : route.params.roomId
const base = ref()
const hit = ref()

const settlementDialogShown = ref(false)
const settlementCountdownActive = ref(false)

const slicedImages = ref<Map<number, HTMLCanvasElement> | null>(null);
const slicedHintImages = ref<Map<number, HTMLCanvasElement> | null>(null);
const cachedFullImages = ref<Map<string, HTMLImageElement>>(new Map());


async function fetchImage(url: any) {
    const response = await fetch(url);
    const blob = await response.blob();
    const img = new Image();
    const objectURL = URL.createObjectURL(blob);
    img.src = objectURL;
    await new Promise((resolve) => img.onload = resolve);
    return img;
}

function getRandomSquare(randomNum: any, imgWidth: any, imgHeight: any) {
    const maxSize = Math.min(imgWidth, imgHeight) * 0.2;
    const minSize = Math.min(imgWidth, imgHeight) * 0.1;
    const size = Math.floor(minSize + (randomNum % (maxSize - minSize)));

    const x = Math.floor((randomNum * 9301 + 49297) % imgWidth);
    const y = Math.floor((randomNum * 49297 + 9301) % imgHeight);

    const rectX = x % (imgWidth - size);
    const rectY = y % (imgHeight - size);

    const largerSize = size * 2;
    const largerRectX = Math.max(0, rectX + size / 2 - largerSize / 2);
    const largerRectY = Math.max(0, rectY + size / 2 - largerSize / 2);

    const adjustedLargerRectX = Math.min(largerRectX, imgWidth - largerSize);
    const adjustedLargerRectY = Math.min(largerRectY, imgHeight - largerSize);

    return {
        smallRect: { x: rectX, y: rectY, size: size },
        largeRect: { x: adjustedLargerRectX, y: adjustedLargerRectY, size: largerSize }
    };
}


function isUniformColor(imageData: any) {
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    let whiteCount = 0;
    let blackCount = 0;
    let transparentCount = 0;

    for (let i = 0; i < totalPixels * 4; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (r === 255 && g === 255 && b === 255) {
            whiteCount++;
        } else if (r === 0 && g === 0 && b === 0) {
            blackCount++;
        } else if (a === 0) {
            transparentCount++;
        }
    }

    const whiteRatio = whiteCount / totalPixels;
    const blackRatio = blackCount / totalPixels;
    const transparentRatio = transparentCount / totalPixels;

    return whiteRatio <= 0.4 && blackRatio <= 0.4 && transparentRatio <= 0.4;
}


async function generateMaskedImage(i: number) {

    if (slicedImages.value == null || slicedHintImages.value == null) {
        return;
    }

    const url = game.value.QuestionList[i].ImageUrl;
    var randomNum = questionList.value[i].RandomNumber;

    const img = await fetchImage(url);
    cachedFullImages.value.set(url, img);
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')! as CanvasRenderingContext2D;
    canvas.width = img.width;
    canvas.height = img.height;

    let square, largeSquare, imageData;

    do {
        const squares = getRandomSquare(randomNum, img.width, img.height);
        square = squares.smallRect;
        largeSquare = squares.largeRect;
        ctx.drawImage(img, square.x, square.y, square.size, square.size, 0, 0, square.size, square.size);
        imageData = ctx.getImageData(0, 0, square.size, square.size);
        randomNum++;
    } while (!isUniformColor(imageData));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = square.size;
    canvas.height = square.size;
    ctx.drawImage(img, square.x, square.y, square.size, square.size, 0, 0, square.size, square.size);

    slicedImages.value.set(i, canvas);

    const hintCanvas = document.createElement('canvas') as HTMLCanvasElement;
    const hintCtx = hintCanvas.getContext('2d')! as CanvasRenderingContext2D;
    hintCanvas.width = largeSquare.size;
    hintCanvas.height = largeSquare.size;
    hintCtx.drawImage(img, largeSquare.x, largeSquare.y, largeSquare.size, largeSquare.size, 0, 0, largeSquare.size, largeSquare.size);
    slicedHintImages.value.set(i, hintCanvas);
}

async function preprocessImages() {

    slicedImages.value = new Map();
    slicedHintImages.value = new Map();

    for (let i = currentQuestionIndex.value!; i < game.value.MaxQuestionCount; i++) {
        if (slicedImages.value.has(i)) {
            continue;
        }
        console.log('preprocessImages:', i)
        await generateMaskedImage(i);
        updateImage();
    }
}

const updateImage = function () {
    if (slicedImages.value == null || slicedHintImages.value == null) {
        return;
    }

    var source;
    if (questionList.value[currentQuestionIndex.value!].HintLevel == 0) {
        source = slicedImages.value;
    } else {
        source = slicedHintImages.value;
    }

    const canvas = source.get(currentQuestionIndex.value!);
    if (canvas) {
        const refCanvas = document.querySelector(`.masked-image`) as HTMLCanvasElement;
        if (refCanvas) {
            const ctx = refCanvas.getContext('2d');
            if (ctx) {
                refCanvas.width = canvas.width;
                refCanvas.height = canvas.height;
                ctx.drawImage(canvas, 0, 0);
            }
        }
    }
}

function imageLoadingCompleted() {
    rallyReached.value = true;
}

function onFaceHit(face: HitType, _: string) {
    hit.value.hit(face)
}

function prepareNextQuestion() {
    if (settlementCountdownActive.value == true) {
        return
    }

    settlementDialogShown.value = true
    settlementCountdownActive.value = true
}

function moveToNextQuestion() {
    settlementDialogShown.value = false
    settlementCountdownActive.value = false
    updateImage();
}

function sendMove(content: string) {
    if (settlementDialogShown.value == true) {
        gameHub.invokeGameHub(
            'Chat',
            roomId,
            content
        )
    } else {
        gameHub.invokeGameHub(
            'SendMove',
            roomId,
            JSON.stringify({
                CharacterName: content
            })
        )
    }
}

const hintListener = (response: any) => {
    questionList.value[response.Payload.CurrentQuestionIndex].HintLevel = response.Payload.HintLevel;
    updateImage();

    const playerHint = players.value.find((p) => p.id === response.Payload.PlayerId)

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: `玩家${playerHint?.name}请求了提示`,
        style: 'Correct',
        nickname: '管理员兔兔',
        avatar: '/amiya.jpg'
    } as Message)
}

const giveUpListener = (response: any) => {
    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: '房主选择放弃本题',
        style: 'Correct',
        nickname: '管理员兔兔',
        avatar: '/amiya.jpg'
    } as Message)

    game.value = response.Game
    giveUpPressed.value = false;

    prepareNextQuestion()
}

function receiveMoveListener(response: SignalrResponse) {
    const player = players.value.find((p) => p.id === response.Payload.PlayerId)

    if (response.Game) {
        game.value = response.Game
    }

    const result = response.Payload.Result
    const characterName = response.Payload.CharacterName

    let content = characterName

    base.value.pushMessage({
        userId: response.Payload.PlayerId,
        content: content,
        style: result,
        nickname: player?.name || 'Unknown',
        avatar: player?.avatar || '/avatar.webp'
    } as Message)

    if (result === 'Correct') {
        prepareNextQuestion()
    }
}

function gameInfoListener(response: SignalrResponse) {
    if (response.Game) {
        game.value = response.Game
    }

    players.value = response.PlayerList.map((p: any) => {
        return {
            id: p.UserId,
            name: p.UserName,
            avatar: p.UserAvatar ? p.UserAvatar : '/avatar.webp',
            score: p.Score
        }
    })
}

function gameCompletedListener(response: SignalrResponse) {
    game.value = response.Game
    prepareNextQuestion()
}

var handleRequestHint = () => {
    //console.log('请求提示');
    gameHub.invokeGameHub('RequestHint', roomId);
}

var handleGiveUp = () => {
    giveUpPressed.value = true;
    gameHub.invokeGameHub('GiveUp', roomId);
}

const rallyPointStatusListener = (response: any) => {
    if (response.Name == "ImageProcess") {
        rallyText.value = '正在加载题目....';
        for (let i = 0; i < players.value.length; i++) {
            if (response.Players.includes(players.value[i].id)) {
                rallyText.value = rallyText.value + '<br/>' + players.value[i].name + ': 已加载';
            } else {
                rallyText.value = rallyText.value + '<br/>' + players.value[i].name + ': 加载中...';
            }
        }
    }
}

const rallyPointReachedListener = (response: any) => {
    if (response.Name == "ImageProcess") {
        rallyReached.value = true;
    }
}

function load(roomData: GameRoom, gameData: SignalrResponse) {
    gameHub.addGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.addGameHubListener('GameInfo', gameInfoListener)
    gameHub.addGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.addGameHubListener('RallyPointStatus', rallyPointStatusListener);
    gameHub.addGameHubListener('RallyPointReached', rallyPointReachedListener);
    gameHub.addGameHubListener('Hint', hintListener)
    gameHub.addGameHubListener('GiveUp', giveUpListener)

    gameInfoListener(gameData)

    preprocessImages();
    updateImage();

    if (roomData.isClosed || roomData.isCompleted) {
        prepareNextQuestion()
    }

}


onUnmounted(() => {
    gameHub.removeGameHubListener('ReceiveMove', receiveMoveListener)
    gameHub.removeGameHubListener('GameInfo', gameInfoListener)
    gameHub.removeGameHubListener('GameCompleted', gameCompletedListener)
    gameHub.removeGameHubListener('RallyPointStatus', rallyPointStatusListener);
    gameHub.removeGameHubListener('RallyPointReached', rallyPointReachedListener);
    gameHub.removeGameHubListener('Hint', hintListener)
    gameHub.removeGameHubListener('GiveUp', giveUpListener)

})

// function test(){
//     console.log('current index:', currentQuestionIndex.value)
//     currentQuestionIndex.value = ( currentQuestionIndex.value??0 ) - 1
//     console.log('current index:', currentQuestionIndex.value)
//     prepareNextQuestion()
// }

</script>

<style lang="scss" scoped>
$guideHeight: 160px;

.collapsed {
    width: 0;
    height: 0;
    display: none;
}

.game-card {
    position: relative;
    overflow: hidden;
    width: 1080px; // 此处固定宽度,是因为amiya face，会改变宽度，因此偷懒临时固定宽度


    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        .overlay-card {
            width: 90%;
            height: 90%;
            display: flex;
            flex-direction: column;
            background-color: white;
            background: url(@/assets/images/bg.05c72f.jpg) center / cover no-repeat;

            .correct-answer {
                width: 100%;
                font-size: 24px;
                color: bisque;
                text-shadow:
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000;
                text-align: center;
            }

            .correct-answer-image {
                flex-grow: 1;
                flex-shrink: 1;

                .answered-image {
                    max-width: 100%;
                    max-height: 100%;
                }
            }
        }
    }



    .game-panel {
        height: calc(100% - $guideHeight);
        background: url(@/assets/images/bg.05c72f.jpg) center / cover no-repeat;
        border-radius: 4px;
        padding: 10px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        position: relative;

        .question-prompt {
            font-size: 24px;
            color: bisque;
            text-shadow:
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000;
        }

        .game-body {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-top: 10px;
            flex-grow: 1;
            flex-shrink: 1;

            .question-display {
                background-color: white;
                border: 5px solid #ccc;

                min-width: 300px;
            }

            .answer-list {
                margin-right: 5px;
                margin-left: 5px;
                width: 200px;

                background: rgba(0, 0, 0, 0);

                .game-title {
                    width: 100%;
                    aspect-ratio: 10/4;
                    background: url(@/assets/images/cypherChallenge/title_content.png) center / contain no-repeat;
                    margin-bottom: 20px;
                }

                .property-revealed {
                    overflow: auto;
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);

                    .property-header {
                        margin-left: -10px;
                        aspect-ratio: 36/10;

                        background: url(@/assets/images/cypherChallenge/advanced_tag_bg_1.png) center / contain no-repeat;

                        .property-value {
                            padding-left: 10px;
                            text-align: center;
                            font-size: 16px;
                            color: black;
                        }
                    }
                }
            }

            .answer-table {
                margin-right: 20px;
                font-size: 12px;

                .player-shown {
                    display: flex;
                    align-items: center;
                }
            }

        }

        .hint-area {
            position: absolute;
            right: 10px;
            top: 10px;
        }
    }

    .game-guide {
        height: $guideHeight;
        display: flex;
        align-items: flex-end;
        padding-bottom: 30px;
    }
}
</style>
