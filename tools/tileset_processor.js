const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// Import shared helpers from island detection processor
const { 
    detectBackgroundColors, 
    findSpriteIslands, 
    createRegularizedGrid,
    uniformDownscale
} = require('./island_regularize_processor.js');

// Tileset-specific grid creation with exact 32x32 tiles
function createTilesetGrid(image, islands, cols, rows, targetSpriteSize) {
    console.log('   Creating exact tileset grid...');
    
    // Create output image with exact dimensions
    const outputWidth = cols * targetSpriteSize;
    const outputHeight = rows * targetSpriteSize;
    const gridImage = new Jimp({ width: outputWidth, height: outputHeight, color: 0x00000000 });
    
    console.log(`   Grid output: ${outputWidth}x${outputHeight}`);
    
    // Sort islands for consistent placement (top-left to bottom-right)
    const sortedIslands = islands.slice().sort((a, b) => {
        const aY = a.minY;
        const bY = b.minY;
        
        if (Math.abs(aY - bY) < 50) { // Same row
            return a.minX - b.minX;
        }
        return aY - bY;
    });
    
    // Take only the tiles we need
    const targetTiles = Math.min(sortedIslands.length, cols * rows);
    
    for (let i = 0; i < targetTiles; i++) {
        const island = sortedIslands[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Extract tile from original image
        const tileW = island.maxX - island.minX + 1;
        const tileH = island.maxY - island.minY + 1;
        
        const tile = image.clone().crop({
            x: island.minX,
            y: island.minY,
            w: tileW,
            h: tileH
        });
        
        // Scale tile to exactly targetSpriteSize x targetSpriteSize
        const scaledTile = tile.resize({ w: targetSpriteSize, h: targetSpriteSize });
        
        // Calculate placement in grid (exact positioning)
        const gridX = col * targetSpriteSize;
        const gridY = row * targetSpriteSize;
        
        // Place tile
        gridImage.composite(scaledTile, gridX, gridY);
    }
    
    console.log(`   Placed ${targetTiles} tiles in exact ${cols}x${rows} grid`);
    
    return gridImage;
}

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/processed');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Enhanced background removal for tilesets
function smartBackgroundRemoval(image, bgColors, tolerance = 100) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    let removedPixels = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];
            const a = image.bitmap.data[idx + 3];
            
            if (a < 50) continue;
            
            // Check against all detected background colors
            let isBackground = false;
            for (const bgColor of bgColors) {
                const distance = Math.sqrt(
                    Math.pow(r - bgColor.r, 2) +
                    Math.pow(g - bgColor.g, 2) +
                    Math.pow(b - bgColor.b, 2)
                );
                
                if (distance <= tolerance) {
                    isBackground = true;
                    break;
                }
            }
            
            if (isBackground) {
                // Only remove if it's likely background (near edges or isolated)
                const isNearEdge = x < 20 || x >= width - 20 || y < 20 || y >= height - 20;
                
                // Check if pixel is isolated (few non-background neighbors)
                let nonBgNeighbors = 0;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = (ny * width + nx) * 4;
                            const nr = image.bitmap.data[nIdx + 0];
                            const ng = image.bitmap.data[nIdx + 1];
                            const nb = image.bitmap.data[nIdx + 2];
                            const na = image.bitmap.data[nIdx + 3];
                            
                            if (na > 50) {
                                let neighborIsBg = false;
                                for (const bgColor of bgColors) {
                                    const nDist = Math.sqrt(
                                        Math.pow(nr - bgColor.r, 2) +
                                        Math.pow(ng - bgColor.g, 2) +
                                        Math.pow(nb - bgColor.b, 2)
                                    );
                                    if (nDist <= tolerance) {
                                        neighborIsBg = true;
                                        break;
                                    }
                                }
                                
                                if (!neighborIsBg) {
                                    nonBgNeighbors++;
                                }
                            }
                        }
                    }
                }
                
                // Remove if near edge OR isolated (few non-background neighbors)
                if (isNearEdge || nonBgNeighbors < 3) {
                    image.bitmap.data[idx + 3] = 0;
                    removedPixels++;
                }
            }
        }
    }
}


// Validation functions for tilesets
function validateTilesetIslandCount(islands, expectedCount) {
    const found = islands.length;
    const valid = found === expectedCount;
    
    return {
        valid,
        found,
        expected: expectedCount,
        message: valid ? `Found exact count: ${found} tiles` : 
                `Wrong count: found ${found}, expected ${expectedCount}`
    };
}

function validateTilesetDimensions(finalImage, cols, rows, targetSpriteSize) {
    const expectedWidth = cols * targetSpriteSize;
    const expectedHeight = rows * targetSpriteSize;
    const actualWidth = finalImage.bitmap.width;
    const actualHeight = finalImage.bitmap.height;
    
    const valid = actualWidth === expectedWidth && actualHeight === expectedHeight;
    
    return {
        valid,
        expected: { width: expectedWidth, height: expectedHeight },
        actual: { width: actualWidth, height: actualHeight },
        message: valid ? `Correct dimensions: ${actualWidth}x${actualHeight}` :
                `Wrong dimensions: got ${actualWidth}x${actualHeight}, expected ${expectedWidth}x${expectedHeight}`
    };
}

function validateTilesetQuality(islands, cols, rows, options) {
    const expectedCount = cols * rows;
    const islandValidation = validateTilesetIslandCount(islands, expectedCount);
    
    // Check tile size consistency
    const widths = islands.map(i => i.maxX - i.minX + 1);
    const heights = islands.map(i => i.maxY - i.minY + 1);
    const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
    
    const maxWidthVariance = Math.max(...widths.map(w => Math.abs(w - avgWidth) / avgWidth));
    const maxHeightVariance = Math.max(...heights.map(h => Math.abs(h - avgHeight) / avgHeight));
    
    const sizeConsistent = maxWidthVariance < 0.5 && maxHeightVariance < 0.5; // 50% variance max
    
    // For decor files, size variation is expected (e.g. candle vs bookshelf)
    const isDecor = options.filename && options.filename.includes('decor');
    const strictSizeCheck = !isDecor;
    
    const overallSuccess = islandValidation.valid && (sizeConsistent || !strictSizeCheck);
    
    return {
        success: overallSuccess,
        islandValidation,
        sizeConsistency: {
            valid: sizeConsistent,
            maxWidthVariance: maxWidthVariance.toFixed(2),
            maxHeightVariance: maxHeightVariance.toFixed(2),
            avgSize: `${avgWidth.toFixed(1)}x${avgHeight.toFixed(1)}`,
            message: sizeConsistent ? 'Tiles are consistent size' : 
                    (isDecor ? `Tiles vary (expected for decor): width ${(maxWidthVariance*100).toFixed(1)}%` : 
                    `Tiles vary too much: width ${(maxWidthVariance*100).toFixed(1)}%, height ${(maxHeightVariance*100).toFixed(1)}%`)
        },
        overallMessage: overallSuccess ? 'High quality tileset processing' : 'Quality issues detected'
    };
}

// Enhanced Tileset Pipeline using island detection
async function processTileset(image, filename, cols, rows, options) {
    if (options.verbose) console.log('   Using Enhanced Tileset Pipeline...');
    
    const expectedCount = cols * rows;
    
    // 1. Detect Background Colors
    const bgColors = detectBackgroundColors(image);
    if (options.verbose) {
        console.log(`   Detected ${bgColors.length} background colors`);
    }
    
    // 2. Conservative Background Removal
    const tolerance = options.tolerance || 20;
    smartBackgroundRemoval(image, bgColors, tolerance);
    
    // 3. Detect tile islands
    const rawIslands = findSpriteIslands(image, 10); // Low threshold for tiles
    
    // Robust filtering: Sort by size and take top N
    const sortedIslands = rawIslands.sort((a, b) => b.pixels.length - a.pixels.length);
    let islands = sortedIslands;
    
    if (sortedIslands.length > expectedCount) {
        if (options.verbose) {
            console.log(`   Found ${sortedIslands.length} islands, filtering to top ${expectedCount}...`);
        }
        
        const anchors = sortedIslands.slice(0, expectedCount);
        const leftovers = sortedIslands.slice(expectedCount);
        
        // Merge leftovers into nearest anchor if close
        let mergedCount = 0;
        for (const scrap of leftovers) {
            let bestAnchor = null;
            let minDist = Infinity;
            
            const scrapCx = (scrap.minX + scrap.maxX) / 2;
            const scrapCy = (scrap.minY + scrap.maxY) / 2;
            
            for (const anchor of anchors) {
                const anchorCx = (anchor.minX + anchor.maxX) / 2;
                const anchorCy = (anchor.minY + anchor.maxY) / 2;
                const dist = Math.sqrt(Math.pow(scrapCx - anchorCx, 2) + Math.pow(scrapCy - anchorCy, 2));
                
                if (dist < minDist) {
                    minDist = dist;
                    bestAnchor = anchor;
                }
            }
            
            if (bestAnchor && minDist < 50) { // Merge if within 50px
                bestAnchor.pixels.push(...scrap.pixels);
                bestAnchor.minX = Math.min(bestAnchor.minX, scrap.minX);
                bestAnchor.maxX = Math.max(bestAnchor.maxX, scrap.maxX);
                bestAnchor.minY = Math.min(bestAnchor.minY, scrap.minY);
                bestAnchor.maxY = Math.max(bestAnchor.maxY, scrap.maxY);
                mergedCount++;
            }
        }
        
        if (options.verbose) {
            console.log(`   Merged ${mergedCount} fragments into anchors`);
        }
        islands = anchors;
    } else if (sortedIslands.length < expectedCount) {
        console.warn(`   ⚠️ Found fewer islands (${sortedIslands.length}) than expected (${expectedCount}). Using all.`);
    }
    
    if (options.verbose) {
        console.log(`   Final island count: ${islands.length}`);
    }
    
    // 4. Validate quality
    const qualityValidation = validateTilesetQuality(islands, cols, rows, { ...options, filename });
    if (options.verbose) {
        console.log(`   Quality: ${qualityValidation.overallMessage}`);
        console.log(`   Islands: ${qualityValidation.islandValidation.message}`);
        console.log(`   Size consistency: ${qualityValidation.sizeConsistency.message}`);
    }
    
    if (!qualityValidation.success) {
        throw new Error(`Tileset processing failed validation: ${qualityValidation.overallMessage}`);
    }
    
    // 5. Create regularized grid
    let processedImage = image;
    if (islands.length > 0) {
        // Calculate appropriate cell size for tiles
        const widths = islands.map(i => i.maxX - i.minX + 1);
        const heights = islands.map(i => i.maxY - i.minY + 1);
        const maxWidth = Math.max(...widths);
        const maxHeight = Math.max(...heights);
        const cellSize = Math.max(maxWidth, maxHeight) + 4; // Small padding
        
        if (options.verbose) {
            console.log(`   Using cell size: ${cellSize}px`);
        }
        
        // Check if this is a tileset (contains "tiles" in filename)
        const isTileset = filename.toLowerCase().includes('tiles');
        
        if (isTileset) {
            // For tilesets, create exact grid with scaled tiles
            processedImage = createTilesetGrid(image, islands, cols, rows, 32);
        } else {
            // For other sprites, use regular grid with cell size
            processedImage = createRegularizedGrid(image, islands, cols, rows, cellSize);
        }
    }
    
    return { processedImage, islands, qualityValidation };
}

// Enhanced single file processing function for Tilesets
async function processSingleTileset(inputPath, outputPath, cols, rows, targetSpriteSize = 32, options = {}) {
    const filename = path.basename(inputPath);
    
    if (!options.verbose) {
        console.log(`Processing Tileset ${filename}...`);
    } else {
        console.log(`\n=== Processing Tileset: ${filename} ===`);
        console.log(`Target: ${cols}x${rows} grid, ${targetSpriteSize}x${targetSpriteSize} sprites`);
    }
    
    try {
        const image = await Jimp.read(inputPath);
        if (options.verbose) {
            console.log(`Original: ${image.bitmap.width}x${image.bitmap.height}`);
        }
        
        const result = await processTileset(image, filename, cols, rows, options);
        const { processedImage, islands, qualityValidation } = result;
        
        // Phase 4: Downscale (different approach for tilesets vs other sprites)
        const isTileset = filename.toLowerCase().includes('tiles');
        let finalSheet;
        
        if (isTileset) {
            // For tilesets, we already created exact dimensions - no scaling needed
            finalSheet = processedImage;
            console.log(`Tileset ready: ${finalSheet.bitmap.width}x${finalSheet.bitmap.height} (exact dimensions)`);
        } else {
            // For other sprites, use uniform downscale
            finalSheet = uniformDownscale(processedImage, cols, rows, targetSpriteSize);
        }
        
        // Final dimension validation
        const dimensionValidation = validateTilesetDimensions(finalSheet, cols, rows, targetSpriteSize);
        if (options.verbose) {
            console.log(`   Final dimensions: ${dimensionValidation.message}`);
        }
        
        if (!dimensionValidation.valid) {
            throw new Error(`Final image dimensions are wrong: ${dimensionValidation.message}`);
        }
        
        // Save outputs
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Always save final result
        await finalSheet.write(outputPath);
        console.log(`✅ ${filename} -> ${path.basename(outputPath)} (${finalSheet.bitmap.width}x${finalSheet.bitmap.height})`);
        
        // Save debug files only if verbose
        if (options.verbose) {
            const debugDir = path.join(path.dirname(__dirname), 'debug_sprites');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            
            const baseName = path.basename(filename, '.png');
            const metadataPath = path.join(debugDir, `${baseName}_tileset_metadata.json`);
            const verboseMetadata = {
                input: { width: image.bitmap.width, height: image.bitmap.height },
                final: { width: finalSheet.bitmap.width, height: finalSheet.bitmap.height },
                processing: {
                    pipeline: 'Enhanced Tileset with Island Detection',
                    tolerance: options.tolerance,
                    islandsFound: islands?.length || 0,
                    qualityValidation: qualityValidation,
                    dimensionValidation: dimensionValidation
                },
                grid: { cols, rows }
            };
            fs.writeFileSync(metadataPath, JSON.stringify(verboseMetadata, null, 2));
            
            // Save processed image (before downscale) for debug
            const processedPath = path.join(debugDir, `${baseName}_tileset_processed.png`);
            await processedImage.write(processedPath);
            
            console.log(`   Debug files saved to ${debugDir}/`);
        }
        
        return { finalSheet, islands, qualityValidation, dimensionValidation };
        
    } catch (err) {
        console.error(`Error processing ${filename}: ${err.message}`);
        throw err;
    }
}

// CLI interface for testing
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.log('Usage: node tileset_processor.js <input_path> <output_path> <cols> <rows> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --size=N             Target sprite size (default: 32)');
        console.log('  --tolerance=N        Background removal tolerance (default: 20)');
        console.log('  --verbose            Show detailed processing info');
        console.log('');
        console.log('Example:');
        console.log('  node tileset_processor.js public/assets/tilesets/snowy_village_tiles.png /tmp/test.png 8 3 --verbose');
        process.exit(1);
    }
    
    const inputPath = args[0];
    const outputPath = args[1];
    const cols = parseInt(args[2]);
    const rows = parseInt(args[3]);
    
    const options = {
        tolerance: parseInt(args.find(arg => arg.startsWith('--tolerance='))?.split('=')[1]) || 20,
        verbose: args.includes('--verbose')
    };
    
    const targetSize = parseInt(args.find(arg => arg.startsWith('--size='))?.split('=')[1]) || 32;
    
    (async () => {
        try {
            console.log(`🎯 Testing Enhanced Tileset Processor`);
            console.log(`Input: ${inputPath}`);
            console.log(`Output: ${outputPath}`);
            console.log(`Target: ${cols}x${rows} grid of ${targetSize}x${targetSize} tiles`);
            console.log('');
            
            await processSingleTileset(inputPath, outputPath, cols, rows, targetSize, options);
            console.log('');
            console.log('✅ Tileset processing completed successfully!');
        } catch (error) {
            console.error('');
            console.error('❌ Tileset processing failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = {
    processSingleTileset,
    processTileset,
    smartBackgroundRemoval,
    validateTilesetIslandCount,
    validateTilesetDimensions,
    validateTilesetQuality
};
