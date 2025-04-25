import express, {NextFunction, Request, Response} from "express";
import {MockGameRepository} from "../../infrastructure/repositories/mock/MockGameRepository";
import {GameId} from "../../domain/Game/valueObject/GameId";
import {Game} from "../../domain/Game/Game";
import {HTTPError} from "../../shared/HTTPError";
import {MockPlayerRepository} from "../../infrastructure/repositories/mock/MockPlayerRepository";
import {MockCellRepository} from "../../infrastructure/repositories/mock/MockCellRepository";
import {PlayerDTO, PlayerMap} from "./PlayerMap";
import {MockUserRepository} from "../../infrastructure/repositories/mock/MockUserRepository";
import {Room} from "../../domain/Room/Room";
import {User} from "../../domain/User/User";
import {Player} from "../../domain/Game/Player/Player";
import {CellDTO, CellMap} from "./CellMap";
import {Cell} from "../../domain/Game/Cell/Cell";
import {CellId} from "../../domain/Game/Cell/valueObject/CellId";
import {gameDTO, GameMap} from "./GameMap";


const gameRepository = MockGameRepository.create();
const playerRepository = MockPlayerRepository.create();
const cellRepository = MockCellRepository.create();
const userRepository = MockUserRepository.create();

export class GameRouter {
    static setup(app: express.Application) {

        app.get('/games/:id', async (req: Request, res: Response, next: NextFunction) => {
            const gameId = GameId.create(req.params.id);
            const gamePersistence = await gameRepository.find(gameId);
            if (!gamePersistence) {
                next(new HTTPError(404, 'Game not found'));
                return;
            }
            const game = Game.create({
                ...gamePersistence,
                gameRepository,
                playerRepository,
                cellRepository
            });
            
            
            const playersDTO = game.players.map(player => PlayerMap.toDTO(player, ));
            const gameDTO = GameMap.toDTO()
            
            
        });

    }

    static async getPlayerDTO(player: Player): Promise<PlayerDTO | undefined> {
        const userPersistenceOrUndefined = await userRepository.find(player.userId);
        if (!userPersistenceOrUndefined) {
            return undefined
        }
        
        const user =  User.create({
            ...userPersistenceOrUndefined,
        });
        
        return PlayerMap.toDTO(player, user);   
    }
    
    static async getCellsDTO(gameId: GameId): Promise<CellDTO[]> {
        const cellsPersistence = await cellRepository.findByGameId(gameId);
        const cells = cellsPersistence.map(cellPersistence => Cell.create(cellPersistence));
        return cells.map(CellMap.toDTO);
    }
    
    static async getGameDTO(game: Game): Promise<gameDTO> {
        const promises = [
            game.players.map(this.getPlayerDTO),
            GameRouter.getCellsDTO(game.id)
        ]
        
        const [playersDTO, cellsDTO] = await Promise.all(promises);
        
        return GameMap.toDTO(game, playersDTO, cellsDTO);
    }
    
    
}
