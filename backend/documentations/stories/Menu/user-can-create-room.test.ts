import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';

const request = supertest.agent(getApp());

describe('User can create a room, but only one.', () => {
    let user: UserDTO;

    beforeAll(async () => {
        const response = await request.post('/users').send({name: 'RoomHost'});
        user = response.body;
    });


    it('WHEN user creates a room with a valid name SHOULD return 200 with the created room, the user set as host, and the user added as a player', async () => {
        const response = await request.post('/rooms').send({
            name: 'Valid Room',
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Valid Room');
        expect(response.body.hostId).toBe(user.id);
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].id).toBe(user.id);

        await request.delete(`/rooms/${response.body.id}`);
    });

    it('WHEN user creates a room with a name shorter than 3 characters SHOULD return 400', async () => {
        const countBefore = (await request.get('/rooms')).body.totalSize;

        const response = await request.post('/rooms').send({
            name: 'AB',
        });

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/rooms')).body.totalSize;
        expect(countAfter).toBe(countBefore);
    });

    it('WHEN user creates a room with a name longer than 50 characters SHOULD return 400', async () => {
        const countBefore = (await request.get('/rooms')).body.totalSize;

        const response = await request.post('/rooms').send({
            name: 'A'.repeat(51),
        });

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/rooms')).body.totalSize;
        expect(countAfter).toBe(countBefore);
    });

    it('WHEN user creates a room without providing a name SHOULD return 400', async () => {
        const countBefore = (await request.get('/rooms')).body.totalSize;

        const response = await request.post('/rooms').send({});

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/rooms')).body.totalSize;
        expect(countAfter).toBe(countBefore);
    });

    it('WHEN user tries to create a second room SHOULD return 400', async () => {
        const firstRoom = await request.post('/rooms').send({
            name: 'First Room',
        });
        expect(firstRoom.status).toBe(200);

        const secondRoom = await request.post('/rooms').send({
            name: 'Second Room',
        });

        expect(secondRoom.status).toBe(400);
        const roomsOwnedByHost = (await request.get('/rooms')).body.results.filter(
            (r: {hostId: string}) => r.hostId === user.id
        );
        expect(roomsOwnedByHost).toHaveLength(1);

        await request.delete(`/rooms/${firstRoom.body.id}`);
    });
});
