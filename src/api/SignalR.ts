import * as signalR from '@microsoft/signalr';
import {toast} from '@src/utils/Toast.ts';


//var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
var rootUrl = window._env_.VUE_APP_API_URL;

var connection: signalR.HubConnection | null = null;
var lastToken: string | null = null;

var getGameInterval: any;

export const isConnected = () => {
    return connection?.state === signalR.HubConnectionState.Connected;
};

export const connectToGameHub = async () =>{
    // 确保函数不可重入，每次调用都会断开前面的连接
    if (connection) {
        await connection.stop();
        connection = null;
    }

    if(!getGameInterval){
        getGameInterval = setInterval(() => {
            invokeGameHub('GetServerTime');
      }, 10000);
    }

    try {
        // 检查并更新 jwt-token
        const currentToken = localStorage.getItem('jwt-token');
        if (lastToken !== currentToken) {
            lastToken = currentToken;
            connection = null;
        }

        // 创建新的连接实例
        connection = new signalR.HubConnectionBuilder()
            .withUrl(`${rootUrl}/gamehub`, {
                accessTokenFactory: () => localStorage.getItem('jwt-token') ?? ""
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // 连接关闭时的处理
        connection.onclose(async (error) => {
            console.error('Connection closed due to error.', error);
            connection = null;
        });

        // 启动连接
        await connection.start();
        console.log("SignalR Connected.");
        
        // 连接成功后的后处理
        await postConnectionSetup();

    } catch (error) {
        console.error('An error occurred while connecting to the game hub:', error);
        return false;
    }

    return true;
};

const postConnectionSetup = async () => {
    if (!connection) {
        return;
    }
    console.log("Performing post-connection setup...");
    connection.on("MyConnectionInfo", (response) => {
        var responseObj = JSON.parse(response);
        localStorage.setItem('connection-id', responseObj.ConnectionId);
    });

    connection.on("ServerTime", (response) => {
        var responseObj = JSON.parse(response);
        var utcTime = new Date(responseObj.UtcNow);
        var localTime = new Date(responseObj.LocalNow);
        console.log("Server time: ", utcTime, localTime);
        var timeDiff = new Date().getTime() - utcTime.getTime();
        console.log("Time difference: ", timeDiff);
        localStorage.setItem('server-time-diff', timeDiff.toString());
    });
    
    await connection.invoke("Me");

    // 执行所有的connectCallbacks
    connectCallbacks.forEach((callback) => {
        try{
            callback();
        }catch(e){
            console.error(e)
        }
    });
};

var callbacks: { originalCallback: (...args: any[]) => void; jsonCallback: (response: any) => void; }[] = [];

export const addGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {

    if (!connection) {
        return;
    }

    var jsonParshCallback = (response: any) => {
        var responseObj = JSON.parse(response);
        callback(responseObj);
    }

    callbacks.push({ "originalCallback": callback, "jsonCallback": jsonParshCallback });

    connection.on(eventName, jsonParshCallback);
};

var connectCallbacks: any[] = []

export const addConnectListener = (callback: () => void) => {
    //记录所有的callback
    connectCallbacks.push(callback)
    if(isConnected()){
        try{
            callback()
        }catch(e){
            console.error(e)
        }
    }
}

export const removeConnectListener = (callback: () => void) => {
    //移除callback
    connectCallbacks = connectCallbacks.filter(x => x != callback)
}

export const removeGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    if (!connection) {
        return;
    }

    var callbackObj = callbacks.find(x => x.originalCallback == callback);
    if (callbackObj) {
        connection.off(eventName, callbackObj.jsonCallback);
    }
};

export const invokeGameHub = (methodName: string, ...args: any[]) => {
    if (!connection) {
        return;
    }

    connection.invoke(methodName, ...args).catch((err) =>{
         console.error(err)
         toast("服务器返回意外错误，请稍后再试。")
    });
};