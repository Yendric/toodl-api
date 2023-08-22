FROM node:18-alpine as production

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . . 

RUN yarn install --production=false
RUN yarn prisma generate 
RUN yarn build

CMD ["yarn", "serve"]

FROM node:18-alpine as development

ENV NODE_ENV=development

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . . 

RUN yarn install
RUN yarn prisma generate 

CMD [ "yarn", "dev" ]

EXPOSE 3001