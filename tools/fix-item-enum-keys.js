#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read ItemIDs enum
const itemIdsPath = path.join(__dirname, '../src/constants/ItemIDs.ts');
const itemsPath = path.join(__dirname, '../src/data/items.ts');

const itemIdsContent = fs.readFileSync(itemIdsPath, 'utf8');
let itemsContent = fs.readFileSync(itemsPath, 'utf8');

// Extract enum mappings: EnumKey = 'string_value'
const enumPattern = /(\w+)\s*=\s*['"]([^'"]+)['"]/g;
const mappings = [];
let match;

while ((match = enumPattern.exec(itemIdsContent)) !== null) {
    mappings.push({
        enumKey: match[1],
        stringValue: match[2]
    });
}

console.log(`Found ${mappings.length} ItemID mappings`);

// Replace in items.ts
mappings.forEach(({ enumKey, stringValue }) => {
    // Replace object key: 'string_value': { => [ItemID.EnumKey]: {
    const keyPattern = new RegExp(`'${stringValue}':\\s*\\{`, 'g');
    itemsContent = itemsContent.replace(keyPattern, `[ItemID.${enumKey}]: {`);
    
    // Replace id property: id: 'string_value' => id: ItemID.EnumKey
    const idPattern = new RegExp(`id:\\s*'${stringValue}'`, 'g');
    itemsContent = itemsContent.replace(idPattern, `id: ItemID.${enumKey}`);
});

// Write updated file
fs.writeFileSync(itemsPath, itemsContent, 'utf8');

console.log(`✅ Successfully updated ${itemsPath}`);
console.log(`Replaced all string literals with ItemID enum references`);
