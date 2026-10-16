# Design Prompt: Tic-Tac-Toe Multiplayer — Hacker/Terminal UI

Design a 4-page website mockup for a real-time multiplayer Tic-Tac-Toe web app. Style: **techy/hacker terminal aesthetic** — dark background, monospace fonts, neon accent glow (matrix green or cyan), subtle scanline/CRT texture, sharp square corners over rounded ones. Think hacker terminal / cyberpunk dashboard, not a cute casual game.

## Visual language
- Background: near-black (#0a0e0a or #0d1117 style), with a faint grid or scanline overlay.
- Primary accent: terminal green (#00ff9c / #39ff14) or cyan (#00e5ff) for highlights, borders, active states.
- Secondary accent: magenta/red for errors, danger, "opponent" states.
- Typography: monospace throughout (e.g. JetBrains Mono, Fira Code, IBM Plex Mono). Headers can use a glitch/terminal-prompt style (`> ROOM_LIST` instead of "Room List").
- UI chrome: thin 1px glowing borders, terminal-window framing (fake window controls optional), blinking cursor accents, ASCII-style dividers.
- Buttons: bracketed text style optional (e.g. `[ JOIN ]`), hover = glow intensifies.
- Status indicators use color coding: green = waiting/available, amber = in progress, red = full/ended.

## Pages

### 1. Login
- Single username field, styled like a terminal prompt (`ENTER_HANDLE:`).
- Validation rules shown inline: name must be 3–20 characters, must be unique.
- Error state: username too short/long, or already taken (red inline message, terminal-style, e.g. `ERR: HANDLE_TAKEN`).
- Single primary CTA: `[ CONNECT ]`.
- No password/auth — this is a name-only identity system.

### 2. Menu (Room List)
- Header showing current user's handle and a `[ CREATE_ROOM ]` action.
- Paginated list of rooms, each row showing: room name, host name, player count (e.g. `2/2`), and status badge (`WAITING_FOR_PLAYERS` / `IN_PROGRESS` / `ENDED`).
- Rooms update live (design a subtle "live" indicator, e.g. a pulsing dot, to convey real-time websocket updates — new rooms animate in, full/in-progress rooms are visually deprioritized or disabled for joining).
- Join action per row (`[ JOIN ]`), disabled/greyed if room is full or game in progress.
- A user can only be in one room at a time — if already in a room, show a `[ RETURN_TO_ROOM ]` state instead of create/join.
- Empty state: no rooms yet, styled as terminal output (e.g. `> NO_ACTIVE_ROOMS_FOUND`).
- Pagination controls (prev/next), terminal-styled (`< PREV`, `NEXT >`).

### 3. Room (Room Details)
- Room name (editable inline by host only, with a rename affordance), room id/code visible.
- Two player slots displayed side by side (Player 1 / Player 2 with a "waiting for opponent..." empty-slot placeholder if only 1 player).
- Host is visually marked (e.g. `[HOST]` tag) next to their name.
- Host-only controls: `[ RENAME_ROOM ]`, `[ REMOVE_PLAYER ]` (per non-host player), `[ START_GAME ]` (disabled until 2 players present), `[ DELETE_ROOM ]`.
- Non-host controls: `[ LEAVE_ROOM ]`.
- Status banner reflecting room state (waiting for players / game in progress / game ended).
- If a game is active for this room, show a way to jump into it (`[ ENTER_GAME ]`).

### 4. Game
- 3x3 grid, terminal/ASCII styled cells — empty cells show a faint blinking cursor or dim placeholder, marked cells show bold glowing `X` or `O`.
- Two players' names + marks shown at top/sides, with the active player's turn clearly highlighted (glow/pulse on their name when it's their turn).
- Turn indicator / status line styled like terminal output (e.g. `> AWAITING_INPUT: PLAYER_2`).
- End-of-game states to design:
  - **Win**: winning line highlighted (glowing strike-through the 3 cells), banner `> GAME_OVER: PLAYER_1_WINS`.
  - **Draw**: banner `> GAME_OVER: DRAW`.
  - **Opponent left**: banner `> GAME_OVER: OPPONENT_DISCONNECTED`.
- `[ LEAVE_GAME ]` control available during and after the game.
- Disabled/locked visual state for cells when it's not the viewer's turn or the game has ended.

## Notes for the designer
- All real-time state (room list updates, game moves, game end) arrives via WebSocket events — so the design should emphasize "live" feedback: subtle animations on state changes (row added/removed, cell marked, turn switch) rather than static page reloads.
- Design for both the "waiting" and "active" states of each page — these are meaningful UI states, not edge cases.
- Keep information density low and legible — this is a 2-player casual game wrapped in a hacker aesthetic, not a data-dense dashboard.