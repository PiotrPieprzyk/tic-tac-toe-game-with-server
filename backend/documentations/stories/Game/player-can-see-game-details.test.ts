import {describe, expect, it, beforeAll, afterAll, beforeEach, afterEach} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('Player can see game details.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;
    let room: RoomDTO;
    let game: {id: string; activePlayerId: string; players: {id: string; userId: string}[]};

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'GameDetailsHostA'}),
            agentB.post('/users').send({name: 'GameDetailsHostB'}),
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

    beforeEach(async () => {
        const roomRes = await agentA.post('/rooms').send({name: 'Game Details Room'});
        room = roomRes.body;
        await agentB.put(`/rooms/${room.id}/join`).send();

        const gameRes = await agentA.post('/games').send({roomId: room.id});
        game = gameRes.body;
    });

    afterEach(async () => {
        await agentA.put('/games/leave').send({gameId: game.id}).catch(() => {});
        await agentB.put('/games/leave').send({gameId: game.id}).catch(() => {});
        await agentB.put(`/rooms/${room.id}/leave`).send().catch(() => {});
        await agentA.delete(`/rooms/${room.id}`).catch(() => {});
    });

    it("WHEN fetching an in-progress game SHOULD return 200 with players' names and marks and the id of the player whose turn it is", async () => {
        const response = await request.get(`/games/${game.id}`);

        expect(response.status).toBe(200);
        expect(response.body.players).toHaveLength(2);
        expect(response.body.players[0]).toHaveProperty('userName');
        expect(response.body.players[0]).toHaveProperty('mark');
        expect(response.body.activePlayerId).toBe(game.activePlayerId);
    });

    it("WHEN fetching a game after a cell has been marked SHOULD return 200 with the updated cells and the next active player's id", async () => {
        const activeAgent = game.activePlayerId === game.players.find(p => p.userId === userA.id)?.id ? agentA : agentB;
        await activeAgent.put(`/games/${game.id}/mark`).send({position: 0});

        const response = await request.get(`/games/${game.id}`);

        expect(response.status).toBe(200);
        expect(response.body.cells).toContainEqual(expect.objectContaining({position: 0}));
        expect(response.body.activePlayerId).not.toBe(game.activePlayerId);
    });

    it('WHEN fetching a game that ended SHOULD return 404', async () => {
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
            {agent: first, position: 8},
        ];
        for (const step of sequence) {
            await step.agent.put(`/games/${game.id}/mark`).send({position: step.position});
        }

        const response = await request.get(`/games/${game.id}`);

        expect(response.status).toBe(404);
    });

    it('WHEN game does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await request.get(`/games/${guid}`);

        expect(response.status).toBe(404);
    });
});
