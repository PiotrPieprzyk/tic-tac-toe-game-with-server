exports.up = (pgm) => {
    pgm.createTable("games", {
        id: {type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()")},
        status: {
            type: "text",
            notNull: true,
            check: "status in ('IN_PROGRESS', 'ENDED', 'WAITING_FOR_PLAYERS')",
        },
        result: {
            type: "text",
            notNull: false,
            check: "result in ('WIN', 'DRAW', 'PLAYER_LEFT_THE_GAME')",
        },
        room_id: {type: "uuid", notNull: true, references: "rooms", onDelete: "CASCADE"},
        active_player_id: {type: "uuid", notNull: false},
        winner_player_id: {type: "uuid", notNull: false},
        updated_timestamp: {type: "bigint", notNull: true},
    });

    pgm.addConstraint("rooms", "rooms_active_game_id_fkey", {
        foreignKeys: {
            columns: "active_game_id",
            references: "games(id)",
            onDelete: "SET NULL",
        },
    });
};

exports.down = (pgm) => {
    pgm.dropConstraint("rooms", "rooms_active_game_id_fkey");
    pgm.dropTable("games");
};
