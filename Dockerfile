FROM node:alpine
LABEL org.opencontainers.image.source https://github.com/chrisns/iot-magichome
WORKDIR /app
COPY package.json  package-lock.json ./
RUN npm install && npm audit fix
COPY index.js .
USER node
CMD npm start
