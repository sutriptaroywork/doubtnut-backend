FROM 942682721582.dkr.ecr.ap-south-1.amazonaws.com/base:v12.13.0

WORKDIR /opt/app


RUN  npm i -g node-pre-gyp pm2
COPY package.json /opt/app
RUN npm i

ARG DD_VERSION
ENV DD_VERSION=$DD_VERSION
ENV PORT=3000
ENV STARTCMD="pm2 start index.js --max-memory-restart 1560M --log-date-format 'DD-MM HH:mm:ss.SSS' --no-daemon"

COPY . /opt/app

EXPOSE 3000

CMD ["supervisord"]
