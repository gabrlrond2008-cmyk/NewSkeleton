import {OPCODES, STATEMENT_INPUTS, BOOLEAN_INPUTS, STACK_LIKE, VALUE_LIKE} from './ai-block-validator';

function uid() {
    var soup = '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var id = [];
    for (var i = 0; i < 20; i++) {
        id.push(soup.charAt(Math.random() * soup.length));
    }
    return id.join('');
}

function levenshtein(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (var j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
            var cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[m][n];
}

function closestOpcode(malformed) {
    var best = null;
    var bestDist = 4;
    for (var op in OPCODES) {
        if (!Object.prototype.hasOwnProperty.call(OPCODES, op)) continue;
        var dist = levenshtein(malformed, op);
        if (dist < bestDist) {
            bestDist = dist;
            best = op;
        }
    }
    return best;
}

var HAT_OPCODES = {
    event_whenflagclicked: 1,
    event_whenkeypressed: 1,
    event_whenstageclicked: 1,
    event_whenthisspriteclicked: 1,
    event_whenbackdropswitchesto: 1,
    event_whengreaterthan: 1,
    event_whenbroadcastreceived: 1,
    control_start_as_clone: 1
};

function assignPositions(topBlocks) {
    var startX = 30;
    var startY = 30;
    for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        if (!block) continue;
        block.x = startX;
        block.y = startY;
        startY += 80;
    }
}

function autoCorrect(blockData) {
    if (!blockData || !blockData.blockMap) return blockData;
    var blockMap = blockData.blockMap;
    var topBlocks = blockData.topBlocks || [];
    var changes = [];

    // Phase 1: Fix opcode typos
    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b = blockMap[id];
        if (!b || b.shadow) continue;
        if (OPCODES[b.opcode]) continue;
        var corrected = closestOpcode(b.opcode);
        if (corrected) {
            changes.push('Opcodigo "' + b.opcode + '" → "' + corrected + '"');
            b.opcode = corrected;
        }
    }

    // Phase 1.5: Fix concatenated opcodes (AI writes opcode+suffix as one token e.g. "sensing_touchingmousepointer")
    var SHADOW_FOR_MENU = {
        TOUCHINGOBJECTMENU: 'sensing_touchingobjectmenu',
        DISTANCETOMENU: 'sensing_distancetomenu',
        KEY_OPTION: 'sensing_keyoptions',
        CHOICE: 'event_broadcast_menu',
        STYLE: 'motion_setrotationstyle',
        TO: 'motion_goto_menu',
        TOWARDS: 'motion_pointtowards_menu',
        COSTUME: 'looks_costume',
        BACKDROP: 'looks_backdrops',
        SOUND_MENU: 'sound_sounds_menu',
        CLONE_OPTION: 'control_create_clone_of_menu',
        CURRENTMENU: 'sensing_current',
        DRAG_MODE: 'sensing_setdragmode',
        NUMBER_NAME: 'math_number',
        PROPERTY: 'sensing_of_object_menu'
    };
    var CONCAT_MENU_MAP = {
        sensing_touchingobject: 'TOUCHINGOBJECTMENU',
        sensing_distanceto: 'DISTANCETOMENU',
        event_whenkeypressed: 'KEY_OPTION',
        event_whenbroadcastreceived: 'CHOICE',
        motion_setrotationstyle: 'STYLE',
        motion_goto: 'TO',
        motion_gotoxy: 'TO',
        motion_glideto: 'TO',
        motion_pointtowards: 'TOWARDS',
        looks_switchcostumeto: 'COSTUME',
        looks_switchbackdropto: 'BACKDROP',
        sound_play: 'SOUND_MENU',
        sound_playuntildone: 'SOUND_MENU',
        control_create_clone_of: 'CLONE_OPTION',
        sensing_keypressed: 'KEY_OPTION',
        sensing_current: 'CURRENTMENU',
        looks_costumenumbername: 'NUMBER_NAME',
        looks_backdropnumbername: 'NUMBER_NAME',
        sensing_setdragmode: 'DRAG_MODE',
        motion_xposition: 'NUMBER_NAME',
        motion_yposition: 'NUMBER_NAME',
        motion_direction: 'NUMBER_NAME',
        looks_size: 'NUMBER_NAME',
        sensing_loudness: 'NUMBER_NAME',
        sensing_timer: 'NUMBER_NAME',
        sensing_answer: 'NUMBER_NAME',
        operator_round: 'NUMBER_NAME',
        operator_mod: 'NUMBER_NAME',
        operator_add: 'NUMBER_NAME',
        operator_subtract: 'NUMBER_NAME',
        operator_multiply: 'NUMBER_NAME',
        operator_divide: 'NUMBER_NAME',
        operator_random: 'NUMBER_NAME'
    };
    function longestCommonPrefix(a, b) {
        var len = Math.min(a.length, b.length);
        for (var i = 0; i < len; i++) {
            if (a[i] !== b[i]) return i;
        }
        return len;
    }
    for (var concatId in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, concatId)) continue;
        var cb = blockMap[concatId];
        if (!cb || cb.shadow) continue;
        if (OPCODES[cb.opcode]) continue;
        var bestKnown = null;
        var bestLcp = 0;
        for (var knownOp in OPCODES) {
            if (!Object.prototype.hasOwnProperty.call(OPCODES, knownOp)) continue;
            if (knownOp.indexOf('menu') !== -1 || knownOp.indexOf('options') !== -1) continue;
            if (knownOp.length >= cb.opcode.length) continue;
            var lcp = longestCommonPrefix(cb.opcode, knownOp);
            if (lcp > bestLcp || (lcp === bestLcp && bestKnown && lcp > 0 && Math.abs(cb.opcode.length - knownOp.length) < Math.abs(cb.opcode.length - bestKnown.length))) {
                bestLcp = lcp;
                bestKnown = knownOp;
            }
        }
        if (bestKnown && bestLcp >= 10 && bestLcp >= bestKnown.length * 0.6) {
            var suffix = cb.opcode.substring(bestLcp);
            changes.push('Opcodigo concatenado "' + cb.opcode + '" → "' + bestKnown + '"' + (suffix ? ' (sufijo: "' + suffix + '")' : ''));
            cb.opcode = bestKnown;
            if (suffix && CONCAT_MENU_MAP[bestKnown]) {
                var fieldName = CONCAT_MENU_MAP[bestKnown];
                if (!cb.inputs[fieldName] && !cb.fields[fieldName]) {
                    var shadowOp = SHADOW_FOR_MENU[fieldName] || 'math_number';
                    var shadowFields = {NUM: {name: 'NUM', value: '0'}};
                    if (shadowOp === 'sensing_touchingobjectmenu') {
                        shadowFields = {TOUCHINGOBJECTMENU: {name: 'TOUCHINGOBJECTMENU', value: suffix}};
                    } else if (shadowOp === 'sensing_distancetomenu') {
                        shadowFields = {DISTANCETOMENU: {name: 'DISTANCETOMENU', value: suffix}};
                    } else if (shadowOp === 'sensing_keyoptions') {
                        shadowFields = {KEY_OPTION: {name: 'KEY_OPTION', value: suffix}};
                    } else if (shadowOp === 'event_broadcast_menu') {
                        shadowFields = {BROADCAST_OPTION: {name: 'BROADCAST_OPTION', value: suffix}};
                    } else if (shadowOp === 'looks_costume') {
                        shadowFields = {COSTUME: {name: 'COSTUME', value: suffix}};
                    } else if (shadowOp === 'looks_backdrops') {
                        shadowFields = {BACKDROP: {name: 'BACKDROP', value: suffix}};
                    } else if (shadowOp === 'sound_sounds_menu') {
                        shadowFields = {SOUND_MENU: {name: 'SOUND_MENU', value: suffix}};
                    } else if (shadowOp === 'control_create_clone_of_menu') {
                        shadowFields = {CLONE_OPTION: {name: 'CLONE_OPTION', value: suffix}};
                    } else if (shadowOp === 'motion_goto_menu') {
                        shadowFields = {TO: {name: 'TO', value: suffix}};
                    } else if (shadowOp === 'motion_pointtowards_menu') {
                        shadowFields = {TOWARDS: {name: 'TOWARDS', value: suffix}};
                    } else if (shadowOp === 'text') {
                        shadowFields = {TEXT: {name: 'TEXT', value: suffix}};
                    }
                    var shadowId = uid();
                    blockMap[shadowId] = {
                        id: shadowId, opcode: shadowOp, fields: shadowFields,
                        inputs: {}, next: null, parent: cb.id,
                        topLevel: false, shadow: true, mutation: null
                    };
                    cb.inputs[fieldName] = {name: fieldName, block: null, shadow: shadowId};
                }
            }
        }
    }

    // Phase 2: Remove reporters/booleans from topBlocks
    var cleanedTop = [];
    for (var ti = 0; ti < topBlocks.length; ti++) {
        var tb = topBlocks[ti];
        if (!tb) continue;
        var shape = OPCODES[tb.opcode];
        if (shape === 'reporter' || shape === 'boolean') {
            changes.push('Reporter/booleano "' + tb.opcode + '" quitado de top-level');
            tb.topLevel = false;
            tb.parent = null;
        } else {
            cleanedTop.push(tb);
        }
    }
    topBlocks = cleanedTop;

    // Phase 3: Fix end blocks with next
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b3 = blockMap[id];
        if (!b3 || b3.shadow) continue;
        var b3Sh = OPCODES[b3.opcode];
        if (b3Sh === 'end' && b3.next) {
            changes.push('End "' + b3.opcode + '" — next quitado');
            b3.next = null;
        }
    }

    // Phase 4: Fix hats in middle of chain (break chain)
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow || !b.next) continue;
        var nextBlock = blockMap[b.next];
        if (nextBlock && !nextBlock.shadow && HAT_OPCODES[nextBlock.opcode]) {
            changes.push('Hat "' + nextBlock.opcode + '" en medio de script — cadena partida');
            b.next = null;
            nextBlock.parent = null;
            if (topBlocks.indexOf(nextBlock) === -1) {
                topBlocks.push(nextBlock);
            }
        }
    }

    // Phase 5: Insert missing hat if no hats exist but there are top blocks
    var hasHat = false;
    for (var ti5 = 0; ti5 < topBlocks.length; ti5++) {
        if (HAT_OPCODES[topBlocks[ti5].opcode]) {
            hasHat = true;
            break;
        }
    }

    if (!hasHat && topBlocks.length > 0) {
        var hatId = uid();
        var firstBlock = topBlocks[0];
        var hatBlock = {
            id: hatId,
            opcode: 'event_whenflagclicked',
            inputs: {},
            fields: {},
            next: firstBlock.id,
            parent: null,
            topLevel: true,
            shadow: false,
            mutation: null
        };
        firstBlock.parent = hatId;
        firstBlock.topLevel = false;
        blockMap[hatId] = hatBlock;
        topBlocks[0] = hatBlock;
        changes.push('Hat faltante: event_whenflagclicked insertado');
    }

    // Phase 6: Ensure topLevel consistency
    for (var ti6 = 0; ti6 < topBlocks.length; ti6++) {
        var tb2 = topBlocks[ti6];
        if (tb2) tb2.topLevel = true;
    }
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow) continue;
        if (topBlocks.indexOf(b) === -1) {
            b.topLevel = false;
        }
    }

    // Phase 7.5: Fix boolean inputs — clear invalid shadows and disconnect non-boolean child blocks
    // (uses BOOLEAN_INPUTS imported from ai-block-validator)
    for (var boolId in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, boolId)) continue;
        var boolBlock = blockMap[boolId];
        if (!boolBlock || boolBlock.shadow) continue;
        var boolInputs = BOOLEAN_INPUTS[boolBlock.opcode];
        if (!boolInputs) continue;
        for (var boolIname in boolBlock.inputs) {
            if (!boolInputs[boolIname]) continue;
            var boolInput = boolBlock.inputs[boolIname];
            boolInput.shadow = null;
            if (!boolInput.block) continue;
            var childBlock = blockMap[boolInput.block];
            if (!childBlock || childBlock.shadow) continue;
            var childShape = OPCODES[childBlock.opcode];
            if (childShape !== 'boolean') {
                changes.push('"' + boolBlock.opcode + '"."' + boolIname + '" no es booleano → desconectado');
                boolInput.block = null;
            }
        }
    }

    // Phase 7.6: Fix reporter/boolean in next chain — disconnect them
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow || !b.next) continue;
        var nextBlock = blockMap[b.next];
        if (!nextBlock || nextBlock.shadow) continue;
        var nextShape = OPCODES[nextBlock.opcode];
        if (nextShape === 'reporter' || nextShape === 'boolean') {
            changes.push('Reporter/booleano "' + nextBlock.opcode + '" en cadena next — desconectado');
            b.next = null;
            nextBlock.parent = null;
        }
    }

    // Phase 7.7: Fix input shape incompatibilities:
    //   - stack/hat/c/end in value inputs → disconnect
    //   - reporter/boolean in statement inputs → disconnect
    //   - non-boolean in boolean inputs → disconnect
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow) continue;
        var parentInputs = BOOLEAN_INPUTS[b.opcode];
        var parentStatements = STATEMENT_INPUTS[b.opcode];
        for (var iname in b.inputs) {
            var inputEntry = b.inputs[iname];
            if (!inputEntry.block) continue;
            var childBlock = blockMap[inputEntry.block];
            if (!childBlock || childBlock.shadow) continue;
            var childShape = OPCODES[childBlock.opcode];
            if (!childShape) continue;

            var isStatement = parentStatements && parentStatements[iname];
            var isBoolean = parentInputs && parentInputs[iname];

            if (isStatement && VALUE_LIKE[childShape]) {
                changes.push('Reporter/booleano "' + childBlock.opcode + '" en statement input "' + iname + '" de "' + b.opcode + '" — desconectado');
                inputEntry.block = null;
            } else if (isBoolean && childShape !== 'boolean') {
                changes.push('No-booleano "' + childBlock.opcode + '" en boolean input "' + iname + '" de "' + b.opcode + '" — desconectado');
                inputEntry.block = null;
            } else if (!isStatement && !isBoolean && STACK_LIKE[childShape]) {
                changes.push('Stack/hat/c/end "' + childBlock.opcode + '" en value input "' + iname + '" de "' + b.opcode + '" — desconectado');
                inputEntry.block = null;
            }
        }
    }

    // Phase 7.8: Fill missing numeric operands of arithmetic operators with 0,
    // so operator_add/subtract/multiply/divide/random/mod never render broken.
    var ARITH_OPERANDS = {
        operator_add: ['NUM1', 'NUM2'],
        operator_subtract: ['NUM1', 'NUM2'],
        operator_multiply: ['NUM1', 'NUM2'],
        operator_divide: ['NUM1', 'NUM2'],
        operator_mod: ['NUM1', 'NUM2'],
        operator_random: ['FROM', 'TO']
    };
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow) continue;
        var reqOperands = ARITH_OPERANDS[b.opcode];
        if (!reqOperands) continue;
        for (var oi = 0; oi < reqOperands.length; oi++) {
            var opName = reqOperands[oi];
            if (b.inputs[opName]) continue;
            var shadowId = uid();
            blockMap[shadowId] = {
                id: shadowId, opcode: 'math_number',
                fields: {NUM: {name: 'NUM', value: '0'}},
                inputs: {}, next: null, parent: b.id,
                topLevel: false, shadow: true, mutation: null
            };
            b.inputs[opName] = {name: opName, block: null, shadow: shadowId};
        }
    }

    // Phase 7.9: Prune unreachable dead blocks after control_stop (all / this script)
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow || b.opcode !== 'control_stop' || !b.next) continue;
        var stopOpt = b.fields && b.fields.STOP_OPTION ? (b.fields.STOP_OPTION.value || b.fields.STOP_OPTION) : 'all';
        if (stopOpt === 'all' || stopOpt === 'this script') {
            var deadId = b.next;
            b.next = null;
            while (deadId && blockMap[deadId]) {
                var deadBlock = blockMap[deadId];
                var nextDead = deadBlock.next;
                delete blockMap[deadId];
                deadId = nextDead;
            }
            changes.push('Bloques muertos tras control_stop eliminados');
        }
    }

    // Phase 7.10: Sanitize freezing waits in key movement loops
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow || b.opcode !== 'control_wait') continue;
        var waitDuration = b.inputs && b.inputs.DURATION ? parseFloat(b.inputs.DURATION.value || b.inputs.DURATION) : 0;
        if (waitDuration > 0.15) {
            var pId = b.parent;
            var insideKeyIf = false;
            while (pId && blockMap[pId]) {
                var pb = blockMap[pId];
                if (pb.opcode === 'control_if' && pb.inputs && pb.inputs.CONDITION) {
                    var cBlock = blockMap[pb.inputs.CONDITION.block];
                    if (cBlock && cBlock.opcode === 'sensing_keypressed') {
                        var keyOpt = cBlock.fields && cBlock.fields.KEY_OPTION ? (cBlock.fields.KEY_OPTION.value || cBlock.fields.KEY_OPTION) : '';
                        if (/arrow|w|a|s|d/i.test(String(keyOpt))) {
                            insideKeyIf = true;
                            break;
                        }
                    }
                }
                pId = pb.parent;
            }
            if (insideKeyIf) {
                if (b.inputs.DURATION && typeof b.inputs.DURATION === 'object') {
                    b.inputs.DURATION.value = 0.02;
                } else {
                    b.inputs.DURATION = 0.02;
                }
                changes.push('Espera de ' + waitDuration + 's en bucle de teclas reducida a 0.02s (evita congelar controles)');
            }
        }
    }

    // Phase 7.11: Safe collision invulnerability (prevents instant-death 30 FPS damage spam)
    for (id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        b = blockMap[id];
        if (!b || b.shadow || (b.opcode !== 'control_if' && b.opcode !== 'control_if_else')) continue;
        var condId = b.inputs && b.inputs.CONDITION ? b.inputs.CONDITION.block : null;
        var condBlock = condId ? blockMap[condId] : null;
        if (!condBlock || condBlock.opcode !== 'sensing_touchingobject') continue;

        var subId = b.inputs.SUBSTACK ? b.inputs.SUBSTACK.block : null;
        var hasLivesReduction = false;
        var hasProtection = false;
        var lastSubBlock = null;

        var curr = subId;
        while (curr && blockMap[curr]) {
            var blk = blockMap[curr];
            lastSubBlock = blk;
            if (blk.opcode === 'data_changevariableby') {
                var varName = blk.fields && blk.fields.VARIABLE ? (blk.fields.VARIABLE.value || blk.fields.VARIABLE) : '';
                if (/vida|live|salud|hp/i.test(String(varName))) {
                    hasLivesReduction = true;
                }
            }
            if (blk.opcode === 'control_wait' || blk.opcode === 'motion_gotoxy' || blk.opcode === 'event_broadcast') {
                hasProtection = true;
            }
            curr = blk.next;
        }

        if (hasLivesReduction && !hasProtection && lastSubBlock) {
            var protWaitId = uid();
            var shadowNumId = uid();
            blockMap[shadowNumId] = {
                id: shadowNumId, opcode: 'math_number',
                fields: {NUM: {name: 'NUM', value: '0.5'}},
                inputs: {}, next: null, parent: protWaitId,
                topLevel: false, shadow: true, mutation: null
            };
            blockMap[protWaitId] = {
                id: protWaitId, opcode: 'control_wait',
                inputs: {DURATION: {name: 'DURATION', block: shadowNumId, shadow: shadowNumId}},
                fields: {}, next: null, parent: lastSubBlock.id,
                topLevel: false, shadow: false, mutation: null
            };
            lastSubBlock.next = protWaitId;
            changes.push('Añadido tiempo de invulnerabilidad (0.5s) tras restar vida por colisión (evita muerte instantánea en 1 frame)');
        }
    }

    // Phase 8: Assign positions
    assignPositions(topBlocks);

    if (changes.length > 0) {
        console.log('[AI Blocks] Auto-correcciones aplicadas:', changes);
    }

    // Preserve the parse errors produced earlier (auto-init warnings, bad
    // symbols, empty conditions...). They must reach the UI and the fix loop.
    var keptErrors = (blockData && blockData.errors) || [];

    return {
        blockMap: blockMap,
        topBlocks: topBlocks,
        errors: keptErrors.slice(),
        valid: keptErrors.length === 0,
        changes: changes
    };
}

export {autoCorrect};
