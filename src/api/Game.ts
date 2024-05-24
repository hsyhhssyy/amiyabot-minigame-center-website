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
        url: '/api/gameHub/shorten/' + gameId + '/url'
    })
    return res.url
}
