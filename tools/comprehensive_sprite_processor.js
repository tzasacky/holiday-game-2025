const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// Reuse existing utilities
const { 
    detectBackgroundColors, 
    aggressiveBackgroundRemoval,
    findSpriteIslands, 
    groupNearbyIslands
} = require('./island_regularize_processor.js');

// ============================================================================
// COMPREHENSIVE QUALITY VALIDATION - Deep heuristics for real success
// ============================================================================

function validateSpriteDensity(sprite, image) {
    const spriteWidth = sprite.maxX - sprite.minX + 1;
    const spriteHeight = sprite.maxY - sprite.minY + 1;
    const totalPixels = spriteWidth * spriteHeight;
    const nonTransparentPixels = sprite.pixels.length;
    const density = nonTransparentPixels / totalPixels;
    
    return {
        valid: density >= 0.20 && density <= 0.80,
        density,
        message: density < 0.20 ? 'Too sparse (background noise)' : 
                density > 0.80 ? 'Too dense (includes background)' : 'Good density'
    };
}

function validateSpriteVariance(sprites) {
    if (sprites.length === 0) return { valid: false, variance: Infinity, message: 'No sprites' };
    
    const areas = sprites.map(s => (s.maxX - s.minX + 1) * (s.maxY - s.minY + 1));
    const median = [...areas].sort((a,b) => a-b)[Math.floor(areas.length/2)];
    
    const variances = areas.map(a => Math.abs(a - median) / median);
    const maxVariance = Math.max(...variances);
    const avgVariance = variances.reduce((a,b) => a+b, 0) / variances.length;
    
    return {
        valid: maxVariance < 3.0 && avgVariance < 1.0,
        maxVariance,
        avgVariance,
        median,
        message: maxVariance >= 3.0 ? `Max variance too high (${maxVariance.toFixed(2)})` :
                avgVariance >= 1.0 ? `Avg variance too high (${avgVariance.toFixed(2)})` : 'Good size consistency'
    };
}

function validateSpatialDistribution(sprites, imageWidth, imageHeight) {
    if (sprites.length === 0) return { valid: false, message: 'No sprites' };
    
    const quadrants = [0,0,0,0]; // TL, TR, BL, BR
    
    sprites.forEach(s => {
        const centerX = (s.minX + s.maxX) / 2;
        const centerY = (s.minY + s.maxY) / 2;
        
        const quad = (centerX > imageWidth/2 ? 1 : 0) + (centerY > imageHeight/2 ? 2 : 0);
        quadrants[quad]++;
    });
    
    const emptyQuadrants = quadrants.filter(count => count === 0).length;
    const maxQuadrant = Math.max(...quadrants);
    const totalSprites = sprites.length;
    
    // Each quadrant should have some sprites, no single quadrant should dominate
    const wellDistributed = emptyQuadrants <= 1 && maxQuadrant < totalSprites * 0.8;
    
    return {
        valid: wellDistributed,
        quadrants,
        emptyQuadrants,
        maxConcentration: maxQuadrant / totalSprites,
        message: emptyQuadrants > 1 ? `${emptyQuadrants} empty quadrants (clustered)` :
                maxQuadrant >= totalSprites * 0.8 ? `${Math.round(maxQuadrant/totalSprites*100)}% in one quadrant` : 'Well distributed'
    };
}

function validateBackgroundRemovalCompleteness(originalImage, cleanedImage) {
    const width = originalImage.bitmap.width;
    const height = originalImage.bitmap.height;
    
    let originalPixels = 0;
    let removedPixels = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const originalAlpha = originalImage.bitmap.data[idx + 3];
            const cleanedAlpha = cleanedImage.bitmap.data[idx + 3];
            
            if (originalAlpha > 50) {
                originalPixels++;
                if (cleanedAlpha <= 50) {
                    removedPixels++;
                }
            }
        }
    }
    
    const removalRate = removedPixels / originalPixels;
    
    return {
        valid: removalRate >= 0.60 && removalRate <= 0.90,
        removalRate,
        originalPixels,
        removedPixels,
        message: removalRate < 0.60 ? `Only ${(removalRate*100).toFixed(1)}% removed (not enough)` :
                removalRate > 0.90 ? `${(removalRate*100).toFixed(1)}% removed (ate sprites)` : 
                `${(removalRate*100).toFixed(1)}% removed (good)`
    };
}

function validateIslandDistribution(islands) {
    if (islands.length === 0) return { valid: false, message: 'No islands' };
    
    const sizes = islands.map(i => i.pixels.length).sort((a,b) => b-a);
    const largest = sizes[0];
    const total = sizes.reduce((a,b) => a+b, 0);
    const largestRatio = largest / total;
    
    // No single giant dominating everything
    const balanced = largestRatio < 0.5;
    
    return {
        valid: balanced,
        largestRatio,
        sizes: sizes.slice(0, 5), // Top 5 sizes for debug
        message: largestRatio >= 0.5 ? `One island dominates ${(largestRatio*100).toFixed(1)}%` : 'Balanced distribution'
    };
}

function smartMergeToTarget(islands, targetCount, maxMergeDistance = 200) {
    console.log(`   Smart merging ${islands.length} islands to ${targetCount}...`);
    
    if (islands.length <= targetCount) {
        return { islands, mergedCount: 0, forcedMerges: 0 };
    }
    
    // Sort by size (largest first)  
    const sortedIslands = islands.slice().sort((a, b) => b.pixels.length - a.pixels.length);
    
    // Take top N as anchors
    const anchors = sortedIslands.slice(0, targetCount);
    const leftovers = sortedIslands.slice(targetCount);
    
    let mergedCount = 0;
    let forcedMerges = 0;
    
    for (const scrap of leftovers) {
        let bestAnchor = null;
        let minDist = Infinity;
        
        const scrapCx = (scrap.minX + scrap.maxX) / 2;
        const scrapCy = (scrap.minY + scrap.maxY) / 2;
        const scrapArea = scrap.pixels.length;
        
        for (const anchor of anchors) {
            const anchorCx = (anchor.minX + anchor.maxX) / 2;
            const anchorCy = (anchor.minY + anchor.maxY) / 2;
            const anchorArea = anchor.pixels.length;
            const dist = Math.sqrt(Math.pow(scrapCx - anchorCx, 2) + Math.pow(scrapCy - anchorCy, 2));
            
            // Prefer merging similar sizes that are close
            const sizeSimilarity = Math.min(scrapArea, anchorArea) / Math.max(scrapArea, anchorArea);
            const score = dist / (sizeSimilarity * sizeSimilarity); // Lower is better
            
            if (score < minDist && dist <= maxMergeDistance && sizeSimilarity > 0.1) {
                minDist = score;
                bestAnchor = anchor;
            }
        }
        
        if (bestAnchor) {
            const actualDist = Math.sqrt(Math.pow(scrapCx - (bestAnchor.minX + bestAnchor.maxX)/2, 2) + 
                                       Math.pow(scrapCy - (bestAnchor.minY + bestAnchor.maxY)/2, 2));
            
            // Merge scrap into anchor
            bestAnchor.pixels.push(...scrap.pixels);
            bestAnchor.minX = Math.min(bestAnchor.minX, scrap.minX);
            bestAnchor.maxX = Math.max(bestAnchor.maxX, scrap.maxX);
            bestAnchor.minY = Math.min(bestAnchor.minY, scrap.minY);
            bestAnchor.maxY = Math.max(bestAnchor.maxY, scrap.maxY);
            
            mergedCount++;
            
            if (actualDist > maxMergeDistance * 0.8) {
                forcedMerges++; // Track questionable merges
            }
        }
    }
    
    console.log(`   Merged ${mergedCount} fragments, ${forcedMerges} forced merges`);
    
    return { islands: anchors, mergedCount, forcedMerges };
}

function validateComprehensiveQuality(result, originalImage, cleanedImage, imageWidth, imageHeight) {
    console.log('   🔍 Running comprehensive quality validation...');
    
    const sprites = result.islands;
    const validations = {
        spriteDensity: [],
        spriteVariance: validateSpriteVariance(sprites),
        spatialDistribution: validateSpatialDistribution(sprites, imageWidth, imageHeight),
        backgroundRemoval: validateBackgroundRemovalCompleteness(originalImage, cleanedImage),
        islandDistribution: validateIslandDistribution(sprites)
    };
    
    // Validate each sprite's density
    let goodDensityCount = 0;
    for (const sprite of sprites) {
        const densityCheck = validateSpriteDensity(sprite, originalImage);
        validations.spriteDensity.push(densityCheck);
        if (densityCheck.valid) goodDensityCount++;
    }
    
    const densityRatio = goodDensityCount / sprites.length;
    
    // Overall success requires most validations to pass
    const overallSuccess = 
        densityRatio >= 0.8 && // 80% of sprites have good density
        validations.spriteVariance.valid &&
        validations.spatialDistribution.valid &&
        validations.backgroundRemoval.valid &&
        validations.islandDistribution.valid &&
        result.forcedMerges < sprites.length * 0.2; // <20% forced merges
    
    console.log(`     Density: ${goodDensityCount}/${sprites.length} sprites (${(densityRatio*100).toFixed(1)}%)`);
    console.log(`     Variance: ${validations.spriteVariance.message}`);
    console.log(`     Distribution: ${validations.spatialDistribution.message}`);
    console.log(`     Background: ${validations.backgroundRemoval.message}`);
    console.log(`     Islands: ${validations.islandDistribution.message}`);
    console.log(`     Forced merges: ${result.forcedMerges}/${sprites.length} (${(result.forcedMerges/sprites.length*100).toFixed(1)}%)`);
    
    return {
        success: overallSuccess,
        validations,
        densityRatio,
        overallMessage: overallSuccess ? 'High quality segmentation' : 'Quality issues detected'
    };
}

function validateGridRegularization(gridImage, cols, rows, targetSpriteSize) {
    const expectedWidth = cols * targetSpriteSize;
    const expectedHeight = rows * targetSpriteSize;
    const actualWidth = gridImage.bitmap.width;
    const actualHeight = gridImage.bitmap.height;
    
    const dimensionsCorrect = actualWidth === expectedWidth && actualHeight === expectedHeight;
    
    return {
        success: dimensionsCorrect,
        expected: { width: expectedWidth, height: expectedHeight },
        actual: { width: actualWidth, height: actualHeight },
        message: dimensionsCorrect 
            ? 'Grid dimensions correct' 
            : `Grid dimensions wrong: expected ${expectedWidth}x${expectedHeight}, got ${actualWidth}x${actualHeight}`
    };
}

function validateSpriteScaling(islands, targetSpriteSize) {
    const maxWidth = Math.max(...islands.map(i => i.maxX - i.minX + 1));
    const maxHeight = Math.max(...islands.map(i => i.maxY - i.minY + 1));
    
    const spritesWillFit = maxWidth <= targetSpriteSize && maxHeight <= targetSpriteSize;
    
    return {
        success: spritesWillFit,
        maxWidth,
        maxHeight,
        targetSize: targetSpriteSize,
        message: spritesWillFit 
            ? 'All sprites will fit in target cells'
            : `Sprites too large: max ${maxWidth}x${maxHeight}, target ${targetSpriteSize}x${targetSpriteSize}`
    };
}

// ============================================================================
// STRATEGY IMPLEMENTATIONS
// ============================================================================

// Strategy 1: Edge Detection + Flood Fill
async function strategyEdgeDetectionFloodFill(image, options) {
    console.log('   Trying Strategy 1: Edge Detection + Flood Fill...');
    
    // Remove watermark
    removeWatermark(image);
    
    for (const closeRadius of [5, 8, 12, 15]) {
        console.log(`     Testing close radius: ${closeRadius}`);
        
        try {
            // Edge detection
            const borderMask = detectSpriteBorders(image);
            
            // Close gaps
            const closedBorders = closeBorderGaps(borderMask, closeRadius);
            
            // Create background removal mask
            const backgroundMask = createBackgroundMask(image, closedBorders);
            
            // Apply mask
            const cleaned = applyBackgroundRemovalMask(image, backgroundMask);
            
            // Find islands
            const rawIslands = findSpriteIslands(cleaned, 10);
            
            // Smart merge to target
            const mergeResult = smartMergeToTarget(rawIslands, options.expectedTotal);
            
            // Comprehensive quality validation
            const qualityValidation = validateComprehensiveQuality(
                mergeResult, image, cleaned, image.bitmap.width, image.bitmap.height
            );
            
            console.log(`     Result: ${qualityValidation.overallMessage}`);
            
            if (qualityValidation.success) {
                return { 
                    success: true, 
                    processedImage: cleaned, 
                    islands: mergeResult.islands,
                    forcedMerges: mergeResult.forcedMerges,
                    strategy: `Edge Detection (radius ${closeRadius})`,
                    qualityValidation
                };
            }
            
        } catch (error) {
            console.log(`     Failed with radius ${closeRadius}: ${error.message}`);
        }
    }
    
    return { success: false, strategy: 'Edge Detection + Flood Fill' };
}

// Strategy 2: Color-based Background Removal
async function strategyColorBasedRemoval(image, options) {
    console.log('   Trying Strategy 2: Color-based Background Removal...');
    
    // Remove watermark
    removeWatermark(image);
    
    // Detect background colors
    const bgColors = detectBackgroundColors(image);
    console.log(`   Detected background colors: ${bgColors.length}`);
    
    for (const tolerance of [30, 60, 90, 120]) {
        console.log(`     Testing tolerance: ${tolerance}`);
        
        try {
            const cleaned = image.clone();
            aggressiveBackgroundRemoval(cleaned, bgColors, tolerance);
            
            // Find islands
            const rawIslands = findSpriteIslands(cleaned, 10);
            
            // Smart merge to target
            const mergeResult = smartMergeToTarget(rawIslands, options.expectedTotal);
            
            // Comprehensive quality validation
            const qualityValidation = validateComprehensiveQuality(
                mergeResult, image, cleaned, image.bitmap.width, image.bitmap.height
            );
            
            console.log(`     Result: ${qualityValidation.overallMessage}`);
            
            if (qualityValidation.success) {
                return { 
                    success: true, 
                    processedImage: cleaned, 
                    islands: mergeResult.islands,
                    forcedMerges: mergeResult.forcedMerges,
                    strategy: `Color-based (tolerance ${tolerance})`,
                    qualityValidation
                };
            }
            
        } catch (error) {
            console.log(`     Failed with tolerance ${tolerance}: ${error.message}`);
        }
    }
    
    return { success: false, strategy: 'Color-based Background Removal' };
}

// Strategy 3: Hybrid Approach
async function strategyHybridApproach(image, options) {
    console.log('   Trying Strategy 3: Hybrid Approach...');
    
    // Remove watermark
    removeWatermark(image);
    
    // Test combinations of background removal + edge detection
    const bgTolerances = [20, 40, 60];
    const closeRadii = [8, 12, 16];
    
    for (const bgTol of bgTolerances) {
        for (const closeRadius of closeRadii) {
            console.log(`     Testing bg_tolerance: ${bgTol}, close_radius: ${closeRadius}`);
            
            try {
                // Step 1: Light background removal
                const bgColors = detectBackgroundColors(image);
                const preprocessed = image.clone();
                aggressiveBackgroundRemoval(preprocessed, bgColors, bgTol);
                
                // Step 2: Edge detection on preprocessed
                const borderMask = detectSpriteBorders(preprocessed);
                
                // Step 3: Close gaps
                const closedBorders = closeBorderGaps(borderMask, closeRadius);
                
                // Step 4: Background removal mask
                const backgroundMask = createBackgroundMask(image, closedBorders);
                
                // Step 5: Apply to original
                const cleaned = applyBackgroundRemovalMask(image, backgroundMask);
                
                // Find islands
                const rawIslands = findSpriteIslands(cleaned, 10);
                
                // Smart merge to target
                const mergeResult = smartMergeToTarget(rawIslands, options.expectedTotal);
                
                // Comprehensive quality validation
                const qualityValidation = validateComprehensiveQuality(
                    mergeResult, image, cleaned, image.bitmap.width, image.bitmap.height
                );
                
                console.log(`     Result: ${qualityValidation.overallMessage}`);
                
                if (qualityValidation.success) {
                    return { 
                        success: true, 
                        processedImage: cleaned, 
                        islands: mergeResult.islands,
                        forcedMerges: mergeResult.forcedMerges,
                        strategy: `Hybrid (bg_tol ${bgTol}, close ${closeRadius})`,
                        qualityValidation
                    };
                }
                
            } catch (error) {
                console.log(`     Failed with bg_tolerance ${bgTol}, close_radius ${closeRadius}: ${error.message}`);
            }
        }
    }
    
    return { success: false, strategy: 'Hybrid Approach' };
}

// ============================================================================
// PERFECT GRID REGULARIZATION
// ============================================================================

function calculateOptimalScale(islands, cols, rows, targetSpriteSize) {
    console.log('   Calculating optimal scale factor...');
    
    // Find maximum sprite dimensions
    const widths = islands.map(i => i.maxX - i.minX + 1);
    const heights = islands.map(i => i.maxY - i.minY + 1);
    
    const maxSpriteWidth = Math.max(...widths);
    const maxSpriteHeight = Math.max(...heights);
    
    console.log(`   Max sprite size: ${maxSpriteWidth}x${maxSpriteHeight}`);
    
    // Calculate scale to fit largest sprite in targetSpriteSize
    const scaleX = targetSpriteSize / maxSpriteWidth;
    const scaleY = targetSpriteSize / maxSpriteHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95; // 5% margin for safety
    
    console.log(`   Calculated scale factor: ${scale.toFixed(3)}`);
    
    return scale;
}

function createPerfectGrid(image, islands, cols, rows, targetSpriteSize) {
    console.log('   Creating perfect grid...');
    
    // Calculate optimal scale
    const scale = calculateOptimalScale(islands, cols, rows, targetSpriteSize);
    
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
    
    // Take only the sprites we need
    const targetSprites = Math.min(sortedIslands.length, cols * rows);
    
    for (let i = 0; i < targetSprites; i++) {
        const island = sortedIslands[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Extract sprite from original image
        const spriteW = island.maxX - island.minX + 1;
        const spriteH = island.maxY - island.minY + 1;
        
        const sprite = image.clone().crop({
            x: island.minX,
            y: island.minY,
            w: spriteW,
            h: spriteH
        });
        
        // Scale sprite
        const scaledW = Math.round(spriteW * scale);
        const scaledH = Math.round(spriteH * scale);
        const scaledSprite = sprite.resize({ w: scaledW, h: scaledH });
        
        // Validate sprite fits
        if (scaledW > targetSpriteSize || scaledH > targetSpriteSize) {
            throw new Error(`Scaled sprite ${scaledW}x${scaledH} exceeds cell size ${targetSpriteSize}x${targetSpriteSize}`);
        }
        
        // Calculate placement in grid (center within cell)
        const gridX = col * targetSpriteSize + Math.floor((targetSpriteSize - scaledW) / 2);
        const gridY = row * targetSpriteSize + Math.floor((targetSpriteSize - scaledH) / 2);
        
        // Place sprite
        gridImage.composite(scaledSprite, gridX, gridY);
    }
    
    console.log(`   Placed ${targetSprites} sprites in ${cols}x${rows} grid`);
    
    // Validate final grid
    const gridValidation = validateGridRegularization(gridImage, cols, rows, targetSpriteSize);
    if (!gridValidation.success) {
        throw new Error(`Grid validation failed: ${gridValidation.message}`);
    }
    
    return { gridImage, scale, spritesPlaced: targetSprites };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function removeWatermark(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
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

function detectSpriteBorders(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const borderMask = new Jimp({ width, height, color: 0x00000000 });
    
    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            if (image.bitmap.data[idx + 3] < 50) continue; // Skip transparent
            
            // Get 3x3 neighborhood
            const pixels = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nIdx = ((y + dy) * width + (x + dx)) * 4;
                    const r = image.bitmap.data[nIdx];
                    const g = image.bitmap.data[nIdx + 1];
                    const b = image.bitmap.data[nIdx + 2];
                    const a = image.bitmap.data[nIdx + 3];
                    const gray = a < 50 ? 0 : (r + g + b) / 3;
                    pixels.push(gray);
                }
            }
            
            // Sobel kernels
            const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
            
            let gx = 0, gy = 0;
            for (let i = 0; i < 9; i++) {
                gx += pixels[i] * sobelX[i];
                gy += pixels[i] * sobelY[i];
            }
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            
            if (magnitude > 50) {
                borderMask.bitmap.data[idx] = 255;
                borderMask.bitmap.data[idx + 1] = 255;
                borderMask.bitmap.data[idx + 2] = 255;
                borderMask.bitmap.data[idx + 3] = 255;
            }
        }
    }
    
    return borderMask;
}

function closeBorderGaps(borderMask, radius = 3) {
    const width = borderMask.bitmap.width;
    const height = borderMask.bitmap.height;
    
    // Dilate then erode
    const dilated = borderMask.clone();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            let hasBorderNear = false;
            for (let dy = -radius; dy <= radius && !hasBorderNear; dy++) {
                for (let dx = -radius; dx <= radius && !hasBorderNear; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = (ny * width + nx) * 4;
                        if (borderMask.bitmap.data[nIdx + 3] > 50) {
                            hasBorderNear = true;
                        }
                    }
                }
            }
            
            if (hasBorderNear) {
                dilated.bitmap.data[idx] = 255;
                dilated.bitmap.data[idx + 1] = 255;
                dilated.bitmap.data[idx + 2] = 255;
                dilated.bitmap.data[idx + 3] = 255;
            } else {
                dilated.bitmap.data[idx + 3] = 0;
            }
        }
    }
    
    // Erode
    const closed = dilated.clone();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            let allBorderNear = true;
            for (let dy = -radius; dy <= radius && allBorderNear; dy++) {
                for (let dx = -radius; dx <= radius && allBorderNear; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = (ny * width + nx) * 4;
                        if (dilated.bitmap.data[nIdx + 3] < 50) {
                            allBorderNear = false;
                        }
                    } else {
                        allBorderNear = false;
                    }
                }
            }
            
            if (!allBorderNear) {
                closed.bitmap.data[idx + 3] = 0;
            }
        }
    }
    
    return closed;
}

function createBackgroundMask(image, borderMask) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const backgroundMask = new Jimp({ width, height, color: 0x00000000 });
    
    const visited = new Array(width * height).fill(false);
    
    function floodFillBackground(startX, startY) {
        const stack = [[startX, startY]];
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const pixelIndex = y * width + x;
            if (visited[pixelIndex]) continue;
            
            const idx = pixelIndex * 4;
            
            // Stop at borders
            if (borderMask.bitmap.data[idx + 3] > 50) continue;
            
            // Stop at transparent
            if (image.bitmap.data[idx + 3] < 50) continue;
            
            visited[pixelIndex] = true;
            
            // Mark for removal
            backgroundMask.bitmap.data[idx] = 255;
            backgroundMask.bitmap.data[idx + 1] = 255;
            backgroundMask.bitmap.data[idx + 2] = 255;
            backgroundMask.bitmap.data[idx + 3] = 255;
            
            // Continue flood fill
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
    
    // Start from edges
    for (let x = 0; x < width; x++) {
        floodFillBackground(x, 0);
        floodFillBackground(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        floodFillBackground(0, y);
        floodFillBackground(width - 1, y);
    }
    
    return backgroundMask;
}

function applyBackgroundRemovalMask(image, backgroundMask) {
    const cleaned = image.clone();
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const shouldRemove = backgroundMask.bitmap.data[idx + 3] > 50;
            
            if (shouldRemove) {
                cleaned.bitmap.data[idx + 3] = 0; // Only remove background
            }
            // Preserve all sprite pixels exactly
        }
    }
    
    return cleaned;
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

async function processWithComprehensiveStrategy(image, filename, cols, rows, options) {
    console.log('🎯 Starting Comprehensive Sprite Processing...');
    
    const strategies = [
        strategyEdgeDetectionFloodFill,
        strategyColorBasedRemoval,
        strategyHybridApproach
    ];
    
    // Try strategies in order
    for (const strategy of strategies) {
        try {
            const result = await strategy(image.clone(), options);
            
            if (result.success) {
                console.log(`✅ ${result.strategy} succeeded with high quality segmentation`);
                console.log(`   Final sprites: ${result.islands.length}, Forced merges: ${result.forcedMerges || 0}`);
                
                // Create perfect grid
                const gridResult = createPerfectGrid(result.processedImage, result.islands, cols, rows, 32);
                console.log(`   Grid created: ${gridResult.spritesPlaced} sprites placed`);
                
                return {
                    success: true,
                    finalImage: gridResult.gridImage,
                    processedImage: result.processedImage,
                    islands: result.islands,
                    strategy: result.strategy,
                    scale: gridResult.scale,
                    spritesPlaced: gridResult.spritesPlaced,
                    qualityValidation: result.qualityValidation
                };
            } else {
                console.log(`❌ ${result.strategy} failed`);
            }
        } catch (error) {
            console.log(`💥 Strategy failed with error: ${error.message}`);
        }
    }
    
    throw new Error('All strategies failed - could not process sprite');
}

// Removed mergeToTargetCount - now using smartMergeToTarget with comprehensive validation

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function processSingleFileComprehensive(inputPath, outputPath, cols, rows, targetSpriteSize = 32, options = {}) {
    const filename = path.basename(inputPath);
    
    console.log(`\n🚀 === Comprehensive Processing: ${filename} ===`);
    console.log(`📐 Target: ${cols}x${rows} grid, ${targetSpriteSize}x${targetSpriteSize} sprites`);
    console.log(`🎯 Expected sprites: ${options.expectedTotal}`);
    
    try {
        const image = await Jimp.read(inputPath);
        console.log(`📊 Original: ${image.bitmap.width}x${image.bitmap.height}`);
        
        const result = await processWithComprehensiveStrategy(image, filename, cols, rows, options);
        
        // Save final result
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        await result.finalImage.write(outputPath);
        
        console.log(`\n✅ SUCCESS!`);
        console.log(`   Strategy: ${result.strategy}`);
        console.log(`   Sprites placed: ${result.spritesPlaced}/${options.expectedTotal}`);
        console.log(`   Scale factor: ${result.scale.toFixed(3)}`);
        console.log(`   Output: ${result.finalImage.bitmap.width}x${result.finalImage.bitmap.height}`);
        console.log(`   File: ${path.basename(outputPath)}`);
        
        // Save debug files if verbose
        if (options.verbose) {
            const projectRoot = path.resolve(__dirname, '..');
            const debugDir = path.join(projectRoot, 'debug_sprites');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            
            const baseName = path.basename(filename, '.png');
            await result.processedImage.write(path.join(debugDir, `${baseName}_processed.png`));
            
            const metadata = {
                strategy: result.strategy,
                islands: result.islands.length,
                expectedTotal: options.expectedTotal,
                spritesPlaced: result.spritesPlaced,
                scale: result.scale,
                outputDimensions: {
                    width: result.finalImage.bitmap.width,
                    height: result.finalImage.bitmap.height
                }
            };
            fs.writeFileSync(path.join(debugDir, `${baseName}_metadata.json`), JSON.stringify(metadata, null, 2));
            
            console.log(`   Debug files saved to ${debugDir}/`);
        }
        
        return result;
        
    } catch (error) {
        console.error(`\n💥 FAILED: ${error.message}`);
        throw error;
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log('Usage: node comprehensive_sprite_processor.js <input_path> <cols> <rows> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --expected-total=N   Expected number of sprites (required)');
        console.log('  --size=N            Target sprite size (default: 32)');
        console.log('  --verbose           Save debug files and metadata');
        console.log('');
        console.log('Example:');
        console.log('  node comprehensive_sprite_processor.js generated/characters/hero.png 8 5 --expected-total=36 --verbose');
        process.exit(1);
    }
    
    const inputPath = args[0];
    const cols = parseInt(args[1]);
    const rows = parseInt(args[2]);
    
    const options = {
        expectedTotal: parseInt(args.find(arg => arg.startsWith('--expected-total='))?.split('=')[1]),
        verbose: args.includes('--verbose')
    };
    
    if (!options.expectedTotal) {
        console.error('--expected-total is required');
        process.exit(1);
    }
    
    const targetSize = parseInt(args.find(arg => arg.startsWith('--size='))?.split('=')[1]) || 32;
    const outputPath = inputPath.replace('.png', '_comprehensive.png');
    
    (async () => {
        try {
            await processSingleFileComprehensive(inputPath, outputPath, cols, rows, targetSize, options);
        } catch (error) {
            console.error('\n💥 Processing failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = {
    processSingleFileComprehensive,
    processWithComprehensiveStrategy,
    validateSpriteDensity,
    validateSpriteVariance,
    validateSpatialDistribution,
    validateBackgroundRemovalCompleteness,
    validateIslandDistribution,
    validateComprehensiveQuality,
    validateGridRegularization,
    validateSpriteScaling,
    smartMergeToTarget
};