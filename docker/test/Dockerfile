FROM node:11.12-alpine

LABEL author="Dave Mathews Njeru"
LABEL application="Identity Management"

# COPY is done from the buid context not the location of the dockerfile
RUN mkdir /iam

WORKDIR /iam

RUN apk update && apk upgrade && \
  npm install -g yarn@1.15.x && rm -rf package-lock.json

COPY package.json /iam
COPY yarn.lock /iam

RUN yarn install
