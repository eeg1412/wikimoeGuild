FROM node:20-alpine

# 安装系统依赖：bash、tzdata（时区数据供运行时使用，时区由 docker-compose 的 TZ 环境变量指定）
# UTF-8 编码防止日志乱码
RUN apk add --no-cache bash tzdata

# 设置 UTF-8 字符编码，解决日志中文乱码问题
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

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

EXPOSE 3120

CMD ["node", "app.js"]
