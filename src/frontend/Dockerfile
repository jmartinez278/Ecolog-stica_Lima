FROM node:22-alpine
WORKDIR /app
RUN chown node:node /app
USER node
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY src/ ./src/
COPY index.html tsconfig.json vite.config.ts ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
