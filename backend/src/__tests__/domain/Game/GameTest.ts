import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {GameRepositoryI} from "../../../infrastructure/repositories/interfaces/GameRepositoryI";
import {GameStatusEnum} from "../../../domain/Game/valueObject/GameStatus";
import {UserRepositoryI} from "../../../infrastructure/repositories/interfaces/UserRepositoryI";
import {UserId} from "../../../domain/User/UserId";
import {GameId} from "../../../domain/Game/valueObject/GameId";
import {PlayerId} from "../../../domain/Game/Player/PlayerId";
import {Player} from "../../../domain/Game/Player/Player";
import {Game, GamePropsRaw} from "../../../domain/Game/Game";
import {CellRepositoryI} from "../../../infrastructure/repositories/interfaces/CellRepositoryI";
import {CellId} from "../../../domain/Game/Cell/valueObject/CellId";
import {Mark, MarkTypes} from "../../../domain/Game/Cell/valueObject/Mark";
import {GamePersistence} from "../../../application/Game/GameMap";
import {PlayerPersistence} from "../../../application/Game/PlayerMap";
import {CellPersistence} from "../../../application/Game/CellMap";
import {GameResultEnum} from "../../../domain/Game/valueObject/GameResult";
import {PlayerRepositoryI} from "../../../infrastructure/repositories/interfaces/PlayerRepositoryI";
import {UserPersistence} from "../../../application/User/UserMap";


const exampleGameIdValue = '1afd6658-89af-4bbb-9149-721ae0e23982';
const exampleUserIdValue1 = '2afd6658-89af-4bbb-9149-721ae0e23982';
const exampleUserIdValue2 = '3afd6658-89af-4bbb-9149-721ae0e23982';
const examplePlayerIdValue1 = '4afd6658-89af-4bbb-9149-721ae0e23982';
const examplePlayerIdValue2 = '5afd6658-89af-4bbb-9149-721ae0e23982';
const exampleCellsIdsValues = [
    '6afd6658-89af-4bbb-9149-721ae0e23982',
    '7afd6658-89af-4bbb-9149-721ae0e23982',
    '8afd6658-89af-4bbb-9149-721ae0e23982',

    '9afd6658-89af-4bbb-9149-721ae0e23982',
    '10fd6658-89af-4bbb-9149-721ae0e23982',
    '11fd6658-89af-4bbb-9149-721ae0e23982',

    '12fd6658-89af-4bbb-9149-721ae0e23982',
    '13fd6658-89af-4bbb-9149-721ae0e23982',
    '14fd6658-89af-4bbb-9149-721ae0e23982'
];
const exampleRoomIdValue = "15fd6658-89af-4bbb-9149-721ae0e23982";
const idDoNotExistValue = "16fd6658-89af-4bbb-9149-721ae0e23982";

const exampleGamePersistence: GamePersistence = {
    id: exampleGameIdValue,
    roomId: '15afd6658-89af-4bbb-9149-721ae0e23982',
    players: [],
    activePlayerId: examplePlayerIdValue1,
    status: GameStatusEnum.IN_PROGRESS,
    updatedTimestamp: Date.now(),
}

const examplePlayerPersistence: PlayerPersistence = {
    id: examplePlayerIdValue1,
    userId: exampleUserIdValue1,
    mark: 'X',
}

const exampleCellPersistence: CellPersistence = {
    id: exampleCellsIdsValues[0],
    gameId: exampleGameIdValue,
    position: 0,
    mark: 'X',
}

const mockGameRepository: GameRepositoryI = {
    save: jest.fn(() => Promise.resolve()),
    find: jest.fn((id: GameId) => {
        if (id.value === idDoNotExistValue) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve({...exampleGamePersistence})
    }),
    delete: jest.fn(() => Promise.resolve()),
}

const mockPlayerRepository: PlayerRepositoryI = {
    save: jest.fn(() => Promise.resolve()),
    find: jest.fn((id: PlayerId) => {
        if (id.value === idDoNotExistValue) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve({...examplePlayerPersistence})
    }),
    delete: jest.fn(() => Promise.resolve()),
}

const mockCellRepository: CellRepositoryI = {
    save: jest.fn(() => Promise.resolve()),
    find: jest.fn((id: CellId) => {
        if (id.value === idDoNotExistValue) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve({...exampleCellPersistence})
    }),
    findByGameId(gameId: GameId): Promise<CellPersistence[] | []> {
        if (gameId.value === idDoNotExistValue) {
            return Promise.resolve([]);
        }
        return Promise.resolve([{...exampleCellPersistence}])
    },
    delete: jest.fn(() => Promise.resolve()),
}

describe("Game Class", () => {
    let exampleGameRawProps: GamePropsRaw;
    let examplePlayer1: PlayerPersistence;
    let examplePlayer2: PlayerPersistence;

    beforeEach(() => {
        examplePlayer1 = {
            id: examplePlayerIdValue1,
            userId: exampleUserIdValue1,
            mark: 'X',
        };

        examplePlayer2 = {
            id: examplePlayerIdValue2,
            userId: exampleUserIdValue2,
            mark: 'O',
        };

        exampleGameRawProps = {
            id: exampleGameIdValue,
            roomId: exampleRoomIdValue,
            players: [examplePlayer1, examplePlayer2],
            status: GameStatusEnum.IN_PROGRESS,
            activePlayerId: examplePlayerIdValue1,
            updatedTimestamp: Date.now(),
            gameRepository: mockGameRepository,
            playerRepository: mockPlayerRepository,
            cellRepository: mockCellRepository
        };

        jest.clearAllMocks();
    })


    describe('playerMarkCell', () => {
        it('Player mark empty cell. Should save cell with player mark. The game will not finish after this move.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([
                {
                    id: exampleCellsIdsValues[0],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 1,
                },
                {
                    id: exampleCellsIdsValues[1],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 2,
                },
                {
                    id: exampleCellsIdsValues[2],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 3,
                },
            ]));


            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer2.id
            });


            await expect(game.playerMarkCell(examplePlayer2.id, 4)).resolves.toBeUndefined();

            expect(mockCellRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                gameId: exampleGameIdValue,
                mark: MarkTypes.O,
                position: 4,
            }));
            expect(mockCellRepository.save).toHaveBeenCalledTimes(1);
            expect(mockGameRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: exampleGameIdValue,
                status: GameStatusEnum.IN_PROGRESS,
                activePlayerId: examplePlayer1.id,
            }))
            expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
        })
        
        it('Player mark last cell. Winning combination satisfied. Game is ended with result player 1 win.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([
                // X O X
                // X O X
                // O
                {
                    id: exampleCellsIdsValues[0],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 0,
                },
                {
                    id: exampleCellsIdsValues[1],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 1,
                },
                {
                    id: exampleCellsIdsValues[2],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 2,
                },
                
                
                {
                    id: exampleCellsIdsValues[3],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 3,
                },
                {
                    id: exampleCellsIdsValues[4],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 4,
                },
                {
                    id: exampleCellsIdsValues[5],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 5,
                },
                
                
                {
                    id: exampleCellsIdsValues[6],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 6,
                },
            ]));
            
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer2.id
            });
            
            await expect(game.playerMarkCell(examplePlayer2.id, 7)).resolves.toBeUndefined();
            
            expect(mockCellRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                gameId: exampleGameIdValue,
                mark: MarkTypes.O,
                position: 7,
            }));
            
            expect(mockCellRepository.save).toHaveBeenCalledTimes(1);
            
            expect(mockGameRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: exampleGameIdValue,
                status: GameStatusEnum.ENDED,
                result: GameResultEnum.WIN,
            }))
            
            expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
        });
        
        it('Player mark last cell. Any winning combination has not been satisfied. Game is ended with result draw.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([
                // X O X
                // X O X
                // O X 
                {
                    id: exampleCellsIdsValues[0],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 0,
                },
                {
                    id: exampleCellsIdsValues[1],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 1,
                },
                {
                    id: exampleCellsIdsValues[2],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 2,
                },
                
                
                {
                    id: exampleCellsIdsValues[3],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 3,
                },
                {
                    id: exampleCellsIdsValues[4],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 4,
                },
                {
                    id: exampleCellsIdsValues[5],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 5,
                },
                
                
                {
                    id: exampleCellsIdsValues[6],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 6,
                },
                {
                    id: exampleCellsIdsValues[7],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 7,
                },
            ]));
            
            
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer2.id
            });
            
            await expect(game.playerMarkCell(examplePlayer2.id, 8)).resolves.toBeUndefined();
            
            expect(mockCellRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                gameId: exampleGameIdValue,
                mark: MarkTypes.O,
                position: 8,
            }));
            
            expect(mockCellRepository.save).toHaveBeenCalledTimes(1);
            
            expect(mockGameRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: exampleGameIdValue,
                status: GameStatusEnum.ENDED,
                result: GameResultEnum.DRAW,
            }))
            
            expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
        })

        it('Player cannot mark already marked.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([
                {
                    id: exampleCellsIdsValues[0],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 1,
                },
                {
                    id: exampleCellsIdsValues[1],
                    gameId: exampleGameIdValue,
                    mark: 'O',
                    position: 2,
                },
                {
                    id: exampleCellsIdsValues[2],
                    gameId: exampleGameIdValue,
                    mark: 'X',
                    position: 3,
                },
            ]));

            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id
            });

            await expect(game.playerMarkCell(examplePlayer1.id, 1)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        })

        it('Player cannot mark cell if game is waiting for players.', async () => {
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1],
                activePlayerId: examplePlayer1.id,
                status: GameStatusEnum.WAITING_FOR_PLAYERS
            });

            await expect(game.playerMarkCell(examplePlayer1.id, 1)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        })

        it('Player cannot mark cell if game is ended.', async () => {
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id,
                status: GameStatusEnum.ENDED
            });

            await expect(game.playerMarkCell(examplePlayer1.id, 1)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        })

        it('Player cannot mark cell if player not found.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([]));

            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id,

            });

            await expect(game.playerMarkCell(idDoNotExistValue, 0)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        });

        it('Player cannot mark cell with invalid position.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([]));

            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id,
            });

            await expect(game.playerMarkCell(examplePlayer1.id, 10)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();

            await expect(game.playerMarkCell(examplePlayer1.id, -1)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockCellRepository.save).not.toHaveBeenCalled();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        })
    })
    
    describe('playerLeave', () => {
        it('Player leave game. Game is waiting for players.', async () => {
            mockCellRepository.findByGameId = jest.fn((gameId: GameId) => Promise.resolve([]));

            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id,
            });
            
            await expect(game.playerLeave(examplePlayer1.id)).resolves.toBeUndefined();
            
            expect(mockGameRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: exampleGameIdValue,
                status: GameStatusEnum.WAITING_FOR_PLAYERS,
            }))
        })
        
        it('Player not found. Should throw error.', async () => {
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1, examplePlayer2],
                activePlayerId: examplePlayer1.id,
            });
            
            await expect(game.playerLeave(idDoNotExistValue)).rejects.toThrowErrorMatchingSnapshot();
            expect(mockGameRepository.save).not.toHaveBeenCalled();
        })
        
        it('Last player leave game. Game is deleted.', async () => {
            const game = Game.create({
                ...exampleGameRawProps,
                id: exampleGameIdValue,
                cellRepository: mockCellRepository,
                players: [examplePlayer1],
                activePlayerId: examplePlayer1.id,
            });
            
            await expect(game.playerLeave(examplePlayer1.id)).resolves.toBeUndefined();
            
            expect(mockGameRepository.delete).toHaveBeenCalledWith(GameId.create(exampleGameIdValue));
            expect(mockGameRepository.delete).toHaveBeenCalledTimes(1);
        })
    })

})
