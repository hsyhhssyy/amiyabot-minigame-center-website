import * as signalR from '@microsoft/signalr';

var connection: signalR.HubConnection;

var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
rootUrl = "http://localhost:5003"

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

                connection.on("ReceiveMyId", (response)=>{
                    var responseObj = JSON.parse(response);
                    console.log("ReceiveMyId",responseObj.SignalRId);
                    localStorage.setItem('signalrId', responseObj.SignalRId);                
                });

                await connection.invoke("GetMyId");

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

export const addGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    connection.on(eventName, callback);
};

export const removeGameHubListener = (eventName: string, callback: (...args: any[]) => void) => {
    connection.off(eventName, callback);
};

export const invokeGameHub = (methodName: string, ...args: any[]) => {
    connection.invoke(methodName, ...args).catch((err) => console.error(err));
};