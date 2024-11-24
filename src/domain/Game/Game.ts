import {GameId} from "./valueObject/GameId";
import {RoomId} from "../Room/RoomId";
import {GameRepositoryI} from "./GameRepository";
import {Player} from "./Player/Player";
import {CellRepositoryI} from "./Cell/CellRepository";
import {PlayerRepositoryI} from "./Player/PlayerRepository";
import {PlayerId} from "./Player/PlayerId";
import {Timestamp} from "../../shared/Timestamp";
import {GameStatus, GameStatusEnum} from "./valueObject/GameStatus";
import {GameResult, GameResultEnum} from "./valueObject/GameResult";
import {Mark, MarkTypes} from "./Cell/valueObject/Mark";
import {GameMap} from "./GameMap";
import {Cell} from "./Cell/Cell";
import {CellMap, CellPersistence} from "./Cell/CellMap";
import {Position} from "./Cell/valueObject/Position";


export type GameProps = {
    id: GameId,
    roomId: RoomId,
    players: Player[],
    status: GameStatus,
    result?: GameResult,
    activePlayerId: PlayerId,
    winnerPlayerId?: PlayerId,
    updatedTimestamp: Timestamp,
    gameRepository: GameRepositoryI,
    playerRepository: PlayerRepositoryI,
    cellRepository: CellRepositoryI
}

export type GamePropsRaw = {
    id?: string,
    roomId: string,
    players: Player[],
    status?: GameStatusEnum,
    result?: GameResultEnum,
    activePlayerId?: string,
    winnerPlayerId?: string,
    updatedTimestamp?: number,
    gameRepository: GameRepositoryI,
    playerRepository: PlayerRepositoryI,
    cellRepository: CellRepositoryI
}

export class Game {
    public readonly id: GameId;
    public readonly roomId: RoomId;
    public readonly players: Player[];
    public readonly status: GameStatus;
    public readonly result?: GameResult;
    public readonly activePlayerId: PlayerId;
    public readonly winnerPlayerId?: PlayerId;
    public readonly updatedTimestamp: Timestamp;
    public readonly gameRepository: GameRepositoryI;
    public readonly playerRepository: PlayerRepositoryI;
    public readonly cellRepository: CellRepositoryI;

    private constructor(props: GameProps) {
        this.id = props.id;
        this.roomId = props.roomId;
        this.players = props.players;
        this.status = props.status;
        this.result = props.result;
        this.activePlayerId = props.activePlayerId;
        this.winnerPlayerId = props.winnerPlayerId;
        this.updatedTimestamp = props.updatedTimestamp;
        this.gameRepository = props.gameRepository;
        this.playerRepository = props.playerRepository;
        this.cellRepository = props.cellRepository;
    }

    public static create(props: GamePropsRaw): Game {
        if (!props.roomId) {
            throw new Error('Room id is required');
        }

        if (!props.players || props.players.length !== 2) {
            throw new Error('Game must have 2 players');
        }

        return new Game({
            id: GameId.create(props.id),
            roomId: RoomId.create(props.roomId),
            players: props.players,
            status: GameStatus.create(props.status),
            result: props.result ? GameResult.create(props.result) : undefined,
            activePlayerId: props.activePlayerId ? PlayerId.create(props.activePlayerId) : PlayerId.create(props.players[0].id.value),
            winnerPlayerId: props.winnerPlayerId ? PlayerId.create(props.winnerPlayerId) : undefined,
            updatedTimestamp: Timestamp.create(props.updatedTimestamp),
            gameRepository: props.gameRepository,
            playerRepository: props.playerRepository,
            cellRepository: props.cellRepository
        });
    }

    public async playerMarkCell(playerId: string, cellPosition: number, mark: MarkTypes): Promise<void> {
        const playerIdValueObject = PlayerId.create(playerId);
        const markValueObject = Mark.create(mark);
        const cellPositionValueObject = Position.create(cellPosition);

        if (this.status.value === GameStatusEnum.ENDED) {
            throw new Error('Game already ended');
        }

        if (this.status.value === GameStatusEnum.WAITING_FOR_PLAYERS) {
            throw new Error('Game is waiting for players');
        }

        const player = this.players.find(player => player.id.exact(playerIdValueObject));
        const secondPlayer = this.players.find(player => !player.id.exact(playerIdValueObject));

        if (!player) {
            throw new Error('Player not found');
        }

        if (!secondPlayer) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                status: GameStatusEnum.WAITING_FOR_PLAYERS
            });
            throw new Error('Second player not found. Waiting for second player to join');
        }

        if (!player.id.exact(this.activePlayerId)) {
            throw new Error('Not player turn');
        }

        const gameCells = (await this.cellRepository.findByGameId(this.id)).map(cell => {
            try {
                return Cell.create(cell)
            } catch (e) {
                throw new Error('Parsing already created cells was not possible');
            }
        });

        if (gameCells.some(cell => cell.position.exact(cellPositionValueObject))) {
            throw new Error('Cell already marked');
        }

        const newCell = Cell.create({
            mark: markValueObject.value,
            position: cellPositionValueObject.value,
            gameId: this.id.value
        });

        await this.cellRepository.save(CellMap.toPersistence(newCell));

        const {newGameStatus, newGameResult} = this.getNewGameStatusAndResult([...gameCells, newCell]);

        if (newGameStatus !== GameStatusEnum.ENDED) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                activePlayerId: secondPlayer.id.value,
                updatedTimestamp: Timestamp.create().toPersistent()
            });
            return;
        }
    }

    public getNewGameStatusAndResult(newGameCells: Cell[]): {
        newGameStatus: GameStatusEnum,
        newGameResult: GameResultEnum | undefined
    } {
        return {
            newGameStatus: GameStatusEnum.IN_PROGRESS,
            newGameResult: undefined
        }
    }
}
