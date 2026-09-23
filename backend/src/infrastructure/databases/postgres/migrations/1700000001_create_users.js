/**
 * Example migration — fully worked out, mirrors UserPersistence
 * ({ id, name, lastActiveDate }) so you can see the pattern before
 * writing the rooms/games/players/cells migrations yourself.
 *
 * Run with: npm run migrate up
 * (requires DATABASE_URL env var, e.g. postgres://user:pass@localhost:5432/tic_tac_toe)
 */

exports.up = (pgm) => {
    pgm.createTable("users", {
        id: {type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()")},
        name: {type: "text", notNull: true, unique: true},
        last_active_date: {type: "bigint", notNull: true},
    });
};

exports.down = (pgm) => {
    pgm.dropTable("users");
};
