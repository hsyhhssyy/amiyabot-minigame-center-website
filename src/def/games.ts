export interface GameItem {
    id: number
    image: string
    name: string
    type: string
    route: string
    settings: string|null
    notAvailable?: boolean
}

export type GameTypes = { [key: string]: GameItem }

export const gameList: GameItem[] = [
    {
        id: 1,
        image: '/games/SchulteGrid.png',
        name: '技能方格猜干员',
        type: 'SchulteGrid',
        route: '/games/schulte-grid/',
        settings: null
    },
    {
        id: 2,
        image: '/games/SkinGuess.png',
        name: '立绘猜干员',
        type: 'SkinGuess',
        route: '/games/skin-guess/',
        settings: null,
        notAvailable: true
    },
    {
        id: 3,
        image: '/games/SkillGuess.png',
        name: '技能图标猜干员',
        type: 'SkillGuess',
        route: '/games/schulte-grid/',
        settings: null,
        notAvailable: true
    },
    {
        id: 4,
        image: '/games/CypherChallenge.png',
        name: '大帝的挑战',
        type: 'CypherChallenge',
        route: '/games/cypher-challenge/',
        settings: null,
        notAvailable: false
    }
]

export function getGameTypeMap() {
    const gameTypeMap: GameTypes = {}
    for (const item of gameList) {
        gameTypeMap[item.type] = item
    }
    return gameTypeMap
}
