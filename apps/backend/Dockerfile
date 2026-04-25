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
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN corepack enable && yarn install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN yarn workspace @repo/backend build

# ██████╗ ██╗   ██╗███╗   ██╗
# ██╔══██╗██║   ██║████╗  ██║
# ██████╔╝██║   ██║██╔██╗ ██║
# ██╔══██╗██║   ██║██║╚██╗██║
# ██║  ██║╚██████╔╝██║ ╚████║
# ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   Stage

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY packages/shared ./packages/shared

EXPOSE 3000

CMD ["node", "apps/backend/dist/main"]
