## Game tic tac toe with server

This is a simple game of tic tac toe with a server. The game is played in the hosted locally webapp.

## How to run the game

1. Clone the repository.
2. Run the server. Webapp url will be displayed in the console.
3. Open the webapp url in your browser.

## How to play the game

1. Enter your name.
2. Create or choose a room.
3. As host, you can start the game. If you are not the host, wait for the host to start the game.

## Testing on another device (same WiFi network)

To open the app from a phone or another computer on the same WiFi network, the frontend dev
server (port 4000) and backend server (port 3000) need to be reachable from other devices, and
`frontend/.env.local` needs to point `VITE_API_DOMAIN` at your machine's LAN IP (see
`ipconfig`, under your WiFi adapter's "IPv4 Address").

### Allow the ports through Windows Firewall

Firewall rules require an elevated (Administrator) PowerShell window.

**Option A — PowerShell:**

```powershell
New-NetFirewallRule -DisplayName "Tic-Tac-Toe Dev (3000,4000)" -Direction Inbound -Protocol TCP -LocalPort 3000,4000 -Action Allow -Profile Private
```

**Option B — GUI:**

1. Open "Windows Defender Firewall with Advanced Security".
2. **Inbound Rules** → **New Rule…** → **Port** → Next.
3. **TCP**, specific local ports: `3000,4000` → Next.
4. **Allow the connection** → Next.
5. Check only **Private** (uncheck Domain/Public) → Next.
6. Name it (e.g. `Tic-Tac-Toe Dev`) → Finish.

### Also check

- Your WiFi network profile must be set to **Private**, not Public (Settings → Network &
  Internet → Wi-Fi → your network → Network profile type). A firewall rule scoped to
  `-Profile Private` has no effect on a network Windows considers Public.
- Node.js may have been blocked the first time it ran — check **Windows Defender Firewall →
  Allow an app through firewall** for `node.exe` and make sure **Private** is checked there too.

## Game rules

1. The game is played on a 3x3 grid.
2. The first player is X, the second player is O.
3. The players take turns to play.
4. The player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row wins the game.
5. The game is a draw if the grid is full and no player has won.


