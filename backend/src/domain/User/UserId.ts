import {Guid} from "../../shared/GUID";

export class ValueObject<T> {
    public readonly value: T;
    
    protected constructor(value: T) {
        this.value = value;
    }
    
    exact(other: ValueObject<T>): boolean {
        if(!other) {
            return false;
        }
        
        return this.value === other.value;
    }
}

export class UserId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(value?: string): UserId {
        return new UserId(value ? Guid.createFromValue(value) : Guid.createNewGuid());
    }
}
