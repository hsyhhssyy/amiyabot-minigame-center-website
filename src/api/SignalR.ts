import * as signalR from '@microsoft/signalr'
import { toast, getData, setData } from '@/utils'

// @ts-ignore
const rootUrl = window['_env_'].VUE_APP_API_URL

let connectCallbacks: any[] = []
let connection: signalR.HubConnection | null = null
let lastToken: string | null | undefined = null
let getGameInterval: any = null

export interface SignalrResponse {
    [kek: string]: any
}

export const isConnected = () => {
    return connection?.state === signalR.HubConnectionState.Connected
}

export const connectToGameHub = async () => {
    // 确保函数不可重入，每次调用都会断开前面的连接
    if (connection) {
        await connection.stop()
        connection = null
    }

    if (!getGameInterval) {
        getGameInterval = setInterval(() => {
            invokeGameHub('GetServerTime')
        }, 10000)
    }

    try {
        // 检查并更新 jwt-token
        const currentToken = getData<string | null>('jwt-token')
        if (lastToken !== currentToken) {
            lastToken = currentToken
            connection = null
        }

        // 创建新的连接实例
        connection = new signalR.HubConnectionBuilder()
            .withUrl(`${rootUrl}/gamehub`, {
                accessTokenFactory: () => getData<string>('jwt-token') ?? ''
            })
            .configureLogging(signalR.LogLevel.Information)
            .build()

        // 连接关闭时的处理
        connection.onclose(async (error) => {
            console.error('Connection closed due to error.', error)
            connection = null
        })

        // 启动连接
        await connection.start()
        console.log('SignalR Connected.')

        // 连接成功后的后处理
        await postConnectionSetup()
    } catch (error) {
        console.error('An error occurred while connecting to the game hub:', error)
        return false
    }

    return true
}

const postConnectionSetup = async () => {
    if (!connection) {
        return
    }
    console.log('Performing post-connection setup...')
    connection.on('MyConnectionInfo', (response) => {
        const responseObj = JSON.parse(response)
        setData('connection-id', responseObj.ConnectionId)
    })

    connection.on('ServerTime', (response) => {
        const responseObj = JSON.parse(response)
        const utcTime = new Date(responseObj.UtcNow)
        const localTime = new Date(responseObj.LocalNow)
        console.log('Server time: ', utcTime, localTime)
        const timeDiff = new Date().getTime() - utcTime.getTime()
        console.log('Time difference: ', timeDiff)
        setData('server-time-diff', timeDiff.toString())
    })

    await connection.invoke('Me')

    // 执行所有的connectCallbacks
    connectCallbacks.forEach((callback) => {
        try {
            callback()
        } catch (e) {
            console.error(e)
        }
    })
}

const callbacks: {
    originalCallback: (...args: any[]) => void
    jsonCallback: (response: SignalrResponse) => void
}[] = []

export const addGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    if (!connection) {
        return
    }

    const jsonParseCallback = (response: any) => {
        const responseObj = JSON.parse(response)
        callback(responseObj)
    }

    callbacks.push({ originalCallback: callback, jsonCallback: jsonParseCallback })

    connection.on(eventName, jsonParseCallback)
}

export const addConnectListener = (callback: () => void) => {
    //记录所有的callback
    connectCallbacks.push(callback)
    if (isConnected()) {
        try {
            callback()
        } catch (e) {
            console.error(e)
        }
    }
}

export const removeConnectListener = (callback: () => void) => {
    //移除callback
    connectCallbacks = connectCallbacks.filter((x) => x != callback)
}

export const removeGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    if (!connection) {
        return
    }

    const callbackObj = callbacks.find((x) => x.originalCallback == callback)
    if (callbackObj) {
        connection.off(eventName, callbackObj.jsonCallback)
    }
}

export const invokeGameHub = (methodName: string, ...args: any[]) => {
    if (!connection) {
        return
    }

    connection.invoke(methodName, ...args).catch((err) => {
        console.error(err)
        // toast('服务器返回意外错误，请稍后再试。').then()
    })
}
