import {ValueObject} from "../User/UserId";

export class RoomName extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value: string): RoomName {
        if(!value) {
            throw new Error('Room name is required');
        }
        
        if (value.length < 3) {
            throw new Error('Room name must be at least 3 characters long');
        }
        
        if (value.length > 50) {
            throw new Error('Room name must be at most 50 characters long');
        }
        
        return new RoomName(value);
    }
}