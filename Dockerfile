FROM node:16-alpine3.14 AS development

WORKDIR /usr/src/app

COPY ../package.json ./

# RUN npm install -g npm@8.6.0

# RUN npm install glob rimraf --legacy-peer-deps

# RUN npm install --only=development --legacy-peer-deps

COPY . .

# RUN npm run build

FROM node:16-alpine3.14 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]