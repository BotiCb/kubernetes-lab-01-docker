# Notes API

A small HTTP API written in TypeScript with [NestJS](https://nestjs.com/), packaged with Docker for Lab 1.

It stores short notes (title + body) and keeps them in a JSON file, so the data survives a container restart as long as the file lives on a volume.

- Container port: **3000**
- Host port (compose): **8400**
- Image: `docker.io/boti13/notes-api:1.0.0`

---

## API

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| `GET` | `/health` | Liveness probe, also used by `HEALTHCHECK` | `200` |
| `GET` | `/notes` | List all notes, newest first | `200` |
| `POST` | `/notes` | Create a note from `{ "title": "...", "body": "..." }` | `201` |
| `GET` | `/notes/{id}` | Fetch one note | `200` / `404` |
| `PATCH` | `/notes/{id}` | Update the title, the body, or both | `200` / `404` |
| `DELETE` | `/notes/{id}` | Delete a note | `204` / `404` |

A note looks like this:

```json
{
  "id": "b55a980d-c823-437f-98cc-e46e341a5f4d",
  "title": "lab 1",
  "body": "docker notes",
  "createdAt": "2026-09-19T17:25:21.481Z",
  "updatedAt": "2026-09-19T17:25:21.481Z"
}
```

Request bodies are validated (`class-validator`), unknown fields are rejected with `400`.

---

## Running it

With Docker Compose (builds the image, creates the named volume):

```bash
docker compose up --build -d
```

Then:

```bash
curl -s http://localhost:8400/health
# {"status":"ok","uptime":3}

curl -s -X POST http://localhost:8400/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"lab 1","body":"docker notes"}'

curl -s http://localhost:8400/notes
```

The notes stay in the `notes-data` volume, so `docker compose down && docker compose up -d` keeps them. `docker compose down -v` removes the volume and starts from an empty store.

Without compose:

```bash
docker run -d --name notes-api \
  -p 8400:3000 \
  -v notes-data:/data \
  boti13/notes-api:1.0.0
```

Locally, without Docker (Node 22+, pnpm):

```bash
pnpm install
pnpm build
pnpm start
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the HTTP server listens on |
| `DATA_DIR` | `/data` in the image, `./data` otherwise | Directory holding `notes.json` |
| `NODE_ENV` | `production` in the image | Standard Node environment flag |

---

## How the image is built

The `Dockerfile` is a five stage build on `node:24-alpine`:

1. **base** — enables corepack/pnpm and copies only `package.json` + `pnpm-lock.yaml`.
2. **deps** — `pnpm install --frozen-lockfile` with a BuildKit cache mount on the pnpm store.
3. **prod-deps** — the same install with `--prod`, built from `base` rather than from `deps` so the dev dependencies never end up in the virtual store.
4. **build** — adds the sources on top of **deps** and runs `nest build`.
5. **runtime** — copies `node_modules` from **prod-deps** and `dist/` from **build**.

Consequences worth pointing out:

- Editing a file under `src/` only invalidates the last two steps: the dependency layers stay cached and nothing is re-downloaded.
- The final image has no TypeScript sources, no compiler and no nest CLI — just the compiled `dist/` and the runtime dependencies (~68 MB total, of which 62 MB is the base image).
- It runs as the unprivileged `node` user (uid 1000) that ships with the base image; `/data` is chowned to it.
- `HEALTHCHECK` polls `/health` with busybox `wget`, so Docker reports the container as `healthy` or `unhealthy`.
- The app handles `SIGTERM` through Nest's shutdown hooks, so `docker stop` is a clean stop instead of a 10 second wait followed by `SIGKILL`.
