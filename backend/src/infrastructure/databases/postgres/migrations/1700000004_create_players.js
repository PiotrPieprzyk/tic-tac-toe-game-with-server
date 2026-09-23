exports.up = (pgm) => {
    pgm.createTable("players", {
        id: {type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()")},
        user_id: {type: "uuid", notNull: true, references: "users", onDelete: "CASCADE"},
        mark: {type: "text", notNull: true, check: "mark in ('X', 'O')"},
        game_id: {type: "uuid", notNull: true, references: "games", onDelete: "CASCADE"},
    });
};

exports.down = (pgm) => {
    pgm.dropTable("players");
};
