FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm dlx prisma generate
RUN pnpm build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm dlx prisma generate --generator client

FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm dlx prisma generate
EXPOSE 3001
CMD ["pnpm", "dev"]

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p /app/sessions && chown -R node:node /app/sessions
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
RUN corepack enable
USER node
EXPOSE 3001
CMD ["pnpm", "serve"]
