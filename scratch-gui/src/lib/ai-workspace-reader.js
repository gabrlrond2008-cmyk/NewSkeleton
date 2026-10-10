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

function buildInline(blocks, block) {
    var inline = [];
    var fk = FIELD_KEYS[block.opcode] || {};
    for (var f in block.fields) {
        if (fk[f]) {
            inline.push(f + '=' + block.fields[f].value);
        }
    }
    for (var iname in block.inputs) {
        var input = block.inputs[iname];
        if (iname === 'SUBSTACK' || iname === 'SUBSTACK2') continue;
        // A value input "has no reporter" when it only carries a shadow. The VM
        // represents that as {block: shadowId, shadow: shadowId} while parsed
        // descriptors use {block: null, shadow: shadowId}; normalize both so the
        // canonical signature is identical for the same script.
        var realChild = null;
        if (input.block) {
            var child = blocks._blocks[input.block];
            if (child && !child.shadow) realChild = input.block;
        }
        if (realChild) continue;
        if (input.shadow && !realChild) {
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
        }
    }
    return inline;
}

/**
 * Render a single block: its own line (opcode + inline fields/shadows), its
 * nested reporter inputs and its statement substacks. Does NOT follow `next`.
 * @param {string} blockId
 * @param {Object} blocks container with a `_blocks` map
 * @param {!Array<string>} lines
 * @param {number} depth
 */
function renderSubtreeBlock(blockId, blocks, lines, depth) {
    var block = blocks._blocks[blockId];
    if (!block || block.shadow) return;

    var inline = buildInline(blocks, block);
    var statements = [];
    var nested = [];

    for (var iname in block.inputs) {
        var input = block.inputs[iname];
        if (iname === 'SUBSTACK' || iname === 'SUBSTACK2') {
            statements.push(iname);
            continue;
        }
        if (input.block) nested.push(iname);
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
}

function appendScript(blockId, blocks, lines, depth) {
    while (blockId) {
        var block = blocks._blocks[blockId];
        if (!block || block.shadow) break;
        renderSubtreeBlock(blockId, blocks, lines, depth);
        blockId = block.next;
    }
}

function appendNested(inputName, blockId, blocks, lines, depth) {
    var block = blocks._blocks[blockId];
    if (!block || block.shadow) return;
    var inline = buildInline(blocks, block);
    var childNested = [];
    for (var iname in block.inputs) {
        var input = block.inputs[iname];
        if (iname === 'SUBSTACK' || iname === 'SUBSTACK2') continue;
        if (input.block) childNested.push(iname);
    }
    var indent = repeat('  ', depth);
    var line = indent + inputName + ': >' + block.opcode + '<';
    if (inline.length > 0) line += ' ' + inline.join(' ');
    lines.push(line);
    for (var ni = 0; ni < childNested.length; ni++) {
        appendNested(childNested[ni], block.inputs[childNested[ni]].block, blocks, lines, depth + 1);
    }
}

/**
 * Build the canonical signature (the exact lines WORKSPACE ACTUAL prints) for a
 * single top-level chain, given a block container of the shape {_blocks: {id: block}}.
 * Works against both a scratch-vm target.blocks and a parsed descriptor.blockMap.
 * @param {Object} container container with a _blocks map
 * @param {string} startId top-level block id
 * @return {string}
 */
function signatureFromContainer(container, startId) {
    if (!container || !container._blocks || !startId) return '';
    var lines = [];
    appendScript(startId, container, lines, 0);
    return lines.join('\n');
}

/**
 * Structured read of the current workspace scripts, reusing the exact same
 * analysis/traversal as readWorkspace so that signatures are the canonical text
 * the AI sees under WORKSPACE ACTUAL.
 * @param {*} vm scratch-vm instance
 * @return {Array<{blockId:string, topOpcode:string, signature:string}>}
 */
function readWorkspaceScripts(vm) {
    if (!vm || !vm.editingTarget) return [];
    var target = vm.editingTarget;
    var blocks = target.blocks;
    if (!blocks || !blocks._scripts) return [];
    var out = [];
    for (var i = 0; i < blocks._scripts.length; i++) {
        var id = blocks._scripts[i];
        var topBlock = blocks._blocks[id];
        if (!topBlock || topBlock.shadow) continue;
        var signature = signatureFromContainer(blocks, id);
        if (!signature) continue;
        out.push({blockId: id, topOpcode: topBlock.opcode, signature: signature});
    }
    return out;
}

/**
 * The canonical identity of a single block: the exact line WORKSPACE ACTUAL
 * prints for it (opcode + inline fields/shadows), WITHOUT its children. Two
 * blocks with equal kernels have the same "shape" and can be aligned during a
 * block-level diff; the diff then only looks at their children.
 * @param {Object} container container with a `_blocks` map
 * @param {string} blockId
 * @return {string}
 */
function blockKernel(container, blockId) {
    var block = container && container._blocks ? container._blocks[blockId] : null;
    if (!block) return '';
    var inline = buildInline(container, block);
    var line = '>' + block.opcode;
    if (inline.length > 0) line += ' ' + inline.join(' ');
    return line;
}

/**
 * Canonical text of a block AND all its children (nested reporters + statement
 * substacks), but NOT the blocks that follow it via `next`. Used to decide if a
 * subtree is byte-identical between the old chain and the new descriptor.
 * @param {Object} container container with a `_blocks` map
 * @param {string} blockId
 * @return {string}
 */
function subtreeSignature(container, blockId) {
    if (!container || !container._blocks || !blockId) return '';
    var lines = [];
    renderSubtreeBlock(blockId, container, lines, 0);
    return lines.join('\n');
}

export {readWorkspace, readWorkspaceScripts, signatureFromContainer, blockKernel, subtreeSignature};
