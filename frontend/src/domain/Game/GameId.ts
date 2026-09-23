import {ValueObject} from "@/domain/shared/models/ValueObject.ts";
import {Guid} from "@/domain/shared/models/GUID.ts";

export class GameId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): GameId {
        return new GameId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
