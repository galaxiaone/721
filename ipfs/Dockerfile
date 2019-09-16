FROM node:10

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json .

RUN yarn --quiet

# Bundle app source
COPY . .

CMD [ "yarn", "start" ]
