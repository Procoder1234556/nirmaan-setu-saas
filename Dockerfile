FROM node:24 AS builder
RUN npm install -g @wasp.sh/wasp-cli
WORKDIR /app
COPY template/app ./template/app
WORKDIR /app/template/app
RUN wasp install && wasp build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/template/app/.wasp/build /app
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
