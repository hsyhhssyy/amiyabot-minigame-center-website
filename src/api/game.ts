import { serverRequest } from '@/api/index'

export interface GameRoom {
    id: string
    joinCode: string
    gameType: string
    creatorId: string
    creatorAvatar: string
    creatorNickname: string
    createTime: string
    isClosed: boolean
    isCompleted: boolean
    isPrivate: boolean
    isStarted: boolean
    playerList: { [key: string]: string }
}

export async function getGame(gameId: string) {
    return await serverRequest.get<GameRoom>({
        url: '/api/gameHub/' + gameId
    })
}

export async function listGame() {
    return await serverRequest.get<GameRoom[]>({
        url: '/api/gameHub'
    })
}

export async function getShortenUrl(gameId: string): Promise<string> {
    const res = await serverRequest.get({
        url: '/api/gameHub/' + gameId + '/url'
    })
    return res.url
}

export async function statisticsApi(playerId: string): Promise<any> {
    return await serverRequest.get({
        url: '/api/gameHub/player/' + playerId + '/statistics'
    })
}

export async function jmesPathQuery(file:string,query:string): Promise<any>{
    return await serverRequest.post({
        url: '/api/arknights/jmes-path', 
        data: {
            file: file,
            query: query
        }
    })
}
