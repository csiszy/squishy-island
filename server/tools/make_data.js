// Copies the numbers the server needs from the game's data files (made from the design book by
// tools/export_data) into src/data.generated.ts, so the server and the game always use the same rules.
const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, '..', '..', 'game', 'data');
const read = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const economy = read('economy.json');
const squishies = read('squishies.json').squishies.map(s => ({ id: s.id, family: s.family, rarity: s.rarity }));
const out = `// Made by tools/make_data.js from game/data (do not edit by hand).\n` +
  `var ECONOMY: Economy = ${JSON.stringify(economy)};\n` +
  `var SQUISHIES: SquishyInfo[] = ${JSON.stringify(squishies)};\n`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data.generated.ts'), out);
console.log(`server data: ${squishies.length} squishies, ${Object.keys(economy.boxes).length} box kinds`);
