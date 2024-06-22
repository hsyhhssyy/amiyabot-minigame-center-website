import * as signalR from '@microsoft/signalr'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/stores/user'
import { getData, setData, toast } from '@/utils'
import store from '@/stores/index'

// @ts-ignore
const rootUrl = window['_env_'].VUE_APP_API_URL

export const useGameHubStore = defineStore('gameHub', () => {
    const router = useRouter()
    const user = useUser()

    const connection = ref<signalR.HubConnection | null>()
    const checkInterval = ref<NodeJS.Timeout>()
    const serverInterval = ref<NodeJS.Timeout>()
    const lastToken = ref('')

    const isConnected = computed(() => {
        return connection.value?.state === signalR.HubConnectionState.Connected
    })

    const callbacks: {
        originalCallback: (...args: any[]) => void
        jsonCallback: (response: any) => void
        eventName: string
    }[] = []

    async function connect() {
        try {
            if (!serverInterval.value) {
                serverInterval.value = setInterval(() => {
                    invokeGameHub('GetServerTime')
                }, 10000)
            }

            // 检查并更新 jwt-token
            const currentToken = getData<string>('jwt-token') || ''
            if (lastToken.value !== currentToken) {
                lastToken.value = currentToken
                await close()
            }else{
                if(isConnected.value){
                    return
                }
            }
            
            connection.value = new signalR.HubConnectionBuilder()
                .withUrl(`${rootUrl}/gamehub`, {
                    accessTokenFactory: () => currentToken
                })
                .configureLogging(signalR.LogLevel.Information)
                .build()

            // 连接关闭时的处理
            connection.value.onclose(async (error) => {
                console.error('Connection closed due to error.', error)
                connection.value = null

                //1秒后自动重新连接
                setTimeout(connect, 1000)
            })

            // 启动连接
            await connection.value.start()
            console.log('SignalR Connected.')

            // 连接成功后的后处理
            await postConnectionSetup()
        } catch (error) {
            console.error('An error occurred while connecting to the game hub:', error)
            setTimeout(connect, 1000)
        }
    }

    async function close() {
        if (connection.value) {
            await connection.value?.stop()
        }
    }

    async function postConnectionSetup() {
        if (connection.value) {
            console.log('Performing post-connection setup...')

            connection.value.on('MyConnectionInfo', (response) => {
                const responseObj = JSON.parse(response)
                setData('connection-id', responseObj.ConnectionId)
            })

            connection.value.on('Alert', async (response) => {
                await toast(response.Message, 'error')
            })

            connection.value.on('ServerTime', (response) => {
                const responseObj = JSON.parse(response)
                const utcTime = new Date(responseObj.UtcNow)
                const localTime = new Date(responseObj.LocalNow)
                const timeDiff = new Date().getTime() - utcTime.getTime()

                //console.log('Server time: ', utcTime, localTime)
                //console.log('Time difference: ', timeDiff)

                setData('server-time-diff', timeDiff.toString())
            })

            await connection.value.invoke('Me')

            // 重新注册事件
            for (const callback of callbacks) {
                connection.value.on(callback.eventName, callback.jsonCallback)
            }
        }
    }

    function invokeGameHub(methodName: string, ...args: any[]) {
        if (!connection.value) {
            return
        }
        connection.value.invoke(methodName, ...args).catch(async (err) => {
            console.error(err)
            connection.value?.stop()
        })
    }

    function addGameHubListener(eventName: string, callback: (...args: any[]) => void) {
        if (!connection.value) {
            return
        }
        //console.log('注册事件：' + eventName)

        const existingJsonCallback =  callbacks.find((x) => x.originalCallback == callback)

        if(existingJsonCallback){
            return
        }

        const jsonParseCallback = (response: any) => {
            const responseObj = JSON.parse(response)
            if(eventName !== 'GameInfo'){
                console.log('收到事件：' + eventName, responseObj)
            }
            callback(responseObj)
        }

        callbacks.push({ 
            originalCallback: callback,
             jsonCallback: jsonParseCallback, 
            eventName: eventName
        })
        connection.value.on(eventName, jsonParseCallback)
    }

    function removeGameHubListener(eventName: string, callback: (...args: any[]) => void) {
        if (!connection.value) {
            return
        }
        //console.log('移除事件：' + eventName)

        const callbackObj = callbacks.find((x) => x.originalCallback == callback)
        if (callbackObj) {
            connection.value.off(eventName, callbackObj.jsonCallback)
        }
    }

    function checkConnection() {
        if (!isConnected.value) {
            router.push('/regular-home').then()
            return
        }
        clearTimeout(checkInterval.value)
        checkInterval.value = setTimeout(checkConnection, 500)
    }

    watch(
        computed(() => isConnected.value),
        async () => {
            if (!isConnected.value) {
                await connect()
            }
        }
    )

    watch(
        computed(() => user.userName),
        async (userName) => {
            if (!isConnected.value && userName) {
                await connect()
                checkConnection()
            }
        }
    )

    return {
        connection,
        isConnected,
        invokeGameHub,
        addGameHubListener,
        removeGameHubListener,
        connect
    }
})

export function useGameHub() {
    return useGameHubStore(store)
}
