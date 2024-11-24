import {ValueObject} from "../../../User/UserId";

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
            throw new Error('Mark is required');
        }
        
        if(!MarkTypes[value as keyof typeof MarkTypes]) {
            throw new Error('Invalid mark type');
        }
        
        return new Mark(value);
    }
}
