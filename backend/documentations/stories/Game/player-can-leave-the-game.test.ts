import {describe, expect, it, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import supertest from 'supertest';
import * as http from 'http';
import WebSocket from 'ws';
import {getApp} from '@/app';
import {WebsocketServer} from '@/websocket';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';
import {waitForEvent, connectAndSubscribeGame} from '../testUtils/websocket';

const app = getApp();
let server: http.Server;
let serverPort: number;
let request: ReturnType<typeof supertest>;
let wsClient: WebSocket;

describe('Player can leave the game.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let userC: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;
    let agentC: ReturnType<typeof supertest.agent>;
    let room: RoomDTO;
    let game: {id: string; activePlayerId: string; players: {id: string; userId: string}[]};

    beforeAll(async () => {
        server = http.createServer(app);
        new WebsocketServer(server);
        await new Promise<void>((resolve) => server.listen(0, resolve));
        serverPort = (server.address() as {port: number}).port;
        request = supertest(server);

        agentA = supertest.agent(server);
        agentB = supertest.agent(server);
        agentC = supertest.agent(server);

        const [resA, resB, resC] = await Promise.all([
            agentA.post('/users').send({name: 'LeaveGameHostA'}),
            agentB.post('/users').send({name: 'LeaveGameHostB'}),
            agentC.post('/users').send({name: 'LeaveGameOutsiderC'}),
        ]);
        userA = resA.body;
        userB = resB.body;
        userC = resC.body;
    });

    afterAll(async () => {
        await Promise.all([
            request.delete(`/users/${userA.id}`),
            request.delete(`/users/${userB.id}`),
            request.delete(`/users/${userC.id}`),
        ]);
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    beforeEach(async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Leave Game Room'});
        room = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const gameRes = await agentA.post('/games').send({roomId: room.id});
        game = gameRes.body;

        wsClient = await connectAndSubscribeGame(serverPort, game.id);
    });

    afterEach(async () => {
        wsClient.close();
        await agentA.put('/games/leave').send({gameId: game.id}).catch(() => {});
        await agentB.put('/games/leave').send({gameId: game.id}).catch(() => {});
        await agentB.put(`/rooms/${room.id}/leave`).send().catch(() => {});
        await agentA.delete(`/rooms/${room.id}`).catch(() => {});
    });

    it('WHEN a player leaves a game with the other player remaining SHOULD return 200 and broadcast a GameEndedEvent with result PLAYER_LEFT_THE_GAME', async () => {
        const eventPromise = waitForEvent(wsClient, 'gameEnded');

        const response = await agentB.put('/games/leave').send({gameId: game.id});

        expect(response.status).toBe(200);
        const event = await eventPromise as {eventType: string; dto: {status: string; result: string}};
        expect(event.dto.status).toBe('ENDED');
        expect(event.dto.result).toBe('PLAYER_LEFT_THE_GAME');
    });

    it('WHEN the last player leaves a game SHOULD return 200 and broadcast a GameDeletedEvent (game is auto-deleted)', async () => {
        await agentB.put('/games/leave').send({gameId: game.id});

        const eventPromise = waitForEvent(wsClient, 'gameDeleted');
        const response = await agentA.put('/games/leave').send({gameId: game.id});

        expect(response.status).toBe(200);
        const event = await eventPromise as {eventType: string; dto: {id: string}};
        expect(event.dto.id).toBe(game.id);
    });

    it('WHEN a user who is not a player of the game tries to leave SHOULD return 400', async () => {
        const response = await agentC.put('/games/leave').send({gameId: game.id});

        expect(response.status).toBe(400);
    });

    it('WHEN game does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await agentA.put('/games/leave').send({gameId: guid});

        expect(response.status).toBe(404);
    });
});
