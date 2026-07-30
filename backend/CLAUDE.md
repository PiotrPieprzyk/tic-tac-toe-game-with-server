# backend — Clean Architecture / DDD rules

Layers: `domain/` → `application/` → `infrastructure/`. **Dependency rule: domain imports nothing from application or infrastructure. Ever.** Application may import domain. Infrastructure may import domain and application.

## Repository pattern
- Interface lives in `domain/<Aggregate>/<Aggregate>Repository.ts` (e.g. `domain/Room/RoomRepository.ts`).
- Interface methods take/return the **domain entity** (`Room`, `User`, `Game`), never a `*Persistence` DTO — that would leak an infra shape into domain.
- Implementation lives in `infrastructure/repositories/mock/Mock<Aggregate>Repository.ts`, instantiated via `Mock<Aggregate>Repository.create()`.
- Only `application/<Aggregate>/<Aggregate>Router.ts` calls the repository (through the interface type). Domain entities never hold a repository reference or call `.save()`/`.delete()` themselves.
- Child entities that are persisted separately from their aggregate root (e.g. `Cell`) don't need their own domain-facing repository interface — keep those interfaces infra-internal (`infrastructure/repositories/interfaces/`) and only the aggregate's own repository implementation may use them.

## Mapper pattern
- `application/<Aggregate>/<Aggregate>Map.ts` — DTO conversion only (`toDTO`), used to build API responses.
- `infrastructure/repositories/mock/<Aggregate>PersistenceMap.ts` — persistence conversion (`toPersistence`/`toDomain`), used only inside the matching Mock repository. Never import a `*Persistence` type into `domain/` or expose it on a repository interface.

## Domain errors
- `shared/DomainError.ts`: `ValidationError` (400), `ForbiddenError` (400), `NotFoundError` (404), `InvalidStateError` (500).
- Domain entities and value objects throw these — never `HTTPError`, never a raw `Error`.
- `HTTPError` (`shared/HTTPError.ts`) is reserved for router-level translation only (e.g. a router's own "not found" check before calling into domain).
- `app.ts`'s error middleware is the only place status codes get decided for the client; it maps `instanceof HTTPError || instanceof DomainError` to `err.status`.

## Entities are pure
- No repository fields, no async side effects. Mutating methods (`room.hostRenames(...)`, `game.playerMarksCell(...)`) return a **new** instance, or `undefined` to signal "the aggregate should be deleted."
- Business rules that require cross-aggregate lookups (e.g. "does this user exist," "does this host already have a room") are decided by the router calling the repository first, then passed into a domain factory/method that enforces the rule (see `Room.createForHost`, `Room.hostEditsRoom`).

## Routers
- Thin: parse request → call domain → persist/delete via repository → build DTO → respond. No business rules inline in a route handler — if you're writing an `if` that checks a domain invariant, it belongs in the entity instead.
- There is no separate use-case layer; the router doubles as one. That's an accepted simplification at this project's size — keep it that way rather than adding a use-case layer speculatively.
- Repository dependencies are injected via the constructor (typed by the repository interface, e.g. `UserRepository`, never a `Mock*` concrete class), and `setup(app)` is an instance method.
- `Router.setup(app, repositories)` (`application/Router.ts`) takes a `RouterRepositories` object and constructs each sub-router (`new UserRouter(...)`, `new RoomRouter(...)`, `new GameRouter(...)`) with the repositories it needs, then calls `.setup(app)` on the instance.
- `app.ts`'s `getApp(repositories?)` defaults to the `Mock*Repository.create()` singletons when no repositories are passed, so `getApp()` still works with no args in tests/`index.ts`, but callers can inject alternative repository implementations (e.g. for isolated tests) without touching router internals.

## Current known gaps (don't "fix" these as side effects of unrelated work)
- `GameRouter` only implements `GET /games/:id`. No game creation, mark, or leave endpoints exist yet.
- `websocket.ts` is an unwired echo stub — no domain event → broadcast path exists.
- Several `documentations/stories/**` tests assert on these missing features and are expected to fail.
