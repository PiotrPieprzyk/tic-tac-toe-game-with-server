import {Guid} from "../../../shared/GUID";
import {ValueObject} from "../../User/UserId";

export class GameId extends ValueObject<string>{
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): GameId {
        return new GameId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
