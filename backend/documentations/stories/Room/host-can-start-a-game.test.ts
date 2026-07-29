import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('Host can start a game.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let room: RoomDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'StartGameHostA'}),
            agentB.post('/users').send({name: 'StartGameHostB'}),
        ]);
        userA = resA.body;
        userB = resB.body;

        const roomRes = await agentA.post('/rooms').send({
            name: 'Start Game Room',
        });
        room = roomRes.body;
    });

    afterAll(async () => {
        await agentA.delete(`/rooms/${room.id}`);
        await Promise.all([
            request.delete(`/users/${userA.id}`),
            request.delete(`/users/${userB.id}`),
        ]);
    });

    it('WHEN host starts a game with 2 players in the room SHOULD return 200 with the created game', async () => {
        await agentB.put(`/rooms/${room.id}/join`).send();

        const response = await request.post('/games').send({roomId: room.id, hostId: userA.id});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.roomId).toBe(room.id);
        expect(response.body.players).toHaveLength(2);

        await agentB.put(`/rooms/${room.id}/leave`).send();
    });

    it('WHEN not-host tries to start a game SHOULD return 400', async () => {
        await agentB.put(`/rooms/${room.id}/join`).send();

        const response = await request.post('/games').send({roomId: room.id, hostId: userB.id});

        expect(response.status).toBe(400);

        await agentB.put(`/rooms/${room.id}/leave`).send();
    });

    it('WHEN host starts a game with only 1 player in the room SHOULD return 400', async () => {
        const response = await request.post('/games').send({roomId: room.id, hostId: userA.id});

        expect(response.status).toBe(400);
    });

    it('WHEN host tries to start a game that is already in progress SHOULD return 400', async () => {
        await agentB.put(`/rooms/${room.id}/join`).send();
        await request.post('/games').send({roomId: room.id, hostId: userA.id});

        const response = await request.post('/games').send({roomId: room.id, hostId: userA.id});

        expect(response.status).toBe(400);

        await agentB.put(`/rooms/${room.id}/leave`).send();
    });

    it('WHEN room does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await request.post('/games').send({roomId: guid, hostId: userA.id});

        expect(response.status).toBe(404);
    });

    it('WHEN host start game again after the first one was finished SHOULD return 200', async () => {
        // This test requires a way to finish the first game so it is automatically removed.
        // Skipping full setup as a game-finishing API is not available in the current scope.
        expect(true).toBe(false);
    });
});
