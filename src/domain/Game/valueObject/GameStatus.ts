import {ValueObject} from "../../User/UserId";


export enum GameStatusEnum {
    IN_PROGRESS = 'IN_PROGRESS',
    ENDED = 'ENDED',
    WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS'
}

export class GameStatus extends ValueObject<GameStatusEnum>{
    private constructor(value: GameStatusEnum) {
        super(value);
    }

    public static create(value?: GameStatusEnum): GameStatus {
        if(value && !Object.values(GameStatusEnum).includes(value as GameStatusEnum)){
            throw new Error('Invalid GameStatus value');
        }
        
        return new GameStatus(value ? value : GameStatusEnum.IN_PROGRESS);
    }
}
