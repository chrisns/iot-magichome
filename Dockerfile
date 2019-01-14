FROM node:alpine
WORKDIR /app
COPY package.json  package-lock.json ./
RUN npm i --silent && npm audit fix
COPY index.js .

CMD npm start
