FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Fix permissions
RUN chown node:node /usr/src/app

# Don't run as root
USER node

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Run app
ENTRYPOINT ["/bin/sh"]
CMD ["./app-start.sh"]