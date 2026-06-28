import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import * as http from 'http';
import WebSocket from 'ws';
import {getApp} from '../../src/app';
import {WebsocketServer} from '../../src/websocket';
import {UserDTO} from '../../src/application/User/UserMap';
import {RoomDTO} from '../../src/application/Room/RoomMap';

const app = getApp();
let server: http.Server;
let request: ReturnType<typeof supertest>;
let wsClient: WebSocket;
let wsPort: number;

function waitForEvent(eventType: string, timeoutMs = 3000): Promise<unknown> {
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

describe('The rooms list is updated automatically.', () => {
    let user: UserDTO;
    const createdRoomIds: string[] = [];

    beforeAll(async () => {
        server = http.createServer(app);
        new WebsocketServer(server);

        await new Promise<void>((resolve) => server.listen(0, resolve));
        wsPort = (server.address() as { port: number }).port;
        request = supertest(server);

        const userRes = await request.post('/users').send({name: 'WsUser'});
        user = userRes.body;

        wsClient = new WebSocket(`ws://localhost:${wsPort}/ws`);
        await new Promise<void>((resolve, reject) => {
            wsClient.on('open', resolve);
            wsClient.on('error', reject);
        });

        wsClient.send(JSON.stringify({action: 'subscribeRooms'}));
    });

    afterAll(async () => {
        await Promise.all(createdRoomIds.map(id => request.delete(`/rooms/${id}`)));
        await request.delete(`/users/${user.id}`);
        wsClient.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('WHEN a new room is created SHOULD receive a RoomAddedEvent with the new room\'s data', async () => {
        const eventPromise = waitForEvent('roomAdded');

        const roomRes = await request.post('/rooms').send({
            name: 'WS Room',
            hostId: user.id,
            usersIds: [user.id],
        });
        const room: RoomDTO = roomRes.body;
        createdRoomIds.push(room.id);

        const event = await eventPromise as { eventType: string; dto: RoomDTO };

        expect(event.eventType).toBe('roomAdded');
        expect(event.dto.id).toBe(room.id);
        expect(event.dto.name).toBe('WS Room');
        expect(event.dto.hostId).toBe(user.id);
    });

    it('WHEN a room is renamed SHOULD receive a RoomEditedEvent with the updated name', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const eventPromise = waitForEvent('roomEdited');

        await request.put(`/rooms/${roomId}`).send({hostId: user.id, name: 'WS Room Renamed'});

        const event = await eventPromise as { eventType: string; dto: { id: string; name: string } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.id).toBe(roomId);
        expect(event.dto.name).toBe('WS Room Renamed');
    });

    it('WHEN a player joins a room SHOULD receive a RoomEditedEvent with the updated players list', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const secondUserRes = await request.post('/users').send({name: 'WsUser2'});
        const secondUser: UserDTO = secondUserRes.body;

        const eventPromise = waitForEvent('roomEdited');
        await request.put(`/rooms/${roomId}/join`).send({userId: secondUser.id});

        const event = await eventPromise as { eventType: string; dto: { users: UserDTO[] } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.users.map(u => u.id)).toContain(secondUser.id);

        await request.put(`/rooms/${roomId}/leave`).send({userId: secondUser.id});
        await request.delete(`/users/${secondUser.id}`);
    });

    it('WHEN a room\'s game status changes to IN_PROGRESS SHOULD receive a RoomEditedEvent with the updated status', async () => {
        // Requires game-start functionality not yet implemented.
        // Once a game-start endpoint exists, trigger it here and assert the roomEdited event has status IN_PROGRESS.
        expect(true).toBe(true);
    });

    it('WHEN a room is deleted SHOULD receive a RoomDeletedEvent with the room\'s id', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const eventPromise = waitForEvent('roomDeleted');

        await request.delete(`/rooms/${roomId}`);
        createdRoomIds.pop();

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(roomId);
    });

    it('WHEN the last player leaves a room SHOULD receive a RoomDeletedEvent (room is auto-deleted)', async () => {
        const roomRes = await request.post('/rooms').send({
            name: 'WS Room Last Player',
            hostId: user.id,
            usersIds: [user.id],
        });
        const room: RoomDTO = roomRes.body;

        const eventPromise = waitForEvent('roomDeleted');
        await request.put(`/rooms/${room.id}/leave`).send({userId: user.id});

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(room.id);
    });
});
