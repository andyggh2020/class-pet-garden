# 构建前端
FROM node:20-alpine AS frontend-builder

# npm 源（默认国内镜像，海外服务器可 --build-arg NPM_REGISTRY=https://registry.npmjs.org 覆盖）
ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set registry "${NPM_REGISTRY}" \
  && npm install --no-audit --no-fund

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public

RUN npx vite build

# 生产运行镜像
FROM node:20-alpine AS production

ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server \
  && npm config set registry "${NPM_REGISTRY}" \
  && npm ci --omit=dev

COPY server ./server
COPY --from=frontend-builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/api/health || exit 1

CMD ["node", "server/index.js"]
