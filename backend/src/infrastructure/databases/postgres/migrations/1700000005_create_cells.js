exports.up = (pgm) => {
    pgm.createTable("cells", {
        id: {type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()")},
        mark: {type: "text", notNull: true},
        position: {type: "integer", notNull: true},
        game_id: {type: "uuid", notNull: true, references: "games", onDelete: "CASCADE"},
    });

    pgm.addConstraint("cells", "cells_game_id_position_unique", {
        unique: ["game_id", "position"],
    });
};

exports.down = (pgm) => {
    pgm.dropTable("cells");
};
