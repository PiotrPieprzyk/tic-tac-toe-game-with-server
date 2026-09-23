/**
 * TODO: create the "games" table, mirroring GamePersistence
 * (backend/src/infrastructure/repositories/mock/GamePersistenceMap.ts):
 *   id, status, activePlayerId, result, winnerPlayerId, roomId, updatedTimestamp
 *
 * "players" isn't a column here — it's a separate table (see the players
 * migration), since Game.players is a child collection just like Cell.
 *
 * Things to decide:
 * - roomId as a foreign key into rooms(id)
 * - status/result: could be a Postgres ENUM type (matches GameStatusEnum /
 *   GameResultEnum in the domain) or a plain text column with a CHECK
 *   constraint — either teaches you something different, pick one.
 */

exports.up = (pgm) => {
    // pgm.createTable("games", { ... });
};

exports.down = (pgm) => {
    // pgm.dropTable("games");
};
