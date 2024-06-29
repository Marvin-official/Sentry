ARG NODE_VERSION=22.3.0

# BUILDER

FROM node:$NODE_VERSION AS builder
WORKDIR /app
ADD . .

RUN yarn install
RUN yarn add sharp --ignore-engines
RUN yarn build


# RELEASE

FROM node:$NODE_VERSION AS release
WORKDIR /app

COPY --from=builder /app/build /app/build
COPY package.json yarn.lock ./

RUN yarn install --prod
RUN yarn add sharp --ignore-engines
CMD ["yarn", "start"]