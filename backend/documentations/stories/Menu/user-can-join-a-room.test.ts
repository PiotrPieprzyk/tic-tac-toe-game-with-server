import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('User can join a room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let userC: UserDTO;
    let room: RoomDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;
    let agentC: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);
        agentC = supertest.agent(app);

        const [resA, resB, resC] = await Promise.all([
            agentA.post('/users').send({name: 'UserJoinA'}),
            agentB.post('/users').send({name: 'UserJoinB'}),
            agentC.post('/users').send({name: 'UserJoinC'}),
        ]);
        userA = resA.body;
        userB = resB.body;
        userC = resC.body;

        const roomRes = await agentA.post('/rooms').send({
            name: 'Join Room',
        });
        room = roomRes.body;
    });

    afterAll(async () => {
        await agentA.delete(`/rooms/${room.id}`);
        await Promise.all([
            request.delete(`/users/${userA.id}`),
            request.delete(`/users/${userB.id}`),
            request.delete(`/users/${userC.id}`),
        ]);
    });

    it('WHEN user joins a room with available space SHOULD return 200 with the updated room including the new player', async () => {
        const response = await agentB.put(`/rooms/${room.id}/join`).send();

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(2);
        expect(response.body.users.map((u: UserDTO) => u.id)).toContain(userB.id);

        await agentB.put(`/rooms/${room.id}/leave`).send();
    });

    it('WHEN user tries to join a room that is already full (2 players) SHOULD return 400', async () => {
        await agentB.put(`/rooms/${room.id}/join`).send();

        const response = await agentC.put(`/rooms/${room.id}/join`).send();

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${room.id}`)).body;
        expect(roomAfter.users).toHaveLength(2);

        await agentB.put(`/rooms/${room.id}/leave`).send();
    });

    it('WHEN user tries to join a room where a game is in progress SHOULD return 400', async () => {
        // This test requires a room with an active IN_PROGRESS game.
        // Skipping setup as game start API is not available in the current scope.
        // Once game-start endpoint is implemented, set room.activeGameId and verify.
        expect(true).toBe(false);
    });

    it('WHEN user tries to join a room they are already in SHOULD return 400', async () => {
        const response = await agentA.put(`/rooms/${room.id}/join`).send();

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${room.id}`)).body;
        expect(roomAfter.users).toHaveLength(1);
    });

    it('WHEN user tries to join a room that does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid()
        const response = await agentB.put(`/rooms/${guid}/join`).send();

        expect(response.status).toBe(404);
    });

    it('WHEN user tries to join a room, even though they already joined to another one SHOULD return 400', async () => {
        const roomRes2 = await agentA.post('/rooms').send({
            name: 'Join Room',
        });
    })
});
