FROM node:latest

# set working directory
RUN mkdir /app
WORKDIR /app

# add `/usr/src/node_modules/.bin` to $PATH
ENV PATH /node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /package.json
RUN npm install --quiet --only=production

# start app
CMD ["npm", "start"]