import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import supertest from 'supertest';
import * as http from 'http';
import WebSocket from 'ws';
import {getApp} from '@/app';
import {WebsocketServer} from '@/websocket';
import {UserDTO} from '@/application/User/UserMap';
import {RoomDTO} from '@/application/Room/RoomMap';
import {waitForEvent, connectAndSubscribeRoom} from '../testUtils/websocket';

const app = getApp();
let server: http.Server;
let request: ReturnType<typeof supertest>;
let wsPort: number;

describe('Room events are scoped to a subscribed room.', () => {
    let hostA: UserDTO;
    let hostB: UserDTO;
    let agentA: ReturnType<typeof supertest.agent>;
    let agentB: ReturnType<typeof supertest.agent>;
    let wsClient: WebSocket;
    let roomA: RoomDTO;
    const createdRoomIds: string[] = [];

    beforeAll(async () => {
        server = http.createServer(app);
        new WebsocketServer(server);

        await new Promise<void>((resolve) => server.listen(0, resolve));
        wsPort = (server.address() as { port: number }).port;
        request = supertest(server);
        agentA = supertest.agent(server);
        agentB = supertest.agent(server);

        const [resA, resB] = await Promise.all([
            agentA.post('/users').send({name: 'RoomScopeHostA'}),
            agentB.post('/users').send({name: 'RoomScopeHostB'}),
        ]);
        hostA = resA.body;
        hostB = resB.body;

        const roomARes = await agentA.post('/rooms').send({name: 'Room A'});
        roomA = roomARes.body;
        createdRoomIds.push(roomA.id);

        wsClient = await connectAndSubscribeRoom(wsPort, roomA.id);
    });

    afterAll(async () => {
        await Promise.all(createdRoomIds.map(id => request.delete(`/rooms/${id}`)));
        await Promise.all([
            request.delete(`/users/${hostA.id}`),
            request.delete(`/users/${hostB.id}`),
        ]);
        wsClient.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('WHEN the subscribed room is renamed SHOULD receive a RoomEditedEvent for that room', async () => {
        const eventPromise = waitForEvent(wsClient, 'roomEdited');

        await agentA.put(`/rooms/${roomA.id}`).send({name: 'Room A Renamed'});

        const event = await eventPromise as { eventType: string; dto: { id: string; name: string } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.id).toBe(roomA.id);
        expect(event.dto.name).toBe('Room A Renamed');
    });

    it('WHEN a different room is created, renamed and deleted SHOULD NOT deliver any of those events to a client subscribed only to another room', async () => {
        const addedPromise = waitForEvent(wsClient, 'roomAdded', 150);
        const roomBRes = await agentB.post('/rooms').send({name: 'Room B'});
        const roomB: RoomDTO = roomBRes.body;
        await expect(addedPromise).rejects.toThrow();

        const editedPromise = waitForEvent(wsClient, 'roomEdited', 150);
        await agentB.put(`/rooms/${roomB.id}`).send({name: 'Room B Renamed'});
        await expect(editedPromise).rejects.toThrow();

        const deletedPromise = waitForEvent(wsClient, 'roomDeleted', 150);
        await agentB.delete(`/rooms/${roomB.id}`);
        await expect(deletedPromise).rejects.toThrow();
    });

    it('WHEN the subscribed room is deleted SHOULD receive a RoomDeletedEvent for that room', async () => {
        const eventPromise = waitForEvent(wsClient, 'roomDeleted');

        await agentA.delete(`/rooms/${roomA.id}`);
        createdRoomIds.pop();

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(roomA.id);
    });

    it("WHEN the client resubscribes to a different room on the same connection SHOULD stop receiving events for the previous room and start receiving events for the new one", async () => {
        const roomERes = await agentA.post('/rooms').send({name: 'Room E'});
        const roomE: RoomDTO = roomERes.body;
        createdRoomIds.push(roomE.id);

        const roomFRes = await agentB.post('/rooms').send({name: 'Room F'});
        const roomF: RoomDTO = roomFRes.body;
        createdRoomIds.push(roomF.id);

        wsClient.send(JSON.stringify({action: 'subscribeRoom', roomId: roomE.id}));
        wsClient.send(JSON.stringify({action: 'subscribeRoom', roomId: roomF.id}));

        const roomEEditedPromise = waitForEvent(wsClient, 'roomEdited', 150);
        await agentA.put(`/rooms/${roomE.id}`).send({name: 'Room E Renamed'});
        await expect(roomEEditedPromise).rejects.toThrow();

        const roomFEditedPromise = waitForEvent(wsClient, 'roomEdited');
        await agentB.put(`/rooms/${roomF.id}`).send({name: 'Room F Renamed'});
        const event = await roomFEditedPromise as { eventType: string; dto: { id: string; name: string } };

        expect(event.eventType).toBe('roomEdited');
        expect(event.dto.id).toBe(roomF.id);
        expect(event.dto.name).toBe('Room F Renamed');
    });

    it('WHEN the room the client is now subscribed to is deleted SHOULD receive a RoomDeletedEvent for it', async () => {
        const roomFId = createdRoomIds[createdRoomIds.length - 1];
        const eventPromise = waitForEvent(wsClient, 'roomDeleted');

        await agentB.delete(`/rooms/${roomFId}`);
        createdRoomIds.pop();

        const event = await eventPromise as { eventType: string; dto: { id: string } };

        expect(event.eventType).toBe('roomDeleted');
        expect(event.dto.id).toBe(roomFId);
    });
});
