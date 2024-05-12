import * as signalR from '@microsoft/signalr';

var connection: signalR.HubConnection;

var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
// rootUrl = "http://localhost:5003"

export const connetToGameHub = async () => {
    try {

        if (connection) {
            return;
        }

        connection = new signalR.HubConnectionBuilder()
            .withUrl(rootUrl + "/gamehub", {
                accessTokenFactory: () => {
                    console.log("jwt",localStorage.getItem('jwt-token'))
                    return localStorage.getItem('jwt-token') ?? ""
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        async function start() {
            try {
                await connection.start();
                console.log("SignalR Connected.");

                connection.on("MyConnectionInfo", (response)=>{
                    var responseObj = JSON.parse(response);
                    localStorage.setItem('connection-id', responseObj.ConnectionId);                
                });

                await connection.invoke("Me");

            } catch (err) {
                console.log(err);
                setTimeout(start, 5000);
            }
        };

        connection.onclose(async () => {
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
    var jsonParshCallback = (response:any)=>{
        var responseObj = JSON.parse(response);
        callback(responseObj);
    }

    callbacks.push({"originalCallback":callback, "jsonCallback": jsonParshCallback});

    connection.on(eventName, jsonParshCallback);
};

export const removeGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    var callbackObj = callbacks.find(x=>x.originalCallback == callback);
    if (callbackObj){
        connection.off(eventName, callbackObj.jsonCallback);
    }
};

export const invokeGameHub = (methodName: string, ...args: any[]) => {
    connection.invoke(methodName, ...args).catch((err) => console.error(err));
};