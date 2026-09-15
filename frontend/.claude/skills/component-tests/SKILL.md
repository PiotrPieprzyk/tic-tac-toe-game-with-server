---
name: component-tests
description: Write behavior-focused React component tests for a story spec under frontend/doc/stories/**. Use when creating or updating a *.test.ts file next to (or describing) a story .md, or when asked to add/expand tests for a frontend component that isn't implemented yet.
---

# Writing component story tests

Reference implementation: `frontend/doc/stories/Menu/user-can-choose-a-name.test.ts`
(spec: `frontend/doc/stories/Menu/user-can-choose-a-name.md`).

These tests are black-box, behavior-focused specs for components that may not
be implemented yet — it is expected and correct for them to fail until the
component exists. Do not adjust assertions to make them pass; the test is the
spec.

## 1. Read the story spec first

Every `*.test.ts` under `frontend/doc/stories/**` has a matching `.md` file.
The `.md` is the source of truth for:

- the `data-testid` tree (nesting matters, see steps 3-4)
- one `#### WHEN ...` heading per test case — this is the test's `it(...)` title

For the exact labels, button text, color, font, and error messages look at the
design file(s) under `frontend/doc/design/*.dc.html`

## 2. Centralize design tokens in testUtils

Never inline raw color/font strings in a test. Put them once in
`frontend/doc/stories/testUtils.ts` as plain `const ... as const` objects
(e.g. `DESIGN_COLORS`, `DESIGN_FONTS`) and import from there:

```ts
import {DESIGN_COLORS} from '../testUtils';
```

Colors in `toHaveStyle` must be written the way jsdom will report them back —
prefer hex (`'#00ff9c'`) for `color`/`borderColor` and full `rgba(r, g, b, a)`
(spaces after commas) for translucent values, matching what the design file's
inline `style="..."` actually says.

## 3. Query elements by walking the data-testid tree, outer to inner

Elements in the `.md` are listed as a nested tree, e.g.:

```
- data-testId="userForm"
  - data-testId="userNameTextField"
    - data-testId="input"
    - data-testId="errorMessage"
  - data-testId="connect"
```

Never call `screen.getByTestId('input')` directly. Always resolve the
wrapper first with `within`, then query children inside it, mirroring the
nesting exactly:

```ts
import {screen, within} from '@testing-library/react';

export function userForm() {
    return within(screen.getByTestId('userForm'));
}

export function getUserNameTextField() {
    return within(userForm().getByTestId('userNameTextField'));
}

export function getUserNameInput() {
    return getUserNameTextField().getByTestId('input');
}

export function getUserNameErrorMessage() {
    return getUserNameTextField().getByTestId('errorMessage');
}

export function getConnect() {
    return userForm().getByTestId('connect');
}
```

Add one such getter function per node in the tree, named after its testid.
Call the getter functions fresh inside each assertion/`waitFor` rather than
caching the element across an interaction that might re-render it (unless you
already re-fetch it inside `waitFor`, as `getUserNameErrorMessage()` does
above).

Prefix a getter with the wrapper's name (e.g. `getUserNameInput`,
`getRoomNameInput`) instead of a generic one (`getInput`) whenever more than
one component tree in the same feature folder has a node with that testid —
this is required once the getters live in a shared file (see step 4), since
plain names like `getInput` or `getErrorMessage` would collide across
components.

## 4. Put mocks, builders, and getX helpers in a per-feature `shared/` folder

Once a second story file for the same feature (e.g. `Menu`) needs the same
mock, builder, or element tree, do not redefine it locally — move it into
`frontend/doc/stories/<Feature>/shared/` and import it. Split by concern, one
file per component tree for the getX helpers:

```
frontend/doc/stories/Menu/shared/
  mocks.ts          # createMockRouter, createMockRoomAPI, createMockRoomEventsSocket, ...
  builders.ts       # buildRoom, ... — one builder per domain response shape
  get/
    roomList.ts     # roomList() + every getX for the RoomList/roomList testid tree
    roomForm.ts     # roomForm() + every getX for the RoomForm/roomForm testid tree
    userForm.ts     # userForm() + every getX for the UserForm/userForm testid tree
```

Rules:

- `mocks.ts` holds one `createMock<Dependency>(overrides)` per injected
  dependency, each returning `vi.fn()` per method and spreading `overrides`
  last so individual tests can override specific methods.
- `builders.ts` holds one `build<Thing>(overrides)` per domain response/DTO
  shape, with sensible defaults and `overrides` spread last.
- `get/<component>.ts` holds the wrapper getter (named after the component,
  e.g. `roomList()`) plus every getX for that component's testid tree, in
  outer-to-inner order — even getters only used by one story file today, so
  the next story for the same component doesn't redefine them.
- A story test file imports what it needs from these shared files instead of
  declaring local `createMock...`/`build...`/`get...` functions. Only a
  `render<Component>(...)` wiring helper (providers + the component under
  test) stays local to each test file, since its provider composition is
  usually specific to that story.

## 5. Structure of a test file

1. Imports: testing-library, `userEvent`, the component under test, its
   domain types (`Router`, the API interface, response types), the relevant
   `*Provider` for context, `DESIGN_COLORS`/`DESIGN_FONTS` from
   `../testUtils`, and the shared `mocks`/`builders`/`get/<component>`
   helpers from step 4.
2. A `render<Component>(...)` helper that wraps the component in all required
   providers.
3. One `describe('<story title>', () => { ... })` block containing one `it`
   per `#### WHEN ...` heading in the `.md`, using that heading verbatim (or
   near-verbatim) as the test title.

## 6. What to assert — behavior, not implementation

For every test, prefer assertions on what a user perceives, not internal
state or markup structure:

- **Text**: exact button/label/error copy via `toHaveTextContent`, matching
  the `.md` word-for-word. Use a regex (e.g. `/CONNECTING/`) only when the
  design splits text across multiple inline elements (e.g. animated dots).
- **Color**: `toHaveStyle({color: ..., borderColor: ...})` using
  `DESIGN_COLORS` constants, for every distinct visual state called out in
  the design (default, error, disabled, loading).
- **Enabled/disabled**: `toBeEnabled()` / `toBeDisabled()`.
- **Focus**: `toHaveFocus()` when the spec requires auto-focus.
- **Loading**: check the "busy" signal the spec defines (e.g.
  `toHaveAttribute('aria-busy', 'true')`) plus the disabled state and label
  change, not a mocked internal loading flag.
- **Navigation/side effects**: assert on the injected mock (e.g.
  `expect(router.push).toHaveBeenCalledWith('#/rooms')`), wrapped in
  `waitFor` when it follows an async resolution.
- **API calls**: assert `userAPI.someMethod` was or wasn't called, not how
  the component internally decided to call it.

Avoid: snapshot tests, querying by CSS class or DOM tag, asserting on
component internals/props, or testing implementation details (e.g. hook
call order, internal state variable names).

## 7. One test per distinct WHEN, merge same-WHEN assertions

If two things must be true for the same triggering action (the same `WHEN`
clause), put them in the same `it` as multiple assertions rather than
splitting into separate tests — don't fragment one behavior across tests.

## 8. Run and confirm the expected failure

After writing/updating tests, run them:

```
npx vitest run doc/stories/<Feature>/<story-name>.test.ts
```

If the component isn't implemented yet, all tests should fail on a missing
`data-testid` (e.g. `Unable to find an element by: [data-testid="userForm"]`)
— that confirms the tests are wired correctly and are waiting on the real
implementation, not broken by a typo or wrong import.