FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@10

# Copy entire monorepo
COPY . .

# Install all deps (including devDeps needed for build)
RUN pnpm install --no-frozen-lockfile

# Build backend
RUN pnpm --filter @bopay/backend build

EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
