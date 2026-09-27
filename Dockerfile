FROM node:18 AS builder
RUN npm install -g @wasp.sh/wasp-cli
WORKDIR /app
COPY template/app ./template/app
WORKDIR /app/template/app
RUN wasp build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/template/app/.wasp/build /app
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
