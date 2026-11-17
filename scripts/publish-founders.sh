#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$(node -p 'Number(process.versions.node.split(".")[0])')" -lt 24 ]; then
  if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm install 24
    nvm use 24
  else
    echo 'Node.js 24 est nécessaire. Installez-le puis relancez ce script.' >&2
    exit 1
  fi
fi
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix functions --ignore-scripts --no-audit --no-fund
npm test
npm run build:firebase
node scripts/verify-cloud-build.mjs
# La connexion est réalisée dans votre propre terminal. Aucun code n’est envoyé au chat.
npx -y firebase-tools@latest login --no-localhost
npx -y firebase-tools@latest deploy --project le-pacte-ludificateur --only functions:pacte,hosting
