import {ValueObject} from "../../../User/UserId";
import {HTTPError} from "../../../../shared/HTTPError";

export enum MarkTypes {
    X = 'X',
    O = 'O',
} 

export class Mark extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value: string): Mark {
        if(!value) {
            throw new HTTPError(400, 'Mark is required');
        }
        
        if(!MarkTypes[value as keyof typeof MarkTypes]) {
            throw new HTTPError(400, 'Invalid mark type');
        }
        
        return new Mark(value);
    }
}
