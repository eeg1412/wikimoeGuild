FROM node:22-alpine

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 复制 shared 模块
COPY shared/ ./shared/

# 复制 server 模块
COPY server/ ./server/

# 安装依赖（仅安装 server 和 shared）
RUN pnpm install --filter server --filter shared --frozen-lockfile --prod

# 持久化目录（由 docker-compose volumes 挂载）
# server/keys  - JWT 密钥
# server/logs  - 日志文件
# server/public - 上传文件
# server/lock  - 锁文件

WORKDIR /app/server

EXPOSE 3000

CMD ["node", "app.js"]
