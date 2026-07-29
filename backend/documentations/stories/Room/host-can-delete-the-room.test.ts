import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('Host can delete the room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'DeleteHostA'}),
            agentB.post('/users').send({name: 'DeleteHostB'}),
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

    it('WHEN host delete room SHOULD return 200', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Delete Room',
        });

        const response = await agentA.delete(`/rooms/${roomRes.body.id}`);

        expect(response.status).toBe(200);
        const roomAfter = await request.get(`/rooms/${roomRes.body.id}`);
        expect(roomAfter.status).toBe(404);
    });

    it('WHEN NOT host delete room SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Delete Room 2',
        });

        const response = await agentB.delete(`/rooms/${roomRes.body.id}`);

        expect(response.status).toBe(400);

        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it("WHEN room's game is in progress and host tried to remove room SHOULD return 400", async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Delete Room In Progress',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();
        await request.post('/games').send({roomId: roomRes.body.id, hostId: userA.id});

        const response = await agentA.delete(`/rooms/${roomRes.body.id}`);

        expect(response.status).toBe(400);

        await agentB.put(`/rooms/${roomRes.body.id}/leave`).send();
        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });
});
