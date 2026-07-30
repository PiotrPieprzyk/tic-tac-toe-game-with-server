import {GameId} from "@/domain/Game/valueObject/GameId";
import {RoomId} from "@/domain/Room/RoomId";
import {UserId} from "@/domain/User/UserId";
import {Player, PlayerPropsRaw} from "@/domain/Game/Player/Player";
import {PlayerId} from "@/domain/Game/Player/PlayerId";
import {Timestamp} from "@/shared/Timestamp";
import {GameStatus, GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {GameResult, GameResultEnum} from "@/domain/Game/valueObject/GameResult";
import {Mark, MarkTypes} from "@/domain/Game/Cell/valueObject/Mark";
import {Cell, CellPropsRaw} from "@/domain/Game/Cell/Cell";
import {Position} from "@/domain/Game/Cell/valueObject/Position";
import {ValidationError} from "@/shared/DomainError";


export type GameProps = {
    id: GameId,
    roomId: RoomId,
    players: Player[],
    cells: Cell[],
    status: GameStatus,
    result?: GameResult,
    activePlayerId?: PlayerId,
    winnerPlayerId?: PlayerId,
    updatedTimestamp: Timestamp,
}

export type GamePropsRaw = {
    id?: string,
    roomId: string,
    players: PlayerPropsRaw[],
    cells?: CellPropsRaw[],
    status?: GameStatusEnum,
    result?: GameResultEnum,
    activePlayerId?: string,
    winnerPlayerId?: string,
    updatedTimestamp?: number,
}

export class Game {
    public readonly id: GameId;
    public readonly roomId: RoomId;
    public readonly players: Player[];
    public readonly cells: Cell[];
    public readonly status: GameStatus;
    public readonly result?: GameResult;
    public readonly activePlayerId?: PlayerId;
    public readonly winnerPlayerId?: PlayerId;
    public readonly updatedTimestamp: Timestamp;

    private constructor(props: GameProps) {
        this.id = props.id;
        this.roomId = props.roomId;
        this.players = props.players;
        this.cells = props.cells;
        this.status = props.status;
        this.result = props.result;
        this.activePlayerId = props.activePlayerId;
        this.winnerPlayerId = props.winnerPlayerId;
        this.updatedTimestamp = props.updatedTimestamp;
    }

    public static create(props: GamePropsRaw): Game {
        if (!props.roomId) {
            throw new ValidationError('Room id is required');
        }

        return new Game({
            id: GameId.create(props.id),
            roomId: RoomId.create(props.roomId),
            players: props.players.map(player => Player.create(player)),
            cells: (props.cells || []).map(cell => Cell.create(cell)),
            status: GameStatus.create(props.status),
            result: props.result ? GameResult.create(props.result) : undefined,
            activePlayerId: props.activePlayerId ? PlayerId.create(props.activePlayerId) : undefined,
            winnerPlayerId: props.winnerPlayerId ? PlayerId.create(props.winnerPlayerId) : undefined,
            updatedTimestamp: Timestamp.create(props.updatedTimestamp),
        });
    }

    public playerMarksCell(userId: UserId, cellPosition: Position): Game {
        if (this.status.value === GameStatusEnum.ENDED) {
            throw new ValidationError('Game already ended');
        }

        if (this.status.value === GameStatusEnum.WAITING_FOR_PLAYERS) {
            throw new ValidationError('Game is waiting for players');
        }

        const player = this.players.find(player => player.userId.exact(userId));
        const secondPlayer = this.players.find(player => !player.userId.exact(userId));

        if (!player) {
            throw new ValidationError('User is not a player of this game');
        }

        if (!secondPlayer) {
            throw new ValidationError('Second player not found. Waiting for second player to join');
        }

        if (this.activePlayerId && !player.id.exact(this.activePlayerId)) {
            throw new ValidationError('Not player turn');
        }

        if (this.cells.some(cell => cell.position.exact(cellPosition))) {
            throw new ValidationError('Cell already marked');
        }

        const newCell = Cell.create({
            mark: player.mark.value,
            position: cellPosition.value,
            gameId: this.id.value
        });

        const newCells = [...this.cells, newCell];
        const {newGameStatus, newGameResult, winner} = this.verifyWinningCombinations(newCells, player);

        return new Game({
            ...this,
            cells: newCells,
            status: GameStatus.create(newGameStatus),
            result: newGameResult ? GameResult.create(newGameResult) : this.result,
            winnerPlayerId: winner ? winner.id : this.winnerPlayerId,
            activePlayerId: newGameStatus === GameStatusEnum.ENDED ? this.activePlayerId : secondPlayer.id,
            updatedTimestamp: Timestamp.create()
        });
    }

    private verifyWinningCombinations(newGameCells: Cell[], currentPlayer: Player): {
        newGameStatus: GameStatusEnum,
        newGameResult?: GameResultEnum,
        winner?: Player
    } {

        // Check if there is a winner
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical
            [0, 4, 8], [2, 4, 6] // diagonal
        ];

        let winningMark: Mark | undefined = undefined;

        for (const combination of winningCombinations) {
            const marks = combination.map(position => {
                const cell = newGameCells.find(cell => cell.position.exact(Position.create(position)));
                return cell ? cell.mark : undefined;
            });

            const firstMarkType = marks[0];

            if (!firstMarkType) {
                continue;
            }

            if (marks.every(mark => mark instanceof Mark && firstMarkType.exact(mark))) {
                winningMark = firstMarkType;
                break;
            }
        }

        if (winningMark) {
            return {
                newGameStatus: GameStatusEnum.ENDED,
                newGameResult: GameResultEnum.WIN,
                winner: currentPlayer
            }
        }

        if (newGameCells.length === 9) {
            return {
                newGameStatus: GameStatusEnum.ENDED,
                newGameResult: GameResultEnum.DRAW
            }
        }

        return {
            newGameStatus: GameStatusEnum.IN_PROGRESS,
            newGameResult: undefined
        }
    }

    /** Returns undefined when the game has no players left and should be deleted. */
    public playerLeaves(userId: UserId): Game | undefined {
        const player = this.players.find(player => player.userId.exact(userId));

        if (!player) {
            throw new ValidationError('User is not a player of this game');
        }

        if (this.players.length === 1) {
            return undefined;
        }

        return new Game({
            ...this,
            players: this.players.filter(p => !p.id.exact(player.id)),
            status: GameStatus.create(GameStatusEnum.ENDED),
            result: GameResult.create(GameResultEnum.PLAYER_LEFT_THE_GAME),
            activePlayerId: undefined,
            updatedTimestamp: Timestamp.create()
        });
    }

    public static start(id: string, roomId: string, hostUserId: string, otherUserId: string): Game {
        const hostPlayer = Player.create({userId: hostUserId, mark: MarkTypes.X});
        const otherPlayer = Player.create({userId: otherUserId, mark: MarkTypes.O});

        return new Game({
            id: GameId.create(id),
            roomId: RoomId.create(roomId),
            players: [hostPlayer, otherPlayer],
            cells: [],
            status: GameStatus.create(GameStatusEnum.IN_PROGRESS),
            activePlayerId: hostPlayer.id,
            updatedTimestamp: Timestamp.create()
        });
    }
}
