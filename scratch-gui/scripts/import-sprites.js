/**
 * scripts/import-sprites.js
 * Tool for ingesting external vector (SVG) and raster (PNG) sprites into Scratch 3.0.
 * Automatically computes MD5 hashes, calculates rotation center pins (rotationCenterX / Y)
 * from bounding boxes / viewBox, copies assets to static/library-assets/, and indexes
 * sprites into src/lib/libraries/sprites.json.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LIBRARY_ASSETS_DIR = path.resolve(__dirname, '../static/library-assets');
const SPRITES_JSON_PATH = path.resolve(__dirname, '../src/lib/libraries/sprites.json');

/**
 * Compute MD5 hash of a buffer
 */
function computeMd5(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Parse SVG dimensions and viewBox to determine width, height, and center pin
 */
function parseSvgDimensions(svgContent) {
    let width = 100;
    let height = 100;

    // Try viewBox first: viewBox="minX minY width height"
    const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
    if (viewBoxMatch) {
        width = parseFloat(viewBoxMatch[3]);
        height = parseFloat(viewBoxMatch[4]);
    } else {
        const widthMatch = svgContent.match(/width\s*=\s*["']\s*([-\d.]+)/i);
        const heightMatch = svgContent.match(/height\s*=\s*["']\s*([-\d.]+)/i);
        if (widthMatch) width = parseFloat(widthMatch[1]);
        if (heightMatch) height = parseFloat(heightMatch[1]);
    }

    if (isNaN(width) || width <= 0) width = 100;
    if (isNaN(height) || height <= 0) height = 100;

    return { width, height };
}

/**
 * Calculate pin coordinates (rotationCenterX / rotationCenterY)
 * @param {number} width
 * @param {number} height
 * @param {'center' | 'feet' | 'top'} pivotType
 */
function calculatePin(width, height, pivotType = 'center') {
    let rotationCenterX = Math.round(width / 2);
    let rotationCenterY = Math.round(height / 2);

    if (pivotType === 'feet') {
        rotationCenterY = Math.round(height * 0.95);
    } else if (pivotType === 'top') {
        rotationCenterY = Math.round(height * 0.1);
    }

    return { rotationCenterX, rotationCenterY };
}

/**
 * Ingest an array of costume specifications for a sprite
 * @param {Object} spriteSpec
 * @param {string} spriteSpec.name
 * @param {string[]} spriteSpec.tags
 * @param {'center' | 'feet'} [spriteSpec.pivotType]
 * @param {Array<{ name: string, dataFormat: 'svg'|'png', content: Buffer|string }>} spriteSpec.costumes
 */
function ingestSprite(spriteSpec) {
    if (!fs.existsSync(LIBRARY_ASSETS_DIR)) {
        fs.mkdirSync(LIBRARY_ASSETS_DIR, { recursive: true });
    }

    const pivotType = spriteSpec.pivotType || 'center';
    const processedCostumes = [];

    for (const c of spriteSpec.costumes) {
        const isSvg = c.dataFormat === 'svg';
        const buffer = Buffer.isBuffer(c.content) ? c.content : Buffer.from(c.content, isSvg ? 'utf8' : 'base64');
        const assetId = computeMd5(buffer);
        const md5ext = `${assetId}.${c.dataFormat}`;
        const targetPath = path.join(LIBRARY_ASSETS_DIR, md5ext);

        // Save file to static/library-assets/
        fs.writeFileSync(targetPath, buffer);

        // Determine pin coordinates
        let width = 100;
        let height = 100;
        if (isSvg) {
            const dims = parseSvgDimensions(buffer.toString('utf8'));
            width = dims.width;
            height = dims.height;
        } else if (c.width && c.height) {
            width = c.width;
            height = c.height;
        }

        const { rotationCenterX, rotationCenterY } = calculatePin(width, height, pivotType);

        processedCostumes.push({
            assetId: assetId,
            name: c.name || spriteSpec.name,
            bitmapResolution: isSvg ? 1 : (c.bitmapResolution || 2),
            md5ext: md5ext,
            dataFormat: c.dataFormat,
            rotationCenterX: rotationCenterX,
            rotationCenterY: rotationCenterY
        });
    }

    // Default pop sound for every sprite
    const defaultSounds = [
        {
            assetId: "83a9787d4cb6f3b7632b4ddfebf74367",
            name: "pop",
            dataFormat: "wav",
            format: "",
            rate: 44100,
            sampleCount: 1032,
            md5ext: "83a9787d4cb6f3b7632b4ddfebf74367.wav"
        }
    ];

    const spriteEntry = {
        name: spriteSpec.name,
        tags: spriteSpec.tags || ["custom", "imported"],
        isStage: false,
        variables: {},
        costumes: processedCostumes,
        sounds: spriteSpec.sounds || defaultSounds,
        blocks: {}
    };

    // Update sprites.json
    let sprites = [];
    if (fs.existsSync(SPRITES_JSON_PATH)) {
        try {
            sprites = JSON.parse(fs.readFileSync(SPRITES_JSON_PATH, 'utf8'));
        } catch (_e) {
            sprites = [];
        }
    }

    // Check if sprite already exists by name, replace or append
    const existingIndex = sprites.findIndex(s => s.name.toLowerCase() === spriteSpec.name.toLowerCase());
    if (existingIndex >= 0) {
        sprites[existingIndex] = spriteEntry;
        console.log(`[ImportSprites] Sprite "${spriteSpec.name}" actualizado en sprites.json`);
    } else {
        sprites.push(spriteEntry);
        console.log(`[ImportSprites] Sprite "${spriteSpec.name}" añadido a sprites.json (Total: ${sprites.length})`);
    }

    fs.writeFileSync(SPRITES_JSON_PATH, JSON.stringify(sprites, null, 4), 'utf8');
    return spriteEntry;
}

module.exports = {
    computeMd5,
    parseSvgDimensions,
    calculatePin,
    ingestSprite
};

// If run directly via CLI
if (require.main === module) {
    console.log('[ImportSprites] Pipeline listo para ingesta de sprites.');
}
