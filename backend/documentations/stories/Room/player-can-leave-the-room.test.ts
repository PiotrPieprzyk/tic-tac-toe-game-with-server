import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('Player can leave the room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'LeaveRoomHostA'}),
            agentB.post('/users').send({name: 'LeaveRoomHostB'}),
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

    it('WHEN a player leaves a room with other players remaining SHOULD return 200 and remove that player from the room', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Leave Room',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();

        const response = await agentB.put(`/rooms/${roomRes.body.id}/leave`).send();

        expect(response.status).toBe(200);
        const roomAfter = (await request.get(`/rooms/${roomRes.body.id}`)).body;
        expect(roomAfter.users).toHaveLength(1);
        expect(roomAfter.users[0].id).toBe(userA.id);

        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it('WHEN the last player leaves a room SHOULD return 200 and delete the room', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Leave Room 2',
        });

        const response = await agentA.put(`/rooms/${roomRes.body.id}/leave`).send();

        expect(response.status).toBe(200);
        const roomAfter = await request.get(`/rooms/${roomRes.body.id}`);
        expect(roomAfter.status).toBe(404);
    });

    it('WHEN room does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await agentA.put(`/rooms/${guid}/leave`).send();

        expect(response.status).toBe(404);
    });
});
