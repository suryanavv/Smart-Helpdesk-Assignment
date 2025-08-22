FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# Use npm install to tolerate workspace lockfile differences during CI/build
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/server.js"]


