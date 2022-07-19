FROM node:9

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN npm install --unsafe-perm

WORKDIR /usr/src/app/subastas_server

CMD ["node", "server.js"]