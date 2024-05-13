import * as signalR from '@microsoft/signalr';

var connection: signalR.HubConnection | null;

var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL

export const isConnected = () => {
    return connection != undefined && connection != null;
}

export const connetToGameHub = async () => {
    try {

        if (connection) {
            connection.stop();
        }

        connection = new signalR.HubConnectionBuilder()
            .withUrl(rootUrl + "/gamehub", {
                accessTokenFactory: () => {
                    console.log("jwt", localStorage.getItem('jwt-token'))
                    return localStorage.getItem('jwt-token') ?? ""
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        var startingJwt = localStorage.getItem('jwt-token');

        async function start() {
            try {
                if(startingJwt != localStorage.getItem('jwt-token')){
                    return
                }

                if(connection?.state == signalR.HubConnectionState.Connected){
                    return
                }

                if (connection && connection != null) {
                    await connection.start();
                    console.log("SignalR Connected.");

                    connection.on("MyConnectionInfo", (response) => {
                        var responseObj = JSON.parse(response);
                        localStorage.setItem('connection-id', responseObj.ConnectionId);
                    });

                    await connection.invoke("Me");
                }

            } catch (err) {
                console.log(err);
                setTimeout(start, 5000);
            }
        };

        connection.onclose(async () => {
            connection = null;
            await start();
        });

        // Start the connection.
        start();

    } catch (error) {
        console.error('An error occurred while creating a client: ', error);
    }
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

    connection.invoke(methodName, ...args).catch((err) => console.error(err));
};