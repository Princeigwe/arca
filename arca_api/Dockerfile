FROM node:25-alpine3.22 AS development

WORKDIR /code

COPY  package*.json ./

RUN npm install --legacy-peer-deps

COPY .  .

EXPOSE 3000

RUN npm run build


FROM node:25-alpine3.22 as production

WORKDIR /code

COPY --from=development /code ./

EXPOSE 3000

CMD ["node", "dist/main"]