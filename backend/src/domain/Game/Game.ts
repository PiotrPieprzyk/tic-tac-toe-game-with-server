import {GameId} from "./valueObject/GameId";
import {RoomId} from "../Room/RoomId";
import {GameRepositoryI} from "../../infrastructure/repositories/interfaces/GameRepositoryI";
import {Player} from "./Player/Player";
import {CellRepositoryI} from "../../infrastructure/repositories/interfaces/CellRepositoryI";
import {PlayerId} from "./Player/PlayerId";
import {Timestamp} from "../../shared/Timestamp";
import {GameStatus, GameStatusEnum} from "./valueObject/GameStatus";
import {GameResult, GameResultEnum} from "./valueObject/GameResult";
import {Mark} from "./Cell/valueObject/Mark";
import {GameMap} from "../../application/Game/GameMap";
import {Cell} from "./Cell/Cell";
import {CellMap} from "../../application/Game/CellMap";
import {Position} from "./Cell/valueObject/Position";
import {HTTPError} from "../../shared/HTTPError";
import {PlayerRepositoryI} from "../../infrastructure/repositories/interfaces/PlayerRepositoryI";
import {PlayerPersistence} from "../../application/Game/PlayerMap";


export type GameProps = {
    id: GameId,
    roomId: RoomId,
    players: Player[],
    status: GameStatus,
    result?: GameResult,
    activePlayerId?: PlayerId,
    winnerPlayerId?: PlayerId,
    updatedTimestamp: Timestamp,
    gameRepository: GameRepositoryI,
    playerRepository: PlayerRepositoryI,
    cellRepository: CellRepositoryI
}

export type GamePropsRaw = {
    id?: string,
    roomId: string,
    players: PlayerPersistence[],
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
    public readonly activePlayerId?: PlayerId;
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
            throw new HTTPError(400, 'Room id is required');
        }

        return new Game({
            id: GameId.create(props.id),
            roomId: RoomId.create(props.roomId),
            players: props.players.map(player => Player.create(player)),
            status: GameStatus.create(props.status),
            result: props.result ? GameResult.create(props.result) : undefined,
            activePlayerId: props.activePlayerId ? PlayerId.create(props.activePlayerId) : undefined,
            winnerPlayerId: props.winnerPlayerId ? PlayerId.create(props.winnerPlayerId) : undefined,
            updatedTimestamp: Timestamp.create(props.updatedTimestamp),
            gameRepository: props.gameRepository,
            playerRepository: props.playerRepository,
            cellRepository: props.cellRepository
        });
    }

    public async playerMarkCell(playerId: string, cellPosition: number): Promise<void> {
        const playerIdValueObject = PlayerId.create(playerId);
        const cellPositionValueObject = Position.create(cellPosition);

        if (this.status.value === GameStatusEnum.ENDED) {
            throw new HTTPError(400, 'Game already ended');
        }

        if (this.status.value === GameStatusEnum.WAITING_FOR_PLAYERS) {
            throw new HTTPError(400, 'Game is waiting for players');
        }

        const player = this.players.find(player => player.id.exact(playerIdValueObject));
        const secondPlayer = this.players.find(player => !player.id.exact(playerIdValueObject));

        if (!player) {
            throw new HTTPError(404, 'Player not found');
        }

        if (!secondPlayer) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                status: GameStatusEnum.WAITING_FOR_PLAYERS
            });
            throw new HTTPError(400, 'Second player not found. Waiting for second player to join');
        }

        if (this.activePlayerId && !player.id.exact(this.activePlayerId)) {
            throw new HTTPError(400, 'Not player turn');
        }

        const gameCells = (await this.cellRepository.findByGameId(this.id)).map(cell => {
            try {
                return Cell.create(cell)
            } catch (e) {
                throw new HTTPError(400, 'Parsing already created cells was not possible');
            }
        });

        if (gameCells.some(cell => cell.position.exact(cellPositionValueObject))) {
            throw new HTTPError(400, 'Cell already marked');
        }

        const newCell = Cell.create({
            mark: player.mark.value,
            position: cellPositionValueObject.value,
            gameId: this.id.value
        });

        await this.cellRepository.save(CellMap.toPersistence(newCell));

        const {newGameStatus, newGameResult, winner} = this.verifyWinningCombinations([...gameCells, newCell], player);

        if (newGameStatus !== GameStatusEnum.ENDED) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                activePlayerId: secondPlayer.id.value,
                updatedTimestamp: Timestamp.create().toPersistent()
            });
            return;
        }
        
        if(newGameResult === GameResultEnum.WIN && winner) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                status: GameStatusEnum.ENDED,
                result: GameResultEnum.WIN,
                winnerPlayerId: winner.id.value,
                updatedTimestamp: Timestamp.create().toPersistent()
            });
            return;
        }
        
        if(newGameResult === GameResultEnum.DRAW) {
            await this.gameRepository.save({
                ...GameMap.toPersistence(this),
                status: GameStatusEnum.ENDED,
                result: GameResultEnum.DRAW,
                updatedTimestamp: Timestamp.create().toPersistent()
            });
            return;
        }
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
    
    public async playerLeave(playerId: string): Promise<void> {
        const playerIdValueObject = PlayerId.create(playerId);
        const player = this.players.find(player => player.id.exact(playerIdValueObject));

        if (!player) {
            throw new HTTPError(404, 'Player not found');
        }
        
        if(this.players.length === 1) {
            await this.gameRepository.delete(this.id);
            return;
        }

        await this.gameRepository.save({
            ...GameMap.toPersistence(this),
            status: GameStatusEnum.WAITING_FOR_PLAYERS,
            activePlayerId: !this.activePlayerId || this.activePlayerId.exact(playerIdValueObject) ? 
                undefined : 
                this.activePlayerId.value,
            updatedTimestamp: Timestamp.create().toPersistent()
        });
    }
}
