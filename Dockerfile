FROM node:18 AS builder
RUN curl -sSL https://get.wasp.sh/installer.sh | sh
ENV PATH="/root/.local/bin:${PATH}"
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
