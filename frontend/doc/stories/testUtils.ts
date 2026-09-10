// Design tokens sourced from `frontend/doc/design/Tic-Tac-Toe Hacker UI.dc.html`.
// Centralized here so story tests assert against the same values instead of
// duplicating magic color/font strings.

export const DESIGN_COLORS = {
    accentGreen: '#00ff9c',
    errorRed: '#ff2d6b',
    dimmedText: 'rgba(217, 255, 233, 0.3)',
    dimmedTextLoading: 'rgba(217, 255, 233, 0.35)',
    statusInProgress: '#ffb020',
} as const;

export const DESIGN_FONTS = {
    fontFamily: "'JetBrains Mono', monospace",
} as const;
