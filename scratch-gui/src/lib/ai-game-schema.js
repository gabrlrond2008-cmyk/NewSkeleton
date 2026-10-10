/*
 * ai-game-schema.js
 * Master Schema Definition, Normalizer, and Target Extractor for Full Scratch Games.
 */
import {convertJsonToBlockMap} from './ai-block-descriptor';

function extractJson(text) {
    if (!text) return null;
    var cleaned = String(text).trim();
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

    var start = cleaned.indexOf('{');
    var end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    cleaned = cleaned.substring(start, end + 1);

    try {
        return JSON.parse(cleaned);
    } catch (e1) {
        try {
            var repaired = cleaned.replace(/,(\s*[\}\]])/g, '$1');
            return JSON.parse(repaired);
        } catch (e2) {
            try {
                var stripped = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, function (ch) {
                    return (ch === '\n' || ch === '\r' || ch === '\t') ? ch : '';
                }).replace(/,(\s*[\}\]])/g, '$1');
                return JSON.parse(stripped);
            } catch (e3) {
                return null;
            }
        }
    }
}

function isGameSchema(jsonObj) {
    if (!jsonObj || typeof jsonObj !== 'object') return false;
    if (jsonObj.sprites && Array.isArray(jsonObj.sprites) && jsonObj.sprites.length > 0) return true;
    if (jsonObj.stage && typeof jsonObj.stage === 'object') return true;
    if (jsonObj.globalVariables || jsonObj.globalLists || jsonObj.globalBroadcasts) return true;
    return false;
}

function normalizeGameSchema(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var schema = {
        gameTitle: String(raw.gameTitle || raw.title || 'Proyecto de Juego Scratch'),
        explanation: String(raw.explanation || raw.description || ''),
        globalVariables: [],
        globalLists: [],
        globalBroadcasts: [],
        stage: {
            backdropPrompt: null,
            musicPrompt: null,
            scripts: []
        },
        sprites: []
    };

    // Global Variables
    var rawVars = raw.globalVariables || raw.variables || [];
    if (Array.isArray(rawVars)) {
        for (var vi = 0; vi < rawVars.length; vi++) {
            var v = rawVars[vi];
            if (typeof v === 'string') {
                schema.globalVariables.push({ name: v, initialValue: 0, visible: true });
            } else if (v && typeof v === 'object' && v.name) {
                schema.globalVariables.push({
                    name: String(v.name),
                    initialValue: v.initialValue !== undefined ? v.initialValue : 0,
                    visible: v.visible !== undefined ? !!v.visible : true
                });
            }
        }
    }

    // Global Lists
    var rawLists = raw.globalLists || raw.lists || [];
    if (Array.isArray(rawLists)) {
        for (var li = 0; li < rawLists.length; li++) {
            var lst = rawLists[li];
            if (typeof lst === 'string') {
                schema.globalLists.push({ name: lst, initialValues: [], visible: true });
            } else if (lst && typeof lst === 'object' && lst.name) {
                schema.globalLists.push({
                    name: String(lst.name),
                    initialValues: Array.isArray(lst.initialValues) ? lst.initialValues : [],
                    visible: lst.visible !== undefined ? !!lst.visible : true
                });
            }
        }
    }

    // Global Broadcasts
    var rawBroadcasts = raw.globalBroadcasts || raw.broadcasts || raw.messages || [];
    if (Array.isArray(rawBroadcasts)) {
        for (var bi = 0; bi < rawBroadcasts.length; bi++) {
            if (rawBroadcasts[bi]) schema.globalBroadcasts.push(String(rawBroadcasts[bi]));
        }
    }

    // Stage
    if (raw.stage && typeof raw.stage === 'object') {
        schema.stage.backdropPrompt = raw.stage.backdropPrompt || raw.stage.backdrop || null;
        schema.stage.musicPrompt = raw.stage.musicPrompt || raw.stage.music || null;
        if (raw.stage.scripts && Array.isArray(raw.stage.scripts)) {
            schema.stage.scripts = raw.stage.scripts;
        }
    }

    // Sprites
    var rawSprites = raw.sprites || [];
    if (Array.isArray(rawSprites)) {
        for (var si = 0; si < rawSprites.length; si++) {
            var sp = rawSprites[si];
            if (!sp || typeof sp !== 'object') continue;
            var spriteObj = {
                name: String(sp.name || ('Sprite_' + (si + 1))),
                imagePrompt: sp.imagePrompt || sp.prompt || sp.costumePrompt || null,
                sfx: [],
                scripts: Array.isArray(sp.scripts) ? sp.scripts : (sp.blocks ? [{ blocks: sp.blocks }] : [])
            };
            if (sp.sfx && Array.isArray(sp.sfx)) {
                for (var sfxi = 0; sfxi < sp.sfx.length; sfxi++) {
                    var sfxItem = sp.sfx[sfxi];
                    if (typeof sfxItem === 'string') {
                        spriteObj.sfx.push({ trigger: 'effect', prompt: sfxItem });
                    } else if (sfxItem && typeof sfxItem === 'object' && sfxItem.prompt) {
                        spriteObj.sfx.push({
                            trigger: String(sfxItem.trigger || 'effect'),
                            prompt: String(sfxItem.prompt)
                        });
                    }
                }
            }
            schema.sprites.push(spriteObj);
        }
    }

    // Fallback: If no sprites array but top-level scripts exist
    if (schema.sprites.length === 0 && raw.scripts && Array.isArray(raw.scripts)) {
        schema.sprites.push({
            name: 'Jugador',
            imagePrompt: raw.imageGenerate ? raw.imageGenerate.prompt : null,
            sfx: [],
            scripts: raw.scripts
        });
    }

    return schema;
}

function parseGameSchema(content) {
    if (!content) return null;
    var jsonObj = typeof content === 'object' ? content : extractJson(content);
    if (!jsonObj || !isGameSchema(jsonObj)) return null;
    return normalizeGameSchema(jsonObj);
}

function extractTargetBlockMaps(gameSchema) {
    if (!gameSchema) return {};
    var targets = {};

    // Process stage scripts
    if (gameSchema.stage && gameSchema.stage.scripts && gameSchema.stage.scripts.length > 0) {
        targets.stage = {
            isStage: true,
            name: 'Escenario',
            parsed: convertJsonToBlockMap({ scripts: gameSchema.stage.scripts })
        };
    }

    // Process sprite scripts
    if (gameSchema.sprites && gameSchema.sprites.length > 0) {
        for (var i = 0; i < gameSchema.sprites.length; i++) {
            var sprite = gameSchema.sprites[i];
            if (sprite.scripts && sprite.scripts.length > 0) {
                targets[sprite.name] = {
                    isStage: false,
                    name: sprite.name,
                    imagePrompt: sprite.imagePrompt,
                    sfx: sprite.sfx,
                    parsed: convertJsonToBlockMap({ scripts: sprite.scripts })
                };
            }
        }
    }

    return targets;
}

export {
    isGameSchema,
    normalizeGameSchema,
    parseGameSchema,
    extractTargetBlockMaps
};
