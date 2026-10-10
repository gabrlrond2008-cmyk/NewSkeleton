import {blockKernel} from './ai-workspace-reader.js';

/**
 * Block-level diff between an existing workspace script (old) and a modified
 * version parsed from the AI response (new). The goal is to apply ONLY the
 * affected blocks to the live canvas — insert new blocks into their sockets
 * (an `if`/`forever` grows to fit them), fade removed ones, keep everything
 * else frozen — instead of rebuilding the whole chain.
 *
 * Matching works in canonical descriptor space (both containers are
 * {_blocks: {id: block}} — a VM target.blocks and a parsed descriptor.blockMap
 * speak the same language), so the diff is pure and unit-testable without
 * Blockly. Application happens later with the live workspace.
 */

var STATEMENT_INPUTS = {
    control_forever: {SUBSTACK: 1},
    control_repeat: {SUBSTACK: 1},
    control_if: {SUBSTACK: 1},
    control_if_else: {SUBSTACK: 1, SUBSTACK2: 1},
    control_repeat_until: {SUBSTACK: 1},
    control_while: {SUBSTACK: 1}
};

function blockOf(container, id) {
    return (container && container._blocks && id) ? container._blocks[id] : null;
}

function chainOf(container, headId) {
    var out = [];
    var id = headId;
    while (id) {
        var b = blockOf(container, id);
        if (!b || b.shadow) break;
        out.push(id);
        id = b.next || null;
    }
    return out;
}

function isStatementInput(opcode, name) {
    return !!(STATEMENT_INPUTS[opcode] && STATEMENT_INPUTS[opcode][name]);
}

/**
 * The "real reporter" attached to a value input, ignoring shadows. The VM
 * represents a shadow-only socket as {block: shadowId, shadow: shadowId} while
 * parsed descriptors use {block: null, shadow: shadowId}; normalizing to the
 * actual non-shadow child keeps both sides comparable.
 * @param {Object} container container with a `_blocks` map
 * @param {{block:?string, shadow:?string}} input
 * @return {string|null}
 */
function realChild(container, input) {
    if (!input || !input.block) return null;
    var b = blockOf(container, input.block);
    if (!b || b.shadow) return null;
    return input.block;
}

/**
 * The real (non-shadow) reporter block attached to a value input, or null when
 * the socket only carries a shadow / is empty. Works against both a VM
 * container ({block: shadowId, shadow: shadowId}) and a parsed descriptor
 * ({block: null, shadow: shadowId}).
 */
function childBlock(container, input) {
    var id = realChild(container, input);
    return id ? blockOf(container, id) : null;
}

function shadowBlock(container, input) {
    if (!input || !input.shadow) return null;
    return blockOf(container, input.shadow);
}

/**
 * A `change` is purely scalar when the two blocks share the same opcode and the
 * SAME block skeleton (every input the new block mentions exists in the old one
 * with the same shape: same shadow opcode, or same real child opcode
 * recursively). Only field / shadow VALUES differ, so the existing block can be
 * mutated in place with setFieldValue instead of being deleted and rebuilt —
 * its subtree never disappears.
 * @param {Object} oldC container with a `_blocks` map (the live VM target)
 * @param {string} oldId
 * @param {Object} newC container with a `_blocks` map (the parsed descriptor)
 * @param {string} newId
 * @return {boolean}
 */
function isFieldOnlyChange(oldC, oldId, newC, newId) {
    var o = blockOf(oldC, oldId);
    var n = blockOf(newC, newId);
    if (!o || !n) return false;
    if (o.opcode !== n.opcode) return false;
    var oInputs = o.inputs || {};
    var nInputs = n.inputs || {};
    for (var iname in nInputs) {
        if (!Object.prototype.hasOwnProperty.call(nInputs, iname)) continue;
        var ni = nInputs[iname];
        var oi = oInputs[iname];
        if (!oi) return false;
        var nReal = childBlock(newC, ni);
        var oReal = childBlock(oldC, oi);
        if (nReal && oReal) {
            if (nReal.opcode !== oReal.opcode) return false;
            if (!isFieldOnlyChange(oldC, oReal.id, newC, nReal.id)) return false;
        } else if (nReal || oReal) {
            return false;
        } else {
            var nSh = shadowBlock(newC, ni);
            var oSh = shadowBlock(oldC, oi);
            if (!!nSh !== !!oSh) return false;
            if (nSh && oSh && nSh.opcode !== oSh.opcode) return false;
        }
    }
    return true;
}

/**
 * Mutations / procedures are not always safely editable at block level. True
 * dynamic blocks (procedures_*, argument_*) bail out. Structural mutations on
 * control_if/control_if_else are NOT a blocker: they only toggle the presence
 * of a fixed SUBSTACK2 input, which the statement diff already expresses, so a
 * script containing them remains editable in place.
 */
var STRUCTURAL_MUTATIONS = {
    control_if: true,
    control_if_else: true
};

function containsMutable(container, headId) {
    var chain = chainOf(container, headId);
    for (var i = 0; i < chain.length; i++) {
        var b = blockOf(container, chain[i]);
        if (!b) continue;
        if (b.opcode &&
            (b.opcode.indexOf('procedures_') === 0 || b.opcode.indexOf('argument_') === 0)) {
            return true;
        }
        if (b.mutation && !STRUCTURAL_MUTATIONS[b.opcode]) return true;
    }
    return false;
}

/**
 * Align the statements of a chain (old vs new) keeping order, and accumulate
 * socket-level ops against the OLD block ids (stable live references).
 * @param {Object} oldC old container
 * @param {string|null} oldHeadId
 * @param {Object} newC new container
 * @param {string|null} newHeadId
 * @param {!Array} ops output ops
 * @param {{atBlock:string, atSlot:string}|null} headAnchor where an insert at
 *     the head of the chain attaches (parent's statement input).
 */
function alignChain(oldC, oldHeadId, newC, newHeadId, ops, headAnchor) {
    var olds = oldHeadId ? chainOf(oldC, oldHeadId) : [];
    var news = newHeadId ? chainOf(newC, newHeadId) : [];
    var i = 0;
    // After a matched block, later inserts attach to its `next` socket.
    var anchor = {
        atBlock: headAnchor ? headAnchor.atBlock : null,
        atSlot: headAnchor ? (headAnchor.atSlot || 'next') : 'next'
    };

    var j = 0;
    while (j < news.length) {
        var newId = news[j];
        var m = -1;
        for (var k = i; k < olds.length; k++) {
            if (blockKernel(oldC, olds[k]) === blockKernel(newC, newId)) {
                m = k;
                break;
            }
        }
        if (m === -1) {
            // Same opcode + same skeleton with only field/shadow VALUE changes:
            // the existing block is mutated IN PLACE (setFieldValue) instead of a
            // visual insert+remove. The op carries the anchor of the block's
            // current socket so a failed mutation can be downgraded to a replace
            // against exactly that position (structural fallback).
            var fm = -1;
            for (var kf = i; kf < olds.length; kf++) {
                if (isFieldOnlyChange(oldC, olds[kf], newC, newId)) {
                    fm = kf;
                    break;
                }
            }
            if (fm !== -1) {
                for (var rm0 = i; rm0 < fm; rm0++) {
                    ops.push({kind: 'remove', oldId: olds[rm0]});
                }
                ops.push({
                    kind: 'mutate',
                    oldId: olds[fm],
                    newId: newId,
                    runIds: [newId],
                    atBlock: anchor.atBlock,
                    atSlot: anchor.atSlot,
                    stacked: true
                });
                i = fm + 1;
                anchor = {atBlock: olds[fm], atSlot: 'next'};
                j++;
                continue;
            }
            // New blocks with no matching old shape: a contiguous run.
            var runIds = [newId];
            j++;
            while (j < news.length) {
                var mm = -1;
                for (var k2 = i; k2 < olds.length; k2++) {
                    if (blockKernel(oldC, olds[k2]) === blockKernel(newC, news[j])) {
                        mm = k2;
                        break;
                    }
                }
                if (mm !== -1) break;
                runIds.push(news[j]);
                j++;
            }
            ops.push({
                kind: 'insert',
                newId: newId,
                runIds: runIds,
                atBlock: anchor.atBlock,
                atSlot: anchor.atSlot,
                stacked: true
            });
            continue;
        }
        // Removed old siblings up to the match.
        for (var r = i; r < m; r++) {
            ops.push({kind: 'remove', oldId: olds[r]});
        }
        diffBlock(oldC, olds[m], newC, newId, ops);
        i = m + 1;
        anchor = {atBlock: olds[m], atSlot: 'next'};
        j++;
    }
    for (; i < olds.length; i++) {
        ops.push({kind: 'remove', oldId: olds[i]});
    }
}

/**
 * Diff two blocks that share the same kernel: their value inputs (reporters)
 * and statement substacks are compared for insert/remove/replace.
 */
function diffBlock(oldC, oldId, newC, newId, ops) {
    var oldP = blockOf(oldC, oldId);
    var newP = blockOf(newC, newId);
    if (!oldP || !newP) return;

    // Value inputs (reporter / shadow sockets).
    var names = {};
    for (var n1 in newP.inputs) names[n1] = true;
    for (var n2 in oldP.inputs) names[n2] = true;
    Object.keys(names).forEach(function (iname) {
        if (isStatementInput(newP.opcode, iname)) return;
        var ni = newP.inputs[iname];
        var oi = oldP.inputs[iname];
        var nb = realChild(newC, ni);
        var ob = realChild(oldC, oi);
        if (!nb && !ob) return;
        if (nb && !ob) {
            ops.push({kind: 'insert', newId: nb, runIds: [nb], atBlock: oldId, atSlot: iname, stacked: false});
            return;
        }
        if (ob && !nb) {
            ops.push({kind: 'remove', oldId: ob});
            return;
        }
        if (blockKernel(oldC, ob) === blockKernel(newC, nb)) {
            diffBlock(oldC, ob, newC, nb, ops);
        } else if (isFieldOnlyChange(oldC, ob, newC, nb)) {
            // Same opcode + same skeleton: only field/shadow values changed, so the
            // existing reporter keeps its subtree and its values are updated IN
            // PLACE. Downgrades to replace automatically if the block cannot hold
            // the new values (applyMutations -> replace fallback).
            ops.push({kind: 'mutate', oldId: ob, newId: nb, runIds: [nb], atBlock: oldId, atSlot: iname, stacked: false});
        } else {
            ops.push({kind: 'replace', oldId: ob, newId: nb, runIds: [nb], atBlock: oldId, atSlot: iname, stacked: false});
        }
    });

    // Statement substacks.
    Object.keys(newP.inputs || {}).forEach(function (iname) {
        if (!isStatementInput(newP.opcode, iname)) return;
        var ni = newP.inputs[iname];
        var oi = oldP.inputs[iname];
        var nh = ni ? ni.block : null;
        var oh = oi ? oi.block : null;
        if (!nh && !oh) return;
        if (nh && !oh) {
            ops.push({kind: 'insert', newId: nh, runIds: chainOf(newC, nh), atBlock: oldId, atSlot: iname, stacked: true});
            return;
        }
        if (oh && !nh) {
            var oc = chainOf(oldC, oh);
            for (var r = 0; r < oc.length; r++) ops.push({kind: 'remove', oldId: oc[r]});
            return;
        }
        alignChain(oldC, oh, newC, nh, ops, {atBlock: oldId, atSlot: iname});
    });
}

/**
 * Diff an entire script (top-level chain) between the current workspace and the
 * new parsed descriptor.
 * @param {Object} oldC {_blocks: ...} from the VM
 * @param {string} oldTopId
 * @param {Object} newC {_blocks: ...} from parsed.blockMap
 * @param {string} newTopId
 * @return {{status: 'ok'|'unsupported', ops?: Array}}
 */
function diffChain(oldC, oldTopId, newC, newTopId) {
    var oldTop = blockOf(oldC, oldTopId);
    var newTop = blockOf(newC, newTopId);
    if (!oldTop || !newTop) return {status: 'unsupported'};
    if (blockKernel(oldC, oldTopId) !== blockKernel(newC, newTopId)) {
        // The hat itself changed (different script start): whole-chain replace.
        return {status: 'unsupported'};
    }
    if (containsMutable(oldC, oldTopId)) return {status: 'unsupported'};
    if (containsMutable(newC, newTopId)) return {status: 'unsupported'};
    var ops = [];
    alignChain(oldC, oldTopId, newC, newTopId, ops, {atBlock: null, atSlot: 'next'});
    return {status: 'ok', ops: ops};
}

/**
 * Build a bounded subset container for an inserted run: copies the run blocks
 * (and every block reachable from them through inputs/substacks) but TRIMS the
 * `next` chain at the run boundary, so the inserted XML never swallows blocks
 * that matched the old chain (they must remain where they are).
 * @param {Object} container source {_blocks}
 * @param {!Array<string>} runIds ordered chain ids of the run
 * @return {Object} {_blocks: {...}} for the run
 */
function boundedSubset(container, runIds) {
    var runSet = {};
    for (var i = 0; i < runIds.length; i++) runSet[runIds[i]] = true;
    var kept = {};
    var queue = runIds.slice();
    while (queue.length > 0) {
        var id = queue.shift();
        if (kept[id]) continue;
        var b = blockOf(container, id);
        if (!b) continue;
        var copy = {
            id: b.id,
            opcode: b.opcode,
            fields: b.fields,
            inputs: b.inputs,
            next: b.next,
            shadow: b.shadow,
            topLevel: b.topLevel,
            mutation: b.mutation
        };
        kept[id] = copy;
        if (b.inputs) {
            for (var name in b.inputs) {
                var input = b.inputs[name];
                if (input && input.block) queue.push(input.block);
                if (input && input.shadow && input.shadow !== input.block) queue.push(input.shadow);
            }
        }
    }
    // Trim the outgoing `next` of the run so it stops at the boundary.
    for (var j = 0; j < runIds.length; j++) {
        var rid = runIds[j];
        var rb = kept[rid];
        if (!rb) continue;
        rb.next = (rb.next && runSet[rb.next]) ? rb.next : null;
    }
    return {_blocks: kept};
}

export {diffChain, boundedSubset, blockKernel, chainOf, containsMutable, isFieldOnlyChange};