import express, {NextFunction, Request, Response} from "express";
import {GameRepository} from "@/domain/Game/GameRepository";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";
import {HTTPError} from "@/shared/HTTPError";
import {UserRepository} from "@/domain/User/UserRepository";
import {Player} from "@/domain/Game/Player/Player";
import {CellDTO, CellMap} from "@/application/Game/CellMap";
import {PlayerDTO, PlayerMap} from "@/application/Game/PlayerMap";
import {gameDTO, GameMap} from "@/application/Game/GameMap";

export class GameRouter {
    constructor(
        private readonly gameRepository: GameRepository,
        private readonly userRepository: UserRepository
    ) {}

    setup(app: express.Application) {

        app.get('/games/:id', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const gameId = GameId.create(req.params.id);
                const game = await this.gameRepository.find(gameId);

                if (!game) {
                    next(new HTTPError(404, 'Game not found'));
                    return;
                }

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
