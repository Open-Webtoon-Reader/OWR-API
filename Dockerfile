FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY prisma ./prisma/
RUN pnpm dlx prisma generate

COPY . .

ENV NODE_ENV=production

RUN pnpm run build

EXPOSE 4000

CMD pnpm dlx prisma migrate deploy && npx prisma db seed && pnpm run start:prod
