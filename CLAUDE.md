# tic-tac-toe

Monorepo: `backend/` (Express + TS, DDD/Clean Architecture — see `backend/CLAUDE.md`), `frontend/`, `docs/`.

- Backend tests: `cd backend && npx jest`. Story specs live in `backend/documentations/stories/**`, run as black-box HTTP tests via `supertest(getApp())` — internal refactors are safe as long as HTTP status codes and JSON bodies don't change.
- Known unimplemented backend features (tests for these are expected to fail): game creation/mark/leave HTTP endpoints, websocket broadcasting (`websocket.ts` is currently an echo stub, not wired to domain events).
