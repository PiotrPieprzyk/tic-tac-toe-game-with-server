/**
 * TODO: create the "cells" table, mirroring CellPersistence
 * (backend/src/application/Game/CellMap.ts): id, mark, position, gameId
 *
 * Things to decide:
 * - gameId as a foreign key into games(id), ON DELETE CASCADE (cells are
 *   owned by their game — deleting a game should delete its cells)
 * - a UNIQUE constraint on (gameId, position) mirrors the domain invariant
 *   that a board has one cell per position
 */

exports.up = (pgm) => {
    // pgm.createTable("cells", { ... });
};

exports.down = (pgm) => {
    // pgm.dropTable("cells");
};
