/**
 * TODO: create the "rooms" table, mirroring RoomPersistence
 * (backend/src/infrastructure/repositories/mock/RoomPersistenceMap.ts):
 *   id, name, hostId, activeGameId, usersIds (string[]), updatedTimestamp
 *
 * Things to decide:
 * - hostId as a foreign key into users(id)
 * - usersIds: a join table `room_users(room_id, user_id)` is the normalized
 *   approach — prefer it over a text[]/jsonb column so you can enforce
 *   referential integrity and query membership efficiently.
 * - activeGameId: nullable foreign key into games(id) (games table doesn't
 *   exist yet at this point — either reorder migrations or add the FK in a
 *   later migration once "games" exists).
 */

exports.up = (pgm) => {
    // pgm.createTable("rooms", { ... });
    // pgm.createTable("room_users", { ... });
};

exports.down = (pgm) => {
    // pgm.dropTable("room_users");
    // pgm.dropTable("rooms");
};
