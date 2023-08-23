FROM node:18-alpine as base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --immutable --immutable-cache --check-cache

COPY prisma ./
RUN yarn prisma generate 

COPY . . 

FROM base as production

ENV NODE_ENV=production

RUN yarn build

CMD ["yarn", "serve"]

FROM base as development

ENV NODE_ENV=development

CMD [ "yarn", "dev" ]

EXPOSE 3001