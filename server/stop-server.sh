#!/bin/sh
# Stops Squishy Island's server (its saved data stays for next time).
cd "$(dirname "$0")"
docker compose down
