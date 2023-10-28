#!/bin/bash

cd /home/ubuntu/doubtnut_backend/api_server/
cp  -f /home/ubuntu/doubtnut_backend/config/env.$DEPLOYMENT_GROUP_NAME .env
sudo chown -R ubuntu. logs/
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

npm install

NODE_PORT=3000 NODE_ENV=production pm2 start index.js -i max --max-memory-restart 2560M --log-date-format 'DD-MM HH:mm:ss.SSS'