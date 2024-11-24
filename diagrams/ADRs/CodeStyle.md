# Code style rules
- Created at: 2021-09-27
- By: Piotr Pieprzyk

## Class construction

1. Use constructor with props, for classes if 
- constructor have more than 4 parameters or in the future we plan more than 4 parameters
```ts
type RoomProps = {
    id: RoomId;
    name: RoomName;
    hostId: UserId;
    activeGameId?: GameId;
    usersIds: UserId[];
    updatedTimestamp: Timestamp
};

export class Room {
    public readonly id: RoomId;
    public readonly name: RoomName;
    public readonly hostId: UserId;
    public readonly activeGameId: GameId | undefined;
    public readonly usersIds: UserId[];
    public readonly updatedTimestamp: Timestamp;

    private constructor(props: RoomProps) {
        this.id = props.id;
        this.name = props.name;
        this.hostId = props.hostId;
        this.activeGameId = props.activeGameId;
        this.usersIds = props.usersIds;
        this.updatedTimestamp = props.updatedTimestamp;
    }
}
```
Pluses:
- It gives flexibility in changing the parameters order in the future.
- If constructor have optional parameters, it is not required to pass undefined to the constructor.

Minus:
- It requires more code, because we need to define the type of the props and assign them to the fields.

Alternative:
```ts
export class Room {
    private constructor(
        public readonly id: RoomId,
        public readonly name: RoomName,
        public readonly usersIds: UserId[],
    ) {}
}
```
