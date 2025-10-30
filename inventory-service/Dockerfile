
FROM node:18-alpine
WORKDIR /app
COPY package.json package.json
RUN npm install --production
COPY . .
CMD ["node", "dist/index.js"]
