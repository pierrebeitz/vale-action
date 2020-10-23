# `jdkato/vale` installs Vale to `/bin/vale`.
FROM jdkato/vale

RUN apk add --no-cache --update nodejs nodejs-npm git

COPY lib /lib
COPY package.json /package.json

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
