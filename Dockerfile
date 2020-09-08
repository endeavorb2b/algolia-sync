FROM node:10.15
ENV NODE_ENV production
ADD ./ /app
WORKDIR /app

RUN yarn --production
ENTRYPOINT [ "yarn", "watch" ]
