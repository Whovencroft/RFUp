# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build frontend
RUN npm run build:client

# Compile server TypeScript
RUN npm run build:server

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Only install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Verify build artifacts exist
RUN ls dist/server/ && ls client/dist/

# Create persistent data directories
RUN mkdir -p /data/db /data/uploads

ENV DATABASE_PATH=/data/db/rfu.db
ENV UPLOADS_DIR=/data/uploads

EXPOSE 3000

# Volumes for persistence
VOLUME ["/data"]

CMD ["node", "dist/server/index.js"]
