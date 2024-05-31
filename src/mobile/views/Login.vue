<template>
    <div class="login">
        <div class="main-body">
            <div class="title">兔兔小游戏中心</div>
            <n-tabs type="line" animated v-model:value="tab">
                <n-tab-pane name="options" tab="options">
                    <n-space justify="center" style="align-content: flex-start">
                        <n-card class="option-item" hoverable embedded size="small" @click="tab = 'user'">
                            <div class="item user">我是注册用户</div>
                        </n-card>
                        <n-card class="option-item" hoverable embedded size="small" @click="tab = 'visitor'">
                            <div class="item visitor">我是游客</div>
                        </n-card>
                        <n-card class="option-item" hoverable embedded size="small" @click="tab = 'register'">
                            <div class="item register">我要注册</div>
                        </n-card>
                        <n-card class="option-item" hoverable embedded size="small" @click="tab = 'bot'">
                            <div class="item bot">在QQ群里玩？</div>
                        </n-card>
                    </n-space>
                </n-tab-pane>
                <n-tab-pane name="user" tab="user">
                    <login-form @back="goBack" type="user" />
                </n-tab-pane>
                <n-tab-pane name="register" tab="register">
                    <login-form @back="goBack" type="register" />
                </n-tab-pane>
                <n-tab-pane name="visitor" tab="visitor">
                    <login-form @back="goBack" type="visitor" />
                </n-tab-pane>
                <n-tab-pane name="bot" tab="bot">
                    <div class="commercial">
                        <div>
                            想要在QQ群里和朋友一起玩？<br />
                            点击或扫码添加阿米娅机器人到群聊。<br />
                            还有游戏数据查询等功能哦。<br />
                            <n-space style="margin-top: 20px" justify="center">
                                <icon-button :icon="MessageEmoji" @click="addBotToGroup" type="primary">
                                    添加到群聊
                                </icon-button>
                                <icon-button :icon="Back" @click="goBack">返回</icon-button>
                            </n-space>
                        </div>
                        <div class="bot-qrcode-container"></div>
                    </div>
                </n-tab-pane>
            </n-tabs>
        </div>
        <div class="footer">
            <div>本网站不是鹰角网络官方网站，而是由爱好者自行开发的工具网站。</div>
            <div>
                <img
                    src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                    alt="GitHub Logo"
                    width="12"
                    height="12"
                />
                <a
                    class="friendly-link"
                    href="https://github.com/hsyhhssyy/amiyabot-minigame-center-website"
                    target="_blank"
                >
                    GitHub Repository
                </a>
                <n-divider vertical />
                <img
                    src="https://img.alicdn.com/tfs/TB1..50QpXXXXX7XpXXXXXXXXXX-40-40.png"
                    alt="Beian Logo"
                    width="12"
                    height="12"
                />
                <a class="friendly-link" href="https://beian.miit.gov.cn/" target="_blank"> 京ICP备2022033983号 </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Back, MessageEmoji } from '@icon-park/vue-next'
import IconButton from '@/universal/components/IconButton.vue'
import LoginForm from '@/mobile/views/LoginForm.vue'

const tab = ref('options')

async function goBack() {
    tab.value = 'options'
}

async function addBotToGroup() {
    window.open(
        'https://qun.qq.com/qunpro/robot/qunshare?robot_uin=2854197898&amp;robot_appid=102068219&amp;biz_type=0'
    )
}
</script>

<style scoped lang="scss">
.login {
    width: 100%;
    height: 100%;
    background: url(../../assets/bg.svg) center / cover no-repeat;
    display: flex;
    flex-direction: column;

    .main-body {
        display: flex;
        flex-grow: 1;
        flex-shrink: 1;
        flex-direction: column;
        align-items: center;
        padding-top: 50px;

        .title {
            font-size: 34px;
            margin-bottom: 50px;
        }

        .option-item {
            cursor: pointer;

            .item {
                width: calc(35vw - 10px);
                height: calc(35vw - 10px);
                background: center top 0 / 80% no-repeat;
                display: flex;
                align-items: flex-end;
                justify-content: center;

                &.user {
                    background-image: url(/face/amiya/amiya_ye.webp);
                }

                &.visitor {
                    background-image: url(/face/amiya/amiya_tea.webp);
                }

                &.register {
                    background-image: url(/face/amiya/amiya_smile.webp);
                }

                &.bot {
                    background-image: url(/face/amiya/amiya_emmm.webp);
                }
            }
        }

        .commercial {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;

            .bot-qrcode-container {
                margin-top: 20px;
                flex-grow: 1;
                flex-shrink: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background-image: url(../../assets/amiyabot-qqgroup.png);
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                width: 100%;
            }
        }
    }

    .footer {
        text-align: center;
        font-size: 14px;
        color: gray;
        padding-bottom: 10px;

        & > div:first-child {
            margin-bottom: 5px;
        }

        & > div:last-child {
            display: flex;
            justify-content: center;
            height: 16px;
        }

        .friendly-link {
            display: flex;
            align-items: center;
            margin: 0 3px;
            text-align: center;
            text-decoration: none;
            color: gray;
            font-size: 12px;
        }
    }
}
</style>
<style lang="scss">
.login {
    .main-body {
        .n-tabs-nav {
            display: none;
        }

        .n-tabs {
            flex-grow: 1;
            flex-shrink: 1;
        }

        .n-tabs .n-tabs-pane-wrapper {
            flex-grow: 1;
            flex-shrink: 1;
            overflow-y: visible;
        }

        .n-tabs .n-tabs-pane-wrapper .n-tab-pane {
            display: flex;
            height: 100%;
            justify-content: center;
            padding: 20px 0;
        }
    }
}
</style>
