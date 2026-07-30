import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import * as http from 'http';
import WebSocket from 'ws';
import {getApp} from '@/app';
import {WebsocketServer} from '@/websocket';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {waitForEvent} from '../testUtils/websocket';

const app = getApp();
let server: http.Server;
let request: ReturnType<typeof supertest>;
let wsClient: WebSocket;
let wsPort: number;

describe('The rooms list is updated automatically.', () => {
    let user: UserDTO;
    let agent: ReturnType<typeof supertest.agent>;
    const createdRoomIds: string[] = [];

    beforeAll(async () => {
        server = http.createServer(app);
        new WebsocketServer(server);

        await new Promise<void>((resolve) => server.listen(0, resolve));
        wsPort = (server.address() as { port: number }).port;
        request = supertest(server);
        agent = supertest.agent(server);

        const userRes = await agent.post('/users').send({name: 'WsUser'});
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
        const eventPromise = waitForEvent(wsClient, 'roomAdded');

        const roomRes = await agent.post('/rooms').send({name: 'WS Room'});
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
        const eventPromise = waitForEvent(wsClient, 'roomEdited');

        await agent.put(`/rooms/${roomId}`).send({name: 'WS Room Renamed'});

        const event = await eventPromise as { eventType: string; dto: { id: string; name: string } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.id).toBe(roomId);
        expect(event.dto.name).toBe('WS Room Renamed');
    });

    it('WHEN a player joins a room SHOULD receive a RoomEditedEvent with the updated players list', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const secondAgent = supertest.agent(server);
        const secondUserRes = await secondAgent.post('/users').send({name: 'WsUser2'});
        const secondUser: UserDTO = secondUserRes.body;

        const eventPromise = waitForEvent(wsClient, 'roomEdited');
        await secondAgent.put(`/rooms/${roomId}/join`).send();

        const event = await eventPromise as { eventType: string; dto: { users: UserDTO[] } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.users.map(u => u.id)).toContain(secondUser.id);

        await secondAgent.put(`/rooms/${roomId}/leave`).send();
        await request.delete(`/users/${secondUser.id}`);
    });

    it('WHEN a room\'s game status changes to IN_PROGRESS SHOULD receive a RoomEditedEvent with the updated status', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const secondAgent = supertest.agent(server);
        const secondUserRes = await secondAgent.post('/users').send({name: 'WsUser3'});
        const secondUser: UserDTO = secondUserRes.body;
        await secondAgent.put(`/rooms/${roomId}/join`).send();

        const eventPromise = waitForEvent(wsClient, 'roomEdited');
        const gameRes = await agent.post('/games').send({roomId});

        const event = await eventPromise as { eventType: string; dto: { status: string } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.status).toBe('IN_PROGRESS');

        await agent.put('/games/leave').send({gameId: gameRes.body.id});
        await secondAgent.put('/games/leave').send({gameId: gameRes.body.id});
        await secondAgent.put(`/rooms/${roomId}/leave`).send();
        await request.delete(`/users/${secondUser.id}`);
    });

    it('WHEN a room is deleted SHOULD receive a RoomDeletedEvent with the room\'s id', async () => {
        const roomId = createdRoomIds[createdRoomIds.length - 1];
        const eventPromise = waitForEvent(wsClient, 'roomDeleted');

        await agent.delete(`/rooms/${roomId}`);
        createdRoomIds.pop();

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(roomId);
    });

    it('WHEN the last player leaves a room SHOULD receive a RoomDeletedEvent (room is auto-deleted)', async () => {
        const roomRes = await agent.post('/rooms').send({name: 'WS Room Last Player'});
        const room: RoomDTO = roomRes.body;

        const eventPromise = waitForEvent(wsClient, 'roomDeleted');
        await agent.put(`/rooms/${room.id}/leave`).send();

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(room.id);
    });
});
