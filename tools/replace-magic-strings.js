#!/usr/bin/env node
/**
 * Universal Enum Replacer - Simplified and More Aggressive
 * 
 * Replaces ALL instances of magic string values with enum references
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ENUM_DIR = path.join(__dirname, '../src/constants');
const SRC_DIR = path.join(__dirname, '../src');
const EXCLUDED_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/constants/**'];

function parseEnumFile(enumPath) {
    const content = fs.readFileSync(enumPath, 'utf8');
    const enumNameMatch = content.match(/export enum (\w+)/);
    if (!enumNameMatch) return null;
    
    const enumName = enumNameMatch[1];
    const enumPattern = /(\w+)\s*=\s*['"]([^'"]+)['"]/g;
    const mappings = [];
    let match;
    
    while ((match = enumPattern.exec(content)) !== null) {
        mappings.push({ key: match[1], value: match[2] });
    }
    
    return { enumName, mappings };
}

function replaceInFile(filePath, enumData) {
    const { enumName, mappings } = enumData;
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    
    mappings.forEach(({ key, value }) => {
        // Escape special regex characters in the value
        const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Replace ALL quotes around this exact value (simple and aggressive)
        const pattern = new RegExp(`(['"\`])${escapedValue}\\1`, 'g');
        const before = content;
        content = content.replace(pattern, `${enumName}.${key}`);
        
        if (content !== before) {
            const matches = (before.match(pattern) || []).length;
            changeCount += matches;
        }
    });
    
    if (changeCount > 0) {
        // Add import if not present
        const importRegex = new RegExp(`import.*${enumName}.*from`);
        if (!importRegex.test(content)) {
            const fileDir = path.dirname(filePath);
            const relPath = path.relative(fileDir, path.join(SRC_DIR, 'constants'));
            const importPath = (relPath.startsWith('.') ? relPath : `./${relPath}`).replace(/\\/g, '/');
            
            // Find last import
            const lines = content.split('\n');
            let lastImportIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
                if (lines[i].trim().startsWith('export ') && !lines[i].includes('import')) break;
            }
            
            const importLine = `import { ${enumName} } from '${importPath}';`;
            if (lastImportIdx >= 0) {
                lines.splice(lastImportIdx + 1, 0, importLine);
            } else {
                lines.unshift(importLine);
            }
            content = lines.join('\n');
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return changeCount;
}

function processEnum(enumFileName) {
    const enumPath = path.join(ENUM_DIR, enumFileName);
    if (!fs.existsSync(enumPath)) {
        console.error(`❌ Not found: ${enumPath}`);
        return;
    }
    
    console.log(`\n🔧 ${enumFileName}`);
    const enumData = parseEnumFile(enumPath);
    if (!enumData) return;
    
    console.log(`📋 ${enumData.mappings.length} values to replace`);
    
    const files = glob.sync(path.join(SRC_DIR, '**/*.{ts,tsx}').replace(/\\/g, '/'), {
        ignore: EXCLUDED_PATTERNS
    });
    
    let totalChanges = 0;
    let filesChanged = 0;
    
    files.forEach(file => {
        const changes = replaceInFile(file, enumData);
        if (changes > 0) {
            const rel = path.relative(SRC_DIR, file);
            console.log(`  ✅ ${rel}: ${changes} replacements`);
            totalChanges += changes;
            filesChanged++;
        }
    });
    
    console.log(`📊 ${filesChanged} files, ${totalChanges} total replacements`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--all')) {
    const enumFiles = fs.readdirSync(ENUM_DIR).filter(f => f.endsWith('IDs.ts'));
    console.log(`🚀 Processing ${enumFiles.length} enums\n`);
    enumFiles.forEach(processEnum);
    console.log('\n✨ Done!');
} else if (args.length > 0) {
    args.forEach(arg => processEnum(arg.endsWith('.ts') ? arg : `${arg}.ts`));
} else {
    console.log('Usage: node replace-magic-strings.js ItemIDs.ts');
    console.log('       node replace-magic-strings.js --all');
}
