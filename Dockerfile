FROM oven/bun:latest

WORKDIR /app

# Env
ARG VITE_SITE_URL
ARG VITE_KRAKSTACK_AUTH_URL

ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_KRAKSTACK_AUTH_URL=$VITE_KRAKSTACK_AUTH_URL

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy source
COPY . .

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
