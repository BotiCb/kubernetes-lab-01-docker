# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# ---- Stage 1: shared base, holds only the manifests ----
FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Only the manifests here, so editing src/ never invalidates an install layer.
COPY package.json pnpm-lock.yaml ./

# ---- Stage 2: full dependency tree, used to compile ----
FROM base AS deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Stage 3: runtime dependencies only (no nest CLI, typescript, types) ----
FROM base AS prod-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ---- Stage 4: compile TypeScript to dist/ ----
FROM deps AS build

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN pnpm build

# ---- Stage 5: runtime, gets the compiled output only ----
FROM node:${NODE_VERSION} AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

WORKDIR /app

# node:alpine already ships an unprivileged "node" user (uid 1000); copying with
# --chown avoids a second full-size layer just to fix ownership afterwards.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/main.js"]
