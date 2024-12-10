import {ValueObject} from "../../User/UserId";
import {HTTPError} from "../../../shared/HTTPError";


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
            throw new HTTPError(500, 'Invalid GameResult value');
        }

        return new GameResult(value);
    }
}
