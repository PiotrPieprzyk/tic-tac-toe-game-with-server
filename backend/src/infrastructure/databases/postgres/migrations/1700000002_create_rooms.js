exports.up = (pgm) => {
    pgm.createTable("rooms", {
        id: {type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()")},
        name: {type: "text", notNull: true},
        host_id: {type: "uuid", notNull: true, references: "users", onDelete: "CASCADE"},
        active_game_id: {type: "uuid", notNull: false},
        updated_timestamp: {type: "bigint", notNull: true},
    });

    pgm.createTable("room_users", {
        room_id: {type: "uuid", notNull: true, references: "rooms", onDelete: "CASCADE"},
        user_id: {type: "uuid", notNull: true, references: "users", onDelete: "CASCADE"},
    });
    pgm.addConstraint("room_users", "room_users_pkey", {primaryKey: ["room_id", "user_id"]});
};

exports.down = (pgm) => {
    pgm.dropTable("room_users");
    pgm.dropTable("rooms");
};
