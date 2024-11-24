import {UserId} from "../../User/UserId";
import {Mark} from "../Cell/valueObject/Mark";
import {PlayerId} from "./PlayerId";
import {UserName} from "../../User/UserName";

type PlayerPropsRaw = {
    id?: string,
    userId: string,
    mark: string
}

export class Player {
    private constructor(
        public readonly id: PlayerId,
        public readonly userId: UserId,
        public readonly mark: Mark
    ) {
    }
    
    public static create(props: PlayerPropsRaw): Player {
        return new Player(
            PlayerId.create(props.id),
            UserId.create(props.userId),
            Mark.create(props.mark)
        );
    }
}
