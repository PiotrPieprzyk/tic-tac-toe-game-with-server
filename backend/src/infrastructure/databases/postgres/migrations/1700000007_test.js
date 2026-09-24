exports.up = (pgm) => {
    pgm.addConstraint("cells", "cells_position_check", {
        check: "position >= 0 AND position < 9",
    });
};

exports.down = (pgm) => {
    pgm.dropConstraint("cells", "cells_position_check");
};
