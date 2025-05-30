import {MockRoomRepository} from "../../infrastructure/repositories/mock/MockRoomRepository";
import express from "express";
import {RoomDTO, RoomMap} from "./RoomMap";
import {RoomId} from "../../domain/Room/RoomId";
import {Room} from "../../domain/Room/Room";
import {HTTPError} from "../../shared/HTTPError";
import {MockUserRepository} from "../../infrastructure/repositories/mock/MockUserRepository";
import {User} from "../../domain/User/User";
import {UserDTO, UserMap} from "../User/UserMap";
import {MockGameRepository} from "../../infrastructure/repositories/mock/MockGameRepository";
import {guidRegex} from "../../shared/GUID";
import {PageSize, PageToken} from "../../shared/Pagination";
import {RoomName} from "../../domain/Room/RoomName";
import {UserId} from "../../domain/User/UserId";

const roomRepository = MockRoomRepository.create();
const userRepository = MockUserRepository.create();
const gameRepository = MockGameRepository.create();


export class RoomRouter {
    static setup(app: express.Application) {
        app.get('/rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                let room: Room | undefined;

                const roomPersistence = await roomRepository.find(roomId);
                room = roomPersistence ? Room.create({...roomPersistence, roomRepository, userRepository}) : undefined;

                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

               const roomDTO = await this.getRoomDTO(room);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        });

        app.get('/rooms', async (req, res, next) => {
            try {
                const pageToken = PageToken.create(req.query.pageToken as string);
                const pageSize = PageSize.create(req.query.pageSize as string);
                const roomsPersistence = await roomRepository.getPage(pageToken, pageSize);
                const rooms = roomsPersistence.results.map(roomPersistence => Room.create({...roomPersistence, roomRepository, userRepository}));
                const roomsDTO = await Promise.all(rooms.map(this.getRoomDTO.bind(this)));

                res.status(200).json({
                    results: roomsDTO,
                    nextPageToken: roomsPersistence.nextPageToken,
                    prevPageToken: roomsPersistence.prevPageToken,
                    totalSize: await roomRepository.getTotalSize()
                });
            } catch (e) {
                next(e);
            }
        })

        app.post('/rooms', async (req, res, next) => {
            try {
                const room = Room.create({
                    name: req.body.name as string,
                    hostId: req.body.hostId as string,
                    usersIds: req.body.usersIds as string[],
                    roomRepository: roomRepository,
                    userRepository: userRepository,
                })

                await roomRepository.save(RoomMap.toPersistence(room));
                const roomDTO = await this.getRoomDTO(room);
                
                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        })
        
        app.put(`/rooms/:id/join`, async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const roomPersistence = await roomRepository.find(roomId);
                if (!roomPersistence) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const room = Room.create({...roomPersistence, roomRepository, userRepository});
                await room.userJoinsRoom(req.body.userId);
                const newRoomPersistence = await roomRepository.find(roomId);
                if(!newRoomPersistence) {
                    next();
                    return;
                }
                const newRoom = Room.create({...newRoomPersistence, roomRepository, userRepository});
                const roomDTO = await this.getRoomDTO(newRoom);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        })
        
        app.put('/rooms/:id/leave', async (req, res, next) => {
            try {
                const rawRoomId: string = req.params.id;
                const rawUserId: string = req.body.userId;

                console.log(rawRoomId, rawUserId);
                
                const roomId = RoomId.create(rawRoomId);
                const roomPersistence = await roomRepository.find(roomId);
                console.log('roomPersistence', roomPersistence);

                if (!roomPersistence) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }


                const room = Room.create({...roomPersistence, roomRepository, userRepository});
                await room.userLeavesRoom(rawUserId);

                res.status(200).json({});
            } catch (e) {
                next(e);
            }
        });
        
        app.put('rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const roomPersistence = await roomRepository.find(roomId);
                
                if (!roomPersistence) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const room = Room.create({...roomPersistence, roomRepository, userRepository});
                
                const promises: Promise<void>[] = [];
                
                if(req.body.name) {
                    promises.push(room.hostRenamesRoom(req.body.hostId, req.body.name))
                }
                
                if(req.body.usersIds) {
                    // find users that are not in the room
                    const usersNotInTheRoom = room.usersIds.filter(userId => !req.body.usersIds.includes(userId));
                    promises.push(
                        ...usersNotInTheRoom.map(userId => room.userLeavesRoom(userId.value))
                    );
                }
                
                await Promise.all(promises);


                const newRoomPersistence = await roomRepository.find(roomId);
                if(!newRoomPersistence) {
                    next();
                    return;
                }
                const newRoom = Room.create({...newRoomPersistence, roomRepository, userRepository});
                const roomDTO = await this.getRoomDTO(newRoom);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        });
        
        app.delete('/rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                await roomRepository.delete(roomId);

                res.status(200).send();
            } catch (e) {
                next(e);
            }
        });
    }

    static async getRoomUsers(room: Room): Promise<(User)[]> {
        const usersPersistenceOrUndefined = await Promise.all(
            room.usersIds.map(userId => userRepository.find(userId))
        );

        return usersPersistenceOrUndefined.flatMap(user => user ? [User.create(user)] : []);
    }
    
    static async getRoomDTO(room: Room): Promise<RoomDTO> {
        const promises = await Promise.all([
            this.getRoomUsers(room),
            room.activeGameId ? gameRepository.find(room.activeGameId) : undefined
        ])

        const users = promises[0];
        const usersDTO = users.map(UserMap.toDTO);
        const gamePersistence = promises[1];
        
        return RoomMap.toDTO(room, usersDTO, gamePersistence);
    }
}
