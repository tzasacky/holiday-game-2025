#!/usr/bin/env node

/**
 * Batch Sprite Processor - Processes all generated sprites according to sprites.yaml
 * Usage: node tools/process_sprites.js
 */

const { processSingleFileComprehensive } = require('./comprehensive_sprite_processor.js');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.join(__dirname, '..');
const GENERATED_DIR = path.join(PROJECT_ROOT, 'generated');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'sprites.yaml');

async function main() {
    console.log('🎮 Holiday Game Sprite Processor');
    console.log('=================================');
    console.log(`Configuration: ${CONFIG_PATH}`);
    console.log(`Generated sprites: ${GENERATED_DIR}`);
    console.log('');

    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(`❌ Configuration file not found: ${CONFIG_PATH}`);
        process.exit(1);
    }

    let spriteConfig;
    try {
        const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
        spriteConfig = yaml.load(fileContents);
    } catch (e) {
        console.error(`❌ Failed to parse sprites.yaml: ${e.message}`);
        process.exit(1);
    }

    const results = [];

    for (const entry of spriteConfig) {
        const relativeInputPath = entry.file;
        const relativeOutputPath = entry.output;
        const spec = entry.spec;

        // FILTER: Skip tilesets (processed by process_tilesets.js)
        if (relativeInputPath.includes('tileset')) {
            continue;
        }

        const inputFile = path.join(GENERATED_DIR, relativeInputPath);
        const outputFile = path.join(PROJECT_ROOT, relativeOutputPath);
        
        console.log(`📋 Processing: ${relativeInputPath}`);
        console.log(`   Grid: ${spec.cols}x${spec.rows} (32x32 sprites)`);
        
        if (!fs.existsSync(inputFile)) {
            console.log(`   ⚠️  Input file not found: ${inputFile}`);
            results.push({ file: relativeInputPath, success: false, reason: 'File not found' });
            continue;
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`   📁 Created directory: ${outputDir}`);
        }

        try {
            // Different settings based on sprite type
            const isCharacterOrEnemy = relativeInputPath.includes('character') || relativeInputPath.includes('enemies');
            
            // Check for verbose flag
            const verbose = process.argv.includes('--verbose');
            
            const options = {
                tolerance: 100,
                minIslandSize: isCharacterOrEnemy ? 30 : 100, // Lower for chars/enemies to keep particles
                skipRegularization: false,
                verbose: verbose,
                expectedTotal: entry.expectedTotal
            };
            
            console.log(`   Mode: Character/Enemy (with regularization)`);

            await processSingleFileComprehensive(
                inputFile,
                outputFile,
                spec.cols,
                spec.rows,
                32, // 32x32 target sprite size
                options
            );

            console.log(`   ✅ Success`);
            results.push({ file: relativeInputPath, success: true });
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            results.push({ file: relativeInputPath, success: false, reason: error.message });
        }
        
        console.log('');
    }

    // Summary
    console.log('📊 Processing Summary');
    console.log('====================');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total: ${results.length}`);
    
    if (failed > 0) {
        console.log('\nFailed files:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  • ${r.file}: ${r.reason}`);
        });
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Check the processed sprites in public/assets/');
    console.log('2. Update sprite grid configurations in code if needed');
    console.log('3. Test the sprites in your game');
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { main };