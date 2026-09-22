// Design tokens sourced from `frontend/doc/design/Tic-Tac-Toe Hacker UI.dc.html`.
// Centralized here so story tests assert against the same values instead of
// duplicating magic color/font strings.

export const DESIGN_COLORS = {
    accentGreen: '#00ff9c',
    errorRed: '#ff2d6b',
    dimmedText: 'rgba(217, 255, 233, 0.3)',
    dimmedTextLoading: 'rgba(217, 255, 233, 0.35)',
    dimmedBorder: 'rgba(217, 255, 233, 0.25)',
    statusInProgress: '#ffb020',
    // Game view (design section "04 // GAME")
    text: '#d9ffe9',
    warning: '#ffb020',
    mutedPlayer: 'rgba(217, 255, 233, 0.35)', // non-active player / loser
    xMark: 'rgba(217, 255, 233, 0.4)', // X on the board while the game is in progress
    emptyCell: 'rgba(217, 255, 233, 0.15)',
    drawPlayerName: 'rgba(217, 255, 233, 0.6)', // both players once the game is a draw / opponent left
    drawMark: 'rgba(217, 255, 233, 0.5)',
    leftPlayerMark: 'rgba(217, 255, 233, 0.25)', // mark of the player who left
} as const;

export const DESIGN_FONTS = {
    fontFamily: "'JetBrains Mono', monospace",
} as const;
