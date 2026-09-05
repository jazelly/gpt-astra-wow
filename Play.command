#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js is required. Install Node.js 24 from https://nodejs.org and run this file again.'
  read '?Press Enter to close.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm install || exit 1
fi
npm run dev -- --open
