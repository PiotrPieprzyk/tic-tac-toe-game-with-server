import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';

const app = getApp();
const request = supertest(app);

describe('Host can remove a player from the room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'RemovePlayerHostA'}),
            agentB.post('/users').send({name: 'RemovePlayerHostB'}),
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

    it('WHEN host removes user SHOULD return 200', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Remove Player Room',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();

        const response = await agentA.put(`/rooms/${roomRes.body.id}`).send({
            usersIds: [userA.id],
        });

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].id).toBe(userA.id);

        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it('WHEN not-host tries removes host SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Remove Player Room 2',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();

        const response = await agentB.put(`/rooms/${roomRes.body.id}`).send({
            usersIds: [userB.id],
        });

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${roomRes.body.id}`)).body;
        expect(roomAfter.users).toHaveLength(2);

        await agentB.put(`/rooms/${roomRes.body.id}/leave`).send();
        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });
});
