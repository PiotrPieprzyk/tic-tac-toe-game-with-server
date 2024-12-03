export class Guid {
    public static createNewGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public static isValidGuid(guid: string): boolean {
        const guidPattern = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
        return guidPattern.test(guid);
    }

    public static createFromValue(value: string): string {
        if (!Guid.isValidGuid(value)) {
            throw new Error('Invalid GUID');
        }
        return value;
    }
}

console.log(Guid.createNewGuid())
