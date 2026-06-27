import {TEMPLATES, expandTemplate} from './ai-block-templates';

function uid() {
    var soup = '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var id = [];
    for (var i = 0; i < 20; i++) {
        id.push(soup.charAt(Math.random() * soup.length));
    }
    return id.join('');
}

var FIELD_KEYS = {
    data_variable: {VARIABLE: 1},
    data_setvariableto: {VARIABLE: 1},
    data_changevariableby: {VARIABLE: 1},
    data_showvariable: {VARIABLE: 1},
    data_hidevariable: {VARIABLE: 1},
    data_addtolist: {LIST: 1},
    data_deleteoflist: {LIST: 1},
    data_deletealloflist: {LIST: 1},
    data_insertatlist: {LIST: 1, INDEX: 1},
    data_replaceitemoflist: {LIST: 1, INDEX: 1},
    data_itemoflist: {LIST: 1, INDEX: 1},
    data_itemnumoflist: {LIST: 1},
    data_lengthoflist: {LIST: 1},
    data_listcontainsitem: {LIST: 1},
    data_showlist: {LIST: 1},
    data_hidelist: {LIST: 1},
    event_whenkeypressed: {KEY_OPTION: 1},
    event_whenbroadcastreceived: {CHOICE: 1},
    motion_setrotationstyle: {STYLE: 1},
    looks_gotofrontback: {FRONT_BACK: 1},
    looks_costumenumbername: {NUMBER_NAME: 1},
    looks_backdropnumbername: {NUMBER_NAME: 1},
    sensing_setdragmode: {DRAG_MODE: 1},
    sensing_current: {CURRENTMENU: 1},
    motion_xposition: {NUMBER_NAME: 1},
    motion_yposition: {NUMBER_NAME: 1},
    motion_direction: {NUMBER_NAME: 1},
    looks_size: {NUMBER_NAME: 1},
    sensing_loudness: {NUMBER_NAME: 1},
    sensing_timer: {NUMBER_NAME: 1},
    sensing_of: {PROPERTY: 1},
    sensing_answer: {NUMBER_NAME: 1},
    operator_round: {NUMBER_NAME: 1},
    operator_mod: {NUMBER_NAME: 1},
    operator_add: {NUMBER_NAME: 1},
    operator_subtract: {NUMBER_NAME: 1},
    operator_multiply: {NUMBER_NAME: 1},
    operator_divide: {NUMBER_NAME: 1},
    operator_random: {NUMBER_NAME: 1}
};

var SHADOW_MAP = {
    STEPS: 'math_number', DEGREES: 'math_number', TIMES: 'math_number',
    DURATION: 'math_number', SECS: 'math_number', DX: 'math_number',
    DY: 'math_number', X: 'math_number', Y: 'math_number',
    DIRECTION: 'math_number', VALUE: 'math_number', CHANGE: 'math_number',
    SIZE: 'math_number', NUM: 'math_number', NUM1: 'math_number',
    NUM2: 'math_number', FROM: 'math_number', TO: 'math_number',
    OPERAND1: 'math_number', OPERAND2: 'math_number', INDEX: 'math_number',
    LETTER: 'math_number', BEATS: 'math_number', NOTE: 'math_number',
    TEMPO: 'math_number', VOLUME: 'math_number',
    MESSAGE: 'text', QUESTION: 'text', STRING1: 'text', STRING2: 'text',
    ITEM: 'text', EFFECT: 'text', CONDITION: 'boolean',
    BROADCAST_INPUT: 'event_broadcast_menu',
    TOUCHINGOBJECTMENU: 'sensing_touchingobjectmenu',
    DISTANCETOMENU: 'sensing_distancetomenu',
    CLONE_OPTION: 'control_create_clone_of_menu',
    KEY_OPTION: 'sensing_keyoptions',
    SOUND_MENU: 'sound_sounds_menu',
    TOWARDS: 'motion_pointtowards_menu',
    TO: 'motion_goto_menu',
    BACKDROP: 'looks_backdrops',
    COSTUME: 'looks_costume'
};

var MENU_FIELDS = {
    event_broadcast_menu: 'BROADCAST_OPTION',
    sensing_touchingobjectmenu: 'TOUCHINGOBJECTMENU',
    sensing_distancetomenu: 'DISTANCETOMENU',
    control_create_clone_of_menu: 'CLONE_OPTION',
    sensing_keyoptions: 'KEY_OPTION',
    sound_sounds_menu: 'SOUND_MENU',
    motion_pointtowards_menu: 'TOWARDS',
    motion_goto_menu: 'TO',
    looks_backdrops: 'BACKDROP',
    looks_costume: 'COSTUME'
};

function getShadow(inputName) {
    return SHADOW_MAP[inputName] || 'math_number';
}

function parseInlineParams(str) {
    var params = [];
    var re = /("[^"]*"|\S+)/g;
    var m;
    while ((m = re.exec(str)) !== null) {
        var part = m[1];
        var eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
            var key = part.substring(0, eqIdx);
            var rawValue = part.substring(eqIdx + 1);
            var gtIdx = rawValue.indexOf('>');
            if (gtIdx >= 0) rawValue = rawValue.substring(0, gtIdx);
            var value = rawValue.replace(/^"(.*)"$/, '$1');
            params.push({key: key, value: value});
        }
    }
    return params;
}

function parseLine(line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return null;

    // Statement: KEY: (nothing after colon)
    var stmtMatch = trimmed.match(/^>?([A-Z_][A-Z_0-9]*):\s*$/);
    if (stmtMatch) {
        return {type: 'statement', name: stmtMatch[1]};
    }

    // Nested value: KEY: >opcode< rest
    var nestedMatch = trimmed.match(/^>?([A-Z_][A-Z_0-9]*):\s*>(.+)<\s*(.*)$/);
    if (nestedMatch) {
        return {
            type: 'valueNested', name: nestedMatch[1],
            nestedOpcode: nestedMatch[2].trim(),
            nestedParams: nestedMatch[3].trim() ? parseInlineParams(nestedMatch[3].trim()) : []
        };
    }

    // Separate-line value/field: KEY: value
    var kvMatch = trimmed.match(/^>?([A-Z_][A-Z_0-9]*):\s+(.+)$/);
    if (kvMatch) {
        return {type: 'kv', name: kvMatch[1], rawValue: kvMatch[2].trim()};
    }

    // Bare KEY=VALUE param for current block (no > prefix, no colon)
    var bareParamMatch = trimmed.match(/^(\w+)=(.+)$/);
    if (bareParamMatch) {
        return {type: 'inlineParam', key: bareParamMatch[1], value: bareParamMatch[2]};
    }

    // Block with inline params: >opcode KEY=VALUE KEY=VALUE
    var inlineMatch = trimmed.match(/^>?(\w+)\s+(.+)$/);
    if (inlineMatch) {
        return {
            type: 'block', opcode: inlineMatch[1],
            inlineParams: parseInlineParams(inlineMatch[2])
        };
    }

    // Block opcode only: >opcode
    var opcode = trimmed.replace(/^>/, '').trim();
    if (opcode && opcode.indexOf(' ') === -1 && opcode.indexOf(':') === -1) {
        return {type: 'block', opcode: opcode, inlineParams: null};
    }

    return null;
}

function processInlineParams(block, params, blockMap, fieldKeys) {
    if (!params) return;
    for (var pi = 0; pi < params.length; pi++) {
        var p = params[pi];
        if (fieldKeys && fieldKeys[p.key]) {
            block.fields[p.key] = {name: p.key, value: p.value};
        } else {
            var shadowType = getShadow(p.key);
            var shadowFields = {NUM: {name: 'NUM', value: '0'}};
            if (shadowType === 'text') {
                shadowFields = {TEXT: {name: 'TEXT', value: p.value}};
            } else if (MENU_FIELDS[shadowType]) {
                shadowFields = {};
                shadowFields[MENU_FIELDS[shadowType]] = {name: MENU_FIELDS[shadowType], value: p.value};
            } else if (shadowType === 'boolean') {
                shadowFields = {BOOL: {name: 'BOOL', value: 'false'}};
            } else {
                var numVal = parseFloat(p.value);
                shadowFields.NUM.value = isNaN(numVal) ? '0' : String(numVal);
            }
            var shadowId = uid();
            blockMap[shadowId] = {
                id: shadowId, opcode: shadowType, fields: shadowFields,
                inputs: {}, next: null, parent: block.id,
                topLevel: false, shadow: true, mutation: null
            };
            block.inputs[p.key] = {name: p.key, block: null, shadow: shadowId};
        }
    }
}

function extractDescriptor(text) {
    if (!text) return null;
    // Normalize line endings
    var normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = normalized.split('\n');
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '@bloques') {
            var result = lines.slice(i + 1).join('\n');
            return result;
        }
    }
    return null;
}

function detectTemplate(text) {
    var match = text.match(/@bloques\s+template:\s*(\w+)(?:\s+params:\s*(.+))?/i);
    if (!match) return null;
    var name = match[1].toLowerCase();
    var params = {};
    if (match[2]) {
        var parts = parseInlineParams(match[2]);
        for (var i = 0; i < parts.length; i++) {
            params[parts[i].key] = parts[i].value;
        }
    }
    return {name: name, params: params};
}

function convertJsonToBlockMap(jsonObj) {
    var blockMap = {};
    var topBlocks = [];
    var errors = [];

    function processBlock(blockObj, parentId, isTopLevel) {
        if (!blockObj || !blockObj.opcode) return null;
        var blockId = uid();
        var block = {
            id: blockId,
            opcode: blockObj.opcode,
            inputs: {},
            fields: {},
            next: null,
            parent: parentId || null,
            topLevel: isTopLevel,
            shadow: false,
            mutation: null
        };

        blockMap[blockId] = block;

        if (blockObj.fields) {
            for (var key in blockObj.fields) {
                if (Object.prototype.hasOwnProperty.call(blockObj.fields, key)) {
                    block.fields[key] = { name: key, value: String(blockObj.fields[key]) };
                }
            }
        }

        if (blockObj.inputs) {
            for (var inputName in blockObj.inputs) {
                if (Object.prototype.hasOwnProperty.call(blockObj.inputs, inputName)) {
                    var val = blockObj.inputs[inputName];
                    if (val === null || val === undefined) continue;

                    if (Array.isArray(val)) {
                        var prevChildId = null;
                        var firstChildId = null;
                        for (var ci = 0; ci < val.length; ci++) {
                            var childId = processBlock(val[ci], blockId, false);
                            if (childId) {
                                if (ci === 0) {
                                    firstChildId = childId;
                                } else if (prevChildId) {
                                    blockMap[prevChildId].next = childId;
                                    blockMap[childId].parent = prevChildId;
                                }
                                prevChildId = childId;
                            }
                        }
                        if (firstChildId) {
                            block.inputs[inputName] = { name: inputName, block: firstChildId, shadow: null };
                        }
                    } else if (typeof val === 'object' && val.opcode) {
                        var childId = processBlock(val, blockId, false);
                        if (childId) {
                            var shadowId = uid();
                            var shadowType = getShadow(inputName);
                            var shadowFields = {};
                            if (shadowType === 'math_number') {
                                shadowFields = { NUM: { name: 'NUM', value: '0' } };
                            } else if (shadowType === 'boolean') {
                                shadowFields = { BOOL: { name: 'BOOL', value: 'false' } };
                            }
                            blockMap[shadowId] = {
                                id: shadowId, opcode: shadowType, fields: shadowFields,
                                inputs: {}, next: null, parent: blockId,
                                topLevel: false, shadow: true, mutation: null
                            };
                            block.inputs[inputName] = { name: inputName, block: childId, shadow: shadowId };
                        }
                    } else {
                        var valStr = String(val);
                        var fieldKeys = FIELD_KEYS[block.opcode] || {};
                        if (fieldKeys[inputName]) {
                            block.fields[inputName] = { name: inputName, value: valStr };
                        } else {
                            var shadowId = uid();
                            var shadowType = getShadow(inputName);
                            var shadowFields = {};
                            if (shadowType === 'text') {
                                shadowFields = { TEXT: { name: 'TEXT', value: valStr } };
                            } else if (MENU_FIELDS[shadowType]) {
                                shadowFields = {};
                                shadowFields[MENU_FIELDS[shadowType]] = { name: MENU_FIELDS[shadowType], value: valStr };
                            } else if (shadowType === 'boolean') {
                                shadowFields = { BOOL: { name: 'BOOL', value: valStr === 'true' ? 'true' : 'false' } };
                            } else {
                                var numVal = parseFloat(valStr);
                                shadowFields = { NUM: { name: 'NUM', value: isNaN(numVal) ? '0' : String(numVal) } };
                            }
                            blockMap[shadowId] = {
                                id: shadowId, opcode: shadowType, fields: shadowFields,
                                inputs: {}, next: null, parent: blockId,
                                topLevel: false, shadow: true, mutation: null
                            };
                            block.inputs[inputName] = { name: inputName, block: null, shadow: shadowId };
                        }
                    }
                }
            }
        }

        return blockId;
    }

    if (jsonObj.scripts && Array.isArray(jsonObj.scripts)) {
        for (var si = 0; si < jsonObj.scripts.length; si++) {
            var script = jsonObj.scripts[si];
            var scriptBlocks = script.blocks;
            if (!scriptBlocks || !Array.isArray(scriptBlocks) || scriptBlocks.length === 0) continue;

            var prevBlockId = null;
            for (var bi = 0; bi < scriptBlocks.length; bi++) {
                var blockId = processBlock(scriptBlocks[bi], null, bi === 0);
                if (blockId) {
                    if (bi === 0) {
                        topBlocks.push(blockMap[blockId]);
                    } else if (prevBlockId) {
                        blockMap[prevBlockId].next = blockId;
                        blockMap[blockId].parent = prevBlockId;
                    }
                    prevBlockId = blockId;
                }
            }
        }
    }

    assignPositions(topBlocks, blockMap);

    var total = Object.keys(blockMap).length;
    var nonShadow = 0;
    for (var cid in blockMap) {
        if (!blockMap[cid].shadow) nonShadow++;
    }
    console.log('[AI Blocks] Parsed JSON ' + total + ' total blocks (' + nonShadow + ' non-shadow, ' + topBlocks.length + ' top-level)');

    return {
        blockMap: blockMap,
        topBlocks: topBlocks,
        errors: errors,
        valid: errors.length === 0
    };
}

function parse(text) {
    if (text) {
        var jsonObj = null;
        var cleanText = text.trim();
        try {
            jsonObj = JSON.parse(cleanText);
        } catch (e) {
            var jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    jsonObj = JSON.parse(jsonMatch[1]);
                } catch (e2) {}
            }
        }
        if (jsonObj && jsonObj.scripts && Array.isArray(jsonObj.scripts)) {
            return convertJsonToBlockMap(jsonObj);
        }
    }

    var tmpl = detectTemplate(text);
    if (tmpl) {
        if (TEMPLATES[tmpl.name]) {
            var result = expandTemplate(tmpl.name, tmpl.params);
            console.log('[AI Blocks] Template "' + tmpl.name + '" expanded: ' + Object.keys(result.blockMap).length + ' blocks');
            return result;
        }
        return {blockMap: {}, topBlocks: [], errors: ['Template "' + tmpl.name + '" no encontrado'], valid: false};
    }

    var descriptor = extractDescriptor(text);
    if (!descriptor) {
        console.log('[AI Blocks] No @bloques descriptor found in response');
        return null;
    }
    console.log('[AI Blocks] Raw descriptor text:', descriptor.substring(0, 200));

    var rawLines = descriptor.split('\n');
    var blockMap = {};
    var topBlocks = [];
    var stack = [];
    var prevId = null;

    for (var li = 0; li < rawLines.length; li++) {
        var parsed = parseLine(rawLines[li]);
        if (!parsed) continue;

        if (parsed.type === 'block') {
            var id = uid();
            var indent = rawLines[li].search(/\S/);

            while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }

            var parentId = null;
            if (stack.length > 0) {
                var top = stack[stack.length - 1];
                if (top.statementName) {
                    parentId = top.blockId;
                    if (top.lastChildId) {
                        var lastChild = blockMap[top.lastChildId];
                        if (lastChild) lastChild.next = id;
                    } else {
                        var parentBlock = blockMap[top.blockId];
                        if (parentBlock && parentBlock.inputs[top.statementName]) {
                            parentBlock.inputs[top.statementName].block = id;
                        }
                    }
                    top.lastChildId = id;
                } else {
                    parentId = top.blockId;
                    if (top.lastChildId) {
                        var lc = blockMap[top.lastChildId];
                        if (lc) lc.next = id;
                    }
                    top.lastChildId = id;
                }
            }

            var isTopLevel = !parentId && indent <= 2;
            if (!parentId && prevId) {
                if (blockMap[prevId]) blockMap[prevId].next = id;
                isTopLevel = false;
            }

            var block = {
                id: id, opcode: parsed.opcode,
                inputs: {}, fields: {},
                next: null, parent: parentId || null,
                topLevel: isTopLevel,
                shadow: false, mutation: null
            };

            processInlineParams(block, parsed.inlineParams, blockMap, FIELD_KEYS[parsed.opcode]);

            if (isTopLevel) topBlocks.push(block);
            blockMap[id] = block;
            stack.push({blockId: id, indent: indent, lastChildId: null, statementName: null});
            prevId = id;

        } else if (parsed.type === 'statement') {
            if (stack.length > 0) {
                while (stack.length > 0 && stack[stack.length - 1].isValue) {
                    stack.pop();
                }
                if (stack.length > 0) {
                    var stmtParent = stack[stack.length - 1];
                    stmtParent.statementName = parsed.name;
                    stmtParent.lastChildId = null;
                    if (!blockMap[stmtParent.blockId].inputs[parsed.name]) {
                        blockMap[stmtParent.blockId].inputs[parsed.name] = {
                            name: parsed.name, block: null
                        };
                    }
                }
            }

        } else if (parsed.type === 'kv') {
            if (stack.length > 0) {
                while (stack.length > 0 && stack[stack.length - 1].isValue) {
                    stack.pop();
                }
                if (stack.length === 0) continue;
                var vParent = stack[stack.length - 1];
                var key = parsed.name;
                var val = parsed.rawValue;
                var currentOpcode = blockMap[vParent.blockId].opcode;
                var fieldKeys = FIELD_KEYS[currentOpcode] || {};

                if (fieldKeys[key]) {
                    blockMap[vParent.blockId].fields[key] = {name: key, value: val};
                } else {
                    var shadowType = getShadow(key);
                    var shadowFields = {NUM: {name: 'NUM', value: '0'}};
                    if (typeof val === 'string' && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
                        shadowType = 'text';
                        shadowFields = {TEXT: {name: 'TEXT', value: val.slice(1, -1)}};
                    } else if (MENU_FIELDS[shadowType]) {
                        shadowFields = {};
                        shadowFields[MENU_FIELDS[shadowType]] = {name: MENU_FIELDS[shadowType], value: val};
                    } else if (shadowType === 'boolean') {
                        shadowFields = {BOOL: {name: 'BOOL', value: 'false'}};
                    } else if (shadowType === 'math_number') {
                        var numVal = parseFloat(val);
                        shadowFields.NUM.value = isNaN(numVal) ? '0' : String(numVal);
                    }
                    var shadowId = uid();
                    blockMap[shadowId] = {
                        id: shadowId, opcode: shadowType, fields: shadowFields,
                        inputs: {}, next: null, parent: vParent.blockId,
                        topLevel: false, shadow: true, mutation: null
                    };
                    blockMap[vParent.blockId].inputs[key] = {
                        name: key, block: null, shadow: shadowId
                    };
                }
            }

        } else if (parsed.type === 'valueNested') {
            if (stack.length > 0) {
                var nIndent = rawLines[li].search(/\S/);
                while (stack.length > 0 && nIndent <= stack[stack.length - 1].indent) {
                    stack.pop();
                }
                var nParent = stack[stack.length - 1];
                var nestedId = uid();
                var nestedBlock = {
                    id: nestedId, opcode: parsed.nestedOpcode,
                    inputs: {}, fields: {},
                    next: null, parent: nParent.blockId,
                    topLevel: false, shadow: false, mutation: null
                };
                processInlineParams(nestedBlock, parsed.nestedParams, blockMap, FIELD_KEYS[parsed.nestedOpcode]);
                blockMap[nestedId] = nestedBlock;
                var shadowId = uid();
                var shadowType = getShadow(parsed.name);
                var shadowFields = {};
                if (shadowType === 'math_number') {
                    shadowFields = {NUM: {name: 'NUM', value: '0'}};
                } else if (shadowType === 'boolean') {
                    shadowFields = {BOOL: {name: 'BOOL', value: 'false'}};
                }
                blockMap[shadowId] = {
                    id: shadowId, opcode: shadowType, fields: shadowFields,
                    inputs: {}, next: null, parent: nParent.blockId,
                    topLevel: false, shadow: true, mutation: null
                };
                blockMap[nParent.blockId].inputs[parsed.name] = {
                    name: parsed.name, block: nestedId, shadow: shadowId
                };
                stack.push({blockId: nestedId, indent: nIndent, lastChildId: null, statementName: null, isValue: true});
            }

        } else if (parsed.type === 'inlineParam') {
            if (stack.length > 0) {
                var ipParent = stack[stack.length - 1];
                var ipBlock = blockMap[ipParent.blockId];
                if (ipBlock) {
                    processInlineParams(ipBlock, [{key: parsed.key, value: parsed.value}], blockMap, FIELD_KEYS[ipBlock.opcode]);
                }
            }
        }
    }

    var errors = [];
    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b = blockMap[id];
        if (b.shadow) continue;
        if (b.topLevel && b.parent) {
            b.topLevel = false;
        }
        if (b.opcode.indexOf('event_when') === 0 && !b.topLevel) {
            errors.push('Hat "' + b.opcode + '" no es top-level');
        }
    }

    assignPositions(topBlocks, blockMap);

    var total = Object.keys(blockMap).length;
    var nonShadow = 0;
    for (var cid in blockMap) {
        if (!blockMap[cid].shadow) nonShadow++;
    }
    console.log('[AI Blocks] Parsed ' + total + ' total blocks (' + nonShadow + ' non-shadow, ' + topBlocks.length + ' top-level)');
    if (errors.length > 0) console.warn('[AI Blocks] Parse errors:', errors);

    return {
        blockMap: blockMap,
        topBlocks: topBlocks,
        errors: errors,
        valid: errors.length === 0
    };
}

function assignPositions(topBlocks, blockMap) {
    var startX = 30;
    var startY = 30;
    var ySpacing = 60;
    for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        if (!block) continue;
        if (block.x !== undefined || block.y !== undefined) continue;
        block.x = startX;
        block.y = startY;
        var totalHeight = 40;
        var current = block.next;
        var depth = 0;
        while (current && blockMap[current] && depth < 100) {
            totalHeight += 36;
            current = blockMap[current].next;
            depth++;
        }
        startY += totalHeight + ySpacing;
    }
}

function extractDescriptorFromResponse(responseText) {
    var tmpl = detectTemplate(responseText);
    if (tmpl) return '@bloques template:' + tmpl.name + ' params:' + JSON.stringify(tmpl.params);
    return extractDescriptor(responseText);
}

export {parse, extractDescriptorFromResponse};
