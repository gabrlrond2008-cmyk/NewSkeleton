function repeat(str, n) {
    var r = '';
    for (var i = 0; i < n; i++) r += str;
    return r;
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
    sensing_current: {CURRENTMENU: 1}
};

function readWorkspace(vm) {
    if (!vm || !vm.editingTarget) return '';
    var target = vm.editingTarget;
    var blocks = target.blocks;
    if (!blocks || !blocks._scripts) return '';
    var lines = [];

    // Sprite/Stage info
    var isStage = target.isStage;
    lines.push('=== ' + (isStage ? 'ESCENARIO' : 'SPRITE: ' + target.getName()) + ' ===');

    // Variables
    var varNames = Object.keys(target.variables || {});
    if (varNames.length > 0) {
        var varList = [];
        for (var vi = 0; vi < varNames.length; vi++) {
            var v = target.variables[varNames[vi]];
            if (v && v.name && v.type === '') {
                varList.push(v.name + '=' + v.value);
            }
        }
        if (varList.length > 0) {
            lines.push('Variables: ' + varList.join(', '));
        }
    }

    // Lists
    var listNames = Object.keys(target.lists || {});
    if (listNames.length > 0) {
        var listList = [];
        for (var li = 0; li < listNames.length; li++) {
            var l = target.lists[listNames[li]];
            if (l && l.name) {
                listList.push(l.name + '[' + (l.value ? l.value.length : 0) + ']');
            }
        }
        if (listList.length > 0) {
            lines.push('Listas: ' + listList.join(', '));
        }
    }

    // Position
    lines.push('Posicion: x=' + Math.round(target.x) + ' y=' + Math.round(target.y));

    if (blocks._scripts && blocks._scripts.length > 0) {
        for (var i = 0; i < blocks._scripts.length; i++) {
            appendScript(blocks._scripts[i], blocks, lines, 0);
        }
    }

    if (lines.length <= 1) return '';
    return 'WORKSPACE ACTUAL\n' + lines.join('\n');
}

function appendScript(blockId, blocks, lines, depth) {
    while (blockId) {
        var block = blocks._blocks[blockId];
        if (!block || block.shadow) break;

        var inline = [];
        var statements = [];
        var nested = [];

        var fk = FIELD_KEYS[block.opcode] || {};
        for (var f in block.fields) {
            if (fk[f]) {
                inline.push(f + '=' + block.fields[f].value);
            }
        }

        for (var iname in block.inputs) {
            var input = block.inputs[iname];
            if (iname === 'SUBSTACK' || iname === 'SUBSTACK2') {
                statements.push(iname);
                continue;
            }
            if (input.shadow && !input.block) {
                var shadow = blocks._blocks[input.shadow];
                if (shadow) {
                    var sf = Object.keys(shadow.fields);
                    if (sf.length > 0) {
                        var val = shadow.fields[sf[0]].value;
                        if (shadow.opcode === 'text') {
                            inline.push(iname + '="' + val + '"');
                        } else {
                            inline.push(iname + '=' + val);
                        }
                    }
                }
            } else if (input.block) {
                nested.push(iname);
            }
        }

        var indent = repeat('  ', depth);
        var line = indent + '>' + block.opcode;
        if (inline.length > 0) line += ' ' + inline.join(' ');
        lines.push(line);

        for (var ni = 0; ni < nested.length; ni++) {
            appendNested(nested[ni], block.inputs[nested[ni]].block, blocks, lines, depth + 1);
        }

        for (var si = 0; si < statements.length; si++) {
            lines.push(indent + '  ' + statements[si] + ':');
            var stInput = block.inputs[statements[si]];
            if (stInput.block) {
                appendScript(stInput.block, blocks, lines, depth + 2);
            }
        }

        blockId = block.next;
    }
}

function appendNested(inputName, blockId, blocks, lines, depth) {
    var block = blocks._blocks[blockId];
    if (!block || block.shadow) return;
    var inline = [];
    var childNested = [];
    for (var iname in block.inputs) {
        var input = block.inputs[iname];
        if (input.shadow && !input.block) {
            var shadow = blocks._blocks[input.shadow];
            if (shadow) {
                var sf = Object.keys(shadow.fields);
                if (sf.length > 0) {
                    var val = shadow.fields[sf[0]].value;
                    if (shadow.opcode === 'text') {
                        inline.push(iname + '="' + val + '"');
                    } else {
                        inline.push(iname + '=' + val);
                    }
                }
            }
        } else if (input.block) {
            childNested.push(iname);
        }
    }
    var indent = repeat('  ', depth);
    var line = indent + inputName + ': >' + block.opcode + '<';
    if (inline.length > 0) line += ' ' + inline.join(' ');
    lines.push(line);
    for (var ni = 0; ni < childNested.length; ni++) {
        appendNested(childNested[ni], block.inputs[childNested[ni]].block, blocks, lines, depth + 1);
    }
}

export {readWorkspace};
