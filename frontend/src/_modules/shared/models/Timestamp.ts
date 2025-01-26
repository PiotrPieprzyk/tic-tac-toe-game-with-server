// TODO: Decide how timestamp class should be implemented
export class Timestamp {
    private constructor(
        public readonly value: Date
    ) {
    }

    static create(value?: number): Timestamp {
        
        // If value is provided cannot be future epoch
        if(value && value > Date.now()) {
            throw new Error('Timestamp cannot be in the future')
        }
        
        return new Timestamp(value ? new Date(value) : new Date(Date.now()))
    }
    
    public toPersistent(): number {
        return this.value.getTime()
    }
}
