import {ValueObject} from "../../../User/UserId";

export class Position extends ValueObject<number>{
    private constructor(value: number) {
        super(value);
    }
    
    public static create(value: number): Position {
        if(!Number.isInteger(value)) {
            throw new Error('Position must be an integer');
        }
        
        if(value < 0) {
            throw new Error('Position must be positive');
        }
        
        if(value > 9) {
            throw new Error('Position must be less than 9');
        }
        
        return new Position(value);
    }
}
