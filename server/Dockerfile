FROM node:20-alpine

RUN apk add --no-cache openssl
RUN npm install -g pnpm

WORKDIR /app

COPY package.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
