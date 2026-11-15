FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
COPY release ./release
COPY preview/mobile/fonts ./preview/mobile/fonts
COPY preview/mobile/visual-upgrade.js preview/mobile/horror-detail.js preview/mobile/ghost-preview.js ./preview/mobile/
RUN node release/build-client.mjs
ENV REMASTER_HOST=0.0.0.0 REMASTER_PORT=3200
EXPOSE 3200
CMD ["node", "release/start.mjs"]
