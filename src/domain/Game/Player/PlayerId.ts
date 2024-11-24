import {Guid} from "../../../shared/GUID";
import {ValueObject} from "../../User/UserId";

export class PlayerId extends ValueObject<string>{
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): PlayerId {
        return new PlayerId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
