## User can choose a name.

### Status:

To do

### Description

Elements in #/users/create:

- data-testId="userForm"
  - data-testId="userNameTextField"
    - data-testId="input"
    - data-testId="errorMessage"
  - data-testId="connect"

connect button is not clickable when userName is empty or errorMessage is visible.
connect button will redirect to #/rooms

Error messages:

- ERR: PLAYER_NAME_TOO_SHORT — (MIN 3 CHARS)
- ERR: PLAYER_NAME_TAKEN — TRY ANOTHER


See `frontend/doc/design/Tic-Tac-Toe Hacker UI.dc.html` (01_LOGIN section) for all UI states, including first-render (input auto-focused, connect disabled).

Color/font constants used by tests are centralized in `frontend/doc/stories/testUtils.ts`.

### Tests

Test cycle prerequisites:

- Mock Router

#### WHEN UserForm is first rendered, connect button SHOULD show default "[ CONNECT ]" label styled grayed out and be disabled, and input SHOULD be focused with the accent color

Prerequisites:

- Render UserForm

#### WHEN user type userName "ValidName", connect button SHOULD be clickable and when clicked SHOULD show loading state for submit button until redirected to #/rooms

Prerequisites:

- Render UserForm

#### WHEN user type userName "TakenName" connect button SHOULD NOT be clickable and errorMessage should be visible

Prerequisites:

- Render UserForm
- Mock API /users - should return message: User name already taken, status: 400

#### WHEN user type userName "Sh" connect button SHOULD NOT be clickable and errorMessage should be visible

Prerequisites:

- Render UserForm


