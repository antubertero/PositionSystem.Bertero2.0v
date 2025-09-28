FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* .npmrc* ./
RUN npm install --production=false
COPY src ./src
COPY test ./test
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
