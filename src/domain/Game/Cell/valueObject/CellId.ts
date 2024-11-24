import {Guid} from "../../../../shared/GUID";
import {ValueObject} from "../../../User/UserId";

export class CellId extends ValueObject<string>{
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): CellId {
        return new CellId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
