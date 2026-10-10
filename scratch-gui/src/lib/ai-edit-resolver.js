import {blockKernel, chainOf, isFieldOnlyChange} from './ai-block-diff.js';
import {parse as parseDescriptor} from './ai-block-descriptor.js';

/**
 * Explicit edit contract (quitar / poner / cambiar). The AI never re-emits a
 * whole script to edit it: it emits a list of `edits`, each locating the exact
 * existing block (its canonical WORKSPACE ACTUAL line) and saying what to do
 * there. This resolver maps those human/AI-readable targets onto real block ids
 * in the LIVE VM container and produces ops the apply machinery already
 * understands (remove / replace / insert).
 *
 * Deletion is NEVER implicit: a script is only touched through an explicit
 * edit; if a target or chain cannot be located, the edit is reported as
 * unresolved and NOTHING is deleted.
 *
 * @param {!Array} edits [{op, chain, target, socket, blocks}]
 * @param {!Array<{blockId:string, topOpcode:string, signature:string}>} existingScripts
 * @param {Object} container live VM target.blocks ({_blocks})
 * @return {{ops:Array, unresolved:Array<string>, counts:Object, blockMap:Object, topBlocks:Array}}
 */

var STATEMENT_INPUTS = {
    control_forever: {SUBSTACK: 1},
    control_repeat: {SUBSTACK: 1},
    control_if: {SUBSTACK: 1},
    control_if_else: {SUBSTACK: 1, SUBSTACK2: 1},
    control_repeat_until: {SUBSTACK: 1},
    control_while: {SUBSTACK: 1}
};

function cleanOpcode(s) {
    return String(s == null ? '' : s).trim().replace(/^>/, '').trim();
}

/**
 * Collect every non-shadow block id in a chain (next + nested reporters +
 * statement substacks, in WORKSPACE ACTUAL traversal order).
 */
function collectBlocks(container, headId) {
    var out = [];
    var id = headId;
    while (id) {
        var b = container && container._blocks ? container._blocks[id] : null;
        if (!b || b.shadow) break;
        out.push(id);
        var inputs = b.inputs || {};
        var nested = [];
        var statements = [];
        for (var iname in inputs) {
            if (iname === 'SUBSTACK' || iname === 'SUBSTACK2') statements.push(iname);
            else nested.push(iname);
        }
        for (var ni = 0; ni < nested.length; ni++) {
            var inp = inputs[nested[ni]];
            if (inp && inp.block) collectBlocks(container, inp.block, out);
        }
        for (var si = 0; si < statements.length; si++) {
            var st = inputs[statements[si]];
            if (st && st.block) collectBlocks(container, st.block, out);
        }
        id = b.next;
    }
    return out;
}

function blockOf(container, id) {
    return (container && container._blocks && id) ? container._blocks[id] : null;
}

/**
 * Locate an existing block by its canonical line. Exact kernel match first,
 * then bare-opcode match, then a substring fallback.
 */
function matchTarget(container, headId, target) {
    var t = cleanOpcode(target);
    if (!t) return null;
    var ids = collectBlocks(container, headId);
    for (var i = 0; i < ids.length; i++) {
        if (blockKernel(container, ids[i]).replace(/^>/, '').trim() === t) return ids[i];
    }
    var firstTok = t.split(/\s+/)[0];
    for (var j = 0; j < ids.length; j++) {
        var b = blockOf(container, ids[j]);
        if (b && b.opcode === firstTok) return ids[j];
    }
    for (var m = 0; m < ids.length; m++) {
        if (blockKernel(container, ids[m]).replace(/^>/, '').trim().indexOf(t) !== -1) return ids[m];
    }
    return null;
}

/**
 * Where a block is attached: the block owning its socket (input name) or its
 * predecessor via `next`. Used so replace/remove reconnects the surrounding
 * structure instead of breaking it.
 */
function findAnchor(container, blockId) {
    for (var id in (container && container._blocks ? container._blocks : {})) {
        var b = container._blocks[id];
        if (!b) continue;
        var inputs = b.inputs || {};
        for (var iname in inputs) {
            var inp = inputs[iname];
            if (inp && inp.block === blockId) return {atBlock: id, atSlot: iname};
        }
        if (b.next === blockId) return {atBlock: id, atSlot: 'next'};
    }
    return {atBlock: null, atSlot: 'next'};
}

function isStatementInput(opcode, name) {
    return !!(STATEMENT_INPUTS[opcode] && STATEMENT_INPUTS[opcode][name]);
}

function tailOf(container, headId) {
    var id = headId;
    var prev = null;
    while (id) {
        var b = blockOf(container, id);
        if (!b || b.shadow) break;
        prev = id;
        id = b.next;
    }
    return prev;
}

function findChain(existingScripts, chain) {
    var op = cleanOpcode(chain);
    if (!op) return null;
    for (var i = 0; i < existingScripts.length; i++) {
        if (existingScripts[i] && existingScripts[i].topOpcode === op) return existingScripts[i];
    }
    return null;
}

/**
 * Parse an edit's `blocks` array (full descriptor syntax) into the shared new
 * block map. Returns the first/top block id and the run chain ids of the new
 * blocks, or null when there is nothing usable.
 */
function buildEditBlocks(edit, combinedMap) {
    if (!edit.blocks || !Array.isArray(edit.blocks) || edit.blocks.length === 0) return null;
    var parsed = parseDescriptor(JSON.stringify({scripts: [{blocks: edit.blocks}]}));
    if (!parsed || !parsed.blockMap || Object.keys(parsed.blockMap).length === 0) return null;
    var newTop = parsed.topBlocks && parsed.topBlocks[0];
    if (!newTop || !newTop.id || !parsed.blockMap[newTop.id]) return null;
    for (var id in parsed.blockMap) {
        if (Object.prototype.hasOwnProperty.call(parsed.blockMap, id)) {
            combinedMap[id] = parsed.blockMap[id];
        }
    }
    return {
        newId: newTop.id,
        runIds: chainOf({_blocks: parsed.blockMap}, newTop.id)
    };
}

function resolveEdits(edits, existingScripts, container) {
    var ops = [];
    var unresolved = [];
    var counts = {inserted: 0, removed: 0, changed: 0};
    var combinedMap = {};

    var list = edits || [];
    for (var i = 0; i < list.length; i++) {
        var edit = list[i];
        if (!edit || typeof edit !== 'object') {
            unresolved.push('Edición inválida (no es un objeto)');
            continue;
        }
        var op = String(edit.op || '').trim().toLowerCase();
        if (op !== 'remove' && op !== 'change' && op !== 'insert') {
            unresolved.push('Operación desconocida: "' + (edit.op || '') + '" (usa remove, change o insert)');
            continue;
        }

        var verb = op === 'remove' ? 'Quitar' : (op === 'change' ? 'Cambiar' : 'Insertar');
        var chainItem = findChain(existingScripts, edit.chain);
        if (!chainItem) {
            unresolved.push(verb + ': no existe la cadena "' + (edit.chain || '?') + '"');
            continue;
        }

        var targetId = matchTarget(container, chainItem.blockId, edit.target);
        if (!targetId) {
            unresolved.push(verb + ': bloque "' + (edit.target || '?') + '" no encontrado en "' + chainItem.topOpcode + '"');
            continue;
        }

        if (op === 'remove') {
            ops.push({kind: 'remove', oldId: targetId});
            counts.removed++;
            continue;
        }

        var built = buildEditBlocks(edit, combinedMap);
        if (!built) {
            unresolved.push(verb + ': "blocks" vacío o inválido');
            continue;
        }

        if (op === 'change') {
            var anchor = findAnchor(container, targetId);
            var parentBlock = blockOf(container, anchor.atBlock);
            var stacked = anchor.atSlot === 'next' || isStatementInput(parentBlock ? parentBlock.opcode : '', anchor.atSlot);
            var opCommon = {
                oldId: targetId,
                newId: built.newId,
                runIds: built.runIds,
                atBlock: anchor.atBlock,
                atSlot: anchor.atSlot,
                stacked: stacked
            };
            if (isFieldOnlyChange(container, targetId, {_blocks: combinedMap}, built.newId)) {
                // Same opcode + same skeleton: mutate fields/shadow values on the
                // EXISTING block in place. No delete, no subtree loss, no rebuild.
                ops.push(Object.assign({kind: 'mutate'}, opCommon));
            } else {
                ops.push(Object.assign({kind: 'replace'}, opCommon));
            }
            counts.changed++;
            continue;
        }

        // insert
        var socket = String(edit.socket || 'next').trim() || 'next';
        var targetBlock = blockOf(container, targetId);
        var atBlock = targetId;
        var atSlot = 'next';
        var stacked = true;
        if (socket !== 'next') {
            var tInp = targetBlock && targetBlock.inputs ? targetBlock.inputs[socket] : null;
            if (tInp && tInp.block) {
                if (isStatementInput(targetBlock ? targetBlock.opcode : '', socket)) {
                    // Append at the end of the existing statement content.
                    var tailId = tailOf(container, tInp.block);
                    atBlock = tailId || targetId;
                    atSlot = 'next';
                    stacked = true;
                } else {
                    // A value input already has a reporter: replace it.
                    ops.push({
                        kind: 'replace',
                        oldId: tInp.block,
                        newId: built.newId,
                        runIds: built.runIds,
                        atBlock: targetId,
                        atSlot: socket,
                        stacked: false
                    });
                    counts.inserted++;
                    continue;
                }
            } else {
                atBlock = targetId;
                atSlot = socket;
                stacked = isStatementInput(targetBlock ? targetBlock.opcode : '', socket);
            }
        }
        ops.push({
            kind: 'insert',
            newId: built.newId,
            runIds: built.runIds,
            atBlock: atBlock,
            atSlot: atSlot,
            stacked: stacked
        });
        counts.inserted++;
    }

    return {ops: ops, unresolved: unresolved, counts: counts, blockMap: combinedMap};
}

export {resolveEdits, isFieldOnlyChange};
