## User can choose a name.

### Status:

In progress

### Description

User can't choose a name that is already taken.
Username must be name longer than 3 characters and shorter than 20 characters.

### Tests

Test cycle prerequisites:
- none

#### WHEN user is created with correct username SHOULD get 200.

Prerequisites:
- none

#### WHEN user is created with username longer than 20 characters SHOULD get 400 error

Prerequisites:
- none

#### WHEN user is created with username shorter than 3 characters SHOULD get 400 error

Prerequisites:
- none

#### WHEN user is created with username already taken SHOULD get 400 error

Prerequisites:
- none

#### WHEN user is created with incorrect parameter SHOULD get 400 error

Prerequisites:
- none

### Required API API

- POST /users
- PUT /users/:id
- GET /users/:id
- DELETE /users/:id

```typescript
/* 
 * @description ...
 */
type id = string
```


