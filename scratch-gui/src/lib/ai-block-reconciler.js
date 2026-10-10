import {signatureFromContainer} from './ai-workspace-reader.js';

/**
 * Plan a reconciliation of the currently placed workspace scripts against a new
 * parsed descriptor, so the AI can EDIT existing blocks instead of wiping the
 * whole workspace. Matching is done on the canonical signature (the exact text
 * the model sees under WORKSPACE ACTUAL), preserving scripts that did not change.
 *
 * Edit contract:
 *  - `clearExisting: true`: the model re-emits the FULL desired state of the
 *    scripts it edits; those are reconciled as preserves/replaces. A script
 *    that is NOT reproduced is NEVER deleted implicitly (omission = keep), so
 *    editing one script cannot wipe the others.
 *  - `clearExisting` falsy / append: nothing is ever deleted implicitly.
 *  - `deleteScripts` (list of top opcodes) and `clearAll` are the ONLY ways to
 *    delete existing scripts, regardless of clearExisting.
 *
 * Changed scripts (signature differs but same top opcode as an existing script)
 * become `replace` pairs. Pairing groups existing and new chains by top opcode
 * and prefers the best prefix-similarity match (ties broken by order), so
 * duplicate-hat scripts are edited in place instead of randomly paired.
 *
 * @param {Object} parsed parsed descriptor ({blockMap, topBlocks})
 * @param {Array<{blockId:string, topOpcode:string, signature:string}>} existingScripts
 * @param {Object} [opts] {clearExisting: boolean, deleteScripts: Array<string>, clearAll: boolean}
 * @return {{keep:Array, replace:Array, remove:Array, add:Array}}
 */
function cleanOpcode(s) {
    return String(s == null ? '' : s).trim().replace(/^>/, '').trim().toLowerCase();
}

function prefixScore(a, b) {
    var al = String(a || '').split('\n');
    var bl = String(b || '').split('\n');
    var n = 0;
    while (n < al.length && n < bl.length && al[n] === bl[n]) n++;
    return n;
}

function planChanges(parsed, existingScripts, opts) {
    var blockMap = parsed && parsed.blockMap ? parsed.blockMap : {};
    var topBlocks = parsed && parsed.topBlocks ? parsed.topBlocks : [];
    var container = {_blocks: blockMap};

    var newChains = [];
    for (var i = 0; i < topBlocks.length; i++) {
        var tb = topBlocks[i];
        if (!tb || !tb.id || tb.shadow) continue;
        var block = blockMap[tb.id];
        if (!block || block.shadow) continue;
        var sig = signatureFromContainer(container, tb.id);
        if (!sig) continue;
        newChains.push({
            newId: tb.id,
            topOpcode: block.opcode || '',
            signature: sig
        });
    }

    var existing = (existingScripts || []).slice();
    if (!Array.isArray(existing)) existing = [];

    var options = opts || {};
    var deleteScripts = (options.deleteScripts || []).map(cleanOpcode);
    var clearAll = !!options.clearAll;

    var consumed = {};
    function consumeBySignature(sig) {
        for (var j = 0; j < existing.length; j++) {
            if (!consumed[j] && existing[j] && existing[j].signature === sig) return j;
        }
        return -1;
    }

    var keep = [];
    var add = [];
    var replace = [];

    for (var n = 0; n < newChains.length; n++) {
        var item = newChains[n];

        // 1. Byte-identical script → keep the existing block untouched.
        var keepIdx = consumeBySignature(item.signature);
        if (keepIdx !== -1) {
            consumed[keepIdx] = true;
            keep.push({oldId: existing[keepIdx].blockId, newId: item.newId, topOpcode: item.topOpcode});
            continue;
        }

        // 2. Best prefix-similarity match among remaining scripts of the SAME
        //    hat. Ties break by order, so editing a duplicated hat lands on the
        //    right script instead of the first one.
        var bestIdx = -1;
        var bestScore = 0;
        for (var e = 0; e < existing.length; e++) {
            if (consumed[e] || !existing[e]) continue;
            if (String(existing[e].topOpcode || '').toLowerCase() !== String(item.topOpcode || '').toLowerCase()) continue;
            var sc = prefixScore(existing[e].signature, item.signature);
            if (sc > bestScore) {
                bestScore = sc;
                bestIdx = e;
            }
        }
        if (bestIdx !== -1) {
            consumed[bestIdx] = true;
            replace.push({
                oldId: existing[bestIdx].blockId,
                oldOpcode: existing[bestIdx].topOpcode,
                newId: item.newId,
                topOpcode: item.topOpcode,
                signature: item.signature
            });
            continue;
        }

        // 3. No existing counterpart → true addition.
        add.push({newId: item.newId, topOpcode: item.topOpcode, signature: item.signature});
    }

    // Removals: only scripts explicitly requested to go (deleteScripts or
    // clearAll). Omission NEVER deletes — with or without clearExisting — so
    // re-emitting just the edited script leaves the rest of the canvas intact.
    var remove = [];
    for (var r = 0; r < existing.length; r++) {
        if (consumed[r] || !existing[r]) continue;
        var rem = existing[r];
        var doRemove = clearAll ||
            (rem.topOpcode && deleteScripts.indexOf(cleanOpcode(rem.topOpcode)) !== -1);
        if (doRemove) {
            remove.push({oldId: rem.blockId, topOpcode: rem.topOpcode});
        }
    }

    return {
        keep: keep,
        replace: replace,
        remove: remove,
        add: add
    };
}

export {planChanges};