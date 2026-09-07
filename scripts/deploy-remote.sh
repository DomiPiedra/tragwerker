#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use 20

cd /var/www/html/tragwerker

npm ci
npm run build
pm2 restart tragwerker --update-env
pm2 save
pm2 status tragwerker
