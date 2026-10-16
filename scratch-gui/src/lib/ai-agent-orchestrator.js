/**
 * ai-agent-orchestrator.js
 * Multi-Agent Orchestration Engine for End-to-End Scratch Game Development.
 * 
 * Pipeline:
 * 1. Director: Designs game structure, scene layout & item coordinates (JSON).
 * 2. Observador (Phase 1): Validates structure & initializes Stage global state.
 * 3. Visual Artist: Generates backdrop & creates sprites in VM.
 * 4. Observador (Phase 2): Places each sprite at the Director's exact (x, y, size, direction) coordinates.
 * 5. Audio Designer: Synthesizes Stage soundtrack & sprite SFX into targets.
 * 6. Observador (Phase 3): Verifies audio assets in targets.
 * 7. Programmer: Selects each sprite in the Simulation window and generates its script JSON.
 * 8. Observador (Phase 4): Inspects inserted code; returns task if invalid or missing.
 * 9. Observador (Final): Positions focus on Player sprite and emits final workspace update.
 */
import {getCompactPromptLines} from './ai-block-library';
import {convertJsonToBlockMap} from './ai-block-descriptor';
import {addAsBackdrop, addNewSpriteFromImage} from './sprite-from-image';
import {
    findTargetByName,
    ensureStage,
    initGlobalVariables,
    addSoundToTarget,
    selectTargetInStagePanel,
    selectTargetInSimulation,
    activateAndSyncTarget,
    inspectTargetCode,
    applySpriteLayout,
    injectBlocksToTarget,
    cleanInitialDefaultSprite,
    compileModularSpriteScripts,
    compileModularStageScripts
} from './ai-game-engine';
import {
    findSpriteOptions,
    findBackdropOptions,
    findSoundOptions,
    addLibrarySpriteToVM,
    addLibraryBackdropToVM,
    addLibrarySoundToVM
} from './ai-scratch-library';
import {
    lintAndNormalizeDescriptor
} from './ai-block-linter';
import {readWorkspace} from './ai-workspace-reader';
import {assembleBlocksInOrder} from './ai-block-animator';

function cleanAndExtractJson(text) {
    if (!text) return null;
    var cleaned = String(text).trim();

    // Strip reasoning <think>...</think> tags if present (e.g. DeepSeek-R1, QwQ)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

    var startObj = cleaned.indexOf('{');
    var startArr = cleaned.indexOf('[');
    var start = -1;
    var isArr = false;

    if (startObj !== -1 && startArr !== -1) {
        if (startArr < startObj) {
            start = startArr;
            isArr = true;
        } else {
            start = startObj;
        }
    } else if (startObj !== -1) {
        start = startObj;
    } else if (startArr !== -1) {
        start = startArr;
        isArr = true;
    }

    if (start === -1) return null;

    var end = isArr ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
    if (end === -1 || end <= start) {
        end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        if (end <= start) return null;
    }

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

function callAgent(aiService, systemPrompt, userMessage, maxTokens) {
    if (!aiService || typeof aiService._call !== 'function') {
        return Promise.reject(new Error('Servicio de Inteligencia Artificial no disponible'));
    }
    var messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];
    return aiService._call(messages, maxTokens || 4096);
}

// -------------------------------------------------------------
// AGENT 1: Director / Game Architect
// Generates scene structure, rules, and item placement coordinates
// -------------------------------------------------------------
function runDirectorAgent(userPrompt, aiService, onProgress) {
    if (onProgress) {
        onProgress({
            agent: 'director',
            percent: 10,
            details: '🎮 [Director]: Diseñando estructura de la escena, mecánicas y coordenadas de los items...'
        });
    }

    var systemPrompt = [
        'Tu nombre es Fist. Eres el Director y Arquitecto Principal de Videojuegos en Scratch 3.0.',
        'Tu misión es diseñar un juego creativo, divertido y completo en Scratch a partir de la idea del usuario.',
        '',
        'SISTEMA DE COORDENADAS Y PANTALLA (480x360 px):',
        '- El centro es (0, 0). X: -240 a +240 (seguro: -200 a +200). Y: -180 a +180 (seguro: -140 a +140).',
        '- Bounding box: ten en cuenta ancho y alto de cada elemento. Nunca los coloques fuera de pantalla.',
        '- Tamaños recomendados: Jugador: 70-85; Obstáculos/Enemigos: 65-80; Coleccionables/Items: 50-65; Metas: 60-80.',
        '- Posición inicial sugerida: Jugador abajo (Y: -100 a -130); Enemigos arriba (Y: +110 a +140) o patrullando; Items repartidos.',
        '',
        'BIBLIOTECA OFICIAL Y CONGRUENCIA:',
        '- Elige fondos y sprites temáticamente congruentes de la biblioteca oficial de Scratch.',
        '- Proporciona "libraryKeywords" con palabras clave en inglés y español (ej: ["rocketship", "space"], ["ghost", "monster"], ["apple", "fruit"]).',
        '',
        'ARQUITECTURA DE MECÁNICAS Y CREATIVIDAD (LEGO COMPOSABLE):',
        '- Puedes diseñar CUALQUIER género: plataformas, shooter espacial, esquivar obstáculos, laberinto, atrapar objetos que caen, o recolectar ítems.',
        '- Para el Jugador (role: "jugador"): define "movement":',
        '  * "type": "arrows_4way" | "platformer" | "space_thrust" | "mouse_follow"',
        '  * "speed": número entre 4 y 8',
        '  * Si es plataformas: "jumpPower": 12 a 16, "gravity": 3 a 5, "floorY": -120',
        '  * "canShoot": true o false (si dispara con barra espaciadora)',
        '- Para Enemigos/Obstáculos (role: "enemigo" | "obstaculo"): define "movement":',
        '  * "type": "rain_fall" | "patrol_bounce" | "chase_target"',
        '  * "speed": número entre 3 y 6',
        '- Para Coleccionables/Items/Metas (role: "recolectable" | "meta"): define "movement":',
        '  * "type": "rain_fall" | "oscillation" | "static"',
        '',
        'DEBES responder ÚNICAMENTE con un JSON válido con esta estructura exacta:',
        '{',
        '  "gameTitle": "Título creativo del juego",',
        '  "theme": "water | space | urban | nature | fantasy | sports",',
        '  "explanation": "Resumen claro de cómo se juega, controles, objetivo y puntuación",',
        '  "stageConcept": "Concepto del fondo en biblioteca (ej: Stars, Blue Sky, Underwater, Forest)",',
        '  "globalVariables": ["puntuacion", "vidas"],',
        '  "globalBroadcasts": ["game_over", "victoria"],',
        '  "winPoints": 50,',
        '  "sprites": [',
        '    {',
        '      "name": "Nave",',
        '      "role": "jugador",',
        '      "libraryKeywords": ["rocketship", "space", "ship", "player"],',
        '      "initialX": 0,',
        '      "initialY": -120,',
        '      "size": 80,',
        '      "direction": 90,',
        '      "movement": { "type": "arrows_4way", "speed": 7 },',
        '      "canShoot": false,',
        '      "sfxActions": ["movimiento", "choque"]',
        '    },',
        '    {',
        '      "name": "Asteroide",',
        '      "role": "enemigo",',
        '      "libraryKeywords": ["rocks", "crystal", "stone", "ball"],',
        '      "initialX": 0,',
        '      "initialY": 130,',
        '      "size": 75,',
        '      "direction": 180,',
        '      "movement": { "type": "rain_fall", "speed": 5 },',
        '      "sfxActions": ["impacto"]',
        '    },',
        '    {',
        '      "name": "Estrella",',
        '      "role": "recolectable",',
        '      "libraryKeywords": ["star", "coin", "apple", "item"],',
        '      "initialX": 100,',
        '      "initialY": 20,',
        '      "size": 55,',
        '      "direction": 90,',
        '      "movement": { "type": "oscillation" },',
        '      "sfxActions": ["recoger"]',
        '    }',
        '  ]',
        '}'
    ].join('\n');

    return callAgent(aiService, systemPrompt, 'Crea la estructura del juego para: ' + userPrompt, 1500)
        .then(function (resText) {
            var blueprint = cleanAndExtractJson(resText);
            if (!blueprint || !blueprint.sprites || !Array.isArray(blueprint.sprites) || blueprint.sprites.length === 0) {
                blueprint = {
                    gameTitle: 'Aventura Scratch',
                    theme: 'water',
                    explanation: 'Juego de esquivar obstáculos y sobrevivir.',
                    stageConcept: 'Water And Rocks',
                    globalVariables: ['puntuacion', 'vidas'],
                    globalLists: [],
                    globalBroadcasts: ['game_over', 'victoria'],
                    sprites: [
                        { name: 'Jugador', role: 'jugador', libraryKeywords: ['boat', 'sailboat', 'player'], initialX: 0, initialY: -120, size: 85, direction: 90, sfxActions: ['movimiento'] },
                        { name: 'Obstaculo', role: 'obstaculo', libraryKeywords: ['rocks', 'crystal', 'obstacle'], initialX: 0, initialY: 120, size: 75, direction: 180, sfxActions: ['impacto'] }
                    ]
                };
            }
            console.log('[AI MultiAgent] 🎮 Director definió estructura del juego:', blueprint.gameTitle);
            return blueprint;
        });
}

// -------------------------------------------------------------
// OBSERVADOR: Phase 1 Validation (Variables and Stage State)
// -------------------------------------------------------------
function observeAndInitStructure(blueprint, vm, onProgress) {
    if (onProgress) {
        onProgress({
            agent: 'supervisor',
            percent: 20,
            details: '🔍 [Observador]: Validando estructura del Director e inicializando variables en el Escenario...'
        });
    }

    if (!blueprint.sprites || blueprint.sprites.length === 0) {
        throw new Error('[Observador]: La estructura del Director no contiene sprites válidos.');
    }

    return initGlobalVariables(vm, blueprint).then(function () {
        console.log('[Observador] Variables globales y broadcasts inicializados con éxito.');
        return blueprint;
    });
}

// -------------------------------------------------------------
// AGENT 2: Visual Artist
// Finds 3 library candidates for backdrop and each sprite, lets user pick (or auto-picks recommended)
// -------------------------------------------------------------
function runVisualAgent(blueprint, aiService, imageService, vm, onProgress) {
    var gameTheme = blueprint.theme || (blueprint.gameTitle + ' ' + (blueprint.stageConcept || ''));

    if (onProgress) {
        onProgress({
            agent: 'visual',
            percent: 30,
            details: '🎨 [Artista]: Buscando opciones congruentes en la biblioteca de Scratch...'
        });
    }

    // 1. Find 3 backdrop candidates
    var backdropQuery = (blueprint.stageConcept || blueprint.gameTitle || 'outdoors');
    var backdropOptions = findBackdropOptions(backdropQuery, 3, gameTheme);

    // 2. Find 3 sprite candidates for each sprite definition
    var spriteCandidateList = blueprint.sprites.map(function (spDef) {
        var spTokens = [
            spDef.name,
            spDef.role,
            spDef.visualDesc,
            ...(spDef.libraryKeywords || [])
        ].filter(Boolean).join(' ');
        var options = findSpriteOptions(spTokens, 3, gameTheme);
        return {
            key: spDef.name,
            name: spDef.name,
            type: 'sprite',
            options: options,
            selectedId: options[0] ? options[0].id : null,
            spriteDef: spDef
        };
    });

    var stageTarget = {
        key: '__stage__',
        name: 'Escenario',
        type: 'backdrop',
        options: backdropOptions,
        selectedId: backdropOptions[0] ? backdropOptions[0].id : null
    };

    var allTargets = [stageTarget, ...spriteCandidateList];

    var createdTargets = {};

    // Sequentially apply initial backdrop and initial default candidate for each sprite
    // so network bandwidth isn't choked by 15 parallel requests, keeping stage populated and responsive!
    var initVisualChain = Promise.resolve();
    if (stageTarget.options[0]) {
        initVisualChain = initVisualChain.then(function () {
            return addLibraryBackdropToVM(stageTarget.options[0].data, vm);
        }).catch(function (err) {
            console.warn('[AI VisualAgent] Error inicial fondo:', err);
        });
    }

    spriteCandidateList.forEach(function (tgt) {
        if (tgt.options[0] && tgt.options[0].data) {
            initVisualChain = initVisualChain.then(function () {
                return addLibrarySpriteToVM(tgt.options[0].data, vm, tgt.name, tgt.spriteDef)
                    .then(function (target) {
                        if (target) createdTargets[tgt.name] = target;
                        cleanInitialDefaultSprite(vm, blueprint.sprites.map(function (s) { return s.name; }));
                    });
            }).catch(function (err) {
                console.warn('[AI VisualAgent] Error inicial sprite:', tgt.name, err);
            });
        }
    });

    // Return a promise that lets the user interactively choose (or auto-proceeds after countdown)
    return new Promise(function (resolve) {
        var timerId = null;
        var countdown = 12;
        var hasResolved = false;

        function doResolve() {
            if (hasResolved) return;
            hasResolved = true;
            if (timerId) clearInterval(timerId);
            console.log('[AI VisualAgent] Selección finalizada. Continuando a fase de verificación...');
            resolve();
        }

        function notifySelection() {
            if (hasResolved) return;
            if (onProgress) {
                onProgress({
                    agent: 'visual',
                    percent: 33,
                    details: '🎨 [Artista]: Selecciona la apariencia visual debajo (auto-continuar en ' + countdown + 's)...',
                    librarySelection: {
                        targets: allTargets,
                        countdown: countdown,
                        onSelectCandidate: function (targetKey, chosenOption) {
                            console.log('[AI VisualAgent] Candidato seleccionado para ' + targetKey + ':', chosenOption ? chosenOption.name : null);
                            var tgt = allTargets.find(function (t) { return t.key === targetKey; });
                            if (tgt && chosenOption) {
                                tgt.selectedId = chosenOption.id;
                                if (tgt.type === 'backdrop') {
                                    addLibraryBackdropToVM(chosenOption.data, vm)
                                        .then(function () {
                                            console.log('[AI VisualAgent] Fondo actualizado en vivo:', chosenOption.name);
                                        })
                                        .catch(function (e) {
                                            console.warn('[AI VisualAgent] Error aplicando fondo:', e);
                                        });
                                } else if (tgt.type === 'sprite') {
                                    // Live placement: Add/replace sprite immediately in Scratch VM so user sees it right away
                                    addLibrarySpriteToVM(chosenOption.data, vm, tgt.name, tgt.spriteDef)
                                        .then(function (target) {
                                            if (target) createdTargets[tgt.name] = target;
                                            console.log('[AI VisualAgent] Sprite colocado en vivo en VM:', tgt.name, chosenOption.name);
                                        })
                                        .catch(function (e) {
                                            console.warn('[AI VisualAgent] Error colocando sprite en vivo:', tgt.name, e);
                                        });
                                }
                                notifySelection();
                            }
                        },
                        onConfirm: function () {
                            console.log('[AI VisualAgent] Botón Confirmar pulsado.');
                            doResolve();
                        }
                    }
                });
            }
        }

        notifySelection();

        timerId = setInterval(function () {
            if (hasResolved) {
                if (timerId) clearInterval(timerId);
                return;
            }
            countdown--;
            if (countdown <= 0) {
                if (timerId) clearInterval(timerId);
                timerId = null;
                doResolve();
            } else {
                notifySelection();
            }
        }, 1000);
    }).then(function () {
        console.log('[AI VisualAgent] Verificando instanciación final de sprites en el VM...');
        var spriteChain = Promise.resolve();

        allTargets.filter(function (t) { return t.type === 'sprite'; }).forEach(function (tgt, sIdx) {
            spriteChain = spriteChain.then(function () {
                var chosenOption = tgt.options.find(function (o) { return o.id === tgt.selectedId; }) || tgt.options[0];
                var pct = 36 + Math.round((sIdx / blueprint.sprites.length) * 12);
                if (onProgress) {
                    onProgress({
                        agent: 'visual',
                        percent: pct,
                        details: '🎨 [Artista]: Verificando sprite "' + tgt.name + '" (' + (chosenOption ? chosenOption.name : '') + ')...'
                    });
                }

                // If already placed during live selection, verify target exists
                var existingTarget = createdTargets[tgt.name] || findTargetByName(vm, tgt.name, false);
                if (existingTarget) {
                    createdTargets[tgt.name] = existingTarget;
                    applySpriteLayout(existingTarget, tgt.spriteDef);
                    console.log('[AI VisualAgent] Sprite ya presente en VM, verificado:', tgt.name);
                    return Promise.resolve(existingTarget);
                }

                if (chosenOption && chosenOption.data) {
                    console.log('[AI VisualAgent] Instanciando sprite pendiente:', tgt.name, chosenOption.name);
                    return addLibrarySpriteToVM(chosenOption.data, vm, tgt.name, tgt.spriteDef).then(function (target) {
                        if (target) createdTargets[tgt.name] = target;
                        return target;
                    }).catch(function (err) {
                        console.warn('[AI VisualAgent] Falló addLibrarySpriteToVM:', tgt.name, err.message, '-> Fallback');
                        return addNewSpriteFromImage(null, vm, tgt.name).then(function (t) {
                            if (t) {
                                createdTargets[tgt.name] = t;
                                applySpriteLayout(t, tgt.spriteDef);
                            }
                            return t;
                        });
                    });
                }
                return addNewSpriteFromImage(null, vm, tgt.name).then(function (t) {
                    if (t) {
                        createdTargets[tgt.name] = t;
                        applySpriteLayout(t, tgt.spriteDef);
                    }
                    return t;
                });
            });
        });

        return spriteChain.then(function () {
            console.log('[AI VisualAgent] Todos los sprites listos en VM:', Object.keys(createdTargets));
            // Clean unused initial default sprite (Sprite1 / Objeto 1 with 0 scripts)
            var spriteNames = blueprint.sprites.map(function (s) { return s.name; });
            cleanInitialDefaultSprite(vm, spriteNames);
            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
            return { createdTargets: createdTargets };
        });
    });
}

// -------------------------------------------------------------
// OBSERVADOR: Phase 2 Placement (Analyzes width/height, adapts sizes, and prevents overlaps)
// -------------------------------------------------------------
function observeAndPositionSprites(blueprint, createdTargets, vm, onProgress) {
    if (onProgress) {
        onProgress({
            agent: 'supervisor',
            percent: 50,
            details: '🔍 [Observador]: Analizando dimensiones (width/height), adaptando proporciones y evitando solapamientos...'
        });
    }

    var placedSprites = [];

    blueprint.sprites.forEach(function (spDef) {
        var target = createdTargets[spDef.name] || findTargetByName(vm, spDef.name, false);
        if (target) {
            var layoutRes = applySpriteLayout(target, spDef, placedSprites);
            if (layoutRes) {
                placedSprites.push(layoutRes);
            }
            console.log('[Observador] 📏 Adaptado "' + spDef.name + '" -> Tamaño: ' + spDef.size + '% (Ancho: ' + spDef.width + 'px, Alto: ' + spDef.height + 'px) en X: ' + spDef.initialX + ', Y: ' + spDef.initialY);
        } else {
            console.warn('[Observador] Sprite no encontrado para posicionar:', spDef.name);
        }
    });

    if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
    return Promise.resolve(createdTargets);
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// AGENT 3: Audio & Sound Designer
// -------------------------------------------------------------
function runAudioAgent(blueprint, aiService, audioService, vm, createdTargets, onProgress) {
    var gameTheme = blueprint.theme || (blueprint.gameTitle + ' ' + (blueprint.stageConcept || ''));

    if (onProgress) {
        onProgress({
            agent: 'audio',
            percent: 54,
            details: '🎵 [Músico]: Buscando banda sonora y efectos en la biblioteca de Scratch...'
        });
    }

    var stage = ensureStage(vm);

    // 1. Find 3 background music options from Scratch sound library
    var musicQuery = (blueprint.stageConcept || blueprint.gameTitle || 'game') + ' music loop dance';
    var musicOptions = findSoundOptions(musicQuery, 3, gameTheme, 'music');

    var stageAudioTarget = {
        key: '__stage_music__',
        name: 'Música de fondo',
        targetName: 'Escenario',
        type: 'sound',
        soundRole: 'music',
        soundName: 'musica_fondo',
        targetId: stage ? stage.id : null,
        options: musicOptions,
        selectedId: musicOptions[0] ? musicOptions[0].id : null
    };

    // 2. Find 3 sound effect options for each sprite
    var spriteAudioTargets = (blueprint.sprites || []).map(function (spDef) {
        var action = (spDef.sfxActions && spDef.sfxActions[0]) ||
            (spDef.role === 'player' ? 'jump' : (spDef.role === 'enemy' ? 'hit' : 'coin'));
        var sfxQuery = action + ' ' + (spDef.name || '') + ' effect';
        var sfxOptions = findSoundOptions(sfxQuery, 3, gameTheme, 'sfx');

        var target = createdTargets[spDef.name] || findTargetByName(vm, spDef.name, false);

        return {
            key: 'sfx_' + spDef.name,
            name: spDef.name + ' (' + action + ')',
            targetName: spDef.name,
            type: 'sound',
            soundRole: 'sfx',
            soundName: 'sfx_' + action,
            targetId: target ? target.id : null,
            options: sfxOptions,
            selectedId: sfxOptions[0] ? sfxOptions[0].id : null
        };
    });

    var allAudioTargets = [stageAudioTarget, ...spriteAudioTargets];

    // Sequentially apply initial default candidate for each sound target
    var initAudioChain = Promise.resolve();
    allAudioTargets.forEach(function (tgt) {
        if (tgt.options[0] && tgt.targetId) {
            initAudioChain = initAudioChain.then(function () {
                return addLibrarySoundToVM(tgt.options[0].data, vm, tgt.targetId, tgt.soundName);
            }).catch(function (err) {
                console.warn('[AI AudioAgent] Error inicial sonido:', tgt.name, err);
            });
        }
    });

    return new Promise(function (resolve) {
        var timerId = null;
        var countdown = 10;
        var hasResolved = false;

        function doResolve() {
            if (hasResolved) return;
            hasResolved = true;
            if (timerId) clearInterval(timerId);
            console.log('[AI AudioAgent] Selección de audio finalizada.');
            resolve();
        }

        function notifySelection() {
            if (hasResolved) return;
            if (onProgress) {
                onProgress({
                    agent: 'audio',
                    percent: 58,
                    details: '🎵 [Músico]: Selecciona los audios debajo (auto-continuar en ' + countdown + 's)...',
                    librarySelection: {
                        category: 'audio',
                        targets: allAudioTargets,
                        countdown: countdown,
                        onSelectCandidate: function (targetKey, chosenOption) {
                            console.log('[AI AudioAgent] Sonido seleccionado para ' + targetKey + ':', chosenOption ? chosenOption.name : null);
                            var tgt = allAudioTargets.find(function (t) { return t.key === targetKey; });
                            if (tgt && chosenOption && tgt.targetId) {
                                tgt.selectedId = chosenOption.id;
                                addLibrarySoundToVM(chosenOption.data, vm, tgt.targetId, tgt.soundName)
                                    .then(function () {
                                        console.log('[AI AudioAgent] Sonido actualizado en vivo en VM:', tgt.name, chosenOption.name);
                                    })
                                    .catch(function (e) {
                                        console.warn('[AI AudioAgent] Error actualizando sonido:', tgt.name, e);
                                    });
                                notifySelection();
                            }
                        },
                        onConfirm: function () {
                            console.log('[AI AudioAgent] Botón Confirmar Selección de audio pulsado.');
                            doResolve();
                        }
                    }
                });
            }
        }

        notifySelection();

        timerId = setInterval(function () {
            if (hasResolved) {
                if (timerId) clearInterval(timerId);
                return;
            }
            countdown--;
            if (countdown <= 0) {
                if (timerId) clearInterval(timerId);
                timerId = null;
                doResolve();
            } else {
                notifySelection();
            }
        }, 1000);
    }).then(function () {
        // Final verification that sounds are present in VM
        var verifyChain = Promise.resolve();
        allAudioTargets.forEach(function (tgt) {
            verifyChain = verifyChain.then(function () {
                var chosen = tgt.options.find(function (o) { return o.id === tgt.selectedId; }) || tgt.options[0];
                if (chosen && tgt.targetId) {
                    return addLibrarySoundToVM(chosen.data, vm, tgt.targetId, tgt.soundName);
                }
            });
        });

        return verifyChain.then(function () {
            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
            if (onProgress) {
                onProgress({
                    agent: 'audio',
                    percent: 64,
                    details: '🎵 [Músico]: Banda sonora y efectos de sonido de Scratch configurados exitosamente.'
                });
            }
            return {
                targets: allAudioTargets
            };
        });
    }).catch(function (err) {
        console.warn('[AI AudioAgent] Error en selección de audio:', err);
        return { targets: allAudioTargets };
    });
}

// -------------------------------------------------------------
// Script Extractor & Observador Contingency Generators
// -------------------------------------------------------------
function extractScriptsList(jsonObj, targetName) {
    if (!jsonObj) return [];
    if (Array.isArray(jsonObj)) {
        if (jsonObj.length > 0 && jsonObj[0].opcode) {
            return [{ blocks: jsonObj }];
        }
        return jsonObj;
    }
    if (jsonObj.scripts && Array.isArray(jsonObj.scripts)) {
        return jsonObj.scripts;
    }
    if (jsonObj.blocks && Array.isArray(jsonObj.blocks)) {
        return [{ blocks: jsonObj.blocks }];
    }
    if (targetName && jsonObj[targetName]) {
        return extractScriptsList(jsonObj[targetName]);
    }
    if (jsonObj.code && Array.isArray(jsonObj.code)) {
        return [{ blocks: jsonObj.code }];
    }
    for (var key in jsonObj) {
        if (jsonObj[key] && Array.isArray(jsonObj[key].scripts)) {
            return jsonObj[key].scripts;
        }
    }
    return [];
}

function generateFallbackStageScripts(blueprint) {
    var scoreVar = (blueprint.globalVariables && blueprint.globalVariables[0]) || 'puntuacion';
    var livesVar = (blueprint.globalVariables && blueprint.globalVariables[1]) || 'vidas';

    return [
        {
            blocks: [
                { opcode: 'event_whenflagclicked' },
                { opcode: 'data_setvariableto', fields: { VARIABLE: scoreVar }, inputs: { VALUE: 0 } },
                { opcode: 'data_setvariableto', fields: { VARIABLE: livesVar }, inputs: { VALUE: 3 } }
            ]
        },
        {
            blocks: [
                { opcode: 'event_whenflagclicked' },
                {
                    opcode: 'control_forever',
                    inputs: {
                        SUBSTACK: [
                            {
                                opcode: 'control_if',
                                inputs: {
                                    CONDITION: {
                                        opcode: 'operator_lt',
                                        inputs: {
                                            OPERAND1: { opcode: 'data_variable', fields: { VARIABLE: livesVar } },
                                            OPERAND2: 1
                                        }
                                    },
                                    SUBSTACK: [
                                        { opcode: 'event_broadcast', inputs: { BROADCAST_INPUT: 'game_over' } },
                                        { opcode: 'control_stop', fields: { STOP_OPTION: 'all' } }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ];
}

function generateFallbackSpriteScripts(spDef, blueprint, target) {
    var role = (spDef.role || '').toLowerCase();
    var scoreVar = (blueprint.globalVariables && blueprint.globalVariables[0]) || 'puntuacion';
    var livesVar = (blueprint.globalVariables && blueprint.globalVariables[1]) || 'vidas';

    var player = (blueprint.sprites || []).find(function (s) {
        var r = (s.role || '').toLowerCase();
        return r === 'player' || r === 'jugador';
    }) || (blueprint.sprites && blueprint.sprites[0]);
    var playerName = (player && player.name !== spDef.name) ? player.name : '';

    var size = (target && typeof target.size === 'number') ? Math.round(target.size) : (spDef.size || 75);
    var initX = (target && typeof target.x === 'number') ? Math.round(target.x) : (typeof spDef.initialX === 'number' ? spDef.initialX : 0);
    var initY = (target && typeof target.y === 'number') ? Math.round(target.y) : (typeof spDef.initialY === 'number' ? spDef.initialY : 0);

    if (role === 'player' || role === 'jugador' || (!role && blueprint.sprites && blueprint.sprites[0] === spDef)) {
        return [
            {
                blocks: [
                    { opcode: 'event_whenflagclicked' },
                    { opcode: 'looks_setsizeto', inputs: { SIZE: size } },
                    { opcode: 'motion_gotoxy', inputs: { X: initX, Y: initY } },
                    { opcode: 'motion_setrotationstyle', fields: { STYLE: 'left-right' } },
                    {
                        opcode: 'control_forever',
                        inputs: {
                            SUBSTACK: [
                                {
                                    opcode: 'control_if',
                                    inputs: {
                                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'right arrow' } },
                                        SUBSTACK: [
                                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: 90 } },
                                            { opcode: 'motion_changexby', inputs: { DX: 8 } }
                                        ]
                                    }
                                },
                                {
                                    opcode: 'control_if',
                                    inputs: {
                                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'left arrow' } },
                                        SUBSTACK: [
                                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: -90 } },
                                            { opcode: 'motion_changexby', inputs: { DX: -8 } }
                                        ]
                                    }
                                },
                                {
                                    opcode: 'control_if',
                                    inputs: {
                                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'up arrow' } },
                                        SUBSTACK: [
                                            { opcode: 'motion_changeyby', inputs: { DY: 8 } }
                                        ]
                                    }
                                },
                                {
                                    opcode: 'control_if',
                                    inputs: {
                                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'down arrow' } },
                                        SUBSTACK: [
                                            { opcode: 'motion_changeyby', inputs: { DY: -8 } }
                                        ]
                                    }
                                },
                                { opcode: 'motion_ifonedgebounce' }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    if (role === 'enemy' || role === 'enemigo' || role === 'obstacle' || role === 'obstaculo') {
        var enemySubstack = [
            { opcode: 'motion_movesteps', inputs: { STEPS: 5 } },
            { opcode: 'motion_ifonedgebounce' }
        ];

        if (playerName) {
            enemySubstack.push({
                opcode: 'control_if',
                inputs: {
                    CONDITION: { opcode: 'sensing_touchingobject', fields: { TOUCHINGOBJECTMENU: playerName } },
                    SUBSTACK: [
                        { opcode: 'data_changevariableby', fields: { VARIABLE: livesVar }, inputs: { VALUE: -1 } },
                        { opcode: 'control_wait', inputs: { DURATION: 0.5 } }
                    ]
                }
            });
        }

        return [
            {
                blocks: [
                    { opcode: 'event_whenflagclicked' },
                    { opcode: 'looks_setsizeto', inputs: { SIZE: size } },
                    { opcode: 'motion_gotoxy', inputs: { X: initX, Y: initY } },
                    {
                        opcode: 'control_forever',
                        inputs: {
                            SUBSTACK: enemySubstack
                        }
                    }
                ]
            }
        ];
    }

    if (role === 'collectible' || role === 'recolectable' || role === 'item' || role === 'goal' || role === 'meta') {
        var collectSubstack = [
            { opcode: 'motion_turnright', inputs: { DEGREES: 2 } }
        ];

        if (playerName) {
            collectSubstack.push({
                opcode: 'control_if',
                inputs: {
                    CONDITION: { opcode: 'sensing_touchingobject', fields: { TOUCHINGOBJECTMENU: playerName } },
                    SUBSTACK: [
                        { opcode: 'data_changevariableby', fields: { VARIABLE: scoreVar }, inputs: { VALUE: 10 } },
                        {
                            opcode: 'motion_gotoxy',
                            inputs: {
                                X: { opcode: 'operator_random', inputs: { FROM: -180, TO: 180 } },
                                Y: { opcode: 'operator_random', inputs: { FROM: -120, TO: 120 } }
                            }
                        }
                    ]
                }
            });
        }

        return [
            {
                blocks: [
                    { opcode: 'event_whenflagclicked' },
                    { opcode: 'looks_setsizeto', inputs: { SIZE: size } },
                    { opcode: 'looks_show' },
                    { opcode: 'motion_gotoxy', inputs: { X: initX, Y: initY } },
                    {
                        opcode: 'control_forever',
                        inputs: {
                            SUBSTACK: collectSubstack
                        }
                    }
                ]
            }
        ];
    }

    // Default / Ambient sprite
    return [
        {
            blocks: [
                { opcode: 'event_whenflagclicked' },
                { opcode: 'looks_setsizeto', inputs: { SIZE: size } },
                { opcode: 'motion_gotoxy', inputs: { X: initX, Y: initY } },
                {
                    opcode: 'control_forever',
                    inputs: {
                        SUBSTACK: [
                            { opcode: 'motion_movesteps', inputs: { STEPS: 3 } },
                            { opcode: 'motion_ifonedgebounce' }
                        ]
                    }
                }
            ]
        }
    ];
}

// -------------------------------------------------------------
// AGENT 4: Programmer + OBSERVADOR (Remastered Target Sync & Modular Logic)
// -------------------------------------------------------------
function generateSpriteScriptsWithAI(spDef, blueprint, wsContext, aiService, target) {
    if (!aiService || typeof aiService.ask !== 'function') {
        return Promise.resolve(null);
    }

    var globalVarNames = (blueprint.globalVariables || []).map(function (v) {
        return typeof v === 'string' ? v : (v.name || '');
    }).filter(Boolean);

    var broadcasts = (blueprint.broadcasts || blueprint.globalBroadcasts || ['game_over', 'victoria'])
        .filter(function (b) { return b !== 'iniciar_juego' && b !== 'start_game'; });

    var targetPosDesc = '';
    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
        var tX = Math.round(target.x);
        var tY = Math.round(target.y);
        var tSize = Math.round(target.size || spDef.size || 80);
        targetPosDesc = 'Posición actual fijada en el escenario: X=' + tX + ', Y=' + tY + ', Tamaño=' + tSize + '%. Respeta OBLIGATORIAMENTE esta posición en motion_gotoxy y looks_setsizeto, NO lo muevas a (0, 0) a menos que sea explícitamente requerido.';
    }

    var promptParts = [
        'MODO CREADOR - PROGRAMACIÓN DEL PERSONAJE:',
        'Personaje objetivo: "' + spDef.name + '".',
        'Rol asignado: "' + (spDef.role || 'sprite') + '".',
        'Título del juego: "' + (blueprint.gameTitle || 'Juego Scratch') + '".',
        'Descripción del juego: ' + (blueprint.explanation || '') + '.',
        targetPosDesc,
        'Variables globales del proyecto: [' + globalVarNames.join(', ') + '].',
        'Mensajes broadcast permitidos (eventos finales): [' + broadcasts.join(', ') + '].',
        'Mecánicas solicitadas para este sprite: ' + (spDef.mechanics || spDef.instructions || (spDef.name + ' realiza sus acciones en el juego')) + '.',
        '',
        wsContext ? ('ESTADO ACTUAL DEL PROYECTO:\n' + wsContext) : '',
        '',
        'REGLAS OBLIGATORIAS (KISS):',
        '1. Devuelve un objeto JSON con { "explanation": "...", "scripts": [ ... ] } con los scripts para este personaje.',
        '2. Todo arranca con Bandera Verde: Cada script debe tener un bloque sombrero "event_whenflagclicked" (Bandera Verde) como sombrero principal para inicializar la posición, tamaño, mostrarse y arrancar el bucle continuo (control_forever). NUNCA uses broadcasts para iniciar el juego o los personajes; el juego arranca directamente al presionar la Bandera Verde.',
        '3. Para movimiento continuo, usa control_forever con control_if anidados (ej. teclas flechas o WASD).',
        '4. Al inicializar personajes que se mueven a los lados, añade "motion_setrotationstyle" con estilo "left-right" para que no se volteen boca abajo.',
        '5. En movimiento con flechas arriba/abajo usa únicamente "motion_changeyby" con velocidad positiva/negativa; NO gires la dirección a 0 o 180.',
        '6. Para modificar variables globales usa siempre "data_changevariableby" con input "VALUE" (ej: inputs: { VALUE: 1 } o { VALUE: -1 }). NUNCA uses input con nombre CHANGE.',
        '7. En colisiones de daño con enemigos usando "sensing_touchingobject", añade siempre un "control_wait" de 0.5 segundos para dar invulnerabilidad temporal y no vaciar vidas en 1 frame.',
        '8. Código simple, directo y funcional. NO generes bloques innecesarios ni bucles vacíos.'
    ];

    return aiService.ask(promptParts.join('\n'), '').then(function (rawResp) {
        if (!rawResp) return null;
        var clean = cleanAndExtractJson(rawResp);
        if (clean) {
            if (Array.isArray(clean.scripts) && clean.scripts.length > 0) return clean.scripts;
            if (Array.isArray(clean.sprites) && clean.sprites[0] && Array.isArray(clean.sprites[0].scripts)) {
                return clean.sprites[0].scripts;
            }
        }
        return null;
    }).catch(function (err) {
        console.warn('[AI Logic] Consulta IA a Modo Creador falló para ' + spDef.name + ':', err);
        return null;
    });
}

function runProgrammerForStage(blueprint, aiService, vm, onProgress, totalSprites) {
    var stage = ensureStage(vm);
    if (!stage) return Promise.resolve();

    return activateAndSyncTarget(stage.id, vm).then(function () {
        if (onProgress) {
            onProgress({
                agent: 'supervisor',
                percent: 62,
                details: '⚡ Ensamblando variables globales y ciclo del juego en el Escenario...'
            });
        }

        function doStageInject() {
            var scripts = (blueprint && blueprint.stageScripts && blueprint.stageScripts.length > 0) ?
                blueprint.stageScripts : compileModularStageScripts(blueprint);

            var stageParsed = convertJsonToBlockMap({ scripts: scripts });
            return injectBlocksToTarget(stage.id, stageParsed, vm).then(function (topIds) {
                try {
                    var workspace = (typeof window !== 'undefined' && window.Blockly && window.Blockly.getMainWorkspace) ?
                        window.Blockly.getMainWorkspace() : null;
                    var animIds = (Array.isArray(topIds) && topIds.length > 0) ? topIds :
                        (stageParsed && stageParsed.blockMap ? Object.keys(stageParsed.blockMap).filter(function (id) {
                            var b = stageParsed.blockMap[id];
                            return b && !b.parent;
                        }) : []);
                    if (workspace && animIds.length > 0) {
                        assembleBlocksInOrder(workspace, animIds);
                    }
                } catch (_animErr) {}
                var check = inspectTargetCode(stage);
                console.log('[Observador] ✅ Escenario programado y verificado:', check);
                return check;
            });
        }

        return doStageInject().then(function (check) {
            // Human Review Checkpoint for Stage!
            return new Promise(function (resolveReview) {
                if (onProgress) {
                    onProgress({
                        agent: 'human-review',
                        percent: 66,
                        details: '🔍 [Revisión Humana]: Revisa las variables y el ciclo del Escenario. Puedes probarlo con la bandera verde.',
                        spriteReview: {
                            title: 'Lógica del Escenario',
                            spriteName: 'Escenario',
                            stepInfo: 'Paso 1 de ' + (totalSprites + 1) + ' (Escenario)',
                            promptNote: 'Revisa las variables globales y el ciclo del juego en el Escenario. Pruébalo con la bandera verde y aprueba para continuar con los personajes.',
                            onApprove: function () {
                                console.log('[AI Review] Humano aprobó el Escenario.');
                                resolveReview(check);
                            },
                            onRegenerate: function () {
                                console.log('[AI Review] Humano solicitó regenerar lógica del Escenario...');
                                doStageInject().then(function () {
                                    if (onProgress) {
                                        onProgress({
                                            agent: 'human-review',
                                            percent: 66,
                                            details: '🔄 Lógica regenerada para el Escenario. Revisa los nuevos bloques.',
                                            spriteReview: {
                                                title: 'Lógica del Escenario',
                                                spriteName: 'Escenario',
                                                stepInfo: 'Paso 1 de ' + (totalSprites + 1) + ' (Escenario)',
                                                promptNote: 'Nuevos bloques del Escenario ensamblados. Pruébalos y pulsa aprobar para continuar.',
                                                onApprove: function () {
                                                    resolveReview(check);
                                                },
                                                onRegenerate: function () {
                                                    doStageInject();
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                } else {
                    resolveReview(check);
                }
            });
        });
    });
}

function runProgrammerForSprite(spDef, blueprint, aiService, vm, target, onProgress, spriteIndex, totalSprites, userLearnings) {
    if (!target) return Promise.resolve();

    return activateAndSyncTarget(target.id, vm).then(function () {
        var pct = 68 + Math.round((spriteIndex / totalSprites) * 28);
        if (onProgress) {
            onProgress({
                agent: 'logic',
                percent: pct,
                details: '⚡ [Lógica]: Programando mecánicas para "' + spDef.name + '" (' + (spDef.role || 'sprite') + ')...'
            });
        }

        // Read real workspace state!
        var wsText = '';
        try {
            wsText = readWorkspace(vm);
            if (userLearnings && userLearnings.length > 0) {
                wsText += '\n[AJUSTES REALIZADOS PREVIAMENTE POR EL USUARIO]:\n' + userLearnings.join('\n');
            }
        } catch (_wErr) {}

        function doGenerateAndInject() {
            return generateSpriteScriptsWithAI(spDef, blueprint, wsText, aiService, target).then(function (aiScripts) {
                var scripts = (aiScripts && aiScripts.length > 0) ?
                    aiScripts :
                    ((spDef.scripts && Array.isArray(spDef.scripts) && spDef.scripts.length > 0) ?
                        spDef.scripts : compileModularSpriteScripts(spDef, blueprint, target));

                var spParsed = convertJsonToBlockMap({ scripts: scripts });
                return injectBlocksToTarget(target.id, spParsed, vm).then(function (topIds) {
                    try {
                        var workspace = (typeof window !== 'undefined' && window.Blockly && window.Blockly.getMainWorkspace) ?
                            window.Blockly.getMainWorkspace() : null;
                        var animIds = (Array.isArray(topIds) && topIds.length > 0) ? topIds :
                            (spParsed && spParsed.blockMap ? Object.keys(spParsed.blockMap).filter(function (id) {
                                var b = spParsed.blockMap[id];
                                return b && !b.parent;
                            }) : []);
                        if (workspace && animIds.length > 0) {
                            assembleBlocksInOrder(workspace, animIds);
                        }
                    } catch (_animErr) {
                        console.warn('[AI Animator] Animación omitida:', _animErr);
                    }

                    var check = inspectTargetCode(target);
                    console.log('[Observador] ✅ Sprite "' + spDef.name + '" ensamblado (' + check.blockCount + ' bloques).');
                    return check;
                });
            });
        }

        return doGenerateAndInject().then(function (check) {
            // Human Review Checkpoint for this Sprite
            return new Promise(function (resolveReview) {
                if (onProgress) {
                    onProgress({
                        agent: 'human-review',
                        percent: pct,
                        details: '🔍 [Revisión Humana]: Revisa y prueba los bloques de "' + spDef.name + '". Modifícalos con el mouse si lo deseas.',
                        spriteReview: {
                            spriteName: spDef.name,
                            spriteRole: spDef.role || 'Personaje',
                            stepInfo: 'Paso ' + (spriteIndex + 2) + ' de ' + (totalSprites + 1) + ' ("' + spDef.name + '")',
                            promptNote: 'Revisa los bloques ensamblados en el área de trabajo y pruébalos con la bandera verde. Puedes mover o editar bloques libremente.',
                            onApprove: function () {
                                console.log('[AI Review] Humano aprobó sprite "' + spDef.name + '". Registrando modificaciones...');
                                try {
                                    var updatedWs = readWorkspace(vm);
                                    if (userLearnings) {
                                        userLearnings.push('Sprite ' + spDef.name + ' verificado por usuario.');
                                    }
                                } catch (_uErr) {}
                                resolveReview(check);
                            },
                            onRegenerate: function () {
                                console.log('[AI Review] Humano solicitó regenerar lógica para "' + spDef.name + '"...');
                                doGenerateAndInject().then(function () {
                                    if (onProgress) {
                                        onProgress({
                                            agent: 'human-review',
                                            percent: pct,
                                            details: '🔄 Lógica regenerada para "' + spDef.name + '". Revisa los nuevos bloques.',
                                            spriteReview: {
                                                spriteName: spDef.name,
                                                spriteRole: spDef.role || 'Personaje',
                                                stepInfo: 'Paso ' + (spriteIndex + 2) + ' de ' + (totalSprites + 1) + ' ("' + spDef.name + '")',
                                                promptNote: 'Nuevos bloques ensamblados. Pruébalos y pulsa aprobar para continuar.',
                                                onApprove: function () {
                                                    resolveReview(check);
                                                },
                                                onRegenerate: function () {
                                                    doGenerateAndInject();
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                } else {
                    resolveReview(check);
                }
            });
        });
    });
}

function runProgrammerAgent(blueprint, aiService, vm, createdTargets, onProgress) {
    var total = (blueprint && blueprint.sprites) ? blueprint.sprites.length : 0;
    // 1. Program Stage with Human Review
    return runProgrammerForStage(blueprint, aiService, vm, onProgress, total).then(function () {
        // 2. Program each Sprite sequentially with human approval
        var chain = Promise.resolve();
        var userLearnings = [];

        blueprint.sprites.forEach(function (spDef, idx) {
            chain = chain.then(function () {
                return new Promise(function (r) { setTimeout(r, 200); }).then(function () {
                    var target = createdTargets[spDef.name] || findTargetByName(vm, spDef.name, false);
                    return runProgrammerForSprite(spDef, blueprint, aiService, vm, target, onProgress, idx, total, userLearnings);
                });
            });
        });

        return chain;
    });
}

// -------------------------------------------------------------
// OBSERVADOR: Final Inspection & Layout Delivery
// -------------------------------------------------------------
function finalizeObserverDelivery(blueprint, createdTargets, vm, onProgress) {
    if (onProgress) {
        onProgress({
            agent: 'supervisor',
            percent: 98,
            details: '🔍 [Observador]: Verificación final completa. Activando personaje principal...'
        });
    }

    // Select Player sprite as active in Stage panel
    if (blueprint.sprites && blueprint.sprites.length > 0) {
        var firstSprite = blueprint.sprites[0];
        var firstTarget = createdTargets[firstSprite.name] || findTargetByName(vm, firstSprite.name, false);
        if (firstTarget) {
            activateAndSyncTarget(firstTarget.id, vm);
        }
    }

    if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
    if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();

    if (onProgress) {
        onProgress({
            agent: 'complete',
            percent: 100,
            details: '🚀 ¡Juego desarrollado, verificado y listo para jugar en el Escenario!'
        });
    }

    return Promise.resolve({
        success: true,
        gameTitle: blueprint.gameTitle,
        explanation: blueprint.explanation,
        spritesCount: blueprint.sprites.length
    });
}

function humanLayoutCheckpoint(blueprint, createdTargets, vm, onProgress) {
    if (!onProgress) return Promise.resolve();
    return new Promise(function (resolve) {
        onProgress({
            agent: 'layout',
            percent: 55,
            details: '📐 Revisa el escenario. Puedes arrastrar o redimensionar los personajes libremente antes de programar.',
            stepAction: {
                title: '📐 Ajuste de Escenario',
                message: 'Los personajes y el fondo están colocados en el escenario. Puedes moverlos o cambiar su tamaño si lo deseas.',
                label: '✓ Comenzar a Programar Personajes ➔',
                onConfirm: function () {
                    console.log('[AI MultiAgent] Humano confirmó disposición en el escenario. Procediendo a programación...');
                    resolve();
                }
            }
        });
    });
}

// -------------------------------------------------------------
// Master Multi-Agent Development Pipeline
// -------------------------------------------------------------
function developFullGameProject(rawInput, aiService, vm, services, onProgress) {
    if (!vm) return Promise.reject(new Error('Scratch VM no provista'));

    var userIdea = typeof rawInput === 'string' ? rawInput : (rawInput && rawInput.explanation) || 'Juego divertido y completo en Scratch';
    var imageService = services && services.imageService;
    var audioService = services && services.audioService;

    // Step 1: Director Agent creates the complete structure & scene layout JSON
    return runDirectorAgent(userIdea, aiService, onProgress)
        .then(function (blueprint) {
            console.log('[AI MultiAgent] 🎮 Director definió estructura del juego:', blueprint.gameTitle);

            // Step 2: Observador validates structure & initializes Stage global variables
            return observeAndInitStructure(blueprint, vm, onProgress)
                .then(function () {
                    // Step 3: Visual Artist creates backdrop and sprites in Scratch VM
                    return runVisualAgent(blueprint, aiService, imageService, vm, onProgress)
                        .then(function (visualRes) {
                            var createdTargets = visualRes.createdTargets || {};
                            console.log('[AI MultiAgent] 🎨 Artista generó sprites.');

                            // Step 4: Observador positions every sprite at Director's exact coordinates
                            return observeAndPositionSprites(blueprint, createdTargets, vm, onProgress)
                                .then(function () {
                                    // Step 5: Human Checkpoint: adjust layout on stage before coding
                                    return humanLayoutCheckpoint(blueprint, createdTargets, vm, onProgress)
                                        .then(function () {
                                            // Step 6: Audio Designer completes soundtrack & SFX (fast, capped at 3-4s)
                                            return runAudioAgent(blueprint, aiService, audioService, vm, createdTargets, onProgress)
                                                .then(function () {
                                                    console.log('[AI MultiAgent] 🎵 Diseñador de audio completó sonidos.');
                                                    if (onProgress) {
                                                        onProgress({
                                                            agent: 'audio',
                                                            percent: 64,
                                                            details: '🎵 [Músico]: Audio procesado con éxito. Pasando a Programación de lógica...'
                                                        });
                                                    }
                                                    // Step 7: Programmer Agent with Modo Creador + human review per sprite
                                                    return runProgrammerAgent(blueprint, aiService, vm, createdTargets, onProgress)
                                                        .then(function () {
                                                            console.log('[AI MultiAgent] ⚡ Programador y Humano completaron los scripts.');
                                                            // Step 8: Final delivery
                                                            return finalizeObserverDelivery(blueprint, createdTargets, vm, onProgress);
                                                        });
                                                })
                                                .catch(function (audioErr) {
                                                    console.warn('[AI MultiAgent] Advertencia de audio (continuando a programación):', audioErr);
                                                    return runProgrammerAgent(blueprint, aiService, vm, createdTargets, onProgress)
                                                        .then(function () {
                                                            return finalizeObserverDelivery(blueprint, createdTargets, vm, onProgress);
                                                        });
                                                });
                                        });
                                });
                        });
                });
        });
}

export {
    runDirectorAgent,
    runVisualAgent,
    runAudioAgent,
    runProgrammerAgent,
    developFullGameProject
};
export default developFullGameProject;
