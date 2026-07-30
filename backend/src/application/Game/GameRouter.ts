import express, {NextFunction, Request, Response} from "express";
import {GameRepository} from "@/domain/Game/GameRepository";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {HTTPError} from "@/shared/HTTPError";
import {UserRepository} from "@/domain/User/UserRepository";
import {UserId} from "@/domain/User/UserId";
import {Position} from "@/domain/Game/Cell/valueObject/Position";
import {RoomRepository} from "@/domain/Room/RoomRepository";
import {RoomId} from "@/domain/Room/RoomId";
import {Player} from "@/domain/Game/Player/Player";
import {CellDTO, CellMap} from "@/application/Game/CellMap";
import {PlayerDTO, PlayerMap} from "@/application/Game/PlayerMap";
import {gameDTO, GameMap} from "@/application/Game/GameMap";
import {EventBroadcaster} from "@/application/shared/EventBroadcaster";
import {RoomMap} from "@/application/Room/RoomMap";
import {UserMap} from "@/application/User/UserMap";

export class GameRouter {
    constructor(
        private readonly gameRepository: GameRepository,
        private readonly userRepository: UserRepository,
        private readonly roomRepository: RoomRepository,
        private readonly eventBroadcaster: EventBroadcaster
    ) {}

    setup(app: express.Application) {

        app.get('/games/:id', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const gameId = GameId.create(req.params.id);
                const game = await this.gameRepository.find(gameId);

                if (!game || game.status.value === GameStatusEnum.ENDED) {
                    next(new HTTPError(404, 'Game not found'));
                    return;
                }

                res.status(200).json(await this.getGameDTO(game));
            } catch (e) {
                next(e);
            }
        });

        app.put('/games/:id/mark', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const gameId = GameId.create(req.params.id);
                const game = await this.gameRepository.find(gameId);

                if (!game) {
                    next(new HTTPError(404, 'Game not found'));
                    return;
                }

                const userId = UserId.create(req.cookies.UserId as string);
                const updatedGame = game.playerMarksCell(userId, Position.create(req.body.position));
                await this.gameRepository.save(updatedGame);

                const dto = await this.getGameDTO(updatedGame);
                if (updatedGame.status.value === GameStatusEnum.ENDED) {
                    this.eventBroadcaster.broadcastToGame(gameId.value, 'gameEnded', dto);
                } else {
                    this.eventBroadcaster.broadcastToGame(gameId.value, 'gameLastTurn', dto);
                }

                res.status(200).json({});
            } catch (e) {
                next(e);
            }
        });

        app.put('/games/leave', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const gameId = GameId.create(req.body.gameId);
                const game = await this.gameRepository.find(gameId);

                if (!game) {
                    next(new HTTPError(404, 'Game not found'));
                    return;
                }

                const userId = UserId.create(req.cookies.UserId as string);
                const updatedGame = game.playerLeaves(userId);

                if (updatedGame) {
                    await this.gameRepository.save(updatedGame);
                    const dto = await this.getGameDTO(updatedGame);
                    this.eventBroadcaster.broadcastToGame(gameId.value, 'gameEnded', dto);
                } else {
                    await this.gameRepository.delete(gameId);
                    this.eventBroadcaster.broadcastToGame(gameId.value, 'gameDeleted', {id: gameId.value});
                }

                res.status(200).json({});
            } catch (e) {
                next(e);
            }
        });

        app.post('/games', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const roomId = RoomId.create(req.body.roomId);
                const room = await this.roomRepository.find(roomId);

                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const hostIdRaw = req.cookies.UserId as string;
                const hostId = UserId.create(hostIdRaw);
                const existingGame = room.activeGameId ? await this.gameRepository.find(room.activeGameId) : undefined;
                const gameInProgress = !!existingGame && existingGame.status.value !== GameStatusEnum.ENDED;

                const newGameId = GameId.create();
                const updatedRoom = room.startGame(hostId, newGameId, gameInProgress);

                const otherUserId = room.usersIds.values.find(userId => !userId.exact(hostId))!.value;
                const game = Game.start(newGameId.value, room.id.value, hostIdRaw, otherUserId);

                await this.gameRepository.save(game);
                await this.roomRepository.save(updatedRoom);

                const users = await Promise.all(updatedRoom.usersIds.values.map(userId => this.userRepository.find(userId)));
                const usersDTO = users.flatMap(user => user ? [UserMap.toDTO(user)] : []);
                const roomDTO = RoomMap.toDTO(updatedRoom, usersDTO, game.status.value);
                this.eventBroadcaster.broadcastToRooms('roomEdited', roomDTO);

                res.status(200).json(await this.getGameDTO(game));
            } catch (e) {
                next(e);
            }
        });

    }

    async getPlayerDTO(player: Player): Promise<PlayerDTO | undefined> {
        const user = await this.userRepository.find(player.userId);
        if (!user) {
            return undefined
        }

        return PlayerMap.toDTO(player, user);
    }

    getCellsDTO(game: Game): CellDTO[] {
        return game.cells.map(CellMap.toDTO);
    }

    async getGameDTO(game: Game): Promise<gameDTO> {
        const playersDTOOrUndefined = await Promise.all(game.players.map(player => this.getPlayerDTO(player)));
        const playersDTO = playersDTOOrUndefined.flatMap(playerDTO => playerDTO ? [playerDTO] : []);

        return GameMap.toDTO(game, playersDTO, this.getCellsDTO(game));
    }
}
