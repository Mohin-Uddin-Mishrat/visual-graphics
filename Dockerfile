# ====== BUILD STAGE ======
FROM node:22-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for build
RUN apt update && apt install -y openssl

# Copy package, lock file & prisma folder
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy rest of the project files
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

# Build the app (NestJS -> dist/)
RUN npm run build

# ====== PRODUCTION STAGE ======
FROM node:22-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies needed at runtime
RUN apt update && apt install -y openssl curl

# Copy necessary files from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Install dependencies
RUN npm ci

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:prod"]
