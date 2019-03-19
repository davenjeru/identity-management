FROM node:11
LABEL author="Dave Mathews Njeru"
LABEL application="Identity Management"

# COPY is done from the buid context not the location of the dockerfile
WORKDIR /iam

COPY package.json /iam
COPY yarn.lock /iam

RUN yarn install --production

COPY dist /iam/dist

EXPOSE 50051

ENTRYPOINT ["yarn", "start"]
