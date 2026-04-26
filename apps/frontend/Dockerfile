# ██████╗ ██╗   ██╗██╗██╗     ██████╗
# ██╔══██╗██║   ██║██║██║     ██╔══██╗
# ██████╔╝██║   ██║██║██║     ██║  ██║
# ██╔══██╗██║   ██║██║██║     ██║  ██║
# ██████╔╝╚██████╔╝██║███████╗██████╔╝
# ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝  Stage

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/logics/package.json ./packages/logics/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN corepack enable && yarn install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

ARG NEXT_PUBLIC_NESTJS_URL
ENV NEXT_PUBLIC_NESTJS_URL=$NEXT_PUBLIC_NESTJS_URL

RUN yarn workspace @repo/frontend build

# ██████╗ ██╗   ██╗███╗   ██╗
# ██╔══██╗██║   ██║████╗  ██║
# ██████╔╝██║   ██║██╔██╗ ██║
# ██╔══██╗██║   ██║██║╚██╗██║
# ██║  ██║╚██████╔╝██║ ╚████║
# ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   Stage

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/server.js"]
