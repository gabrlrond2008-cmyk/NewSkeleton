const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.resolve(__dirname, '../static/library-assets');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sprites = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/lib/libraries/sprites.json'), 'utf8'));
const backdrops = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/lib/libraries/backdrops.json'), 'utf8'));

// Priority theme sprites for games
const PRIORITY_SPRITES = new Set([
    'Rocketship', 'Earth', 'Star', 'Planet2', 'Giga', 'Nano', 'Pico', 'Tera', 'Robot',
    'Ghost', 'Ghoul', 'Bat', 'Franken', 'Shark', 'Shark 2', 'Crab', 'Octopus',
    'Baseball', 'Basketball', 'Soccer Ball', 'Tennis', 'Beachball', 'Ball',
    'Sailboat', 'Fish', 'Diver1', 'Diver2', 'Starfish', 'Rocks', 'Crystal', 'Lightning',
    'Convertible', 'Convertible 2', 'City Bus', 'Buildings', 'Traffic Light', 'Arrow1',
    'Tree', 'Trees', 'Apple', 'Bear', 'Butterfly 1', 'Duck', 'Frog', 'Hare', 'Monkey', 'Parrot',
    'Wizard', 'Wand', 'Dragon', 'Knight', 'Magic Carpet', 'Centaur', 'Fairy',
    'Key', 'Heart', 'Bell', 'Bananas', 'Cat', 'Paddle', 'Line', 'Button1', 'Button2', 'Button3'
]);

const priorityAssets = new Set();
const otherAssets = new Set();

// Add backdrops to priority
backdrops.forEach(b => {
    const md5 = b.md5ext || (b.assetId + '.' + b.dataFormat);
    if (md5) priorityAssets.add(md5);
});

// Add sprites
sprites.forEach(s => {
    const isPriority = PRIORITY_SPRITES.has(s.name);
    (s.costumes || []).forEach(c => {
        const md5 = c.md5ext || (c.assetId + '.' + c.dataFormat);
        if (md5) {
            if (isPriority) priorityAssets.add(md5);
            else otherAssets.add(md5);
        }
    });
    (s.sounds || []).forEach(snd => {
        const md5 = snd.md5ext || (snd.assetId + '.' + snd.dataFormat);
        if (md5) {
            if (isPriority) priorityAssets.add(md5);
            else otherAssets.add(md5);
        }
    });
});

console.log(`[Asset Downloader] Priority assets: ${priorityAssets.size}, Other assets: ${otherAssets.size}`);

const CDN_BASE = 'https://assets.scratch.mit.edu/';

function downloadFile(assetFile) {
    return new Promise((resolve) => {
        const dest = path.join(OUT_DIR, assetFile);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            return resolve({ file: assetFile, status: 'cached' });
        }

        const url = `${CDN_BASE}${assetFile}`;
        const fileStream = fs.createWriteStream(dest);
        const req = https.get(url, { timeout: 8000 }, (res) => {
            if (res.statusCode !== 200) {
                fileStream.close();
                try { fs.unlinkSync(dest); } catch (e) {}
                return resolve({ file: assetFile, status: 'error_' + res.statusCode });
            }
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve({ file: assetFile, status: 'downloaded' });
            });
        });

        req.on('error', (err) => {
            fileStream.close();
            try { fs.unlinkSync(dest); } catch (e) {}
            resolve({ file: assetFile, status: 'error_' + err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            fileStream.close();
            try { fs.unlinkSync(dest); } catch (e) {}
            resolve({ file: assetFile, status: 'timeout' });
        });
    });
}

async function runQueue(list, concurrency = 8) {
    let index = 0;
    let completed = 0;
    const total = list.length;

    async function worker() {
        while (index < list.length) {
            const current = list[index++];
            const res = await downloadFile(current);
            completed++;
            if (completed % 25 === 0 || completed === total) {
                console.log(`[Asset Downloader] Progress: ${completed}/${total} (${res.status}: ${res.file})`);
            }
        }
    }

    const workers = [];
    for (let w = 0; w < concurrency; w++) {
        workers.push(worker());
    }
    await Promise.all(workers);
}

async function main() {
    console.log('[Asset Downloader] Starting download of priority assets (backdrops & game sprites)...');
    const priorityList = Array.from(priorityAssets);
    await runQueue(priorityList, 10);
    console.log('[Asset Downloader] Priority assets download finished.');

    console.log('[Asset Downloader] Starting download of remaining library assets...');
    const otherList = Array.from(otherAssets).filter(a => !priorityAssets.has(a));
    await runQueue(otherList, 10);
    console.log('[Asset Downloader] All library assets download completed!');
}

main().catch(console.error);
