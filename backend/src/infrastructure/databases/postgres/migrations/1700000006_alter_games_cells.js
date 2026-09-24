exports.up = (pgm) => {
    pgm.dropConstraint("games", "games_room_id_fkey");

    pgm.addConstraint("cells", "cells_mark_check", {
        check: "mark in ('X', 'O')",
    });
};

exports.down = (pgm) => {
    pgm.dropConstraint("cells", "cells_mark_check");

    pgm.addConstraint("games", "games_room_id_fkey", {
        foreignKeys: {
            columns: "room_id",
            references: "rooms(id)",
            onDelete: "CASCADE",
        },
    });
};
