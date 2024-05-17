import * as signalR from '@microsoft/signalr';
import {toast} from '@src/api/Toast.ts';


//var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
var rootUrl = window._env_.VUE_APP_API_URL;

var connection: signalR.HubConnection | null = null;
var lastToken: string | null = null;

export const isConnected = () => {
    return connection?.state === signalR.HubConnectionState.Connected;
};

export const connectToGameHub = async () =>{
    // 确保函数不可重入，每次调用都会断开前面的连接
    if (connection) {
        await connection.stop();
        connection = null;
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
    
    await connection.invoke("Me");
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