/**
 * TODO: create the "players" table, mirroring PlayerPersistence
 * (backend/src/application/Game/PlayerMap.ts): id, userId, mark
 *
 * Note there's no gameId in PlayerPersistence itself, but a player only
 * exists within a game — check how MockGameRepository/MockPlayerRepository
 * associate them (GamePersistence.players is the join today) and decide
 * whether you need a gameId FK column here to look players up by game.
 */

exports.up = (pgm) => {
    // pgm.createTable("players", { ... });
};

exports.down = (pgm) => {
    // pgm.dropTable("players");
};
