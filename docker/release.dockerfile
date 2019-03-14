FROM node:11
LABEL author="Dave Mathews Njeru"

# COPY is done from the buid context not the location of the dockerfile
COPY . /identity-management

WORKDIR /identity-management

RUN yarn

EXPOSE 50051

ENTRYPOINT ["yarn", "start"]
