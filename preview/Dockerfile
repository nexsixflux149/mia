FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Explicit allowlist: no operational .env, save data or hosting configuration.
COPY server ./server
COPY public ./public
COPY preview/start.mjs ./preview/start.mjs
ENV PREVIEW_HOST=0.0.0.0 PREVIEW_PORT=3100
EXPOSE 3100
CMD ["node", "preview/start.mjs"]
