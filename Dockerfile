# 后端构建阶段
FROM node:20-alpine AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# 前端构建阶段
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 设置 API URL 为相对路径
ENV VITE_API_URL=/api
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制后端
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY server/package.json server/index.js ./server/

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./public

# 安装 serve 用于静态文件服务
RUN npm install -g serve

# 创建启动脚本
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/server && node index.js &' >> /start.sh && \
    echo 'serve -s /app/public -l 80' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80 3001

CMD ["/bin/sh", "/start.sh"]
