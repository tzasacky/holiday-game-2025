const fs = require('fs');

const enumContent = fs.readFileSync('src/constants/ItemIDs.ts', 'utf8');
const itemsContent = fs.readFileSync('src/data/items.ts', 'utf8');

// Get all enum keys
const enumKeys = Array.from(enumContent.matchAll(/(\w+)\s*=/g)).map(m => m[1]);

// Get all defined keys  
const definedKeys = Array.from(itemsContent.matchAll(/\[ItemID\.(\w+)\]/g)).map(m => m[1]);

// Find missing
const missing = enumKeys.filter(k => !definedKeys.includes(k));

console.log('Missing items:', missing.length);
console.log(missing.join('\n'));
