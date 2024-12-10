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

## Game rules

1. The game is played on a 3x3 grid.
2. The first player is X, the second player is O.
3. The players take turns to play.
4. The player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row wins the game.
5. The game is a draw if the grid is full and no player has won.

## Stories

### User stories
- If the user didn't join to the room within last at least 24 hour, the user is deleted automatically.
  - API: 
    - PUT /rooms/join

### Menu stories
- User can copy the webapp url.

- User can see the list of rooms and players in the room.
  - API
    - GET /rooms
- User can choose a name. User can't choose a name that is already taken.
  - API PUT /users/:id
- User can create room, but only one. When user creates room they are the host.
  - API
    - POST /rooms
- User can join a room.
  - API
    - PUT /rooms/join
  - Business logic:
    - If rooms are full, user can't join the room. Room can have only 2 players.
    - If the game has started, user can't join the room.
- The rooms list is updated automatically.
  - Business logic:
    - If the room is deleted, it is removed from the list.
    - If the game has started, the room status is updated to "in game".
    - If the room is full, the room status is updated to "full".
    - If the room has been added, it is added to the list.
  - API
    - RoomAddedEvent, RoomEditedEvent, RoomDeletedEvent

### In-Room stories
- Host can delete the room.
  - API: 
    - DELETE /rooms/:id
- Host can rename the room.
  - API:
    - PUT /rooms/:id
- Host can remove a player from the room.
  - API: 
    - PUT /rooms/:id
- Player can leave the room. 
  - Business logic:
    - Room is automatically deleted when the last player leaves the room.
  - API:
    - PUT /rooms/leave
- Auto archiving of the room
  - Business logic:
    - If the game is not started within at least 24 hour, the room is deleted automatically.
- If game is in progress, but player go to the different page, they can come back to the game.
  - API:
    - PUT /rooms/join
  - Business logic:
    - Only already added players can come back to the game.
- Host can start a game.
  - API:
    - POST /games
  - Business logic:
    - Game is started only if there are 2 players in the room.
    - Game is started only if the game is not already started.


### In-Game stories

- Player can mark a cell if it is their turn.
- Player can see which player's turn it is.
  - API:
    - GameLastTurnEvent
    - GET /games/:id
- Player can see players names and marks.
  - API:
    - GET /games/:id
- Player can see the game result (win, draw) when the game ends.
  - API:
    - GameEndedEvent
- Player can leave the game and go back to the room. Game is automatically deleted when the last player leaves the game.
  - API:
    - PUT /games/leave
- Auto archiving of the game
  - Business logic:
    - If the game is not ended within at least 24 hour, the game is deleted automatically.

## Models

### Room 
- properties
  - name
  - hostId
  - userIds
  - activeGameId
  - lastActiveDate
- methods
  - userJoinsToRoom
  - userLeavesRoom
  - hostDeletesRoom
  - hostRenamesRoom
  - hostRemovesPlayerFromRoom
  - isRoomFull

### Game
- properties
  - RoomId
  - Players
    - id
    - userId
    - mark
  - Cells
  - Status
  - result
  - activePlayerId
  - winnerId
  - lastActiveDate
- methods
  - startGame
  - playerMarkCell
  - endTurn
  - endGame
  - playerReturnsToRoom

### Game statuses
- inProgress
- ended
- waitingForPlayer

### Game results
- win
- draw
- playerLeftTheGame


### User
- properties
  - id
  - name
  - lastActiveDate
- methods
  - isUserActive

### Cell
- properties
  - mark
  - playerId
  - position
    - x
    - y
                      

## DTOs

### RoomDTO
- id
- name
- hostId
- users
  - id
  - name
- status

### GameDTO
- id
- name
- players
  - id
  - name
  - mark
- cells
  - mark
  - position
    - x
    - y
- result
- activePlayerId

### GameStartedEvent
- eventType: "gameStarted"
- dto: GameDTO

### GameLastTurnEvent
- eventType: "gameLastTurn"
- activePlayerId
- lastMarkedCell
  - mark
  - position
    - x
    - y

### GameEndedEvent
- eventType: "gameEnded"
- dto: GameDTO

- ### GameWaitingForPlayerEvent
- eventType: "gameWaitingForPlayer"
- dto: 
  - playerName

### RoomAddedEvent
- eventType: "roomAdded"
- dto: RoomDTO

### RoomEditedDTO
- eventType: "roomEdited"
- dto: 
  - name
  - players
    - id
    - name
  - status

### RoomDeletedEvent
- eventType: "roomDeleted"
- dto:
  - id


## Listeners

### RoomEventsListener
- listensTo: "roomAdded", "roomEdited", "roomDeleted", "gameStarted", "gameLastTurn", "gameEnded", "gameWaitingForPlayer"
- actorIds: RoomIds[]


## API endpoints

### Room Endpoints
- GET /rooms/:id
- POST /rooms
- PUT /rooms/:id
- PUT /rooms/:id/join
- PUT /rooms/:id/leave
- DELETE /rooms/:id

### Game Endpoints
- GET /games/:id
- POST /games
- DELETE /games/:id
- PUT /games/turns
- PUT /games/leave

### User Endpoints
- GET /users/:id
- POST /users
- PUT /users/:id





