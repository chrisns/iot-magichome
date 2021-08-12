FROM node:16.6.2-alpine
WORKDIR /app
COPY package.json  package-lock.json ./
RUN npm install && npm audit fix
COPY index.js .
USER node
CMD npm start
