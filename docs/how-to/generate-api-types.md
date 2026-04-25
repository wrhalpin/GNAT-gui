# Keep API types in sync

The frontend uses TypeScript types generated from the backend's OpenAPI schema. Whenever you change a Pydantic model in the backend, regenerate the types file before updating the frontend.

---

## How it works

1. FastAPI auto-generates an OpenAPI 3.1 schema at `/openapi.json` from all Pydantic models and route signatures
2. `scripts/generate-types.mjs` fetches that schema from a running backend and passes it to `openapi-typescript`
3. The result is written to `frontend/src/api/generated.ts`
4. `generated.ts` is in `.gitignore` — it is rebuilt at dev-server startup and as part of the CI frontend build

---

## Run manually

With the backend running on port 8000:

```bash
cd frontend
npm run generate-types
```

Or from the repo root:

```bash
node scripts/generate-types.mjs
```

The output file path is `frontend/src/api/generated.ts`.

---

## It runs automatically

`npm run dev` runs `generate-types` first (via the `concurrently` script in `package.json`) so the types are always fresh when you start the dev server.

In CI, the `frontend-test.yml` workflow starts a mock backend or uses the real one (depending on the job) before running the type-check and build steps.

---

## After changing a Pydantic model

1. Restart the backend (or let `--reload` pick up the change)
2. Run `npm run generate-types`
3. Fix any TypeScript errors that arise in the frontend — these are real type mismatches that need to be resolved

---

## Troubleshooting

**`Failed to fetch /openapi.json`**
The backend is not running or is not reachable at `http://localhost:8000`. Start it with `uvicorn gnat_gui.main:app --reload`.

**`generated.ts` has merge conflicts**
Delete the file and regenerate it — it is always fully rewritten.

**Types look stale after a schema change**
The Vite dev server caches module resolution. Run `npm run generate-types` and then hard-restart Vite (`Ctrl+C` and `npm run dev`).
