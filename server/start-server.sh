#!/bin/sh
# Starts Squishy Island's server on this computer (Mac or Linux) and shows the address to type on the phone.
# Needs Docker (Docker Desktop on a Mac). Stop it again with ./stop-server.sh
cd "$(dirname "$0")"
docker compose up -d --build || exit 1
echo
echo "Squishy Island's server is running."
echo "On the phone (test build): DEV -> More... -> Server... and type one of these addresses:"
if command -v ipconfig >/dev/null 2>&1 && ipconfig getifaddr en0 >/dev/null 2>&1; then
  ipconfig getifaddr en0; ipconfig getifaddr en1 2>/dev/null
else
  hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' | grep -v ':' | grep -v '^172\.1[78]\.'
fi
echo "Accounts and saves (web page): http://localhost:7351  (admin / squishy-local)"
