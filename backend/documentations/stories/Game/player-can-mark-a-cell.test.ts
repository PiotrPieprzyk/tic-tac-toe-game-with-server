import {describe, expect, it, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import supertest from 'supertest';
import * as http from 'http';
import WebSocket from 'ws';
import {getApp} from '@/app';
import {WebsocketServer} from '@/websocket';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
let server: http.Server;
let serverPort: number;
let request: ReturnType<typeof supertest>;
let wsClient: WebSocket;

function waitForEvent(eventType: string, timeoutMs = 3000): Promise<{eventType: string; dto: Record<string, unknown>}> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for event: ${eventType}`)), timeoutMs);
        wsClient.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.eventType === eventType) {
                clearTimeout(timer);
                resolve(message);
            }
        });
    });
}

async function connectAndSubscribe(gameId: string): Promise<WebSocket> {
    const client = new WebSocket(`ws://localhost:${serverPort}/ws`);
    await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
    });
    client.send(JSON.stringify({action: 'subscribeGame', gameId}));
    return client;
}

describe('Player can mark a cell.', () => {
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
            agentA.post('/users').send({name: 'MarkCellHostA'}),
            agentB.post('/users').send({name: 'MarkCellHostB'}),
            agentC.post('/users').send({name: 'MarkCellOutsiderC'}),
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
        const roomRes = await agentA.post('/rooms').send({name: 'Mark Cell Room'});
        room = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const gameRes = await agentA.post('/games').send({roomId: room.id, hostId: userA.id});
        game = gameRes.body;

        wsClient = await connectAndSubscribe(game.id);
    });

    afterEach(async () => {
        wsClient.close();
        await agentB.put(`/rooms/${room.id}/leave`).send().catch(() => {});
        await agentA.delete(`/rooms/${room.id}`).catch(() => {});
    });

    it('WHEN the active player marks an empty cell SHOULD return 200 and broadcast a GameLastTurnEvent with the updated cells and the next active player\'s id', async () => {
        const activeAgent = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        const eventPromise = waitForEvent('gameLastTurn');

        const response = await activeAgent.put(`/games/${game.id}/mark`).send({position: 0});

        expect(response.status).toBe(200);
        const event = await eventPromise as {eventType: string; dto: {cells: {position: number}[]; activePlayerId: string}};
        expect(event.dto.cells).toContainEqual(expect.objectContaining({position: 0}));
        expect(event.dto.activePlayerId).not.toBe(game.activePlayerId);
    });

    it('WHEN a player marks a cell when it is not their turn SHOULD return 400', async () => {
        const inactiveAgent = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentB : agentA;

        const response = await inactiveAgent.put(`/games/${game.id}/mark`).send({position: 0});

        expect(response.status).toBe(400);
    });

    it('WHEN a player tries to mark an already marked cell SHOULD return 400', async () => {
        const activeAgent = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        const otherAgent = activeAgent === agentA ? agentB : agentA;
        await activeAgent.put(`/games/${game.id}/mark`).send({position: 0});

        const response = await otherAgent.put(`/games/${game.id}/mark`).send({position: 0});

        expect(response.status).toBe(400);
    });

    it('WHEN a mark completes a winning combination SHOULD return 200 and broadcast a GameEndedEvent with result WIN and the winner\'s id', async () => {
        const first = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        const second = first === agentA ? agentB : agentA;
        const winnerId = game.activePlayerId as string;

        // first: 0, second: 3, first: 1, second: 4, first: 2 -> first wins top row
        await first.put(`/games/${game.id}/mark`).send({position: 0});
        await second.put(`/games/${game.id}/mark`).send({position: 3});
        await first.put(`/games/${game.id}/mark`).send({position: 1});
        await second.put(`/games/${game.id}/mark`).send({position: 4});

        const eventPromise = waitForEvent('gameEnded');
        const response = await first.put(`/games/${game.id}/mark`).send({position: 2});

        expect(response.status).toBe(200);
        const event = await eventPromise as {eventType: string; dto: {status: string; result: string; winnerId?: string}};
        expect(event.dto.status).toBe('ENDED');
        expect(event.dto.result).toBe('WIN');
        expect(event.dto.winnerId).toBe(winnerId);
    });

    it('WHEN the last empty cell is marked without completing a winning combination SHOULD return 200 and broadcast a GameEndedEvent with result DRAW', async () => {
        const first = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        const second = first === agentA ? agentB : agentA;

        const sequence: {agent: typeof first; position: number}[] = [
            {agent: first, position: 0},
            {agent: second, position: 1},
            {agent: first, position: 2},
            {agent: second, position: 4},
            {agent: first, position: 3},
            {agent: second, position: 5},
            {agent: first, position: 7},
            {agent: second, position: 6},
        ];
        for (const step of sequence) {
            await step.agent.put(`/games/${game.id}/mark`).send({position: step.position});
        }

        const eventPromise = waitForEvent('gameEnded');
        const response = await first.put(`/games/${game.id}/mark`).send({position: 8});

        expect(response.status).toBe(200);
        const event = await eventPromise as {eventType: string; dto: {status: string; result: string}};
        expect(event.dto.status).toBe('ENDED');
        expect(event.dto.result).toBe('DRAW');
    });

    it('WHEN a player tries to mark a cell after the game has ended SHOULD return 400', async () => {
        const first = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        const second = first === agentA ? agentB : agentA;
        await first.put(`/games/${game.id}/mark`).send({position: 0});
        await second.put(`/games/${game.id}/mark`).send({position: 3});
        await first.put(`/games/${game.id}/mark`).send({position: 1});
        await second.put(`/games/${game.id}/mark`).send({position: 4});
        await first.put(`/games/${game.id}/mark`).send({position: 2});

        const response = await second.put(`/games/${game.id}/mark`).send({position: 5});

        expect(response.status).toBe(400);
    });

    it('WHEN a user who is not a player of the game tries to mark a cell SHOULD return 400', async () => {
        const response = await agentC.put(`/games/${game.id}/mark`).send({position: 0});

        expect(response.status).toBe(400);
    });

    it('WHEN game does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await agentA.put(`/games/${guid}/mark`).send({position: 0});

        expect(response.status).toBe(404);
    });
});
