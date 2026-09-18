import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {SimpleRoomEventsSockets} from '@/infra/service/SimpleRoomEventsSockets.ts';
import type {RoomAPIResponseRaw} from '@/domain/shared/api/RoomAPI.ts';
import {GameStatusEnum} from '@/domain/Game/GameStatus.ts';

class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly url: string;
    readyState: number = FakeWebSocket.CONNECTING;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: {data: string}) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        fakeSocketInstances.push(this);
    }

    send(data: string): void {
        this.sent.push(data);
    }

    close(): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.();
    }

    triggerOpen(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }

    triggerMessage(payload: unknown): void {
        this.onmessage?.({data: JSON.stringify(payload)});
    }

    triggerClose(): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.();
    }

    sentActions(): unknown[] {
        return this.sent.map((raw) => JSON.parse(raw));
    }
}

let fakeSocketInstances: FakeWebSocket[] = [];

function latestSocket(): FakeWebSocket {
    return fakeSocketInstances[fakeSocketInstances.length - 1];
}

function buildRoom(overrides: Partial<RoomAPIResponseRaw> = {}): RoomAPIResponseRaw {
    return {
        id: 'room-1',
        name: 'ROOM',
        hostId: 'host-1',
        activeGameId: '',
        users: [],
        status: GameStatusEnum.WAITING_FOR_PLAYERS,
        ...overrides,
    };
}

beforeEach(() => {
    fakeSocketInstances = [];
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('SimpleRoomEventsSockets', () => {
    it('WHEN a global subscriber connects SHOULD send subscribeRooms on open', () => {
        const sockets = new SimpleRoomEventsSockets();

        sockets.subscribe({});
        latestSocket().triggerOpen();

        expect(latestSocket().sentActions()).toContainEqual({action: 'subscribeRooms'});
    });

    it('WHEN a room subscriber connects SHOULD send subscribeRoom with the room id on open', () => {
        const sockets = new SimpleRoomEventsSockets();

        sockets.subscribeToRoom('room-42', {});
        latestSocket().triggerOpen();

        expect(latestSocket().sentActions()).toContainEqual({action: 'subscribeRoom', roomId: 'room-42'});
    });

    it('WHEN roomAdded and roomEdited messages arrive SHOULD dispatch both to global handlers', () => {
        const sockets = new SimpleRoomEventsSockets();
        const onRoomAdded = vi.fn();
        const onRoomEdited = vi.fn();
        sockets.subscribe({onRoomAdded, onRoomEdited});
        latestSocket().triggerOpen();

        const added = buildRoom({id: 'room-added'});
        const edited = buildRoom({id: 'room-edited'});
        latestSocket().triggerMessage({eventType: 'roomAdded', dto: added});
        latestSocket().triggerMessage({eventType: 'roomEdited', dto: edited});

        expect(onRoomAdded).toHaveBeenCalledWith(added);
        expect(onRoomEdited).toHaveBeenCalledWith(edited);
    });

    it("WHEN a roomEdited event arrives for a subscribed room SHOULD dispatch to that room's handlers but not a different room's handlers", () => {
        const sockets = new SimpleRoomEventsSockets();
        const onRoomEditedRoomA = vi.fn();
        const onRoomEditedRoomB = vi.fn();
        sockets.subscribeToRoom('room-a', {onRoomEdited: onRoomEditedRoomA});
        sockets.subscribeToRoom('room-b', {onRoomEdited: onRoomEditedRoomB});
        latestSocket().triggerOpen();

        const edited = buildRoom({id: 'room-a'});
        latestSocket().triggerMessage({eventType: 'roomEdited', dto: edited});

        expect(onRoomEditedRoomA).toHaveBeenCalledWith(edited);
        expect(onRoomEditedRoomB).not.toHaveBeenCalled();
    });

    it("WHEN a roomDeleted event arrives for a subscribed room SHOULD unwrap dto.id and dispatch a bare string to that room's handlers but not a different room's handlers", () => {
        const sockets = new SimpleRoomEventsSockets();
        const onRoomDeletedGlobal = vi.fn();
        const onRoomDeletedRoomA = vi.fn();
        const onRoomDeletedRoomB = vi.fn();
        sockets.subscribe({onRoomDeleted: onRoomDeletedGlobal});
        sockets.subscribeToRoom('room-a', {onRoomDeleted: onRoomDeletedRoomA});
        sockets.subscribeToRoom('room-b', {onRoomDeleted: onRoomDeletedRoomB});
        latestSocket().triggerOpen();

        latestSocket().triggerMessage({eventType: 'roomDeleted', dto: {id: 'room-a'}});

        expect(onRoomDeletedGlobal).toHaveBeenCalledWith('room-a');
        expect(onRoomDeletedRoomA).toHaveBeenCalledWith('room-a');
        expect(onRoomDeletedRoomB).not.toHaveBeenCalled();
    });

    it('WHEN a subscriber unsubscribes SHOULD stop receiving further dispatched events', () => {
        const sockets = new SimpleRoomEventsSockets();
        const onRoomAdded = vi.fn();
        const unsubscribe = sockets.subscribe({onRoomAdded});
        latestSocket().triggerOpen();

        unsubscribe();
        latestSocket().triggerMessage({eventType: 'roomAdded', dto: buildRoom()});

        expect(onRoomAdded).not.toHaveBeenCalled();
    });

    it("WHEN a room subscriber unsubscribes SHOULD stop receiving further dispatched events for that room", () => {
        const sockets = new SimpleRoomEventsSockets();
        const onRoomEdited = vi.fn();
        const unsubscribe = sockets.subscribeToRoom('room-a', {onRoomEdited});
        latestSocket().triggerOpen();

        unsubscribe();
        latestSocket().triggerMessage({eventType: 'roomEdited', dto: buildRoom({id: 'room-a'})});

        expect(onRoomEdited).not.toHaveBeenCalled();
    });

    it('WHEN the socket opens SHOULD call onConnect for active subscribers, and WHEN it closes SHOULD call onDisconnect for active subscribers', () => {
        const sockets = new SimpleRoomEventsSockets();
        const onConnect = vi.fn();
        const onDisconnect = vi.fn();
        sockets.subscribe({onConnect, onDisconnect});

        latestSocket().triggerOpen();
        expect(onConnect).toHaveBeenCalledTimes(1);

        latestSocket().triggerClose();
        expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('WHEN a second subscriber joins after the socket is already open SHOULD call its onConnect immediately', () => {
        const sockets = new SimpleRoomEventsSockets();
        sockets.subscribe({});
        latestSocket().triggerOpen();

        const onConnect = vi.fn();
        sockets.subscribe({onConnect});

        expect(onConnect).toHaveBeenCalledTimes(1);
    });
});
