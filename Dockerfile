FROM node:24-slim
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g @wasp.sh/wasp-cli
WORKDIR /app
COPY template/app ./template/app
WORKDIR /app/template/app
RUN wasp install && wasp build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["sh", "-c", "cd /app/template/app/.wasp/out && (npm run start-production || npm start || (cd server && npm start))"]
