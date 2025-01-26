import {ValueObject} from "@/_modules/shared/models/ValueObject";
import {UIError} from "@/_modules/shared/models/UIError";

export enum GameStatusEnum {
    IN_PROGRESS = 'IN_PROGRESS',
    ENDED = 'ENDED',
    WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS'
}

export enum GameStatusEnumUI {
    IN_PROGRESS = 'In progress',
    ENDED = 'Ended',
    WAITING_FOR_PLAYERS = 'Waiting for players',
    DEFAULT = 'Unknown'
}

export class GameStatus extends ValueObject<GameStatusEnum>{
    private constructor(value: GameStatusEnum) {
        super(value);
    }

    public static create(value?: GameStatusEnum): GameStatus {
        if(value && !Object.values(GameStatusEnum).includes(value as GameStatusEnum)){
            throw new UIError('Invalid GameStatus value');
        }

        return new GameStatus(value ? value : GameStatusEnum.IN_PROGRESS);
    }
    
    public toUserFriendlyString(): string {
        switch(this.value) {
            case GameStatusEnum.IN_PROGRESS:
                return GameStatusEnumUI.IN_PROGRESS;
            case GameStatusEnum.ENDED:
                return GameStatusEnumUI.ENDED;
            case GameStatusEnum.WAITING_FOR_PLAYERS:
                return GameStatusEnumUI.WAITING_FOR_PLAYERS;
            default:
                return GameStatusEnumUI.DEFAULT
        }
    }
}
