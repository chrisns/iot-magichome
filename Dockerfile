FROM node:16.2.0-alpine
WORKDIR /app
COPY package.json  package-lock.json ./
RUN npm install && npm audit fix
COPY index.js .
USER node
CMD npm start
