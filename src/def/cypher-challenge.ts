
export interface Answer {
    CharacterName: string;
    CharacterId: string;
    CharacterPropertiesResult: { [key: string]: string };
    AnswerTime: Date;
    PlayerId?: string;
    IsAnswerCorrect: boolean;
}

export interface Question {
    GuessChanceLeft: number;
    CharacterName: string;
    CharacterId: string;
    IsHinted: boolean;
    IsCompleted: boolean;
    CharacterProperties: { [key: string]: string };
    CharacterPropertiesRevealed: { [key: string]: boolean };
    CharacterPropertiesUsed: { [key: string]: boolean };
    AnswerList: Answer[];
}
