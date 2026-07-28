import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';

const request = supertest(getApp());

describe('User can join a room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let userC: UserDTO;
    let room: RoomDTO;

    beforeAll(async () => {
        const [resA, resB, resC] = await Promise.all([
            request.post('/users').send({name: 'UserJoinA'}),
            request.post('/users').send({name: 'UserJoinB'}),
            request.post('/users').send({name: 'UserJoinC'}),
        ]);
        userA = resA.body;
        userB = resB.body;
        userC = resC.body;

        const roomRes = await request.post('/rooms').send({
            name: 'Join Room',
            hostId: userA.id,
            usersIds: [userA.id],
        });
        room = roomRes.body;
    });

    afterAll(async () => {
        await request.delete(`/rooms/${room.id}`);
        await Promise.all([
            request.delete(`/users/${userA.id}`),
            request.delete(`/users/${userB.id}`),
            request.delete(`/users/${userC.id}`),
        ]);
    });

    it('WHEN user joins a room with available space SHOULD return 200 with the updated room including the new player', async () => {
        const response = await request.put(`/rooms/${room.id}/join`).send({userId: userB.id});

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(2);
        expect(response.body.users.map((u: UserDTO) => u.id)).toContain(userB.id);

        await request.put(`/rooms/${room.id}/leave`).send({userId: userB.id});
    });

    it('WHEN user tries to join a room that is already full (2 players) SHOULD return 400', async () => {
        await request.put(`/rooms/${room.id}/join`).send({userId: userB.id});

        const response = await request.put(`/rooms/${room.id}/join`).send({userId: userC.id});

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${room.id}`)).body;
        expect(roomAfter.users).toHaveLength(2);

        await request.put(`/rooms/${room.id}/leave`).send({userId: userB.id});
    });

    it('WHEN user tries to join a room where a game is in progress SHOULD return 400', async () => {
        // This test requires a room with an active IN_PROGRESS game.
        // Skipping setup as game start API is not available in the current scope.
        // Once game-start endpoint is implemented, set room.activeGameId and verify.
        expect(true).toBe(false);
    });

    it('WHEN user tries to join a room they are already in SHOULD return 400', async () => {
        const response = await request.put(`/rooms/${room.id}/join`).send({userId: userA.id});

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${room.id}`)).body;
        expect(roomAfter.users).toHaveLength(1);
    });

    it('WHEN user tries to join a room that does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid()
        const response = await request.put(`/rooms/${guid}/join`).send({userId: userB.id});

        expect(response.status).toBe(404);
    });

    it('WHEN user tries to join a room, even though they already joined to another one SHOULD return 400', async () => {
        const roomRes2 = await request.post('/rooms').send({
            name: 'Join Room',
            hostId: userA.id,
            usersIds: [userA.id],
        });
    })
});
