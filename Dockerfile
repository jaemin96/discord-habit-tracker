FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/habit-tracker-server/package.json apps/habit-tracker-server/package.json
RUN pnpm install --filter @habit-tracker/server --frozen-lockfile

FROM deps AS builder

COPY . .
RUN pnpm --filter @habit-tracker/server build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/habit-tracker-server/package.json apps/habit-tracker-server/package.json
RUN pnpm install --filter @habit-tracker/server --prod --frozen-lockfile

COPY --from=builder /app/apps/habit-tracker-server/dist /app/apps/habit-tracker-server/dist

WORKDIR /app/apps/habit-tracker-server
EXPOSE 4000

CMD ["node", "dist/main.js"]

