# Squishy Island's server: the official Nakama image plus our rules (build/index.js, compiled from src/ by
# `npm run build`, kept in the repository so a computer running the server needs nothing but Docker).
FROM heroiclabs/nakama:3.25.0
COPY build/index.js /nakama/data/modules/index.js
COPY nakama.yml /nakama/data/nakama.yml
