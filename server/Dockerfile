# NyayVivek web (Express API + built client, single origin)
# Build context: repository root
FROM node:20-slim AS clientbuild
WORKDIR /build/client
COPY client/package*.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
# VITE_API_URL intentionally unset: client calls same-origin /api
RUN npm run build

FROM node:20-slim
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server/ ./
COPY --from=clientbuild /build/client/dist /app/client/dist
EXPOSE 5000
CMD ["node", "server.js"]
