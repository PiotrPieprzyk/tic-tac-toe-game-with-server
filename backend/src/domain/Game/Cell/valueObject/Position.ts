import {ValueObject} from "../../../User/UserId";
import {HTTPError} from "../../../../shared/HTTPError";

export class Position extends ValueObject<number>{
    private constructor(value: number) {
        super(value);
    }
    
    public static create(value: number): Position {
        if(!Number.isInteger(value)) {
            throw new HTTPError(400, 'Position must be an integer');
        }
        
        if(value < 0) {
            throw new HTTPError(400, 'Position cannot be less than 0');
        }
        
        if(8 < value) {
            throw new HTTPError(400, 'Position must be less than 9');
        }
        
        return new Position(value);
    }
}
