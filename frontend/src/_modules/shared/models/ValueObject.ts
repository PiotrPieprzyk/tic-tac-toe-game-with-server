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
