import {describe, expect, it, beforeEach, jest} from '@jest/globals';
import {RoomRepositoryI} from "../../../infrastructure/repositories/interfaces/RoomRepositoryI";
import {UserRepositoryI} from "../../../infrastructure/repositories/interfaces/UserRepositoryI";
import {UserId} from "../../../domain/User/UserId";
import {Room} from "../../../domain/Room/Room";
import {RoomId} from "../../../domain/Room/RoomId";
import {RoomPersistence} from "../../../application/Room/RoomMap";
import {UserPersistence} from "../../../application/User/UserMap";
import {PageSize, PageToken, PaginatedResponse} from "../../../shared/Pagination";

const exampleHostIdValue = '1afd6658-89af-4bbb-9149-721ae0e23982'
const exampleUserIdValue1 = '2afd6658-89af-4bbb-9149-721ae0e23982'
const exampleUserIdValue2 = '3afd6658-89af-4bbb-9149-721ae0e23982'
const exampleRoomIdValue = "4afd6658-89af-4bbb-9149-721ae0e23982";
const idDoNotExistValue = "5afd6658-89af-4bbb-9149-721ae0e23982";

const exampleRoomPersistence: RoomPersistence = {
    id: exampleRoomIdValue,
    name: "Room Name",
    hostId: exampleHostIdValue,
    usersIds: [exampleHostIdValue, exampleUserIdValue1],
    activeGameId: undefined,
    updatedTimestamp: Date.now(),
}

const exampleUserPersistence = {
    id: exampleUserIdValue1,
    name: "User Name",
    lastActiveDate: Date.now(),
}

const mockRoomRepository: RoomRepositoryI = {
    save: jest.fn(() => Promise.resolve()),
    find: jest.fn((id: RoomId) => {
        if(id.value === idDoNotExistValue) {
            return Promise.resolve(undefined);
        }
        
        return Promise.resolve({...exampleRoomPersistence})
    }),
    getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<RoomPersistence>> {
        throw new Error("Method not implemented.");
    },
    delete: jest.fn(() => Promise.resolve()),
    
};

const mockUserRepository: UserRepositoryI = {
    save: jest.fn(() => Promise.resolve()),
    find: jest.fn((id: UserId) => {
        if(id.value === idDoNotExistValue) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve({...exampleUserPersistence})
    }),
    delete: jest.fn(() => Promise.resolve()),
    getAll(): Promise<UserPersistence[]> {
        throw new Error("Method not implemented.");
    }
};

describe("Room Class", () => {
    let exampleRoomProps: any;
    let exampleHostId: UserId;
    let exampleUserId1: UserId;
    let exampleUserId2: UserId;

    beforeEach(() => {
        exampleHostId = UserId.create(exampleHostIdValue)
        exampleUserId1 = UserId.create(exampleUserIdValue1);
        exampleUserId2 = UserId.create(exampleUserIdValue2);

        exampleRoomProps = {
            ...exampleRoomPersistence,
            updatedTimestamp: Date.now(),
            roomRepository: mockRoomRepository,
            userRepository: mockUserRepository,
        };
    });

    describe("create()", () => {
        it("should create a room with valid props", () => {
            const room = Room.create(exampleRoomProps);
            expect(room).toBeInstanceOf(Room);
            expect(room.hostId.exact(exampleHostId)).toBe(true);
            expect(room.usersIds).toHaveLength(2);
        });
        
        it("should throw an error if name is missing", () => {
            exampleRoomProps.name = undefined;
            expect(() => Room.create(exampleRoomProps)).toThrowErrorMatchingSnapshot();
        });
        
        it('should throw an error if name to long', () => {
            exampleRoomProps.name = "a".repeat(51);
            expect(() => Room.create(exampleRoomProps)).toThrowErrorMatchingSnapshot();
        });

        it("should throw an error if hostId is missing", () => {
            exampleRoomProps.hostId = undefined;
            expect(() => Room.create(exampleRoomProps)).toThrowErrorMatchingSnapshot();
        });

        it("should throw an error if usersIds is empty", () => {
            exampleRoomProps.usersIds = [];
            expect(() => Room.create(exampleRoomProps)).toThrowErrorMatchingSnapshot();
        });

        it("should throw an error if there are more than 2 users", () => {
            exampleRoomProps.usersIds = [exampleHostIdValue, exampleUserIdValue1, exampleUserIdValue2];
            expect(() => Room.create(exampleRoomProps)).toThrowErrorMatchingSnapshot();
        });
    });

    describe("userJoinsRoom()", () => {
        it("should add a new user if user exists and room is not full", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue];
            const room = Room.create(exampleRoomProps);
            await room.userJoinsRoom(exampleUserIdValue2);
            expect(mockRoomRepository.save).toBeCalledWith(expect.objectContaining({
                usersIds: [exampleHostIdValue, exampleUserIdValue2]
            }));
        });

        it("should throw an error if user is already in room", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue, exampleUserIdValue1];
            const room = Room.create(exampleRoomProps);
            await expect(room.userJoinsRoom(exampleUserIdValue1)).rejects.toThrowErrorMatchingSnapshot();
        });

        it("should throw an error if user does not exist", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue];
            const room = Room.create(exampleRoomProps);
            await expect(room.userJoinsRoom(idDoNotExistValue)).rejects.toThrowErrorMatchingSnapshot();
        });
    });

    describe("userLeavesRoom()", () => {
        it("should remove a user from the room", async () => {
            const room = Room.create({...exampleRoomProps, usersIds: [exampleHostIdValue, exampleUserIdValue1]});
            await room.userLeavesRoom(exampleUserIdValue1);
            expect(mockRoomRepository.save).toBeCalledWith(expect.objectContaining({
                usersIds: [exampleHostIdValue]
            }));
        });

        it("should delete the room if the last user leaves", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue];
            const room = Room.create(exampleRoomProps);
            await room.userLeavesRoom(exampleHostIdValue);
            expect(mockRoomRepository.delete).toHaveBeenCalledWith(room.id);
        });
    });

    describe("hostRemovesPlayerFromRoom()", () => {
        it("should remove a player when the host removes them", async () => {
            const room = Room.create({...exampleRoomProps, usersIds: [exampleHostIdValue, exampleUserIdValue1]});
            await room.hostRemovesPlayerFromRoom(exampleHostIdValue, exampleUserIdValue1);
            expect(mockRoomRepository.save).toBeCalledWith(expect.objectContaining({
                usersIds: [exampleHostIdValue]
            }));
        });

        it("should throw an error if a non-host tries to remove a player", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue, exampleUserIdValue1];
            const room = Room.create(exampleRoomProps);
            await expect(room.hostRemovesPlayerFromRoom(exampleUserIdValue1, exampleHostIdValue)).rejects.toThrowErrorMatchingSnapshot();
        });
    });

    describe("hostRenamesRoom()", () => {
        it("should rename the room if the host renames it", async () => {
            exampleRoomProps.name = 'Old Room Name';
            const room = Room.create(exampleRoomProps);
            await room.hostRenamesRoom(exampleHostIdValue, "New Room Name");
            expect(mockRoomRepository.save).toBeCalledWith(expect.objectContaining({
                name: "New Room Name"
            }));
        });

        it("should throw an error if a non-host tries to rename the room", async () => {
            exampleRoomProps.name = 'Old Room Name';
            const room = Room.create(exampleRoomProps);
            await expect(room.hostRenamesRoom(exampleUserIdValue1, "Another Room Name")).rejects.toThrowErrorMatchingSnapshot();
        });
    });

    describe("hostDeletesRoom()", () => {
        it("should delete the room if the host deletes it", async () => {
            const room = Room.create(exampleRoomProps);
            await room.hostDeletesRoom(exampleHostIdValue);
            expect(mockRoomRepository.delete).toHaveBeenCalledWith(room.id);
        });

        it("should throw an error if a non-host tries to delete the room", async () => {
            exampleRoomProps.usersIds = [exampleHostIdValue, exampleUserIdValue1];
            const room = Room.create(exampleRoomProps);
            await expect(room.hostDeletesRoom(exampleUserIdValue1)).rejects.toThrowErrorMatchingSnapshot();
        });
    });
});
