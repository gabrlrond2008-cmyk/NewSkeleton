/**
 * ai-scratch-library.js
 * Engine for searching and selecting official Scratch sprites and backdrops
 * from the bundled Scratch 3.0 libraries (sprites.json and backdrops.json).
 * Guarantees semantic congruence with game themes and seamless VM integration.
 */
import spriteLibraryContent from './libraries/sprites.json';
import backdropLibraryContent from './libraries/backdrops.json';
import soundLibraryContent from './libraries/sounds.json';
import {applySpriteLayout} from './ai-game-engine';
import {addNewSpriteFromImage} from './sprite-from-image';

const LOCAL_ASSET_URL = (typeof window !== 'undefined' && window.location && window.location.origin) ?
    `${window.location.origin}/static/library-assets/` : 'static/library-assets/';
const CDN_ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';

/**
 * Get local/bundled thumbnail URL for a sprite item
 */
function getSpriteThumbnail(spriteItem) {
    if (!spriteItem || !spriteItem.costumes || spriteItem.costumes.length === 0) {
        return null;
    }
    const firstCostume = spriteItem.costumes[0];
    const md5ext = firstCostume.md5ext || (firstCostume.assetId + '.' + (firstCostume.dataFormat || 'svg'));
    return `${LOCAL_ASSET_URL}${md5ext}`;
}

/**
 * Get local/bundled thumbnail URL for a backdrop item
 */
function getBackdropThumbnail(backdropItem) {
    if (!backdropItem) return null;
    const md5ext = backdropItem.md5ext || (backdropItem.assetId + '.' + (backdropItem.dataFormat || 'png'));
    return `${LOCAL_ASSET_URL}${md5ext}`;
}

/**
 * Pre-fetch an asset and cache it directly in storage.builtinHelper memory.
 * Guarantees 0ms synchronous retrieval when Scratch VM loads costumes/sounds.
 */
async function preloadAssetToStorage(storage, assetType, md5ext, dataFormat) {
    if (!storage || !storage.builtinHelper || !md5ext) return false;
    const parts = md5ext.split('.');
    const assetId = parts[0];
    const ext = (dataFormat || parts[1] || 'png').toLowerCase();

    // Already cached in memory?
    if (storage.builtinHelper.get(assetId)) return true;

    const urls = [
        `${LOCAL_ASSET_URL}${md5ext}`,
        `static/library-assets/${md5ext}`,
        `${CDN_ASSET_URL}${md5ext}/get/`
    ];

    for (const url of urls) {
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const buf = await resp.arrayBuffer();
                const u8 = new Uint8Array(buf);
                if (typeof storage.builtinHelper._store === 'function') {
                    storage.builtinHelper._store(assetType, ext, u8, assetId);
                    return true;
                }
            }
        } catch (_e) {
            // Try next candidate URL
        }
    }
    return false;
}

/**
 * Preload all costumes and sanitize sounds for a sprite descriptor
 */
async function preloadSpriteAssets(spriteDescriptor, storage) {
    if (!spriteDescriptor || !storage) return;
    const AssetType = storage.AssetType;

    if (Array.isArray(spriteDescriptor.costumes)) {
        for (const c of spriteDescriptor.costumes) {
            const md5ext = c.md5ext || (c.assetId + '.' + (c.dataFormat || 'png'));
            const ext = (c.dataFormat || md5ext.split('.').pop() || 'png').toLowerCase();
            const assetType = ext === 'svg' ? AssetType.ImageVector : AssetType.ImageBitmap;
            await preloadAssetToStorage(storage, assetType, md5ext, ext);
        }
    }

    // Sanitize sounds: keep only sounds that are locally present, preventing
    // vm.addSprite from hanging on offline/blocked Scratch CDN requests.
    if (Array.isArray(spriteDescriptor.sounds) && spriteDescriptor.sounds.length > 0) {
        const verifiedSounds = [];
        for (const s of spriteDescriptor.sounds) {
            const md5ext = s.md5ext || (s.assetId + '.' + (s.dataFormat || 'wav'));
            const ext = (s.dataFormat || md5ext.split('.').pop() || 'wav').toLowerCase();
            const loaded = await preloadAssetToStorage(storage, AssetType.Sound, md5ext, ext);
            if (loaded) {
                verifiedSounds.push(s);
            }
        }
        spriteDescriptor.sounds = verifiedSounds;
    }
}

const STOP_WORDS = new Set([
    'de', 'la', 'el', 'en', 'con', 'por', 'para', 'un', 'una', 'del', 'las', 'los',
    'sobre', 'al', 'se', 'es', 'the', 'a', 'an', 'of', 'in', 'on', 'with', 'for', 'at',
    'and', 'y', 'o', 'or', 'muy', 'que', 'como', 'sin', 'sus', 'mas', 'pero'
]);

/**
 * Tokenize and normalize text for fuzzy keyword matching
 */
function tokenize(text) {
    if (!text) return [];
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúüñ\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Thematic dictionary ensuring high semantic congruence between game concepts and Scratch library
 */
const THEMES = {
    water: {
        keywords: [
            'boat', 'ship', 'sail', 'sailboat', 'water', 'sea', 'ocean', 'lake', 'river',
            'beach', 'underwater', 'submarino', 'diver', 'fish', 'shark', 'crab', 'octopus',
            'starfish', 'pufferfish', 'jellyfish', 'iceberg', 'mar', 'barco', 'bote', 'lancha',
            'velero', 'agua', 'rio', 'playa', 'costa', 'buzo', 'pez', 'pescado', 'tiburon',
            'cangrejo', 'pulpo', 'marino', 'marina', 'maritimo', 'olas', 'naufragio'
        ],
        backdrops: ['Water And Rocks', 'City With Water', 'Beach Rio', 'Beach Malibu', 'Boardwalk', 'Underwater 1', 'Underwater 2'],
        sprites: ['Sailboat', 'Fish', 'Shark', 'Shark 2', 'Crab', 'Octopus', 'Diver1', 'Diver2', 'Starfish', 'Rocks']
    },
    space: {
        keywords: [
            'space', 'galaxy', 'star', 'stars', 'alien', 'rocket', 'rocketship', 'spaceship',
            'planet', 'earth', 'moon', 'sun', 'nebula', 'ufo', 'astronaut', 'orbit',
            'espacio', 'galaxia', 'nave', 'cohete', 'estrella', 'planeta', 'luna', 'sol',
            'alienigena', 'extraterrestre', 'astronauta', 'cosmico', 'meteorito', 'asteroide'
        ],
        backdrops: ['Galaxy', 'Nebula', 'Space', 'Stars', 'Space City', 'Moon'],
        sprites: ['Rocketship', 'Star', 'Earth', 'Planet2', 'Giga', 'Nano', 'Pico', 'Tera', 'Robot']
    },
    urban: {
        keywords: [
            'city', 'car', 'convertible', 'bus', 'street', 'road', 'traffic', 'building',
            'buildings', 'urban', 'vehicle', 'drive', 'metro', 'ciudad', 'coche', 'auto',
            'carro', 'calle', 'edificio', 'autobus', 'camion', 'urbano', 'carretera', 'pista'
        ],
        backdrops: ['Colorful City', 'Night City', 'City With Water', 'Bench With View', 'Boardwalk'],
        sprites: ['Convertible', 'Convertible 2', 'City Bus', 'Buildings', 'Traffic Light', 'Arrow1']
    },
    nature: {
        keywords: [
            'tree', 'forest', 'wood', 'woods', 'jungle', 'mountain', 'hills', 'garden',
            'flowers', 'field', 'park', 'grass', 'farm', 'arbol', 'bosque', 'selva',
            'montaña', 'jardin', 'flores', 'pasto', 'campo', 'granja', 'naturaleza'
        ],
        backdrops: ['Forest', 'Woods', 'Jungle', 'Savanna', 'Mountain', 'Canyon', 'Desert', 'Farm', 'Flowers', 'Blue Sky'],
        sprites: ['Tree', 'Trees', 'Apple', 'Bear', 'Butterfly 1', 'Duck', 'Frog', 'Hare', 'Monkey', 'Parrot']
    },
    fantasy: {
        keywords: [
            'castle', 'medieval', 'knight', 'dragon', 'wizard', 'witch', 'magic', 'wand',
            'fairytale', 'castillo', 'medieval', 'caballero', 'dragon', 'mago', 'bruja',
            'magia', 'varita', 'hechizo', 'fantasia', 'reino'
        ],
        backdrops: ['Castle 1', 'Castle 2', 'Castle 3', 'Castle 4'],
        sprites: ['Wizard', 'Wand', 'Dragon', 'Knight', 'Magic Carpet', 'Centaur', 'Fairy']
    },
    sports: {
        keywords: [
            'sport', 'sports', 'ball', 'soccer', 'football', 'basketball', 'baseball',
            'tennis', 'goal', 'court', 'field', 'deporte', 'pelota', 'balon', 'futbol',
            'baloncesto', 'beisbol', 'tenis', 'cancha', 'estadio'
        ],
        backdrops: ['Playing Field', 'Baseball 1', 'Basketball 1', 'Soccer 2'],
        sprites: ['Soccer Ball', 'Basketball', 'Baseball', 'Tennis', 'Beachball', 'Ball']
    },
    obstacle: {
        keywords: [
            'obstacle', 'hazard', 'barrier', 'block', 'rock', 'rocks', 'stone', 'crystal',
            'spike', 'bomb', 'lava', 'danger', 'wall', 'obstaculo', 'peligro', 'barrera',
            'bloque', 'roca', 'piedra', 'cristal', 'trampa', 'muro', 'enemigo'
        ],
        backdrops: ['Water And Rocks', 'Canyon', 'Desert', 'Garden-rock'],
        sprites: ['Rocks', 'Crystal', 'Lightning', 'Ghost', 'Ghoul', 'Bat', 'Franken', 'Shark']
    },
    collectible: {
        keywords: [
            'coin', 'gem', 'star', 'crystal', 'reward', 'bonus', 'heart', 'key', 'apple',
            'moneda', 'gema', 'estrella', 'cristal', 'premio', 'recompensa', 'vida', 'corazon', 'llave'
        ],
        backdrops: ['Blue Sky', 'Stars', 'Galaxy'],
        sprites: ['Star', 'Crystal', 'Key', 'Heart', 'Bell', 'Apple', 'Bananas']
    }
};

/**
 * Detect primary theme from query string and optional game context
 */
function detectTheme(query, context = '') {
    const combined = (query + ' ' + context).toLowerCase();
    let bestTheme = null;
    let maxHits = 0;

    for (const [themeName, themeData] of Object.entries(THEMES)) {
        let hits = 0;
        for (const kw of themeData.keywords) {
            if (combined.includes(kw)) {
                hits += (kw.length > 4 ? 2 : 1);
            }
        }
        if (hits > maxHits) {
            maxHits = hits;
            bestTheme = themeName;
        }
    }

    return bestTheme;
}

/**
 * Extended English-Spanish keyword map
 */
const EN_ES_MAP = {
    'barco': ['boat', 'ship', 'sail', 'sailboat', 'water', 'sea'],
    'bote': ['boat', 'ship', 'sail', 'sailboat', 'water'],
    'lancha': ['boat', 'speedboat', 'water'],
    'velero': ['sailboat', 'sail', 'boat'],
    'nave': ['spaceship', 'rocket', 'rocketship', 'space', 'ufo'],
    'cohete': ['rocket', 'rocketship', 'spaceship'],
    'jugador': ['character', 'person', 'player', 'hero'],
    'obstaculo': ['rock', 'rocks', 'crystal', 'stone', 'barrier', 'obstacle', 'hazard'],
    'bloque': ['rock', 'rocks', 'crystal', 'stone', 'barrier', 'obstacle'],
    'hazard': ['rock', 'rocks', 'crystal', 'obstacle'],
    'roca': ['rocks', 'rock', 'stone', 'crystal'],
    'piedra': ['rocks', 'rock', 'stone'],
    'enemigo': ['monster', 'alien', 'ghost', 'bat', 'ghoul', 'shark'],
    'moneda': ['coin', 'star', 'crystal', 'gem', 'bell'],
    'estrella': ['star', 'starfish'],
    'pelota': ['ball', 'basketball', 'baseball', 'soccer', 'beachball'],
    'mar': ['water', 'sea', 'underwater', 'ocean', 'beach'],
    'agua': ['water', 'sea', 'ocean'],
    'espacio': ['space', 'galaxy', 'stars', 'nebula', 'moon'],
    'castillo': ['castle', 'medieval'],
    'ciudad': ['city', 'urban', 'night city', 'building'],
    'coche': ['car', 'convertible', 'bus'],
    'auto': ['car', 'convertible'],
    'arbol': ['tree', 'trees', 'forest', 'wood'],
    'bosque': ['forest', 'woods', 'jungle'],
    'pez': ['fish', 'pufferfish'],
    'tiburon': ['shark'],
    'cangrejo': ['crab'],
    'pulpo': ['octopus'],
    'buzo': ['diver1', 'diver2'],
    'profesor': ['avery', 'devon', 'abby', 'ben', 'dani', 'dee', 'character', 'person'],
    'profesora': ['avery', 'abby', 'dani', 'dee', 'character', 'person'],
    'maestro': ['avery', 'devon', 'abby', 'ben', 'character'],
    'maestra': ['avery', 'abby', 'dani', 'dee', 'character'],
    'alumno': ['ben', 'avery', 'abby', 'dani', 'dee', 'jordan'],
    'estudiante': ['ben', 'avery', 'abby', 'dani', 'dee', 'jordan'],
    'chico': ['ben', 'devon', 'jordan', 'kai', 'andy'],
    'chica': ['abby', 'avery', 'dani', 'dee', 'anina'],
    'calculadora': ['button1', 'button2', 'button3', 'button4', 'apple', 'bell'],
    'icono': ['button1', 'button2', 'button3', 'button4', 'star'],
    'boton': ['button1', 'button2', 'button3', 'button4', 'button5'],
    'escuela': ['school', 'chalkboard', 'room1', 'room2', 'hallway'],
    'pizarra': ['chalkboard', 'school']
};

/**
 * Calculate match score of a library item against search terms and theme boost
 */
function scoreItem(item, queryTokens, extraKeywords, detectedTheme) {
    let score = 0;
    const itemName = item.name.toLowerCase();
    const itemTags = (item.tags || []).map(t => String(t).toLowerCase());
    const allKeywords = [...queryTokens, ...(extraKeywords || [])];

    for (const kw of allKeywords) {
        if (!kw) continue;
        if (itemName === kw) {
            score += 150;
        } else if (kw.length >= 4 && (itemName.startsWith(kw) || itemName.endsWith(kw))) {
            score += 90;
        } else if (kw.length >= 4 && itemName.includes(kw)) {
            score += 50;
        }

        for (const tag of itemTags) {
            if (tag === kw) {
                score += 60;
            } else if (kw.length >= 4 && (tag.includes(kw) || kw.includes(tag))) {
                score += 30;
            }
        }
    }

    // Boost items matching the detected theme
    if (detectedTheme && THEMES[detectedTheme]) {
        const themeData = THEMES[detectedTheme];
        if (themeData.sprites && themeData.sprites.some(s => s.toLowerCase() === itemName)) {
            score += 80;
        }
        if (themeData.backdrops && themeData.backdrops.some(b => b.toLowerCase() === itemName)) {
            score += 80;
        }
    }

    return score;
}

/**
 * Find 3 best sprite options for a given search query / role
 */
function findSpriteOptions(query, count = 3, gameContext = '') {
    const tokens = tokenize(query);
    const theme = detectTheme(query, gameContext);
    const extra = [];
    tokens.forEach(tok => {
        if (EN_ES_MAP[tok]) {
            extra.push(...EN_ES_MAP[tok]);
        }
    });

    const scored = spriteLibraryContent.map(sprite => {
        return {
            item: sprite,
            score: scoreItem(sprite, tokens, extra, theme)
        };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Pick candidates with score > 0
    const results = [];
    for (let i = 0; i < scored.length && results.length < count; i++) {
        if (scored[i].score > 0) {
            const sp = scored[i].item;
            results.push({
                id: sp.name,
                name: sp.name,
                type: 'sprite',
                data: sp,
                thumbnail: getSpriteThumbnail(sp),
                tags: sp.tags || []
            });
        }
    }

    // Thematic Fallback: only fill from the same theme, NEVER unrelated items
    if (results.length < count && theme && THEMES[theme] && THEMES[theme].sprites) {
        for (const candidateName of THEMES[theme].sprites) {
            if (results.length >= count) break;
            if (!results.some(r => r.name === candidateName)) {
                const found = spriteLibraryContent.find(s => s.name === candidateName);
                if (found) {
                    results.push({
                        id: found.name,
                        name: found.name,
                        type: 'sprite',
                        data: found,
                        thumbnail: getSpriteThumbnail(found),
                        tags: found.tags || []
                    });
                }
            }
        }
    }

    // General fallback only if still needed, prioritizing neutral versatile sprites
    if (results.length < count) {
        const neutralFallbacks = ['Ball', 'Star', 'Rocks', 'Crystal', 'Button1'];
        for (const fbName of neutralFallbacks) {
            if (results.length >= count) break;
            if (!results.some(r => r.name === fbName)) {
                const found = spriteLibraryContent.find(s => s.name === fbName);
                if (found) {
                    results.push({
                        id: found.name,
                        name: found.name,
                        type: 'sprite',
                        data: found,
                        thumbnail: getSpriteThumbnail(found),
                        tags: found.tags || []
                    });
                }
            }
        }
    }

    return results.slice(0, count);
}

/**
 * Find 3 best backdrop options for a given theme / concept
 */
function findBackdropOptions(query, count = 3, gameContext = '') {
    const tokens = tokenize(query);
    const theme = detectTheme(query, gameContext);
    const extra = [];
    tokens.forEach(tok => {
        if (EN_ES_MAP[tok]) {
            extra.push(...EN_ES_MAP[tok]);
        }
    });

    const scored = backdropLibraryContent.map(bg => {
        return {
            item: bg,
            score: scoreItem(bg, tokens, extra, theme)
        };
    });

    scored.sort((a, b) => b.score - a.score);

    const results = [];
    for (let i = 0; i < scored.length && results.length < count; i++) {
        if (scored[i].score > 0) {
            const bg = scored[i].item;
            results.push({
                id: bg.name,
                name: bg.name,
                type: 'backdrop',
                data: bg,
                thumbnail: getBackdropThumbnail(bg),
                tags: bg.tags || []
            });
        }
    }

    // Thematic Fallback: only fill backdrops from the same theme
    if (results.length < count && theme && THEMES[theme] && THEMES[theme].backdrops) {
        for (const candidateName of THEMES[theme].backdrops) {
            if (results.length >= count) break;
            if (!results.some(r => r.name === candidateName)) {
                const found = backdropLibraryContent.find(b => b.name === candidateName);
                if (found) {
                    results.push({
                        id: found.name,
                        name: found.name,
                        type: 'backdrop',
                        data: found,
                        thumbnail: getBackdropThumbnail(found),
                        tags: found.tags || []
                    });
                }
            }
        }
    }

    // Neutral fallback
    if (results.length < count) {
        const fallbacks = ['Blue Sky', 'Space', 'Colorful City', 'Underwater 1'];
        for (const fbName of fallbacks) {
            if (results.length >= count) break;
            if (!results.some(r => r.name === fbName)) {
                const found = backdropLibraryContent.find(b => b.name === fbName);
                if (found) {
                    results.push({
                        id: found.name,
                        name: found.name,
                        type: 'backdrop',
                        data: found,
                        thumbnail: getBackdropThumbnail(found),
                        tags: found.tags || []
                    });
                }
            }
        }
    }

    return results.slice(0, count);
}

/**
 * Find best sound options from official Scratch sound library for a query/role
 */
function findSoundOptions(query, count = 3, gameContext = '', preferredType = 'all') {
    const tokens = tokenize(query);
    const theme = detectTheme(query, gameContext);
    const extra = [];
    tokens.forEach(tok => {
        if (EN_ES_MAP[tok]) {
            extra.push(...EN_ES_MAP[tok]);
        }
        if (tok === 'salto' || tok === 'saltar') extra.push('jump', 'boing', 'pop', 'hop');
        if (tok === 'moneda' || tok === 'premio' || tok === 'puntos') extra.push('coin', 'bell', 'collect', 'chime');
        if (tok === 'golpe' || tok === 'dano' || tok === 'daño' || tok === 'herir') extra.push('hit', 'bonk', 'crunch', 'bite', 'impact');
        if (tok === 'disparo' || tok === 'disparar') extra.push('laser', 'laser1', 'laser2', 'pop');
        if (tok === 'musica' || tok === 'fondo' || tok === 'cancion' || tok === 'soundtrack') extra.push('music', 'loop', 'dance', 'techno', 'beat');
        if (tok === 'victoria' || tok === 'ganar') extra.push('cheer', 'tada', 'win', 'trumpet');
        if (tok === 'derrota' || tok === 'perder' || tok === 'morir') extra.push('lose', 'wobble', 'oops');
    });

    const scored = soundLibraryContent.map(snd => {
        let score = scoreItem(snd, tokens, extra, theme);
        const tags = (snd.tags || []).map(t => String(t).toLowerCase());

        if (preferredType === 'music') {
            if (tags.includes('music') || tags.includes('loops') || snd.name.toLowerCase().includes('dance') || snd.name.toLowerCase().includes('beat')) {
                score += 120;
            } else {
                score -= 40;
            }
        } else if (preferredType === 'sfx') {
            if (tags.includes('effects') || tags.includes('human') || tags.includes('animals') || tags.includes('sports')) {
                score += 80;
            }
            if (tags.includes('music') && !tags.includes('effects')) {
                score -= 30;
            }
        }

        return {
            item: snd,
            score: score
        };
    });

    scored.sort((a, b) => b.score - a.score);

    const results = [];
    for (let i = 0; i < scored.length && results.length < count; i++) {
        if (scored[i].score > 0) {
            const snd = scored[i].item;
            results.push({
                id: snd.name,
                name: snd.name,
                type: 'sound',
                data: snd,
                assetUrl: `${LOCAL_ASSET_URL}${snd.md5ext}`,
                rate: snd.rate,
                sampleCount: snd.sampleCount,
                duration: (snd.sampleCount && snd.rate) ? (snd.sampleCount / snd.rate).toFixed(1) + 's' : '0.5s',
                tags: snd.tags || []
            });
        }
    }

    const soundFallbacks = preferredType === 'music' ?
        ['Video Game 1', 'Dance Celebrate', 'Dance Chill', 'Bossa Nova', 'Cave'] :
        ['Boing', 'Pop', 'Coin', 'Collect', 'Laser1', 'Hit', 'Bonk', 'Cheer'];

    for (const fbName of soundFallbacks) {
        if (results.length >= count) break;
        if (!results.some(r => r.name.toLowerCase() === fbName.toLowerCase())) {
            const found = soundLibraryContent.find(s => s.name.toLowerCase() === fbName.toLowerCase());
            if (found) {
                results.push({
                    id: found.name,
                    name: found.name,
                    type: 'sound',
                    data: found,
                    assetUrl: `${LOCAL_ASSET_URL}${found.md5ext}`,
                    rate: found.rate,
                    sampleCount: found.sampleCount,
                    duration: (found.sampleCount && found.rate) ? (found.sampleCount / found.rate).toFixed(1) + 's' : '0.5s',
                    tags: found.tags || []
                });
            }
        }
    }

    return results.slice(0, count);
}

/**
 * Add an official Scratch library sound directly to a VM target (Stage or Sprite)
 */
async function addLibrarySoundToVM(soundData, vm, targetId, customName) {
    if (!vm || !soundData) return null;
    const storage = vm.runtime && vm.runtime.storage;

    const md5ext = soundData.md5ext || (soundData.assetId + '.' + (soundData.dataFormat || 'wav'));
    const parts = md5ext.split('.');
    const assetId = soundData.assetId || parts[0];
    const ext = (soundData.dataFormat || parts[1] || 'wav').toLowerCase();

    if (storage) {
        await preloadAssetToStorage(storage, storage.AssetType.Sound, md5ext, ext);
    }

    const soundName = customName || soundData.name;
    const vmSound = {
        name: soundName,
        dataFormat: ext,
        assetId: assetId,
        md5: md5ext,
        rate: soundData.rate || 44100,
        sampleCount: soundData.sampleCount || 0
    };

    const target = targetId ? vm.runtime.getTargetById(targetId) : vm.editingTarget;
    if (target && target.sprite && Array.isArray(target.sprite.sounds)) {
        const existingIdx = target.sprite.sounds.findIndex(s => s.name === soundName);
        if (existingIdx !== -1) {
            target.sprite.sounds.splice(existingIdx, 1);
        }
    }

    try {
        await vm.addSound(vmSound, targetId);
        if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
        console.log('[AI ScratchLibrary] Sonido añadido con éxito a target:', soundName, targetId);
        return vmSound;
    } catch (err) {
        console.warn('[AI ScratchLibrary] Error añadiendo sonido a VM:', soundName, err);
        return null;
    }
}

/**
 * Add or replace a sprite library item into the Scratch VM cleanly
 */
function addLibrarySpriteToVM(spriteData, vm, customName, layoutDef) {
    if (!vm || !spriteData) return Promise.reject(new Error('VM o sprite no disponible'));
    const cloned = JSON.parse(JSON.stringify(spriteData));
    const targetName = customName || cloned.name;
    cloned.name = targetName;

    // Apply layout coordinates to sprite descriptor if provided
    if (layoutDef) {
        if (typeof layoutDef.initialX === 'number') cloned.x = layoutDef.initialX;
        if (typeof layoutDef.initialY === 'number') cloned.y = layoutDef.initialY;
        if (typeof layoutDef.direction === 'number') cloned.direction = layoutDef.direction;
    }

    // Delete existing sprite with this name BEFORE adding (prevents auto-rename to "Name2")
    const existing = vm.runtime && Array.isArray(vm.runtime.targets) ?
        vm.runtime.targets.find(t => !t.isStage && t.getName() === targetName) : null;
    if (existing && typeof vm.deleteSprite === 'function') {
        try {
            vm.deleteSprite(existing.id);
            console.log('[AI ScratchLibrary] Sprite anterior "' + targetName + '" eliminado antes de reemplazar.');
        } catch (delErr) {
            console.warn('[AI ScratchLibrary] Error pre-eliminando sprite:', delErr);
        }
    }

    console.log('[AI ScratchLibrary] Añadiendo sprite "' + targetName + '" (origen: ' + (spriteData.name || 'library') + ')...');

    const storage = vm.runtime && vm.runtime.storage;
    return preloadSpriteAssets(cloned, storage).then(() => {
        // Timeout protection: 15000ms (assets are now preloaded into memory cache)
        const addSpritePromise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout de 15000ms al cargar sprite "' + targetName + '"'));
            }, 15000);

            try {
                vm.addSprite(JSON.stringify(cloned))
                    .then(res => {
                        clearTimeout(timer);
                        resolve(res);
                    })
                    .catch(err => {
                        clearTimeout(timer);
                        reject(err);
                    });
            } catch (syncErr) {
                clearTimeout(timer);
                reject(syncErr);
            }
        });

        return addSpritePromise.then(() => {
            const targets = vm.runtime.targets || [];
            let target = targets.find(t => !t.isStage && t.getName() === targetName);
            if (!target) {
                // Might have been assigned an indexed name by Scratch VM
                target = targets.filter(t => !t.isStage).pop();
            }

            if (target) {
                // Ensure canonical name matches targetName
                if (target.getName() !== targetName && typeof vm.renameSprite === 'function') {
                    try {
                        vm.renameSprite(target.id, targetName);
                    } catch (rErr) {
                        console.warn('[AI ScratchLibrary] Error renombrando sprite a ' + targetName, rErr);
                    }
                }
                if (layoutDef) {
                    applySpriteLayout(target, layoutDef, null, vm);
                }
                if (typeof vm.setEditingTarget === 'function') {
                    vm.setEditingTarget(target.id);
                }
            }

            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
            if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();
            console.log('[AI ScratchLibrary] Sprite añadido y verificado con éxito:', targetName);
            return target;
        });
    }).catch(loadErr => {
        console.warn('[AI ScratchLibrary] Error cargando "' + targetName + '" (' + loadErr.message + '). Generando sprite vectorial local garantizado...');
        return addNewSpriteFromImage(null, vm, targetName).then(fallbackTarget => {
            if (fallbackTarget) {
                if (layoutDef) {
                    applySpriteLayout(fallbackTarget, layoutDef, null, vm);
                }
                if (typeof vm.setEditingTarget === 'function') {
                    vm.setEditingTarget(fallbackTarget.id);
                }
                if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
                if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();
            }
            return fallbackTarget;
        });
    });
}

/**
 * Add or activate a backdrop library item in the Scratch VM stage
 */
function addLibraryBackdropToVM(backdropData, vm) {
    if (!vm || !backdropData) return Promise.reject(new Error('VM o fondo no disponible'));
    const stage = vm.runtime && typeof vm.runtime.getTargetForStage === 'function' ?
        vm.runtime.getTargetForStage() : null;

    const md5ext = backdropData.md5ext || (backdropData.assetId + '.' + (backdropData.dataFormat || 'png'));

    // If stage already has a costume matching this name or md5, simply activate it!
    if (stage) {
        const costumes = stage.getCostumes();
        const existingIdx = costumes.findIndex(c => c.name === backdropData.name || c.md5 === md5ext);
        if (existingIdx >= 0) {
            stage.setCostume(existingIdx);
            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
            if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();
            return Promise.resolve(stage);
        }
    }

    const vmBackdrop = {
        name: backdropData.name,
        rotationCenterX: backdropData.rotationCenterX,
        rotationCenterY: backdropData.rotationCenterY,
        bitmapResolution: backdropData.bitmapResolution,
        skinId: null
    };

    const storage = vm.runtime && vm.runtime.storage;
    const ext = (backdropData.dataFormat || md5ext.split('.').pop() || 'png').toLowerCase();
    const assetType = ext === 'svg' ?
        (storage ? storage.AssetType.ImageVector : null) :
        (storage ? storage.AssetType.ImageBitmap : null);

    const preloadPromise = (storage && assetType) ?
        preloadAssetToStorage(storage, assetType, md5ext, ext) :
        Promise.resolve();

    return preloadPromise.then(() => {
        const addBackdropPromise = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout de 15000ms al cargar fondo'));
            }, 15000);
            try {
                vm.addBackdrop(md5ext, vmBackdrop)
                    .then(r => { clearTimeout(timer); resolve(r); })
                    .catch(e => { clearTimeout(timer); reject(e); });
            } catch (syncErr) {
                clearTimeout(timer);
                reject(syncErr);
            }
        });

        return addBackdropPromise.then(() => {
        if (stage) {
            const costumes = stage.getCostumes();
            const targetIdx = costumes.findIndex(c => c.name === backdropData.name || c.md5 === md5ext);
            if (targetIdx >= 0) {
                stage.setCostume(targetIdx);
            }

            // Clean up default empty backdrop (backdrop1 or fondo1) only if more than 1 costume exists
            if (costumes.length > 1) {
                const defaultName = (costumes[0].name || '').toLowerCase();
                if (defaultName === 'backdrop1' || defaultName === 'fondo1') {
                    stage.deleteCostume(0);
                    const updatedCostumes = stage.getCostumes();
                    const newIdx = updatedCostumes.findIndex(c => c.name === backdropData.name || c.md5 === md5ext);
                    if (newIdx >= 0) stage.setCostume(newIdx);
                }
            }
        }
            if (typeof vm.setEditingTarget === 'function' && stage) {
                vm.setEditingTarget(stage.id);
            }
            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
            if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();
            return stage;
        });
    }).catch(err => {
        console.warn('[AI ScratchLibrary] Fallback fondo:', err.message);
        return stage;
    });
}

export {
    findSpriteOptions,
    findBackdropOptions,
    findSoundOptions,
    addLibrarySpriteToVM,
    addLibraryBackdropToVM,
    addLibrarySoundToVM,
    getSpriteThumbnail,
    getBackdropThumbnail,
    detectTheme
};
