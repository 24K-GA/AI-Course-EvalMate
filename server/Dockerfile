FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY index.js ./

# 数据目录
RUN mkdir -p /app/data
VOLUME /app/data

ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["node", "index.js"]
