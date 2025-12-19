const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/processed');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Detect Background Colors
function detectBackgroundColors(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const colorCounts = new Map();
    
    // Sample from edges heavily
    const samples = [];
    for (let i = 0; i < 200; i++) {
        samples.push([Math.floor(Math.random() * width), 0]); // Top edge
        samples.push([Math.floor(Math.random() * width), height - 1]); // Bottom edge
        samples.push([0, Math.floor(Math.random() * height)]); // Left edge
        samples.push([width - 1, Math.floor(Math.random() * height)]); // Right edge
    }
    
    for (const [x, y] of samples) {
        const idx = (y * width + x) * 4;
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const a = image.bitmap.data[idx + 3];
        
        if (a > 200) {
            const colorKey = `${r},${g},${b}`;
            colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }
    }
    
    // Find top 2 dominant colors
    const sortedColors = [...colorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { r, g, b };
        });
    
    if (sortedColors.length === 0) {
        sortedColors.push({ r: 128, g: 128, b: 128 });
    }
    
    // FORCE GREEN SCREEN DETECTION
    // Always add pure green and variations as candidates
    sortedColors.push({ r: 0, g: 255, b: 0 });
    sortedColors.push({ r: 35, g: 255, b: 35 }); // Slightly lighter green noise
    sortedColors.push({ r: 0, g: 177, b: 64 });  // Common generator variation
    
    return sortedColors;
}

function removeWatermark(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Remove watermark (bottom-right corner) - Increased size for safety
    const watermarkSize = Math.min(width * 0.15, height * 0.15, 150);
    const startX = Math.floor(width - watermarkSize);
    const startY = Math.floor(height - watermarkSize);
    
    for (let y = startY; y < height; y++) {
        for (let x = startX; x < width; x++) {
            const idx = (y * width + x) * 4;
            image.bitmap.data[idx + 3] = 0;
        }
    }
}

function aggressiveBackgroundRemoval(image, bgColors, tolerance = 100) {
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
                image.bitmap.data[idx + 3] = 0;
                removedPixels++;
            }
        }
    }
    
    // console.log(`Aggressive removal: ${removedPixels} pixels removed`);
}

// Morphological Closing (Dilate -> Erode) to fill holes in the mask
function morphologicalClose(image, radius = 1) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const temp = image.clone();
    
    // Dilate (expand white regions)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let maxAlpha = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const idx = (ny * width + nx) * 4;
                        const alpha = temp.bitmap.data[idx + 3];
                        if (alpha > maxAlpha) maxAlpha = alpha;
                    }
                }
            }
            const idx = (y * width + x) * 4;
            image.bitmap.data[idx + 3] = maxAlpha;
        }
    }
    
    const dilated = image.clone();
    
    // Erode (shrink white regions)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minAlpha = 255;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const idx = (ny * width + nx) * 4;
                        const alpha = dilated.bitmap.data[idx + 3];
                        if (alpha < minAlpha) minAlpha = alpha;
                    }
                }
            }
            const idx = (y * width + x) * 4;
            image.bitmap.data[idx + 3] = minAlpha;
        }
    }
}

// Phase 2: Island Detection - Find sprite islands
function findSpriteIslands(image, minSize = 50) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const visited = new Array(width * height).fill(false);
    const islands = [];
    
    function floodFill(startX, startY) {
        const stack = [[startX, startY]];
        const island = {
            pixels: [],
            minX: startX, maxX: startX,
            minY: startY, maxY: startY
        };
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const pixelIndex = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[pixelIndex]) {
                continue;
            }
            
            const idx = pixelIndex * 4;
            const alpha = image.bitmap.data[idx + 3];
            
            if (alpha <= 50) continue; // Skip transparent
            
            visited[pixelIndex] = true;
            island.pixels.push([x, y]);
            
            island.minX = Math.min(island.minX, x);
            island.maxX = Math.max(island.maxX, x);
            island.minY = Math.min(island.minY, y);
            island.maxY = Math.max(island.maxY, y);
            
            // 8-connected flood fill
            for (const [dx, dy] of [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]) {
                stack.push([x + dx, y + dy]);
            }
        }
        
        return island;
    }
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = y * width + x;
            if (!visited[pixelIndex]) {
                const idx = pixelIndex * 4;
                const alpha = image.bitmap.data[idx + 3];
                
                if (alpha > 50) {
                    const island = floodFill(x, y);
                    if (island.pixels.length >= minSize) {
                        islands.push(island);
                    }
                }
            }
        }
    }
    
    return islands;
}

// Smart island grouping - group small islands near larger ones (particles, effects)
function groupNearbyIslands(islands, maxDistance = 100) {
    const groups = [];
    const processed = new Set();
    
    // Sort islands by size (largest first)
    const sortedIslands = islands.slice().sort((a, b) => b.pixels.length - a.pixels.length);
    
    for (const island of sortedIslands) {
        if (processed.has(island)) continue;
        
        const group = [island];
        processed.add(island);
        
        const centerX = (island.minX + island.maxX) / 2;
        const centerY = (island.minY + island.maxY) / 2;
        
        // Find nearby smaller islands
        for (const otherIsland of islands) {
            if (processed.has(otherIsland) || otherIsland.pixels.length >= island.pixels.length) continue;
            
            const otherCenterX = (otherIsland.minX + otherIsland.maxX) / 2;
            const otherCenterY = (otherIsland.minY + otherIsland.maxY) / 2;
            
            const distance = Math.sqrt(
                Math.pow(centerX - otherCenterX, 2) + 
                Math.pow(centerY - otherCenterY, 2)
            );
            
            if (distance <= maxDistance) {
                group.push(otherIsland);
                processed.add(otherIsland);
            }
        }
        
        groups.push(group);
    }
    
    return groups;
}

// Phase 3: Grid Regularization - Arrange islands into perfect grid
function regularizeIntoGrid(islands, cols, rows) {
    if (islands.length === 0) return [];
    
    // Sort islands by Y first, then X (reading order)
    const sortedIslands = islands.slice().sort((a, b) => {
        const aY = (a.minY + a.maxY) / 2;
        const bY = (b.minY + b.maxY) / 2;
        
        // Use larger row tolerance based on image dimensions
        const avgIslandHeight = islands.reduce((sum, island) => sum + (island.maxY - island.minY), 0) / islands.length;
        const rowTolerance = avgIslandHeight * 1.5;
        
        if (Math.abs(aY - bY) > rowTolerance) {
            return aY - bY;
        } else {
            const aX = (a.minX + a.maxX) / 2;
            const bX = (b.minX + b.maxX) / 2;
            return aX - bX;
        }
    });
    
    // Group into rows more intelligently
    const gridRows = [];
    if (sortedIslands.length === 0) return gridRows;
    
    let currentRow = [sortedIslands[0]];
    let currentRowY = (sortedIslands[0].minY + sortedIslands[0].maxY) / 2;
    
    for (let i = 1; i < sortedIslands.length; i++) {
        const island = sortedIslands[i];
        const islandY = (island.minY + island.maxY) / 2;
        
        // Calculate dynamic row threshold
        const avgRowHeight = currentRow.reduce((sum, isle) => sum + (isle.maxY - isle.minY), 0) / currentRow.length;
        const rowThreshold = avgRowHeight * 0.8;
        
        if (Math.abs(islandY - currentRowY) > rowThreshold && currentRow.length >= cols * 0.7) {
            // Start new row if we have enough sprites and significant Y difference
            currentRow.sort((a, b) => (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2);
            gridRows.push(currentRow);
            currentRow = [island];
            currentRowY = islandY;
        } else {
            currentRow.push(island);
        }
    }
    
    if (currentRow.length > 0) {
        currentRow.sort((a, b) => (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2);
        gridRows.push(currentRow);
    }
    
    // Take only the first 'rows' rows and limit each row to 'cols' sprites
    const trimmedRows = gridRows.slice(0, rows).map(row => row.slice(0, cols));
    
    console.log(`Organized into ${trimmedRows.length} rows:`);
    trimmedRows.forEach((row, i) => console.log(`  Row ${i}: ${row.length} sprites`));
    
    return trimmedRows;
}

function createRegularizedGrid(image, islands, cols, rows, targetCellSize) {
    // Create new image with perfect grid spacing
    const gridWidth = cols * targetCellSize;
    const gridHeight = rows * targetCellSize;
    const regularized = new Jimp({ width: gridWidth, height: gridHeight, color: 0x00000000 });
    
    // Sort islands by their ORIGINAL position (top-left to bottom-right reading order)
    const sortedIslands = islands.slice().sort((a, b) => {
        const aY = a.minY;
        const bY = b.minY;
        
        // If they're in roughly the same row (within 100px), sort by X
        if (Math.abs(aY - bY) < 100) {
            return a.minX - b.minX;
        }
        return aY - bY;
    });
    
    // Place sprites in grid order (left-to-right, top-to-bottom)
    let spriteIndex = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (spriteIndex >= sortedIslands.length) break;
            
            const island = sortedIslands[spriteIndex];
            
            // Extract island
            const islandW = island.maxX - island.minX + 1;
            const islandH = island.maxY - island.minY + 1;
            
            const extracted = image.clone().crop({
                x: island.minX,
                y: island.minY,
                w: islandW,
                h: islandH
            });
            
            // Place in perfect grid position
            const gridX = col * targetCellSize;
            const gridY = row * targetCellSize;
            
            // Center within cell
            const offsetX = Math.floor((targetCellSize - islandW) / 2);
            const offsetY = Math.floor((targetCellSize - islandH) / 2);
            
            regularized.composite(extracted, gridX + offsetX, gridY + offsetY);
            spriteIndex++;
        }
    }
    
    console.log(`Regularized: ${gridWidth}x${gridHeight} grid with ${spriteIndex} sprites placed`);
    return regularized;
}

// Phase 4: Uniform Downscale
function uniformDownscale(image, cols, rows, targetSpriteSize) {
    // Calculate what the final dimensions should be
    const targetWidth = cols * targetSpriteSize;
    const targetHeight = rows * targetSpriteSize;
    
    const scaleX = targetWidth / image.bitmap.width;
    const scaleY = targetHeight / image.bitmap.height;
    
    // Use uniform scaling (take the smaller scale to ensure everything fits)
    const scale = Math.min(scaleX, scaleY);
    
    const finalWidth = Math.floor(image.bitmap.width * scale);
    const finalHeight = Math.floor(image.bitmap.height * scale);
    
    const downscaled = image.resize({ w: finalWidth, h: finalHeight });
    console.log(`Downscaled: ${image.bitmap.width}x${image.bitmap.height} -> ${finalWidth}x${finalHeight} (${scale.toFixed(3)}x)`);
    
    return downscaled;
}

// Pipeline for Sprites (Mask & Extract)
async function processSprite(image, filename, cols, rows, options) {
    if (options.verbose) console.log('   Using Sprite Pipeline (Mask & Extract)...');
    
    const original = image.clone();
    const mask = image.clone();
    
    // 1. Mask Generation
    // Remove Watermark first
    removeWatermark(mask);
    
    // Aggressive Background Removal on Mask
    const bgColors = detectBackgroundColors(mask);
    if (options.verbose) {
        console.log(`   Detected Background Colors:`);
        bgColors.forEach((c, i) => console.log(`     ${i+1}: R=${c.r}, G=${c.g}, B=${c.b}`));
    }
    const aggressiveTolerance = 100; // Restored to 100
    aggressiveBackgroundRemoval(mask, bgColors, aggressiveTolerance);
    
    // Morphological Close to fill holes
    morphologicalClose(mask, 3); // Increased to 3 to aggressively fill holes
    
    // 2. Detection (on Mask)
    const expectedTotal = options.expectedTotal;
    let islands = [];
    
    if (expectedTotal) {
        if (options.verbose) console.log(`   Targeting ${expectedTotal} sprites (Anchor Method)...`);
        
        // 1. Find ALL islands > minimal noise threshold
        const rawIslands = findSpriteIslands(mask, 10);
        
        // 2. Sort by size (descending)
        rawIslands.sort((a, b) => b.pixels.length - a.pixels.length);
        
        if (rawIslands.length < expectedTotal) {
            console.warn(`   ⚠️ Found fewer islands (${rawIslands.length}) than expected (${expectedTotal}). Using all.`);
            islands = rawIslands;
        } else {
            // 3. Take top N as "Anchors"
            const anchors = rawIslands.slice(0, expectedTotal);
            const leftovers = rawIslands.slice(expectedTotal);
            
            // 4. Merge leftovers into nearest Anchor if close enough
            const mergeDistance = 100; // px
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
                
                if (bestAnchor && minDist <= mergeDistance) {
                    // Merge scrap into anchor
                    bestAnchor.pixels.push(...scrap.pixels);
                    bestAnchor.minX = Math.min(bestAnchor.minX, scrap.minX);
                    bestAnchor.maxX = Math.max(bestAnchor.maxX, scrap.maxX);
                    bestAnchor.minY = Math.min(bestAnchor.minY, scrap.minY);
                    bestAnchor.maxY = Math.max(bestAnchor.maxY, scrap.maxY);
                    mergedCount++;
                }
            }
            
            if (options.verbose) console.log(`   Merged ${mergedCount} small islands into ${anchors.length} anchors.`);
            islands = anchors;
        }
        
        // Debug output
        if (options.verbose) {
             const projectRoot = path.resolve(__dirname, '..');
             const debugDir = path.join(projectRoot, 'debug_sprites');
             if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
             
             const status = islands.length === expectedTotal ? 'success' : 'failed';
             const debugPath = path.join(debugDir, `${path.basename(filename, '.png')}_${status}_${islands.length}found.png`);
             
             // Calculate median size for debug grid to avoid explosion
             const widths = islands.map(i => i.maxX - i.minX + 1).sort((a, b) => a - b);
             const heights = islands.map(i => i.maxY - i.minY + 1).sort((a, b) => a - b);
             const medianW = widths[Math.floor(widths.length / 2)] || 32;
             const medianH = heights[Math.floor(heights.length / 2)] || 32;
             const cellSize = Math.max(medianW, medianH) * 1.5; // 1.5x median size
             
             const debugImage = createRegularizedGrid(mask, islands, cols, rows, cellSize);
             await debugImage.write(debugPath);
             
             if (islands.length !== expectedTotal) {
                 // Save mask on failure
                 const maskPath = path.join(debugDir, `${path.basename(filename, '.png')}_mask_failed.png`);
                 await mask.write(maskPath);
                 throw new Error(`Could not find exactly ${expectedTotal} sprites. Best found: ${islands.length}. Debug saved to ${debugPath}`);
             } else {
                 console.log(`   ℹ️  Debug image saved to ${debugPath}`);
             }
        }

    } else {
        // Fallback
        const rawIslands = findSpriteIslands(mask, 10);
        islands = groupNearbyIslands(rawIslands, 100);
    }
    
    // 3. Extraction (Apply Mask to Original)
    const cleanedOriginal = original.clone();
    const width = original.bitmap.width;
    const height = original.bitmap.height;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const maskAlpha = mask.bitmap.data[idx + 3];
            if (maskAlpha < 50) {
                cleanedOriginal.bitmap.data[idx + 3] = 0;
            }
        }
    }
    
    // Phase 3: Grid Regularization
    // Use Median Size + Padding to prevent explosion
    const widths = islands.map(i => i.maxX - i.minX + 1).sort((a, b) => a - b);
    const heights = islands.map(i => i.maxY - i.minY + 1).sort((a, b) => a - b);
    const medianW = widths[Math.floor(widths.length / 2)] || 32;
    const medianH = heights[Math.floor(heights.length / 2)] || 32;
    
    // Clamp max cell size to avoid massive images
    // Assuming target sprite size is around 32-64 after downscale, and we downscale by ~8-10x usually?
    // Let's just trust the median * 1.2, but maybe warn if it's huge.
    let cellSize = Math.max(medianW, medianH) + 10;
    
    if (options.verbose) console.log(`   Cell Size: ${cellSize}px (Median: ${medianW}x${medianH})`);
    
    const processedImage = createRegularizedGrid(cleanedOriginal, islands, cols, rows, cellSize);
    
    return { processedImage, islands, mask };
}

// Single file processing function
async function processSingleFile(inputPath, outputPath, cols, rows, targetSpriteSize = 32, options = {}) {
    const filename = path.basename(inputPath);
    
    if (!options.verbose) {
        console.log(`Processing ${filename}...`);
    } else {
        console.log(`\n=== Processing: ${filename} ===`);
        console.log(`Target: ${cols}x${rows} grid, ${targetSpriteSize}x${targetSpriteSize} sprites`);
    }
    
    try {
        const image = await Jimp.read(inputPath);
        if (options.verbose) {
            console.log(`Original: ${image.bitmap.width}x${image.bitmap.height}`);
        }
        
        let result;
        // Sprite Pipeline
        result = await processSprite(image, filename, cols, rows, options);
        
        const { processedImage, islands, mask } = result;
        
        // Phase 4: Uniform Downscale
        const finalSheet = uniformDownscale(processedImage, cols, rows, targetSpriteSize);
        
        // Save outputs
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Always save final result (matching input filename)
        await finalSheet.write(outputPath);
        console.log(`✅ ${filename} -> ${path.basename(outputPath)} (${finalSheet.bitmap.width}x${finalSheet.bitmap.height})`);
        
        // Save intermediate files only if verbose
        if (options.verbose) {
            const projectRoot = path.resolve(__dirname, '..');
            const debugDir = path.join(projectRoot, 'debug_sprites');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            
            const baseName = path.basename(filename, '.png');
            
            // Save metadata
            const metadataPath = path.join(debugDir, `${baseName}_metadata.json`);
            const verboseMetadata = {
                input: { width: image.bitmap.width, height: image.bitmap.height },
                final: { width: finalSheet.bitmap.width, height: finalSheet.bitmap.height },
                processing: {
                    islandsFound: islands.length,
                    spritesPlaced: Math.min(islands.length, cols * rows),
                    targetSpriteSize,
                    pipeline: 'Sprite (Mask & Extract)'
                },
                grid: { cols, rows }
            };
            fs.writeFileSync(metadataPath, JSON.stringify(verboseMetadata, null, 2));
            
            // Save mask (denoised)
            if (mask) {
                const maskPath = path.join(debugDir, `${baseName}_mask.png`);
                await mask.write(maskPath);
                console.log(`   ℹ️  Debug mask saved to ${maskPath}`);
            }
        }
        
        return { finalSheet, islands };
        
    } catch (err) {
        console.error(`Error processing ${filename}: ${err.message}`);
        throw err;
    }
}

// Legacy wrapper for single file processing
async function processWithIslandRegularization(filename, cols, rows, targetSpriteSize = 32, options = {}) {
    const inputPath = path.join(ASSETS_DIR, filename);
    const outputPath = path.join(OUTPUT_DIR, filename.replace('.png', '_final.png'));
    return processSingleFile(inputPath, outputPath, cols, rows, targetSpriteSize, { ...options, verbose: true });
}

// Batch processing function
async function processBatch(inputDir, outputDir, cols, rows, targetSpriteSize = 32, options = {}) {
    console.log(`\n=== Batch Processing ===`);
    console.log(`Input: ${inputDir} -> Output: ${outputDir}`);
    console.log(`Grid: ${cols}x${rows}, Target: ${targetSpriteSize}x${targetSpriteSize}`);
    
    if (!fs.existsSync(inputDir)) {
        throw new Error(`Input directory does not exist: ${inputDir}`);
    }
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const files = fs.readdirSync(inputDir).filter(file => file.toLowerCase().endsWith('.png'));
    console.log(`Found ${files.length} PNG files to process`);
    
    const results = [];
    
    for (const filename of files) {
        console.log(`\n--- Processing ${filename} ---`);
        try {
            const result = await processSingleFile(
                path.join(inputDir, filename),
                path.join(outputDir, filename),
                cols, rows, targetSpriteSize, options
            );
            results.push({ filename, success: true, ...result });
        } catch (error) {
            console.error(`Failed to process ${filename}: ${error.message}`);
            results.push({ filename, success: false, error: error.message });
        }
    }
    
    console.log(`\n=== Batch Complete ===`);
    console.log(`Processed: ${results.filter(r => r.success).length}/${files.length} files`);
    return results;
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log('Usage:');
        console.log('  Single file: node island_regularize_processor.js <filename> <cols> <rows> [options]');
        console.log('  Batch:       node island_regularize_processor.js --batch <input_dir> <output_dir> <cols> <rows> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --tolerance=N         Background removal tolerance (default: 50)');
        console.log('  --size=N             Target sprite size (default: 32)');
        console.log('  --min-island=N       Minimum island size in pixels (default: 100)');
        console.log('  --skip-regularization Skip grid regularization, just denoise and downscale');
        console.log('  --verbose            Save intermediate files and metadata');
        console.log('');
        console.log('Examples:');
        console.log('  node island_regularize_processor.js characters/hero.png 16 5 --skip-regularization');
        console.log('  node island_regularize_processor.js --batch ./input ./output 16 5 --verbose');
        process.exit(1);
    }
    
    const isBatch = args[0] === '--batch';
    const options = {
        tolerance: parseInt(args.find(arg => arg.startsWith('--tolerance='))?.split('=')[1]) || 50,
        minIslandSize: parseInt(args.find(arg => arg.startsWith('--min-island='))?.split('=')[1]) || 100,
        skipRegularization: args.includes('--skip-regularization'),
        verbose: args.includes('--verbose')
    };
    
    const targetSize = parseInt(args.find(arg => arg.startsWith('--size='))?.split('=')[1]) || 32;
    
    (async () => {
        try {
            if (isBatch) {
                if (args.length < 5) {
                    console.error('Batch mode requires: --batch <input_dir> <output_dir> <cols> <rows>');
                    process.exit(1);
                }
                
                const inputDir = args[1];
                const outputDir = args[2];
                const cols = parseInt(args[3]);
                const rows = parseInt(args[4]);
                
                await processBatch(inputDir, outputDir, cols, rows, targetSize, options);
            } else {
                const filename = args[0];
                const cols = parseInt(args[1]);
                const rows = parseInt(args[2]);
                
                await processWithIslandRegularization(filename, cols, rows, targetSize, options);
            }
            
            console.log('\n✅ Processing completed!');
        } catch (error) {
            console.error('\n❌ Processing failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = {
    processWithIslandRegularization,
    processBatch,
    processSingleFile,
    processSprite,
    detectBackgroundColors,
    aggressiveBackgroundRemoval,
    findSpriteIslands,
    groupNearbyIslands,
    regularizeIntoGrid,
    createRegularizedGrid,
    uniformDownscale
};