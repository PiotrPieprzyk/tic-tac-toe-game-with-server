FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.dangerously-allow-all-builds=true

COPY . .

EXPOSE 4000

CMD ["pnpm", "run", "dev"]
