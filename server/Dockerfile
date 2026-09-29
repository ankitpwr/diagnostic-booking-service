FROM oven/bun:1.3.12-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

FROM oven/bun:1.3.12-alpine AS production

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production --ignore-scripts

COPY --from=build /app/src ./src

EXPOSE 3000

CMD [ "bun", "run", "dev" ]

