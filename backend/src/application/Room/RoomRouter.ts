import express from "express";
import {RoomDTO, RoomMap} from "@/application/Room/RoomMap";
import {RoomId} from "@/domain/Room/RoomId";
import {Room} from "@/domain/Room/Room";
import {HTTPError} from "@/shared/HTTPError";
import {User} from "@/domain/User/User";
import {UserMap} from "@/application/User/UserMap";
import {PageSize, PageToken} from "@/shared/Pagination";
import {UserId} from "@/domain/User/UserId";
import {RoomRepository} from "@/domain/Room/RoomRepository";
import {UserRepository} from "@/domain/User/UserRepository";
import {GameRepository} from "@/domain/Game/GameRepository";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {EventBroadcaster} from "@/application/shared/EventBroadcaster";

export class RoomRouter {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly userRepository: UserRepository,
        private readonly gameRepository: GameRepository,
        private readonly eventBroadcaster: EventBroadcaster
    ) {}

    setup(app: express.Application) {
        app.get('/rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const room = await this.roomRepository.find(roomId);

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
                const roomsPage = await this.roomRepository.getPage(pageToken, pageSize);
                const roomsDTO = await Promise.all(roomsPage.results.map(this.getRoomDTO.bind(this)));

                res.status(200).json({
                    results: roomsDTO,
                    nextPageToken: roomsPage.nextPageToken,
                    prevPageToken: roomsPage.prevPageToken,
                    totalSize: await this.roomRepository.getTotalSize()
                });
            } catch (e) {
                next(e);
            }
        })

        app.post('/rooms', async (req, res, next) => {
            try {
                const hostId = req.cookies.UserId as string;
                const hostAlreadyHasRoom = !!(await this.roomRepository.findRoomByHostId(UserId.create(hostId)));

                const room = Room.createForHost({
                    name: req.body.name as string,
                    hostId,
                    usersIds: [hostId],
                }, hostAlreadyHasRoom);

                await this.roomRepository.save(room);
                const roomDTO = await this.getRoomDTO(room);
                this.eventBroadcaster.broadcastToRooms('roomAdded', roomDTO);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        })

        app.put(`/rooms/:id/join`, async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const room = await this.roomRepository.find(roomId);
                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const userId = req.cookies.UserId as string;
                const userIdValueObject = UserId.create(userId);
                const userExists = !!(await this.userRepository.find(userIdValueObject));
                if (!userExists) {
                    next(new HTTPError(400, 'User does not exist'));
                    return;
                }

                const existingMembership = await this.roomRepository.findRoomByUserId(userIdValueObject);
                if (existingMembership && !existingMembership.id.exact(roomId)) {
                    next(new HTTPError(400, 'User is already a member of another room'));
                    return;
                }

                const updatedRoom = room.userJoins(userId);
                await this.roomRepository.save(updatedRoom);
                const roomDTO = await this.getRoomDTO(updatedRoom);
                this.eventBroadcaster.broadcastToRooms('roomEdited', roomDTO);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        })

        app.put('/rooms/:id/leave', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const room = await this.roomRepository.find(roomId);

                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const updatedRoom = room.userLeaves(req.cookies.UserId);
                if (updatedRoom) {
                    await this.roomRepository.save(updatedRoom);
                    const roomDTO = await this.getRoomDTO(updatedRoom);
                    this.eventBroadcaster.broadcastToRooms('roomEdited', roomDTO);
                } else {
                    await this.roomRepository.delete(roomId);
                    this.eventBroadcaster.broadcastToRooms('roomDeleted', {id: roomId.value});
                }

                res.status(200).json({});
            } catch (e) {
                next(e);
            }
        });

        app.put('/rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const room = await this.roomRepository.find(roomId);

                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const updatedRoom = room.hostEditsRoom(req.cookies.UserId, {
                    name: req.body.name,
                    usersIds: req.body.usersIds
                });

                await this.roomRepository.save(updatedRoom);
                const roomDTO = await this.getRoomDTO(updatedRoom);
                this.eventBroadcaster.broadcastToRooms('roomEdited', roomDTO);

                res.status(200).json(roomDTO);
            } catch (e) {
                next(e);
            }
        });

        app.delete('/rooms/:id', async (req, res, next) => {
            try {
                const roomId = RoomId.create(req.params.id);
                const room = await this.roomRepository.find(roomId);

                if (!room) {
                    next(new HTTPError(404, 'Room not found'));
                    return;
                }

                const existingGame = room.activeGameId ? await this.gameRepository.find(room.activeGameId) : undefined;
                const gameInProgress = !!existingGame && existingGame.status.value !== GameStatusEnum.ENDED;

                room.assertHostCanDelete(req.cookies.UserId, gameInProgress);
                await this.roomRepository.delete(roomId);
                this.eventBroadcaster.broadcastToRooms('roomDeleted', {id: roomId.value});

                res.status(200).send();
            } catch (e) {
                next(e);
            }
        });
    }

    async getRoomUsers(room: Room): Promise<User[]> {
        const usersOrUndefined = await Promise.all(
            room.usersIds.values.map(userId => this.userRepository.find(userId))
        );

        return usersOrUndefined.flatMap(user => user ? [user] : []);
    }

    async getRoomDTO(room: Room): Promise<RoomDTO> {
        const [users, game] = await Promise.all([
            this.getRoomUsers(room),
            room.activeGameId ? this.gameRepository.find(room.activeGameId) : undefined
        ])

        const usersDTO = users.map(UserMap.toDTO);

        return RoomMap.toDTO(room, usersDTO, game?.status.value);
    }
}
