/**
 * ai-game-engine.js
 * Engine helpers for Scratch VM target creation, variable initialization,
 * asset injection, simulation selection, and code inspection.
 */
import {addAsBackdrop, addToTarget, addNewSpriteFromImage} from './sprite-from-image';
import {blocksToXML} from './ai-block-to-xml';
import {convertJsonToBlockMap} from './ai-block-descriptor';
import {assembleBlocksInOrder} from './ai-block-animator';
import {autoCorrect} from './ai-block-autocorrect';
import createBlocks from './ai-block-creator';

function findTargetByName(vm, name, isStage) {
    if (!vm || !vm.runtime || !vm.runtime.targets) return null;
    var targets = vm.runtime.targets;
    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (isStage && t.isStage) return t;
        if (!isStage && !t.isStage && t.getName() && t.getName().toLowerCase() === String(name).toLowerCase()) {
            return t;
        }
    }
    return null;
}

function ensureStage(vm) {
    if (!vm || !vm.runtime) return null;
    return vm.runtime.getTargetForStage ? vm.runtime.getTargetForStage() : findTargetByName(vm, 'Stage', true);
}

function initGlobalVariables(vm, gameBlueprint) {
    var stage = ensureStage(vm);
    if (!stage || !gameBlueprint) return Promise.resolve();
    var stageId = stage.id;

    // 1. Create variables
    var gVars = gameBlueprint.globalVariables || [];
    for (var vi = 0; vi < gVars.length; vi++) {
        var vName = typeof gVars[vi] === 'string' ? gVars[vi] : (gVars[vi] && gVars[vi].name);
        if (!vName) continue;
        try {
            var existingVar = stage.lookupVariableByNameAndType ? stage.lookupVariableByNameAndType(vName, '') : null;
            if (!existingVar && vm.createVariable) {
                vm.createVariable(stageId, vName, '');
            }
        } catch (e) {
            console.warn('[AI GameEngine] Variable global error:', vName, e.message);
        }
    }

    // 2. Create lists
    var gLists = gameBlueprint.globalLists || [];
    for (var li = 0; li < gLists.length; li++) {
        var lName = typeof gLists[li] === 'string' ? gLists[li] : (gLists[li] && gLists[li].name);
        if (!lName) continue;
        try {
            var existingList = stage.lookupVariableByNameAndType ? stage.lookupVariableByNameAndType(lName, 'list') : null;
            if (!existingList && vm.createVariable) {
                vm.createVariable(stageId, lName, 'list');
            }
        } catch (e) {
            console.warn('[AI GameEngine] Lista global error:', lName, e.message);
        }
    }

    // 3. Create broadcasts
    var gBroadcasts = gameBlueprint.globalBroadcasts || [];
    for (var bi = 0; bi < gBroadcasts.length; bi++) {
        var bName = gBroadcasts[bi];
        if (!bName) continue;
        try {
            var existingMsg = stage.lookupVariableByNameAndType ? stage.lookupVariableByNameAndType(bName, 'broadcast_msg') : null;
            if (!existingMsg && vm.createVariable) {
                vm.createVariable(stageId, bName, 'broadcast_msg');
            }
        } catch (e) {
            console.warn('[AI GameEngine] Broadcast error:', bName, e.message);
        }
    }

    if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
    return Promise.resolve();
}

function addSoundToTarget(blob, soundName, targetId, format, vm) {
    var storage = vm && vm.runtime && vm.runtime.storage;
    if (!storage || !blob || !targetId) return Promise.resolve();
    var dataFormat = format === 'mp3' ? storage.DataFormat.MP3 : storage.DataFormat.WAV;

    return blob.arrayBuffer().then(function (buffer) {
        var asset = storage.createAsset(
            storage.AssetType.Sound,
            dataFormat,
            new Uint8Array(buffer),
            null,
            true
        );
        var vmSound = {
            name: soundName,
            dataFormat: dataFormat,
            asset: asset,
            md5: asset.assetId + '.' + dataFormat,
            assetId: asset.assetId
        };
        return vm.addSound(vmSound, targetId).then(function () {
            if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
        }).catch(function (err) {
            console.warn('[AI Audio] addSound warning:', soundName, err);
        });
    });
}

/**
 * Tool for selecting a Sprite in the Right Stage Panel and Blockly Workspace.
 * Switches active editing target so scripts can be inserted directly.
 */
function selectTargetInStagePanel(targetId, vm) {
    if (!vm || !targetId) return Promise.resolve(null);
    var target = vm.runtime.getTargetById(targetId);
    if (!target) return Promise.resolve(null);

    return new Promise(function (resolve) {
        if (vm.setEditingTarget) {
            vm.setEditingTarget(targetId);
        }
        if (vm.emitTargetsUpdate) {
            vm.emitTargetsUpdate(false);
        }
        if (vm.emitWorkspaceUpdate) {
            vm.emitWorkspaceUpdate();
        }
        // Settle delay for React and Blockly workspace to switch active target
        setTimeout(function () {
            resolve(target);
        }, 80);
    });
}

// Backward-compatible alias
var selectTargetInSimulation = selectTargetInStagePanel;

/**
 * Tool for the Observer to inspect the code inserted in a target.
 * Verifies if blocks were created, checks for hat blocks, and lists opcodes.
 */
function inspectTargetCode(target) {
    if (!target || !target.blocks || !target.blocks._blocks) {
        return { valid: false, blockCount: 0, hasHat: false, opcodes: [] };
    }
    var blocks = target.blocks._blocks;
    var keys = Object.keys(blocks);
    var count = keys.length;
    var hasHat = false;
    var opcodes = [];

    for (var i = 0; i < keys.length; i++) {
        var b = blocks[keys[i]];
        if (b && b.opcode) {
            opcodes.push(b.opcode);
            if (b.opcode.indexOf('event_when') === 0 || b.opcode.indexOf('control_start_as_clone') === 0) {
                hasHat = true;
            }
        }
    }

    return {
        valid: count > 0 && hasHat,
        blockCount: count,
        hasHat: hasHat,
        opcodes: opcodes
    };
}

/**
 * Analyzes and returns the visual dimensions of a Scratch rendered target.
 * Takes into account renderer skin sizes, costume metadata, and current scale.
 */
function getSpriteDimensions(target) {
    if (!target) {
        return { naturalWidth: 80, naturalHeight: 80, width: 80, height: 80 };
    }

    var origW = 0;
    var origH = 0;
    var renderer = target.runtime && target.runtime.renderer;

    // 1. Check renderer skin size (most accurate for rendered targets)
    if (renderer && typeof renderer.getCurrentSkinSize === 'function' && target.drawableID) {
        try {
            var skinSize = renderer.getCurrentSkinSize(target.drawableID);
            if (skinSize && skinSize[0] > 0 && skinSize[1] > 0) {
                origW = skinSize[0];
                origH = skinSize[1];
            }
        } catch (e) {}
    }

    // 2. Check costume metadata
    if (!origW || !origH) {
        var costume = null;
        if (typeof target.getCurrentCostume === 'function') {
            costume = target.getCurrentCostume();
        } else if (target.sprite && target.sprite.costumes && target.sprite.costumes[target.currentCostume]) {
            costume = target.sprite.costumes[target.currentCostume];
        }
        if (costume) {
            var res = costume.bitmapResolution || 1;
            origW = ((costume.size && costume.size[0]) || costume.rawCostumeWidth || 80) / res;
            origH = ((costume.size && costume.size[1]) || costume.rawCostumeHeight || 80) / res;
        }
    }

    if (!origW || origW <= 0) origW = 80;
    if (!origH || origH <= 0) origH = 80;

    var curScale = (typeof target.size === 'number' ? target.size : 100) / 100;
    var curW = origW * curScale;
    var curH = origH * curScale;

    // 3. Check tight bounding box if available from renderer
    if (typeof target.getBounds === 'function') {
        try {
            var b = target.getBounds();
            if (b && typeof b.left === 'number' && typeof b.right === 'number') {
                var bw = Math.abs(b.right - b.left);
                var bh = Math.abs(b.top - b.bottom);
                if (bw > 0 && bh > 0) {
                    curW = bw;
                    curH = bh;
                }
            }
        } catch (e2) {}
    }

    return {
        naturalWidth: Math.round(origW),
        naturalHeight: Math.round(origH),
        width: Math.max(10, Math.round(curW)),
        height: Math.max(10, Math.round(curH))
    };
}

/**
 * Calculates adapted size percentage for a sprite based on its role and natural costume dimensions,
 * so it fits harmoniously on the 480x360 Scratch stage.
 */
function calculateAdaptedSpriteSize(target, spriteDef) {
    var dims = getSpriteDimensions(target);
    var maxNat = Math.max(dims.naturalWidth, dims.naturalHeight);
    if (maxNat <= 0) maxNat = 80;

    var role = (spriteDef && spriteDef.role ? String(spriteDef.role).toLowerCase() : '');
    var name = (spriteDef && spriteDef.name ? String(spriteDef.name).toLowerCase() : '');

    // Ideal target bounding size (px) by role on 480x360 stage
    var targetMaxDim = 72; // default comfortable pixel dimension

    if (role.indexOf('coleccion') !== -1 || role.indexOf('coin') !== -1 || role.indexOf('star') !== -1 ||
        role.indexOf('item') !== -1 || name.indexOf('moneda') !== -1 || name.indexOf('estrella') !== -1) {
        targetMaxDim = 40;
    } else if (role.indexOf('obstac') !== -1 || role.indexOf('hazard') !== -1 || role.indexOf('peligro') !== -1 ||
               role.indexOf('bloque') !== -1 || role.indexOf('roca') !== -1) {
        targetMaxDim = 65;
    } else if (role.indexOf('jugador') !== -1 || role.indexOf('player') !== -1 ||
               name.indexOf('bote') !== -1 || name.indexOf('barco') !== -1 || name.indexOf('nave') !== -1) {
        targetMaxDim = 75;
    } else if (role.indexOf('jefe') !== -1 || role.indexOf('boss') !== -1) {
        targetMaxDim = 115;
    } else if (role.indexOf('enemigo') !== -1 || role.indexOf('enemy') !== -1) {
        targetMaxDim = 65;
    }

    // If Director provided a specific size preference, apply it as a modifier
    if (typeof spriteDef.size === 'number' && spriteDef.size > 0) {
        var multiplier = spriteDef.size / 100;
        multiplier = Math.max(0.65, Math.min(1.4, multiplier));
        targetMaxDim = targetMaxDim * multiplier;
    }

    var adaptedPercent = Math.round((targetMaxDim / maxNat) * 100);
    // Clamp to Scratch safe range (15% to 220%)
    return Math.max(15, Math.min(220, adaptedPercent));
}

/**
 * Clamps coordinates taking into account the sprite's bounding box (width and height)
 * and stage limits (480x360: X [-240, 240], Y [-180, 180]).
 */
function clampPositionWithDimensions(x, y, width, height, margin) {
    margin = typeof margin === 'number' ? margin : 14;
    var halfW = (width || 60) / 2;
    var halfH = (height || 60) / 2;

    var minX = -240 + halfW + margin;
    var maxX = 240 - halfW - margin;
    var minY = -180 + halfH + margin;
    var maxY = 180 - halfH - margin;

    var safeX = typeof x === 'number' ? x : 0;
    var safeY = typeof y === 'number' ? y : 0;

    if (maxX >= minX) {
        safeX = Math.max(minX, Math.min(maxX, safeX));
    } else {
        safeX = 0;
    }

    if (maxY >= minY) {
        safeY = Math.max(minY, Math.min(maxY, safeY));
    } else {
        safeY = 0;
    }

    return { x: Math.round(safeX), y: Math.round(safeY) };
}

/**
 * Positions, scales and analyzes a sprite according to Director blueprint and stage boundaries.
 * Adapts size to role, measures width/height, ensures bounds stay inside 480x360, and prevents overlaps.
 */
function applySpriteLayout(target, spriteDef, existingPlacedSprites, vm) {
    if (!target || !spriteDef) return null;

    // 1. Orientation
    if (typeof spriteDef.direction === 'number') {
        try {
            if (typeof target.setDirection === 'function') target.setDirection(spriteDef.direction);
            else target.direction = spriteDef.direction;
        } catch (dirErr) {
            target.direction = spriteDef.direction;
        }
    }

    // 2. Size adaptation based on natural dimensions & role
    var adaptedSize = calculateAdaptedSpriteSize(target, spriteDef);
    try {
        if (typeof target.setSize === 'function') {
            target.setSize(adaptedSize);
        } else {
            target.size = adaptedSize;
        }
    } catch (sizeErr) {
        target.size = adaptedSize;
    }
    spriteDef.size = adaptedSize;

    // 3. Measure resulting visual dimensions
    var dims = getSpriteDimensions(target);
    var width = dims.width;
    var height = dims.height;
    spriteDef.width = width;
    spriteDef.height = height;

    // 4. Bound-aware position clamping (keeping width and height in mind)
    var targetX = typeof spriteDef.initialX === 'number' ? spriteDef.initialX : 0;
    var targetY = typeof spriteDef.initialY === 'number' ? spriteDef.initialY : 0;
    var clamped = clampPositionWithDimensions(targetX, targetY, width, height, 14);
    var finalX = clamped.x;
    var finalY = clamped.y;

    // 5. Overlap avoidance against existing placed sprites
    if (Array.isArray(existingPlacedSprites)) {
        for (var i = 0; i < existingPlacedSprites.length; i++) {
            var prev = existingPlacedSprites[i];
            if (!prev || prev.target === target) continue;
            var prevW = prev.width || 60;
            var prevH = prev.height || 60;
            var prevX = typeof prev.x === 'number' ? prev.x : 0;
            var prevY = typeof prev.y === 'number' ? prev.y : 0;

            var overlapX = Math.abs(finalX - prevX) < ((width + prevW) / 2 + 10);
            var overlapY = Math.abs(finalY - prevY) < ((height + prevH) / 2 + 10);

            if (overlapX && overlapY) {
                // Shift along Y or X to clear the collision zone
                if (finalY >= prevY) {
                    finalY = prevY + Math.round((height + prevH) / 2 + 18);
                } else {
                    finalY = prevY - Math.round((height + prevH) / 2 + 18);
                }
                var reclamped = clampPositionWithDimensions(finalX, finalY, width, height, 14);
                finalX = reclamped.x;
                finalY = reclamped.y;
            }
        }
    }

    // 6. Apply final coordinates
    try {
        if (typeof target.setXY === 'function') {
            target.setXY(finalX, finalY);
        } else {
            target.x = finalX;
            target.y = finalY;
        }
    } catch (xyErr) {
        target.x = finalX;
        target.y = finalY;
    }

    // 7. Official Scratch GUI synchronization through native postSpriteInfo
    try {
        if (typeof target.postSpriteInfo === 'function') {
            target.postSpriteInfo({
                x: finalX,
                y: finalY,
                size: adaptedSize,
                direction: typeof spriteDef.direction === 'number' ? spriteDef.direction : target.direction
            });
        }
        if (vm && typeof vm.postSpriteInfo === 'function' && vm.editingTarget && vm.editingTarget.id === target.id) {
            vm.postSpriteInfo({
                x: finalX,
                y: finalY,
                size: adaptedSize,
                direction: typeof spriteDef.direction === 'number' ? spriteDef.direction : target.direction
            });
        }
    } catch (postErr) {}

    spriteDef.initialX = finalX;
    spriteDef.initialY = finalY;

    return {
        name: spriteDef.name,
        target: target,
        x: finalX,
        y: finalY,
        width: width,
        height: height,
        size: adaptedSize
    };
}

/**
 * Remastered Sprite Switching ("Pase de Antorcha")
 * Safely switches active editing target in Scratch VM and waits for
 * React GUI and Blockly workspace to fully mount and settle.
 */
function activateAndSyncTarget(targetId, vm) {
    if (!targetId || !vm || !vm.runtime) return Promise.resolve(null);
    var target = vm.runtime.getTargetById(targetId);
    if (!target) return Promise.resolve(null);

    return new Promise(function (resolve) {
        try {
            if (typeof vm.setEditingTarget === 'function') {
                vm.setEditingTarget(targetId);
            }
            if (typeof vm.emitTargetsUpdate === 'function') {
                vm.emitTargetsUpdate(false);
            }
        } catch (e) {
            console.warn('[AI GameEngine] activateAndSyncTarget warning:', e.message);
        }

        // 120ms tick gives React and Blockly DOM tree time to mount the workspace cleanly
        setTimeout(function () {
            resolve(target);
        }, 120);
    });
}

/**
 * Remastered Block Injection into Target Workspace
 * Uses identical canonical pipeline as Modo Creador (blocksToXML + domToWorkspace)
 * to guarantee 100% correct variable mappings and zero Blockly type mismatch crashes.
 */
function injectBlocksToTarget(targetId, parsedBlocks, vm) {
    if (!targetId || !parsedBlocks || !parsedBlocks.blockMap || Object.keys(parsedBlocks.blockMap).length === 0) {
        return Promise.resolve([]);
    }

    var target = (vm && vm.runtime) ? vm.runtime.getTargetById(targetId) : null;
    if (!target) return Promise.resolve([]);

    return activateAndSyncTarget(targetId, vm).then(function () {
        // 1. Auto-correct parsed blocks
        var cleanParsed = parsedBlocks;
        try {
            if (typeof autoCorrect === 'function') {
                cleanParsed = autoCorrect(parsedBlocks);
            }
        } catch (_acErr) {
            cleanParsed = parsedBlocks;
        }

        var Blockly = typeof window !== 'undefined' ? window.Blockly : null;
        var workspace = (Blockly && Blockly.getMainWorkspace) ? Blockly.getMainWorkspace() : null;
        var injectedViaWorkspace = false;

        // 2. Primary canonical path: inject through Blockly workspace (like Modo Creador)
        if (Blockly && workspace && vm && vm.editingTarget && vm.editingTarget.id === targetId) {
            try {
                if (typeof workspace.clear === 'function') {
                    workspace.clear();
                }
                var xml = blocksToXML(cleanParsed, vm);
                if (xml) {
                    var dom = Blockly.Xml.textToDom(xml);
                    Blockly.Xml.domToWorkspace(dom, workspace);
                    injectedViaWorkspace = true;
                    console.log('[AI Logic] Bloques inyectados limpiamente via domToWorkspace para ' + target.getName());
                }
            } catch (wsInjectErr) {
                console.warn('[AI Logic] domToWorkspace falló, usando fallback createBlocks:', wsInjectErr);
            }
        }

        // 3. Fallback path: VM target.blocks direct creation (headless / non-active target)
        if (!injectedViaWorkspace) {
            try {
                createBlocks(vm, cleanParsed, target);
            } catch (crErr) {
                console.warn('[AI Logic] createBlocks error:', crErr);
            }
            try {
                if (vm.emitWorkspaceUpdate) vm.emitWorkspaceUpdate();
            } catch (wsErr) {
                console.warn('[AI Logic] emitWorkspaceUpdate error:', wsErr.message);
            }
        }

        if (vm.emitTargetsUpdate) vm.emitTargetsUpdate(false);

        return new Promise(function (resolve) {
            setTimeout(function () {
                var topIds = (cleanParsed.topBlocks || []).map(function (t) { return t.id; });
                resolve(topIds);
            }, 100);
        });
    });
}

function cleanInitialDefaultSprite(vm, newSpriteNames) {
    if (!vm || !vm.runtime || !vm.runtime.targets) return;
    var targets = vm.runtime.targets.slice();
    var spriteNamesLower = (newSpriteNames || []).map(function (n) { return String(n).toLowerCase(); });

    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.isStage) continue;
        var tName = (t.getName() || '').toLowerCase();
        var isDefaultName = tName.indexOf('sprite') === 0 || tName.indexOf('objeto') === 0;
        if (isDefaultName && spriteNamesLower.indexOf(tName) === -1) {
            var blockCount = t.blocks ? Object.keys(t.blocks._blocks || {}).length : 0;
            if (blockCount === 0 && vm.deleteSprite) {
                try {
                    vm.deleteSprite(t.id);
                } catch (e) {}
            }
        }
    }
}

// ============================================================================
// COMPOSABLE LEGO BEHAVIOR COMPILER (Deterministic, High-Creativity Engine)
// Generates 100% valid, bug-free Scratch 3.0 blocks from modular AI blueprints
// ============================================================================

function compileModularSpriteScripts(spDef, blueprint) {
    var role = (spDef.role || 'ambient').toLowerCase();
    var movement = spDef.movement || {};
    var moveType = movement.type || '';
    var speed = typeof movement.speed === 'number' ? movement.speed : (role === 'jugador' || role === 'player' ? 6 : 4);
    var size = typeof spDef.size === 'number' ? spDef.size : 80;
    var initX = typeof spDef.initialX === 'number' ? spDef.initialX : 0;
    var initY = typeof spDef.initialY === 'number' ? spDef.initialY : 0;
    var dir = typeof spDef.direction === 'number' ? spDef.direction : 90;

    var globalVars = (blueprint && blueprint.globalVariables) || [];
    var scoreVar = globalVars.find(function (v) { return (/punto|score|moneda/i).test(v); }) || 'puntuacion';
    var livesVar = globalVars.find(function (v) { return (/vida|live|salud/i).test(v); }) || 'vidas';

    var playerDef = (blueprint && blueprint.sprites || []).find(function (s) {
        var r = (s.role || '').toLowerCase();
        return r === 'jugador' || r === 'player';
    });
    var playerName = playerDef ? playerDef.name : '';

    var scripts = [];

    // Helper: start header blocks (canonical Scratch starts upon green flag)
    function createStartBlocks(extraBlocks) {
        var list = [
            { opcode: 'event_whenflagclicked' },
            { opcode: 'looks_setsizeto', inputs: { SIZE: size } },
            { opcode: 'motion_gotoxy', inputs: { X: initX, Y: initY } },
            { opcode: 'motion_pointindirection', inputs: { DIRECTION: dir } },
            { opcode: 'motion_setrotationstyle', fields: { STYLE: 'left-right' } },
            { opcode: 'looks_show' }
        ];
        if (extraBlocks && extraBlocks.length > 0) {
            list = list.concat(extraBlocks);
        }
        return list;
    }

    // -------------------------------------------------------------
    // 1. PLAYER ROLE (Modular Control Archetypes)
    // -------------------------------------------------------------
    if (role === 'jugador' || role === 'player') {
        var playerSubstack = [];

        if (moveType === 'platformer') {
            var jumpPower = movement.jumpPower || 12;
            var gravity = movement.gravity || 4;
            var floorY = movement.floorY || -120;

            playerSubstack.push(
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'right arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: 90 } },
                            { opcode: 'motion_changexby', inputs: { DX: speed } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'left arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: -90 } },
                            { opcode: 'motion_changexby', inputs: { DX: -speed } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_and',
                            inputs: {
                                OPERAND1: {
                                    opcode: 'operator_or',
                                    inputs: {
                                        OPERAND1: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'up arrow' } },
                                        OPERAND2: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'space' } }
                                    }
                                },
                                OPERAND2: {
                                    opcode: 'operator_lt',
                                    inputs: {
                                        OPERAND1: { opcode: 'motion_yposition' },
                                        OPERAND2: floorY + 8
                                    }
                                }
                            }
                        },
                        SUBSTACK: [
                            { opcode: 'motion_changeyby', inputs: { DY: jumpPower } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_gt',
                            inputs: {
                                OPERAND1: { opcode: 'motion_yposition' },
                                OPERAND2: floorY
                            }
                        },
                        SUBSTACK: [
                            { opcode: 'motion_changeyby', inputs: { DY: -gravity } }
                        ]
                    }
                },
                { opcode: 'motion_ifonedgebounce' }
            );
        } else if (moveType === 'space_thrust') {
            playerSubstack.push(
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'right arrow' } },
                        SUBSTACK: [{ opcode: 'motion_turnright', inputs: { DEGREES: 6 } }]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'left arrow' } },
                        SUBSTACK: [{ opcode: 'motion_turnleft', inputs: { DEGREES: 6 } }]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'up arrow' } },
                        SUBSTACK: [{ opcode: 'motion_movesteps', inputs: { STEPS: speed } }]
                    }
                },
                { opcode: 'motion_ifonedgebounce' }
            );
        } else if (moveType === 'mouse_follow') {
            playerSubstack.push(
                { opcode: 'motion_pointtowards', fields: { TOWARDS: '_mouse_' } },
                { opcode: 'motion_movesteps', inputs: { STEPS: speed } },
                { opcode: 'motion_ifonedgebounce' }
            );
        } else {
            // Default: 4-Way Smooth Directional Movement (Arrows + WASD)
            playerSubstack.push(
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'right arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: 90 } },
                            { opcode: 'motion_changexby', inputs: { DX: speed } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'left arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_pointindirection', inputs: { DIRECTION: -90 } },
                            { opcode: 'motion_changexby', inputs: { DX: -speed } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'up arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_changeyby', inputs: { DY: speed } }
                        ]
                    }
                },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: { opcode: 'sensing_keypressed', fields: { KEY_OPTION: 'down arrow' } },
                        SUBSTACK: [
                            { opcode: 'motion_changeyby', inputs: { DY: -speed } }
                        ]
                    }
                },
                { opcode: 'motion_ifonedgebounce' }
            );
        }

        scripts.push({
            blocks: createStartBlocks([
                {
                    opcode: 'control_forever',
                    inputs: { SUBSTACK: playerSubstack }
                }
            ])
        });

        // Shooting ability if configured
        if (spDef.canShoot || (spDef.abilities && spDef.abilities.indexOf('shoot') >= 0)) {
            scripts.push({
                blocks: [
                    { opcode: 'event_whenkeypressed', fields: { KEY_OPTION: 'space' } },
                    { opcode: 'event_broadcast', inputs: { BROADCAST_INPUT: 'disparo' } },
                    { opcode: 'control_wait', inputs: { DURATION: 0.25 } }
                ]
            });
        }

        return scripts;
    }

    // -------------------------------------------------------------
    // 2. ENEMY / OBSTACLE ROLE (Modular Hazard Archetypes)
    // -------------------------------------------------------------
    if (role === 'enemigo' || role === 'enemy' || role === 'obstaculo' || role === 'obstacle') {
        var enemySubstack = [];

        if (moveType === 'rain_fall') {
            enemySubstack.push(
                { opcode: 'motion_changeyby', inputs: { DY: -speed } },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_lt',
                            inputs: {
                                OPERAND1: { opcode: 'motion_yposition' },
                                OPERAND2: -160
                            }
                        },
                        SUBSTACK: [
                            {
                                opcode: 'motion_gotoxy',
                                inputs: {
                                    X: { opcode: 'operator_random', inputs: { FROM: -210, TO: 210 } },
                                    Y: 170
                                }
                            }
                        ]
                    }
                }
            );
        } else if (moveType === 'chase_target' && playerName) {
            enemySubstack.push(
                { opcode: 'motion_pointtowards', fields: { TOWARDS: playerName } },
                { opcode: 'motion_movesteps', inputs: { STEPS: speed } },
                { opcode: 'motion_ifonedgebounce' }
            );
        } else {
            // Default Patrol & Bounce
            enemySubstack.push(
                { opcode: 'motion_movesteps', inputs: { STEPS: speed } },
                { opcode: 'motion_ifonedgebounce' }
            );
        }

        // Damage Collision with Player
        if (playerName) {
            var collisionResponse = (moveType === 'rain_fall') ? [
                { opcode: 'data_changevariableby', fields: { VARIABLE: livesVar }, inputs: { VALUE: -1 } },
                {
                    opcode: 'motion_gotoxy',
                    inputs: {
                        X: { opcode: 'operator_random', inputs: { FROM: -200, TO: 200 } },
                        Y: 170
                    }
                },
                { opcode: 'control_wait', inputs: { DURATION: 0.4 } }
            ] : [
                { opcode: 'data_changevariableby', fields: { VARIABLE: livesVar }, inputs: { VALUE: -1 } },
                { opcode: 'motion_turnright', inputs: { DEGREES: 180 } },
                { opcode: 'motion_movesteps', inputs: { STEPS: 20 } },
                { opcode: 'control_wait', inputs: { DURATION: 0.5 } }
            ];

            enemySubstack.push({
                opcode: 'control_if',
                inputs: {
                    CONDITION: { opcode: 'sensing_touchingobject', fields: { TOUCHINGOBJECTMENU: playerName } },
                    SUBSTACK: collisionResponse
                }
            });
        }

        scripts.push({
            blocks: createStartBlocks([
                {
                    opcode: 'control_forever',
                    inputs: { SUBSTACK: enemySubstack }
                }
            ])
        });

        return scripts;
    }

    // -------------------------------------------------------------
    // 3. COLLECTIBLE / GOAL ROLE (Modular Reward Archetypes)
    // -------------------------------------------------------------
    if (role === 'recolectable' || role === 'collectible' || role === 'item' || role === 'moneda' || role === 'coin' || role === 'meta') {
        var collectSubstack = [
            { opcode: 'motion_turnright', inputs: { DEGREES: 2 } }
        ];

        if (moveType === 'rain_fall') {
            collectSubstack.push(
                { opcode: 'motion_changeyby', inputs: { DY: -speed } },
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_lt',
                            inputs: {
                                OPERAND1: { opcode: 'motion_yposition' },
                                OPERAND2: -160
                            }
                        },
                        SUBSTACK: [
                            {
                                opcode: 'motion_gotoxy',
                                inputs: {
                                    X: { opcode: 'operator_random', inputs: { FROM: -200, TO: 200 } },
                                    Y: 170
                                }
                            }
                        ]
                    }
                }
            );
        }

        if (playerName) {
            var isGoal = role === 'meta' || role === 'goal';
            collectSubstack.push({
                opcode: 'control_if',
                inputs: {
                    CONDITION: { opcode: 'sensing_touchingobject', fields: { TOUCHINGOBJECTMENU: playerName } },
                    SUBSTACK: isGoal ? [
                        { opcode: 'data_changevariableby', fields: { VARIABLE: scoreVar }, inputs: { VALUE: 50 } },
                        { opcode: 'event_broadcast', inputs: { BROADCAST_INPUT: 'victoria' } }
                    ] : [
                        { opcode: 'data_changevariableby', fields: { VARIABLE: scoreVar }, inputs: { VALUE: 10 } },
                        {
                            opcode: 'motion_gotoxy',
                            inputs: {
                                X: { opcode: 'operator_random', inputs: { FROM: -190, TO: 190 } },
                                Y: { opcode: 'operator_random', inputs: { FROM: -120, TO: 120 } }
                            }
                        }
                    ]
                }
            });
        }

        scripts.push({
            blocks: createStartBlocks([
                {
                    opcode: 'control_forever',
                    inputs: { SUBSTACK: collectSubstack }
                }
            ])
        });

        return scripts;
    }

    // -------------------------------------------------------------
    // 4. DEFAULT / AMBIENT ENTITIES
    // -------------------------------------------------------------
    scripts.push({
        blocks: createStartBlocks([
            {
                opcode: 'control_forever',
                inputs: {
                    SUBSTACK: [
                        { opcode: 'motion_movesteps', inputs: { STEPS: speed } },
                        { opcode: 'motion_ifonedgebounce' }
                    ]
                }
            }
        ])
    });

    return scripts;
}

function compileModularStageScripts(blueprint) {
    var globalVars = (blueprint && blueprint.globalVariables) || [];
    var scoreVar = globalVars.find(function (v) { return (/punto|score|moneda/i).test(v); }) || 'puntuacion';
    var livesVar = globalVars.find(function (v) { return (/vida|live|salud/i).test(v); }) || 'vidas';

    var flagBlocks = [
        { opcode: 'event_whenflagclicked' },
        { opcode: 'data_setvariableto', fields: { VARIABLE: scoreVar }, inputs: { VALUE: 0 } },
        { opcode: 'data_setvariableto', fields: { VARIABLE: livesVar }, inputs: { VALUE: 3 } }
    ];

    var supervisorBlocks = [
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
    ];

    return [
        { blocks: flagBlocks },
        { blocks: supervisorBlocks }
    ];
}

export {
    findTargetByName,
    ensureStage,
    initGlobalVariables,
    addSoundToTarget,
    selectTargetInStagePanel,
    selectTargetInSimulation,
    activateAndSyncTarget,
    inspectTargetCode,
    getSpriteDimensions,
    calculateAdaptedSpriteSize,
    clampPositionWithDimensions,
    applySpriteLayout,
    injectBlocksToTarget,
    cleanInitialDefaultSprite,
    compileModularSpriteScripts,
    compileModularStageScripts
};

