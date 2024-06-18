export interface Player {
    id: string
    name: string
    avatar: string
}

export interface GamePlayer extends Player {
    score: number
}