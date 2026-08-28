FROM oven/bun:latest

WORKDIR /app

# Env
ARG VITE_SITE_URL
ARG VITE_ANALYTICS_WEBSITE_ID

ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

# Install workspace dependencies without running the root prepare script before
# its source files are available.
COPY package.json bun.lock ./
COPY packages/registry/package.json ./packages/registry/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run prepare
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
