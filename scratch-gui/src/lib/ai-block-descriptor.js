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
    operator_random: {NUMBER_NAME: 1},
    control_stop: {STOP_OPTION: 1}
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

var BOOLEAN_INPUT_MAP = {
    control_if: {CONDITION: 1},
    control_if_else: {CONDITION: 1},
    control_wait_until: {CONDITION: 1},
    control_repeat_until: {CONDITION: 1},
    operator_and: {OPERAND1: 1, OPERAND2: 1},
    operator_or: {OPERAND1: 1, OPERAND2: 1},
    operator_not: {OPERAND: 1}
};

function getShadow(inputName, opcode) {
    if (inputName === 'SUBSTACK' || inputName === 'SUBSTACK2') return null;
    if (inputName === 'CONDITION') return null;
    if (opcode && BOOLEAN_INPUT_MAP[opcode] && BOOLEAN_INPUT_MAP[opcode][inputName]) return null;
    var type = SHADOW_MAP[inputName];
    if (type === 'boolean') return null;
    return type || 'math_number';
}

function isCleanNumber(s) {
    return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(String(s).trim());
}

// If a non-numeric value written as plain text looks like a variable or the
// "answer" reporter, build the real reporter block instead of silently using 0.
// Returns null when the value looks like a symbol/expression (should be an error).
function valueReporter(raw) {
    var v = String(raw == null ? '' : raw).trim();
    if (!v) return null;
    if (isCleanNumber(v)) return null;
    if (/[*+\-<>=/\\^%]/.test(v)) return null;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_ ]+$/.test(v)) return null;
    var lower = v.toLowerCase();
    if (lower === 'respuesta' || lower === 'answer') {
        return {opcode: 'sensing_answer'};
    }
    return {opcode: 'data_variable', fields: {VARIABLE: v}};
}

// If a variable is referenced (data_variable) but its value is never actually
// set (no data_setvariableto, or a data_setvariableto with an EMPTY value), the
// variable ends up empty. That is a logic bug the model must avoid: it should
// assign the intended value before using it. As a safety net, wherever a
// referenced variable is missing a real value we fill it with its own name as
// the text value (so "if <answer = [hola]>" compares against "hola") and
// surface a clear warning.
function autoInitVariables(blockMap, topBlocks, errors) {
    var referenced = {};
    var nonEmptySet = {}; // varName -> true when it has a real value assigned
    var emptySetIds = {}; // varName -> id of a set block whose value is empty

    // Check pre-existing variables in VM target or stage
    if (typeof window !== 'undefined' && window.vm) {
        var editingTarget = window.vm.editingTarget;
        if (editingTarget && editingTarget.variables) {
            for (var evId in editingTarget.variables) {
                if (editingTarget.variables[evId] && editingTarget.variables[evId].name) {
                    nonEmptySet[editingTarget.variables[evId].name] = true;
                }
            }
        }
        var stage = window.vm.runtime && window.vm.runtime.getTargetForStage();
        if (stage && stage.variables) {
            for (var svId in stage.variables) {
                if (stage.variables[svId] && stage.variables[svId].name) {
                    nonEmptySet[stage.variables[svId].name] = true;
                }
            }
        }
    }

    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b = blockMap[id];
        if (!b) continue;
        if (b.opcode === 'data_variable') {
            var fv = b.fields && b.fields.VARIABLE ? b.fields.VARIABLE.value : null;
            if (fv) referenced[fv] = true;
            continue;
        }
        if (b.opcode === 'data_changevariableby') {
            var cvn = b.fields && b.fields.VARIABLE ? b.fields.VARIABLE.value : null;
            if (cvn) {
                referenced[cvn] = true;
                nonEmptySet[cvn] = true; // changevariableby modifies/initializes the variable
            }
            continue;
        }
        if (b.opcode === 'data_setvariableto') {
            var vn = b.fields && b.fields.VARIABLE ? b.fields.VARIABLE.value : null;
            if (!vn) continue;
            var vin = b.inputs && b.inputs.VALUE;
            var filled = false;
            if (vin && vin.block) {
                filled = true; // a reporter is plugged in = has a real value
            } else if (vin && vin.shadow) {
                var sh = blockMap[vin.shadow];
                if (sh) {
                    var isEmptyText = sh.opcode === 'text' && sh.fields && sh.fields.TEXT &&
                        (sh.fields.TEXT.value === undefined || sh.fields.TEXT.value === null ||
                        sh.fields.TEXT.value === '');
                    if (isEmptyText) {
                        if (!emptySetIds[vn]) emptySetIds[vn] = id;
                    } else {
                        filled = true; // number shadow or non-empty text = real value
                    }
                }
            } else {
                filled = true; // no VALUE input at all → treat as assigned
            }
            if (filled) nonEmptySet[vn] = true;
        }
    }

    var toFill = [];
    for (var name in referenced) {
        if (referenced[name] && !nonEmptySet[name]) toFill.push(name);
    }
    if (toFill.length === 0) return;

    // 1) Fill existing set blocks that held an empty value.
    for (var fi = 0; fi < toFill.length; fi++) {
        var fName = toFill[fi];
        var fSetId = emptySetIds[fName];
        if (fSetId) {
            var fSet = blockMap[fSetId];
            if (fSet && fSet.inputs.VALUE && fSet.inputs.VALUE.shadow) {
                var fSh = blockMap[fSet.inputs.VALUE.shadow];
                if (fSh && fSh.fields) {
                    if (fSh.fields.TEXT) fSh.fields.TEXT.value = '0';
                    else if (fSh.fields.NUM) fSh.fields.NUM.value = '0';
                }
            }
        }
    }

    // 2) For any referenced variable with no set block at all, prepend an init to 0.
    var targetTop = null;
    for (var ti = 0; ti < topBlocks.length; ti++) {
        var tb = topBlocks[ti];
        if (tb && !tb.shadow) {
            targetTop = tb;
            break;
        }
    }
    var initIds = [];
    if (targetTop) {
        var oldNext = targetTop.next;
        for (var i = 0; i < toFill.length; i++) {
            var varName = toFill[i];
            if (emptySetIds[varName]) continue; // already handled above
            var initId = uid();
            var valueId = uid();
            blockMap[valueId] = {
                id: valueId, opcode: 'math_number',
                fields: {NUM: {name: 'NUM', value: '0'}},
                inputs: {}, next: null, parent: targetTop.id,
                topLevel: false, shadow: true, mutation: null
            };
            blockMap[initId] = {
                id: initId, opcode: 'data_setvariableto',
                fields: {VARIABLE: {name: 'VARIABLE', value: varName}},
                inputs: {VALUE: {name: 'VALUE', block: null, shadow: valueId}},
                next: null, parent: targetTop.id,
                topLevel: false, shadow: false, mutation: null
            };
            initIds.push(initId);
        }
        if (initIds.length > 0) {
            targetTop.next = initIds[0];
            for (var k = 0; k < initIds.length; k++) {
                blockMap[initIds[k]].next = (k + 1 < initIds.length) ? initIds[k + 1] : oldNext;
            }
        }
    }
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

function processInlineParams(block, params, blockMap, fieldKeys, errors) {
    if (!params) return;
    for (var pi = 0; pi < params.length; pi++) {
        var p = params[pi];
        if (fieldKeys && fieldKeys[p.key]) {
            block.fields[p.key] = {name: p.key, value: p.value};
        } else {
            var shadowType = getShadow(p.key);
            var shadowFields = {NUM: {name: 'NUM', value: '0'}};
            var ipReporterId = null;
            var noShadow = false;
            if (shadowType === 'text') {
                shadowFields = {TEXT: {name: 'TEXT', value: p.value}};
            } else if (MENU_FIELDS[shadowType]) {
                shadowFields = {};
                shadowFields[MENU_FIELDS[shadowType]] = {name: MENU_FIELDS[shadowType], value: p.value};
            } else if (shadowType === 'boolean') {
                noShadow = true;
                if (errors) {
                    errors.push('Input booleano "' + p.key + '" de "' + block.opcode + '" no puede recibir un literal ("' + (p.value || 'vacío') + '"). La condición debe ser un reporter booleano: operator_equals/gt/lt, sensing_keypressed, operator_and/or/not, etc.');
                }
            } else {
                var numVal = parseFloat(p.value);
                var numStr = isNaN(numVal) ? '0' : String(numVal);
                if (errors && !isCleanNumber(p.value) && /\S/.test(p.value)) {
                    var ipRep = valueReporter(p.value);
                    if (ipRep) {
                        ipReporterId = uid();
                        var ipFields = {};
                        if (ipRep.fields && ipRep.fields.VARIABLE) {
                            ipFields.VARIABLE = {name: 'VARIABLE', value: ipRep.fields.VARIABLE};
                        }
                        blockMap[ipReporterId] = {
                            id: ipReporterId, opcode: ipRep.opcode, fields: ipFields,
                            inputs: {}, next: null, parent: block.id,
                            topLevel: false, shadow: false, mutation: null
                        };
                        shadowType = 'text';
                        shadowFields = {TEXT: {name: 'TEXT', value: p.value}};
                    } else {
                        errors.push('Valor no numérico "' + p.value + '" en input "' + p.key + '" de "' + block.opcode + '" → se usó 0. Si era una variable, usá "data_variable" (fields.VARIABLE); si era una operación, anidá el bloque aritmético (operator_add/subtract/multiply/divide).');
                        shadowFields.NUM.value = numStr;
                    }
                } else {
                    shadowFields.NUM.value = numStr;
                }
            }
            var shadowId = null;
            if (!noShadow) {
                shadowId = uid();
                blockMap[shadowId] = {
                    id: shadowId, opcode: shadowType, fields: shadowFields,
                    inputs: {}, next: null, parent: block.id,
                    topLevel: false, shadow: true, mutation: null
                };
            }
            block.inputs[p.key] = {name: p.key, block: ipReporterId, shadow: shadowId};
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

var OPCODE_ALIAS_MAP = {
    operator_less_than: 'operator_lt',
    operator_greater_than: 'operator_gt',
    operator_equal: 'operator_equals',
    operator_equal_to: 'operator_equals',
    control_if_then: 'control_if',
    sensing_touching: 'sensing_touchingobject',
    motion_point_towards: 'motion_pointtowards',
    motion_goto_xy: 'motion_gotoxy',
    looks_say_for_secs: 'looks_sayforsecs',
    looks_think_for_secs: 'looks_thinkforsecs'
};

var INPUT_ALIAS_MAP = {
    substack: 'SUBSTACK', then: 'SUBSTACK', body: 'SUBSTACK', if_true: 'SUBSTACK', do: 'SUBSTACK', script: 'SUBSTACK', blocks: 'SUBSTACK',
    inner_blocks: 'SUBSTACK', inner: 'SUBSTACK', loop_body: 'SUBSTACK', statements: 'SUBSTACK', children: 'SUBSTACK',
    substack2: 'SUBSTACK2', else: 'SUBSTACK2', if_false: 'SUBSTACK2', else_branch: 'SUBSTACK2',
    condition: 'CONDITION', cond: 'CONDITION', if: 'CONDITION',
    value: 'VALUE', val: 'VALUE',
    steps: 'STEPS', duration: 'DURATION', secs: 'DURATION', sec: 'DURATION', seconds: 'DURATION', x: 'X', y: 'Y', dx: 'DX', dy: 'DY',
    change: 'CHANGE', size: 'SIZE', times: 'TIMES', question: 'QUESTION', prompt: 'QUESTION',
    message: 'MESSAGE', text: 'MESSAGE', seems: 'SEEMS', think: 'THINK',
    operand1: 'OPERAND1', op1: 'OPERAND1', a: 'OPERAND1', left: 'OPERAND1',
    operand2: 'OPERAND2', op2: 'OPERAND2', b: 'OPERAND2', right: 'OPERAND2',
    num1: 'NUM1', num2: 'NUM2',
    string1: 'STRING1', string2: 'STRING2',
    from: 'FROM', to: 'TO',
    touchingobjectmenu: 'TOUCHINGOBJECTMENU', object: 'TOUCHINGOBJECTMENU', target: 'TOUCHINGOBJECTMENU', touching: 'TOUCHINGOBJECTMENU',
    distancetomenu: 'DISTANCETOMENU', distanceto: 'DISTANCETOMENU'
};

var FIELD_ALIAS_MAP = {
    variable: 'VARIABLE', var: 'VARIABLE', varname: 'VARIABLE', name: 'VARIABLE',
    list: 'LIST',
    choice: 'CHOICE', broadcast: 'CHOICE',
    key: 'KEY_OPTION', key_option: 'KEY_OPTION',
    costume: 'COSTUME', backdrop: 'BACKDROP', sound: 'SOUND_MENU', clone: 'CLONE_OPTION',
    style: 'STYLE', front_back: 'FRONT_BACK', drag_mode: 'DRAG_MODE',
    stop_option: 'STOP_OPTION',
    touchingobjectmenu: 'TOUCHINGOBJECTMENU', object: 'TOUCHINGOBJECTMENU', target: 'TOUCHINGOBJECTMENU', touching: 'TOUCHINGOBJECTMENU',
    distancetomenu: 'DISTANCETOMENU', distanceto: 'DISTANCETOMENU'
};

function normalizeBlockObj(rawObj) {
    if (!rawObj || typeof rawObj !== 'object') return rawObj;
    var norm = Object.assign({}, rawObj);

    // Opcode aliasing (e.g. operator_less_than -> operator_lt)
    if (norm.opcode) {
        var lowerOpcode = String(norm.opcode).toLowerCase();
        if (OPCODE_ALIAS_MAP[lowerOpcode]) {
            norm.opcode = OPCODE_ALIAS_MAP[lowerOpcode];
        }
    }

    if (!norm.fields) norm.fields = {};
    if (!norm.inputs) norm.inputs = {};

    for (var k in rawObj) {
        if (!Object.prototype.hasOwnProperty.call(rawObj, k)) continue;
        if (k === 'opcode' || k === 'inputs' || k === 'fields' || k === 'next' || k === 'id' ||
            k === 'proccode' || k === 'argumentnames' || k === 'argumentdefaults' || k === 'warp') continue;
        var lowerKey = k.toLowerCase();
        var canonicalField = FIELD_ALIAS_MAP[lowerKey];
        var canonicalInput = INPUT_ALIAS_MAP[lowerKey];

        if (canonicalField && norm.fields[canonicalField] === undefined) {
            norm.fields[canonicalField] = rawObj[k];
        } else if (canonicalInput && norm.inputs[canonicalInput] === undefined) {
            norm.inputs[canonicalInput] = rawObj[k];
        }
    }

    var normInputs = {};
    for (var iname in norm.inputs) {
        if (!Object.prototype.hasOwnProperty.call(norm.inputs, iname)) continue;
        var canonicalIname = INPUT_ALIAS_MAP[iname.toLowerCase()] || iname;
        normInputs[canonicalIname] = norm.inputs[iname];
    }
    norm.inputs = normInputs;

    var normFields = {};
    for (var fname in norm.fields) {
        if (!Object.prototype.hasOwnProperty.call(norm.fields, fname)) continue;
        var canonicalFname = FIELD_ALIAS_MAP[fname.toLowerCase()] || fname;
        normFields[canonicalFname] = norm.fields[fname];
    }
    norm.fields = normFields;

    // Opcode-specific input mappings to prevent Scratch blocks from ignoring inputs
    var op = norm.opcode;
    if (op === 'looks_sayforsecs' || op === 'looks_thinkforsecs') {
        if (norm.inputs.DURATION !== undefined && norm.inputs.SECS === undefined) {
            norm.inputs.SECS = norm.inputs.DURATION;
            delete norm.inputs.DURATION;
        }
    } else if (op === 'control_wait') {
        if (norm.inputs.SECS !== undefined && norm.inputs.DURATION === undefined) {
            norm.inputs.DURATION = norm.inputs.SECS;
            delete norm.inputs.SECS;
        }
    } else if (op === 'operator_join') {
        if (norm.inputs.OPERAND1 !== undefined && norm.inputs.STRING1 === undefined) {
            norm.inputs.STRING1 = norm.inputs.OPERAND1;
            delete norm.inputs.OPERAND1;
        }
        if (norm.inputs.OPERAND2 !== undefined && norm.inputs.STRING2 === undefined) {
            norm.inputs.STRING2 = norm.inputs.OPERAND2;
            delete norm.inputs.OPERAND2;
        }
        if (norm.inputs.NUM1 !== undefined && norm.inputs.STRING1 === undefined) {
            norm.inputs.STRING1 = norm.inputs.NUM1;
            delete norm.inputs.NUM1;
        }
        if (norm.inputs.NUM2 !== undefined && norm.inputs.STRING2 === undefined) {
            norm.inputs.STRING2 = norm.inputs.NUM2;
            delete norm.inputs.NUM2;
        }
    } else if (op === 'operator_lt' || op === 'operator_gt' || op === 'operator_equals') {
        if (norm.inputs.NUM1 !== undefined && norm.inputs.OPERAND1 === undefined) {
            norm.inputs.OPERAND1 = norm.inputs.NUM1;
            delete norm.inputs.NUM1;
        }
        if (norm.inputs.NUM2 !== undefined && norm.inputs.OPERAND2 === undefined) {
            norm.inputs.OPERAND2 = norm.inputs.NUM2;
            delete norm.inputs.NUM2;
        }
        if (norm.inputs.STRING1 !== undefined && norm.inputs.OPERAND1 === undefined) {
            norm.inputs.OPERAND1 = norm.inputs.STRING1;
            delete norm.inputs.STRING1;
        }
        if (norm.inputs.STRING2 !== undefined && norm.inputs.OPERAND2 === undefined) {
            norm.inputs.OPERAND2 = norm.inputs.STRING2;
            delete norm.inputs.STRING2;
        }
    } else if (op === 'control_forever' || op === 'control_repeat' || op === 'control_if') {
        if (norm.inputs.INNER_BLOCKS !== undefined && norm.inputs.SUBSTACK === undefined) {
            norm.inputs.SUBSTACK = norm.inputs.INNER_BLOCKS;
            delete norm.inputs.INNER_BLOCKS;
        }
    } else if (op === 'sensing_touchingobject') {
        if (norm.inputs.OBJECT !== undefined && norm.inputs.TOUCHINGOBJECTMENU === undefined) {
            norm.inputs.TOUCHINGOBJECTMENU = norm.inputs.OBJECT;
            delete norm.inputs.OBJECT;
        }
    } else if (op === 'sensing_distanceto') {
        if (norm.inputs.OBJECT !== undefined && norm.inputs.DISTANCETOMENU === undefined) {
            norm.inputs.DISTANCETOMENU = norm.inputs.OBJECT;
            delete norm.inputs.OBJECT;
        }
    }

    return norm;
}

function convertJsonToBlockMap(jsonObj) {
    var blockMap = {};
    var topBlocks = [];
    var errors = [];

    function processBlock(rawBlockObj, parentId, isTopLevel) {
        if (!rawBlockObj || typeof rawBlockObj !== 'object') return null;
        var blockObj = normalizeBlockObj(rawBlockObj);
        if (!blockObj.opcode) return null;

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
                    var fVal = String(blockObj.fields[key]);
                    // Check if this field actually belongs in inputs as a menu shadow (e.g. SOUND_MENU, TOUCHINGOBJECTMENU, OBJECT, KEY_OPTION)
                    var mappedInputName = null;
                    if (block.opcode === 'sound_playuntildone' || block.opcode === 'sound_play') {
                        mappedInputName = 'SOUND_MENU';
                    } else if (block.opcode === 'sensing_touchingobject') {
                        mappedInputName = 'TOUCHINGOBJECTMENU';
                    } else if (block.opcode === 'sensing_keypressed') {
                        mappedInputName = 'KEY_OPTION';
                    } else if (block.opcode === 'event_broadcast' || block.opcode === 'event_broadcastandwait') {
                        mappedInputName = 'BROADCAST_INPUT';
                    } else if (block.opcode === 'motion_pointtowards') {
                        mappedInputName = 'TOWARDS';
                    } else if (block.opcode === 'motion_goto') {
                        mappedInputName = 'TO';
                    }

                    if (mappedInputName && (key === 'SOUND_MENU' || key === 'OBJECT' || key === 'TOUCHINGOBJECTMENU' || key === 'KEY_OPTION' || key === 'BROADCAST_OPTION' || key === 'CHOICE' || key === 'TOWARDS' || key === 'TO')) {
                        var mShadowType = getShadow(mappedInputName, block.opcode);
                        if (mShadowType) {
                            var mShadowId = uid();
                            var mShadowFields = {};
                            var mFieldKey = MENU_FIELDS[mShadowType] || key;
                            mShadowFields[mFieldKey] = { name: mFieldKey, value: fVal };
                            blockMap[mShadowId] = {
                                id: mShadowId, opcode: mShadowType, fields: mShadowFields,
                                inputs: {}, next: null, parent: blockId,
                                topLevel: false, shadow: true, mutation: null
                            };
                            block.inputs[mappedInputName] = { name: mappedInputName, block: mShadowId, shadow: mShadowId };
                            continue;
                        }
                    }

                    block.fields[key] = { name: key, value: fVal };
                }
            }
        }

        if (blockObj.opcode === 'procedures_definition' && (blockObj.proccode || blockObj.fields.VARIABLE)) {
            var proccode = String(blockObj.proccode || blockObj.fields.VARIABLE.value);
            var argNames = Array.isArray(blockObj.argumentnames) ? blockObj.argumentnames : [];
            var argDefaults = Array.isArray(blockObj.argumentdefaults) ? blockObj.argumentdefaults : argNames.map(function () { return ''; });
            var warpStr = blockObj.warp ? 'true' : 'false';

            var protoId = uid();
            blockMap[protoId] = {
                id: protoId,
                opcode: 'procedures_prototype',
                fields: {},
                inputs: {},
                next: null,
                parent: blockId,
                topLevel: false,
                shadow: true,
                mutation: {
                    proccode: proccode,
                    argumentnames: JSON.stringify(argNames),
                    argumentdefaults: JSON.stringify(argDefaults),
                    warp: warpStr
                }
            };
            block.inputs.custom_block = { name: 'custom_block', block: protoId, shadow: protoId };
        } else if (blockObj.opcode === 'procedures_call' && (blockObj.proccode || blockObj.fields.VARIABLE)) {
            var proccodeCall = String(blockObj.proccode || blockObj.fields.VARIABLE.value);
            var argNamesCall = Array.isArray(blockObj.argumentnames) ? blockObj.argumentnames : [];
            var warpStrCall = blockObj.warp ? 'true' : 'false';
            block.mutation = {
                proccode: proccodeCall,
                argumentnames: JSON.stringify(argNamesCall),
                warp: warpStrCall
            };
        }

        if (blockObj.inputs) {
            for (var rawInputName in blockObj.inputs) {
                if (Object.prototype.hasOwnProperty.call(blockObj.inputs, rawInputName)) {
                    var val = blockObj.inputs[rawInputName];
                    if (val === null || val === undefined) continue;

                    var inputName = rawInputName;
                    if (block.opcode === 'control_wait' && (inputName === 'SECS' || inputName === 'secs' || inputName === 'sec' || inputName === 'seconds')) {
                        inputName = 'DURATION';
                    } else if ((block.opcode === 'looks_sayforsecs' || block.opcode === 'looks_thinkforsecs') && (inputName === 'DURATION' || inputName === 'duration')) {
                        inputName = 'SECS';
                    } else if (block.opcode === 'operator_join') {
                        if (inputName === 'OPERAND1' || inputName === 'NUM1' || inputName === 'A' || inputName === 'TEXT1' || inputName === 'STR1') inputName = 'STRING1';
                        if (inputName === 'OPERAND2' || inputName === 'NUM2' || inputName === 'B' || inputName === 'TEXT2' || inputName === 'STR2') inputName = 'STRING2';
                    } else if ((block.opcode === 'operator_lt' || block.opcode === 'operator_gt' || block.opcode === 'operator_equals') &&
                               (inputName === 'NUM1' || inputName === 'NUM2' || inputName === 'STRING1' || inputName === 'STRING2')) {
                        inputName = (inputName === 'NUM1' || inputName === 'STRING1') ? 'OPERAND1' : 'OPERAND2';
                    } else if (block.opcode === 'operator_random' && (inputName === 'NUM_FROM' || inputName === 'NUM_TO')) {
                        inputName = inputName === 'NUM_FROM' ? 'FROM' : 'TO';
                    } else if (block.opcode === 'sensing_touchingobject' && (inputName === 'OBJECT' || inputName === 'TARGET' || inputName === 'TOUCHING' || inputName === 'SPRITE')) {
                        inputName = 'TOUCHINGOBJECTMENU';
                    } else if (block.opcode === 'sensing_distanceto' && (inputName === 'OBJECT' || inputName === 'TARGET' || inputName === 'SPRITE')) {
                        inputName = 'DISTANCETOMENU';
                    } else if ((block.opcode === 'control_forever' || block.opcode === 'control_repeat' || block.opcode === 'control_if') &&
                               (inputName === 'INNER_BLOCKS' || inputName === 'BODY' || inputName === 'SCRIPT' || inputName === 'BLOCKS')) {
                        inputName = 'SUBSTACK';
                    } else if (block.opcode === 'data_changevariableby' && (inputName === 'CHANGE' || inputName === 'change')) {
                        inputName = 'VALUE';
                    }

                    if (val && typeof val === 'object' && !Array.isArray(val)) {
                        if (val.block && typeof val.block === 'object') {
                            val = val.block;
                        }
                        if (!val.opcode) {
                            var varName = val.variable || val.VARIABLE || (val.fields && (val.fields.VARIABLE ? (val.fields.VARIABLE.value || val.fields.VARIABLE) : null));
                            if (varName) {
                                val = { opcode: 'data_variable', fields: { VARIABLE: varName } };
                            } else if (val.type && String(val.type).indexOf('_') !== -1) {
                                val = Object.assign({}, val, { opcode: val.type });
                            } else if (val.op && String(val.op).indexOf('_') !== -1) {
                                val = Object.assign({}, val, { opcode: val.op });
                            } else if (val.value !== undefined) {
                                val = val.value;
                            } else if (val.val !== undefined) {
                                val = val.val;
                            } else if (val.num !== undefined) {
                                val = val.num;
                            } else if (val.text !== undefined) {
                                val = val.text;
                            }
                        }
                    }

                    if ((inputName === 'SUBSTACK' || inputName === 'SUBSTACK2') && val && typeof val === 'object' && !Array.isArray(val) && val.opcode) {
                        val = [val];
                    }

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
                    } else if (typeof val === 'object' && val && val.opcode) {
                        var childId = processBlock(val, blockId, false);
                        if (childId) {
                            var shadowType = getShadow(inputName, block.opcode);
                            var shadowId = null;
                            if (shadowType && shadowType !== 'boolean') {
                                shadowId = uid();
                                var shadowFields = {};
                                if (shadowType === 'math_number') {
                                    shadowFields = { NUM: { name: 'NUM', value: '0' } };
                                }
                                blockMap[shadowId] = {
                                    id: shadowId, opcode: shadowType, fields: shadowFields,
                                    inputs: {}, next: null, parent: blockId,
                                    topLevel: false, shadow: true, mutation: null
                                };
                            }
                            block.inputs[inputName] = { name: inputName, block: childId, shadow: shadowId };
                        }
                    } else {
                        var valStr = (typeof val === 'object' && val !== null) ? '0' : String(val);
                        var targetInputName = inputName;

                        var fieldKeys = FIELD_KEYS[block.opcode] || {};
                        if (fieldKeys[targetInputName]) {
                            block.fields[targetInputName] = { name: targetInputName, value: valStr };
                        } else {
                            var shadowType = getShadow(targetInputName, block.opcode);
                            var shadowFields = {};
                            var autoReporterId = null;
                            var noShadow = false;
                            if (shadowType === 'text') {
                                shadowFields = { TEXT: { name: 'TEXT', value: valStr } };
                            } else if (MENU_FIELDS[shadowType]) {
                                shadowFields = {};
                                shadowFields[MENU_FIELDS[shadowType]] = { name: MENU_FIELDS[shadowType], value: valStr };
                            } else if (shadowType === 'boolean') {
                                noShadow = true;
                                errors.push('Input booleano "' + targetInputName + '" de "' + block.opcode + '" no puede recibir un literal ("' + valStr + '"). La condición debe ser un reporter booleano: operator_equals/gt/lt, sensing_keypressed, operator_and/or/not, etc.');
                            } else {
                                var numVal = parseFloat(valStr);
                                var numStr = isNaN(numVal) ? '0' : String(numVal);
                                if (!isCleanNumber(valStr) && /\S/.test(valStr)) {
                                    var autoRep = valueReporter(valStr);
                                    if (autoRep) {
                                        autoReporterId = processBlock(autoRep, blockId, false);
                                        shadowType = 'text';
                                        shadowFields = { TEXT: { name: 'TEXT', value: valStr } };
                                    } else {
                                        errors.push('Valor no numérico "' + valStr + '" en input "' + targetInputName + '" de "' + block.opcode + '" → se usó 0. Si era una variable, usá "data_variable" (fields.VARIABLE); si era una operación, anidá el bloque aritmético (operator_add/subtract/multiply/divide).');
                                        shadowFields = { NUM: { name: 'NUM', value: numStr } };
                                    }
                                } else {
                                    shadowFields = { NUM: { name: 'NUM', value: numStr } };
                                }
                            }
                            var shadowId = null;
                            if (!noShadow) {
                                shadowId = uid();
                                blockMap[shadowId] = {
                                    id: shadowId, opcode: shadowType, fields: shadowFields,
                                    inputs: {}, next: null, parent: blockId,
                                    topLevel: false, shadow: true, mutation: null
                                };
                            }
                            block.inputs[targetInputName] = { name: targetInputName, block: autoReporterId, shadow: shadowId };
                        }
                    }
                }
            }
        }

        if (blockObj.next) {
            if (Array.isArray(blockObj.next) && blockObj.next.length > 0) {
                var prevNId = blockId;
                for (var ni = 0; ni < blockObj.next.length; ni++) {
                    var nextBlockId = processBlock(blockObj.next[ni], prevNId, false);
                    if (nextBlockId) {
                        blockMap[prevNId].next = nextBlockId;
                        blockMap[nextBlockId].parent = prevNId;
                        prevNId = nextBlockId;
                    }
                }
            } else if (typeof blockObj.next === 'object' && blockObj.next.opcode) {
                var nextBlockId = processBlock(blockObj.next, blockId, false);
                if (nextBlockId) {
                    block.next = nextBlockId;
                    blockMap[nextBlockId].parent = blockId;
                }
            }
        }

        return blockId;
    }

    if (jsonObj.scripts && Array.isArray(jsonObj.scripts)) {
        for (var si = 0; si < jsonObj.scripts.length; si++) {
            var script = jsonObj.scripts[si];
            var scriptBlocks = script.blocks || script.script || script.chain;
            if (!scriptBlocks) continue;
            if (!Array.isArray(scriptBlocks)) scriptBlocks = [scriptBlocks];
            if (scriptBlocks.length === 0) continue;

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

    autoInitVariables(blockMap, topBlocks, errors);

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
            var jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    jsonObj = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (e2) {}
            }
        }
        if (jsonObj) {
            if (jsonObj.scripts && Array.isArray(jsonObj.scripts)) {
                return convertJsonToBlockMap(jsonObj);
            }
            if (jsonObj.stage || jsonObj.sprites) {
                var allGameScripts = [];
                if (jsonObj.stage && Array.isArray(jsonObj.stage.scripts)) {
                    allGameScripts = allGameScripts.concat(jsonObj.stage.scripts);
                }
                if (Array.isArray(jsonObj.sprites)) {
                    for (var gsi = 0; gsi < jsonObj.sprites.length; gsi++) {
                        var gsp = jsonObj.sprites[gsi];
                        if (gsp && Array.isArray(gsp.scripts)) {
                            allGameScripts = allGameScripts.concat(gsp.scripts);
                        }
                    }
                }
                if (allGameScripts.length > 0) {
                    return convertJsonToBlockMap({ scripts: allGameScripts });
                }
            }
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
    var errors = [];

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
                    } else if (!top.isValue) {
                        var pb = blockMap[top.blockId];
                        if (pb && !pb.next) pb.next = id;
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

            processInlineParams(block, parsed.inlineParams, blockMap, FIELD_KEYS[parsed.opcode], errors);

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
                    var kvReporterId = null;
                    var noShadow = false;
                    if (typeof val === 'string' && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
                        shadowType = 'text';
                        shadowFields = {TEXT: {name: 'TEXT', value: val.slice(1, -1)}};
                    } else if (MENU_FIELDS[shadowType]) {
                        shadowFields = {};
                        shadowFields[MENU_FIELDS[shadowType]] = {name: MENU_FIELDS[shadowType], value: val};
                    } else if (shadowType === 'boolean') {
                        noShadow = true;
                        errors.push('Input booleano "' + key + '" de "' + currentOpcode + '" no puede recibir un literal ("' + val + '"). La condición debe ser un reporter booleano: operator_equals/gt/lt, sensing_keypressed, operator_and/or/not, etc.');
                    } else if (shadowType === 'math_number') {
                        var numVal = parseFloat(val);
                        if (!isCleanNumber(val) && /\S/.test(val)) {
                            var kvRep = valueReporter(val);
                            if (kvRep) {
                                kvReporterId = uid();
                                var kvFields = {};
                                if (kvRep.fields && kvRep.fields.VARIABLE) {
                                    kvFields.VARIABLE = {name: 'VARIABLE', value: kvRep.fields.VARIABLE};
                                }
                                blockMap[kvReporterId] = {
                                    id: kvReporterId, opcode: kvRep.opcode, fields: kvFields,
                                    inputs: {}, next: null, parent: vParent.blockId,
                                    topLevel: false, shadow: false, mutation: null
                                };
                                shadowType = 'text';
                                shadowFields = {TEXT: {name: 'TEXT', value: val}};
                            } else {
                                errors.push('Valor no numérico "' + val + '" en input "' + key + '" de "' + currentOpcode + '" → se usó 0. Si era una variable, usá "data_variable" (fields.VARIABLE); si era una operación, anidá el bloque aritmético (operator_add/subtract/multiply/divide).');
                                shadowFields.NUM.value = isNaN(numVal) ? '0' : String(numVal);
                            }
                        } else {
                            shadowFields.NUM.value = isNaN(numVal) ? '0' : String(numVal);
                        }
                    }
                    var shadowId = null;
                    if (!noShadow) {
                        shadowId = uid();
                        blockMap[shadowId] = {
                            id: shadowId, opcode: shadowType, fields: shadowFields,
                            inputs: {}, next: null, parent: vParent.blockId,
                            topLevel: false, shadow: true, mutation: null
                        };
                    }
                    blockMap[vParent.blockId].inputs[key] = {
                        name: key, block: kvReporterId, shadow: shadowId
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
                processInlineParams(nestedBlock, parsed.nestedParams, blockMap, FIELD_KEYS[parsed.nestedOpcode], errors);
                blockMap[nestedId] = nestedBlock;
                var shadowType = getShadow(parsed.name);
                var shadowId = null;
                if (shadowType !== 'boolean') {
                    shadowId = uid();
                    var shadowFields = {};
                    if (shadowType === 'math_number') {
                        shadowFields = {NUM: {name: 'NUM', value: '0'}};
                    }
                    blockMap[shadowId] = {
                        id: shadowId, opcode: shadowType, fields: shadowFields,
                        inputs: {}, next: null, parent: nParent.blockId,
                        topLevel: false, shadow: true, mutation: null
                    };
                }
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
                    processInlineParams(ipBlock, [{key: parsed.key, value: parsed.value}], blockMap, FIELD_KEYS[ipBlock.opcode], errors);
                }
            }
        }
    }

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

    autoInitVariables(blockMap, topBlocks, errors);

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
    var colWidth = 360;
    var maxColY = 650;
    var currX = startX;
    var currY = startY;

    for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        if (!block) continue;
        if (block.x !== undefined && block.y !== undefined) continue;

        block.x = currX;
        block.y = currY;

        var totalHeight = 50;
        var current = block.next;
        var depth = 0;
        while (current && blockMap && blockMap[current] && depth < 150) {
            totalHeight += 40;
            current = blockMap[current].next;
            depth++;
        }

        currY += totalHeight + 50;
        if (currY > maxColY && i < topBlocks.length - 1) {
            currY = startY;
            currX += colWidth;
        }
    }
}

function extractDescriptorFromResponse(responseText) {
    var tmpl = detectTemplate(responseText);
    if (tmpl) return '@bloques template:' + tmpl.name + ' params:' + JSON.stringify(tmpl.params);
    return extractDescriptor(responseText);
}

export {parse, extractDescriptorFromResponse, convertJsonToBlockMap};
