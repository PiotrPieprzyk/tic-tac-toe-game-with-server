## Host can delete the room

### Status

To do

### Description

The host of a room can delete it. Only the host is allowed to delete the room.


### Tests

Test cycle prerequisites:
- create two users

#### WHEN host delete room SHOULD return 200

Prerequisites:
- Created one room

#### WHEN NOT host delete room SHOULD return 200

Prerequisites:
- Create one room

#### WHEN room do not exist SHOULD return 404

Prerequisites:
- None

#### WHEN room's game is in progress and host tried to remove room SHOULD return 400

Prerequisites:
- Create one room
- Start game



### Required API

- DELETE /rooms/:id



