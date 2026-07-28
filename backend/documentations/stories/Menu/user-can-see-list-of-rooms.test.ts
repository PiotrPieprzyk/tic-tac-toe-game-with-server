import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '@/app';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';

const request = supertest(getApp());

describe('User can see the list of rooms and players in the room.', () => {
    let user: UserDTO;
    const createdRoomIds: string[] = [];

    beforeAll(async () => {
        const response = await request.post('/users').send({name: 'ListUser'});
        user = response.body;
    });

    const createdUserIds: string[] = [];

    afterAll(async () => {
        await Promise.all(createdRoomIds.map(id => request.delete(`/rooms/${id}`)));
        await Promise.all(createdUserIds.map(id => request.delete(`/users/${id}`)));
        await request.delete(`/users/${user.id}`);
    });

    it('WHEN rooms list is requested and there are no rooms SHOULD return 200 with an empty results array', async () => {
        const response = await request.get('/rooms');

        expect(response.status).toBe(200);
        expect(response.body.results).toHaveLength(0);
    });

    it('WHEN rooms list is requested and one room exists SHOULD return 200 with that room in results', async () => {
        const roomRes = await request.post('/rooms').send({
            name: 'List Room 1',
            hostId: user.id,
            usersIds: [user.id],
        });
        const room: RoomDTO = roomRes.body;
        createdRoomIds.push(room.id);

        const response = await request.get('/rooms');

        expect(response.status).toBe(200);
        expect(response.body.results).toHaveLength(1);
        expect(response.body.results[0].id).toBe(room.id);
    });

    it('WHEN rooms list is requested SHOULD include each room\'s id, name, hostId and status', async () => {
        const response = await request.get('/rooms');
        const room = response.body.results[0];

        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
        expect(room).toHaveProperty('hostId');
        expect(room).toHaveProperty('status');
        expect(room.name).toBe('List Room 1');
        expect(room.hostId).toBe(user.id);
    });

    it('WHEN rooms list is requested SHOULD include the players currently in each room', async () => {
        const secondUser = (await request.post('/users').send({name: 'ListUser2'})).body;
        const roomId = createdRoomIds[createdRoomIds.length - 1];

        await request.put(`/rooms/${roomId}/join`).send({userId: secondUser.id});

        const response = await request.get('/rooms');
        const room = response.body.results.find((r: RoomDTO) => r.id === roomId);

        expect(room.users).toHaveLength(2);
        expect(room.users.map((u: UserDTO) => u.id)).toContain(user.id);
        expect(room.users.map((u: UserDTO) => u.id)).toContain(secondUser.id);

        await request.put(`/rooms/${roomId}/leave`).send({userId: secondUser.id});
        await request.delete(`/users/${secondUser.id}`);
    });

    it('WHEN rooms list is requested with pageSize=1 and two rooms exist SHOULD return only one room and a nextPageToken', async () => {
        const secondHost = (await request.post('/users').send({name: 'ListUser3'})).body;
        createdUserIds.push(secondHost.id);

        const secondRoomRes = await request.post('/rooms').send({
            name: 'List Room 2',
            hostId: secondHost.id,
            usersIds: [secondHost.id],
        });
        createdRoomIds.push(secondRoomRes.body.id);

        const response = await request.get('/rooms?pageSize=1');

        expect(response.status).toBe(200);
        expect(response.body.results).toHaveLength(1);
        expect(response.body.nextPageToken).not.toBeNull();
    });

    it('WHEN rooms list is requested with a valid pageToken SHOULD return the next page of rooms', async () => {
        const firstPage = await request.get('/rooms?pageSize=1');
        const nextPageToken = firstPage.body.nextPageToken;

        const secondPage = await request.get(`/rooms?pageSize=1&pageToken=${nextPageToken}`);

        expect(secondPage.status).toBe(200);
        expect(secondPage.body.results).toHaveLength(1);
        expect(secondPage.body.results[0].id).not.toBe(firstPage.body.results[0].id);
    });
});
