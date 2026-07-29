import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {Guid} from '@/shared/GUID';

const app = getApp();
const request = supertest(app);

describe('Host can rename the room.', () => {
    let userA: UserDTO;
    let userB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;

    beforeAll(async () => {
        agentA = supertest.agent(app);
        agentB = supertest.agent(app);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'RenameHostA'}),
            agentB.post('/users').send({name: 'RenameHostB'}),
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

    it('WHEN host renames the room with a valid name SHOULD return 200 with the updated name', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Rename Room',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();

        const response = await agentA.put(`/rooms/${roomRes.body.id}`).send({
            name: 'Renamed Room',
        });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Renamed Room');

        await agentB.put(`/rooms/${roomRes.body.id}/leave`).send();
        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it('WHEN not-host tries to rename the room SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Rename Room 2',
        });
        await agentB.put(`/rooms/${roomRes.body.id}/join`).send();

        const response = await agentB.put(`/rooms/${roomRes.body.id}`).send({
            name: 'Should Not Rename',
        });

        expect(response.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${roomRes.body.id}`)).body;
        expect(roomAfter.name).toBe('Rename Room 2');

        await agentB.put(`/rooms/${roomRes.body.id}/leave`).send();
        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it('WHEN host renames the room with a name shorter than 3 characters, longer than 50 characters SHOULD return 400', async () => {
        const roomRes = await agentA.post('/rooms').send({
            name: 'Rename Room 3',
        });

        const tooShort = await agentA.put(`/rooms/${roomRes.body.id}`).send({name: 'AB'});
        const tooLong = await agentA.put(`/rooms/${roomRes.body.id}`).send({name: 'A'.repeat(51)});

        expect(tooShort.status).toBe(400);
        expect(tooLong.status).toBe(400);
        const roomAfter = (await request.get(`/rooms/${roomRes.body.id}`)).body;
        expect(roomAfter.name).toBe('Rename Room 3');

        await agentA.delete(`/rooms/${roomRes.body.id}`);
    });

    it('WHEN room does not exist SHOULD return 404', async () => {
        const guid = Guid.createNewGuid();

        const response = await agentA.put(`/rooms/${guid}`).send({name: 'Anything'});

        expect(response.status).toBe(404);
    });
});
