# frontend

React + TS app using DDD/Clean Architecture layers under `src/`:

- `domain/` — business types, value objects, API/service interfaces, and the React context/hook pairs (`useUserAPI`, `useRoomAPI`, `useRouter`, `useRoomEventsSocket`, `useUserSession`) that define abstractions. No framework implementation details, no I/O.
- `infra/` — concrete implementations of `domain` interfaces (`SimpleUserAPI`, `SimpleRoomAPI`, `ReactRouter`, real websocket client, etc).
- `app/` — UI components. Consume `domain` context hooks; never import `infra` directly. See `frontend/.claude/skills/app-components` for how to structure/split components in here.
- `components/`, `shared/` — presentational/shared UI, no dependency on `domain`/`infra`/`app`.

Dependency rule (enforced by `eslint.config.js` via `no-restricted-imports`):
- `domain` → nothing in `app` or `infra`.
- `infra` → may depend on `domain`, never on `app`.
- `app` → may depend on `domain` only, never on `infra` directly.

Concrete `infra` implementations are wired into `domain` context providers only at the composition root (`src/App.tsx`).

- Relative imports are disallowed everywhere — use the `@/` (src) or `@doc/` (doc) alias.
- Frontend story specs live in `doc/stories/**`; see `frontend/.claude/skills/component-tests` when adding/updating them.
- Styling uses Tailwind CSS v4. Theme tokens are defined in `src/index.css` via `@theme`, named by function (e.g. `panel-background`, `primary-border`, `text-muted`) rather than generic accent numbers — use these tokens instead of raw colors/hex values.