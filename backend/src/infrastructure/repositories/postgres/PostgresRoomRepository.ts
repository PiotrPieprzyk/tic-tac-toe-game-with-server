import {Pool} from "pg";
import {RoomRepository} from "@/domain/Room/RoomRepository";
import {RoomId} from "@/domain/Room/RoomId";
import {Room} from "@/domain/Room/Room";
import {UserId} from "@/domain/User/UserId";
import {PageSize, PageToken, PaginatedResponse} from "@/shared/Pagination";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";
import {RoomPersistence, RoomPersistenceMap, RoomRow} from "@/infrastructure/repositories/postgres/RoomPersistenceMap";

let roomRepository: PostgresRoomRepository;

export class PostgresRoomRepository implements RoomRepository {
    private pool: Pool;

    private constructor() {
        this.pool = PostgresConnection.getPool();
    }

    static create(): PostgresRoomRepository {
        if (!roomRepository) {
            roomRepository = new PostgresRoomRepository();
        }
        return roomRepository;
    }

    private async usersIdsFor(roomId: string): Promise<string[]> {
        const result = await this.pool.query<{ user_id: string }>(
            'SELECT user_id FROM room_users WHERE room_id = $1',
            [roomId]
        );
        return result.rows.map(row => row.user_id);
    }

    private async toDomain(row: RoomRow): Promise<Room> {
        const usersIds = await this.usersIdsFor(row.id);
        return RoomPersistenceMap.toDomain(RoomPersistenceMap.fromRow(row, usersIds));
    }

    async save(room: Room): Promise<void> {
        const persistence = RoomPersistenceMap.toPersistence(room);
        const row = RoomPersistenceMap.toRow(persistence);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO rooms (id, name, host_id, active_game_id, updated_timestamp)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET
                     name = $2, host_id = $3, active_game_id = $4, updated_timestamp = $5`,
                [row.id, row.name, row.host_id, row.active_game_id, row.updated_timestamp]
            );

            await client.query('DELETE FROM room_users WHERE room_id = $1 AND user_id != ALL($2::uuid[])', [
                row.id,
                persistence.usersIds,
            ]);

            for (const userId of persistence.usersIds) {
                await client.query(
                    'INSERT INTO room_users (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [row.id, userId]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async find(id: RoomId): Promise<Room | undefined> {
        const result = await this.pool.query<RoomRow>('SELECT * FROM rooms WHERE id = $1', [id.value]);
        const row = result.rows[0];
        return row ? this.toDomain(row) : undefined;
    }

    async findRoomByHostId(hostId: UserId): Promise<Room | undefined> {
        const result = await this.pool.query<RoomRow>('SELECT * FROM rooms WHERE host_id = $1', [hostId.value]);
        const row = result.rows[0];
        return row ? this.toDomain(row) : undefined;
    }

    async findRoomByUserId(userId: UserId): Promise<Room | undefined> {
        const result = await this.pool.query<RoomRow>(
            `SELECT rooms.* FROM rooms
             JOIN room_users ON room_users.room_id = rooms.id
             WHERE room_users.user_id = $1`,
            [userId.value]
        );
        const row = result.rows[0];
        return row ? this.toDomain(row) : undefined;
    }

    async delete(id: RoomId): Promise<void> {
        await this.pool.query('DELETE FROM rooms WHERE id = $1', [id.value]);
    }

    async getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<Room>> {
        const defaultPageSize = 100;
        const defaultPageToken = 0;
        const token = pageToken.value ?? defaultPageToken;
        const size = pageSize.value ?? defaultPageSize;

        const [rowsResult, countResult] = await Promise.all([
            this.pool.query<RoomRow>(
                'SELECT * FROM rooms ORDER BY updated_timestamp, id LIMIT $1 OFFSET $2',
                [size, token * size]
            ),
            this.pool.query<{ count: string }>('SELECT COUNT(*) FROM rooms'),
        ]);

        const totalSize = Number(countResult.rows[0].count);
        const results = await Promise.all(rowsResult.rows.map(row => this.toDomain(row)));

        return {
            results,
            nextPageToken: (token + 1) * size < totalSize ? token + 1 : null,
            prevPageToken: token > 0 ? token - 1 : null,
            totalSize,
        };
    }

    async getTotalSize(): Promise<number> {
        const result = await this.pool.query<{ count: string }>('SELECT COUNT(*) FROM rooms');
        return Number(result.rows[0].count);
    }
}
