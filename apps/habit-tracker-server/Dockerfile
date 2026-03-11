FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/habit-tracker-server ./apps/habit-tracker-server

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @habit-tracker/server prisma:generate
RUN pnpm --filter @habit-tracker/server build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl
RUN corepack enable

COPY --from=builder /app /app

RUN chmod +x /app/apps/habit-tracker-server/docker/start.sh

EXPOSE 4000

CMD ["/app/apps/habit-tracker-server/docker/start.sh"]
