# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.13.0

FROM node:${NODE_VERSION}-bookworm-slim AS base

# Remix app lives here 
WORKDIR /app

# Set production environment variables
# ENV NODE_ENV=production

# Install pnpm
# ARG PNPM_VERSION=.10.19.0
RUN npm install -g pnpm

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install node modules including dev dependencies
COPY --link package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Add Prisma and Generate Prisma client
COPY prisma ./prisma
RUN pnpm run db:generate

# Copy application code
ADD . .
# COPY --link . .

# Mount the secret and set it as an environment variable and run the build
# RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
#   export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) && \
#   pnpm run build

# Build application
RUN pnpm run build

# Remove development dependencies
RUN CI=true pnpm prune --prod

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]