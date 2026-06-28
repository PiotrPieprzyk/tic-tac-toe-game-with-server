import {GameId} from "@/domain/Game/valueObject/GameId";
import {CellId} from "@/domain/Game/Cell/valueObject/CellId";
import {Mark} from "@/domain/Game/Cell/valueObject/Mark";
import {Position} from "@/domain/Game/Cell/valueObject/Position";
import {CellRepositoryI} from "@/infrastructure/repositories/interfaces/CellRepositoryI";

type CellProps = {
    id: CellId;
    mark: Mark;
    position: Position;
    gameId: GameId;
}

type CellPropsRaw = {
    id?: string,
    mark: string,
    position: number,
    gameId: string,
}

export class Cell {
    public readonly id: CellId;
    public readonly mark: Mark;
    public readonly position: Position;
    public readonly gameId: GameId;

    private constructor(props: CellProps) {
        this.id = props.id;
        this.mark = props.mark;
        this.position = props.position;
        this.gameId = props.gameId;
    }

    public static create(props: CellPropsRaw): Cell {
        return new Cell({
            id: CellId.create(props.id),
            mark: Mark.create(props.mark),
            position: Position.create(props.position),
            gameId: GameId.create(props.gameId),
        });
    }
}
