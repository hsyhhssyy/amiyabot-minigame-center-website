

export const games = [
    { id: 1, image: '/SchulteGrid.png' , name: '技能方格猜干员', type:"SchulteGrid", route:"/regular-home/games/schulte-grid/" },
    { id: 2, image: '/SkinGuess.png' , name: '立绘猜干员', notAvailable:true, type:"SkinGuess", route:"/regular-home/games/skin-guess/" },
    { id: 3, image: '/SkillGuess.png' , name: '技能图标猜干员', notAvailable:false, type:"SkillGuess", route:"/regular-home/games/skill-guess/" },
    // 添加更多游戏
]

export interface Room {
    id: string
    creator: string
    creatorAvatar: string,
    createTime: Date
    isStarted: boolean
    isCompleted: boolean
    isClosed: boolean
    playerCount: number
    gameType: string
    isPrivate: boolean
}