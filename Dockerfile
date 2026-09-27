FROM node:24-slim
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g @wasp.sh/wasp-cli
WORKDIR /app
COPY template/app ./template/app
WORKDIR /app/template/app
RUN wasp install && wasp build
RUN cd /app/template/app/.wasp/out/server && npm run bundle
RUN (cd /app/template/app/.wasp/out/web-app && npm run build) || true

EXPOSE 10000
ENV PORT=10000
ENV NODE_ENV=production
CMD ["sh", "-c", "cd /app/template/app/.wasp/out/server && (npm run start-production || (npx prisma db push --schema=../db/schema.prisma --accept-data-loss && npm run start-prod) || npm run start-prod || node bundle/server.js)"]
