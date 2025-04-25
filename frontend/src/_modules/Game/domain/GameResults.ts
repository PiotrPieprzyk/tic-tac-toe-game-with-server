import {ValueObject} from "@/_modules/shared/models/ValueObject";
import {UIError} from "@/_modules/shared/models/UIError";

export enum GameResultEnum {
    WIN = 'WIN',
    DRAW = 'DRAW',
    PLAYER_LEFT_THE_GAME = 'PLAYER_LEFT_THE_GAME',
}

export class GameResult extends ValueObject<GameResultEnum>{
    private constructor(value: GameResultEnum) {
        super(value);
    }

    public static create(value: GameResultEnum): GameResult {
        if(!value || value && !Object.values(GameResultEnum).includes(value as GameResultEnum)){
            throw new UIError('Invalid GameResult value');
        }

        return new GameResult(value);
    }
}
