FROM node:21-alpine

WORKDIR /app

ADD package*.json /app/
RUN npm i

ADD main.js /app
ADD bot /app

CMD ["npm", "run start"]
