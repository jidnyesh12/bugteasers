FROM node:24-trixie-slim AS build
RUN npm install --global corepack@latest && corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@bugteasers/worker..." \
    && pnpm --filter @bugteasers/worker deploy --legacy --prod /out

FROM node:24-trixie-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
CMD ["node", "worker.js"]
