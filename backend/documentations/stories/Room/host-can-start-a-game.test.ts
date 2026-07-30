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
    });

    afterAll(async () => {
        await Promise.all([
            request.delete(`/users/${userA.id}`),
            request.delete(`/users/${userB.id}`),
        ]);
    });

    it('WHEN host starts a game with 2 players in the room SHOULD return 200 with the created game', async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Start Game Room'});
        const room: RoomDTO = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const response = await agentA.post('/games').send({roomId: room.id});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.roomId).toBe(room.id);
        expect(response.body.players).toHaveLength(2);

        await agentA.put('/games/leave').send({gameId: response.body.id});
        await agentB.put('/games/leave').send({gameId: response.body.id});
        await agentB.put(`/rooms/${room.id}/leave`).send();
        await agentA.delete(`/rooms/${room.id}`);
    });

    it('WHEN not-host tries to start a game SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Start Game Room Not Host'});
        const room: RoomDTO = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const response = await agentB.post('/games').send({roomId: room.id});

        expect(response.status).toBe(400);

        await agentB.put(`/rooms/${room.id}/leave`).send();
        await agentA.delete(`/rooms/${room.id}`);
    });

    it('WHEN host starts a game with only 1 player in the room SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Start Game Room Solo'});
        const room: RoomDTO = roomRes.body;

        const response = await agentA.post('/games').send({roomId: room.id});

        expect(response.status).toBe(400);

        await agentA.delete(`/rooms/${room.id}`);
    });

    it('WHEN host tries to start a game that is already in progress SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Start Game Room In Progress'});
        const room: RoomDTO = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();
        const firstGameRes = await agentA.post('/games').send({roomId: room.id});

        const response = await agentA.post('/games').send({roomId: room.id});

        expect(response.status).toBe(400);

        await agentA.put('/games/leave').send({gameId: firstGameRes.body.id});
        await agentB.put('/games/leave').send({gameId: firstGameRes.body.id});
        await agentB.put(`/rooms/${room.id}/leave`).send();
        await agentA.delete(`/rooms/${room.id}`);
    });

    it('WHEN room does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await agentA.post('/games').send({roomId: guid});

        expect(response.status).toBe(404);
    });

    it('WHEN host start game again after the first one was finished SHOULD return 200', async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Restart Game Room'});
        const room: RoomDTO = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const firstGameRes = await agentA.post('/games').send({roomId: room.id});
        const firstGame = firstGameRes.body;

        await agentA.put('/games/leave').send({gameId: firstGame.id});
        await agentB.put('/games/leave').send({gameId: firstGame.id});

        const response = await agentA.post('/games').send({roomId: room.id});

        expect(response.status).toBe(200);

        await agentA.put('/games/leave').send({gameId: response.body.id});
        await agentB.put('/games/leave').send({gameId: response.body.id});
        await agentB.put(`/rooms/${room.id}/leave`).send();
        await agentA.delete(`/rooms/${room.id}`);
    });
});
