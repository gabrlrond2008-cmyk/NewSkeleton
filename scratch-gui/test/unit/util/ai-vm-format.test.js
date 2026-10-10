import {blockKernel, signatureFromContainer, subtreeSignature} from '../../../src/lib/ai-workspace-reader.js';
import {diffChain} from '../../../src/lib/ai-block-diff.js';

// VM-REAL format: an input with only a shadow uses block === shadow
// (scratch-vm adapter.js sets childBlockNode = childShadowNode when no flat child).
function makeVmChain(prefix, steps) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: 'event_whenflagclicked', fields: {}, inputs: {},
        next: prefix + '_if', parent: null, topLevel: true, shadow: false
    };
    var iff = {
        id: prefix + '_if', opcode: 'control_if', fields: {}, mutation: null,
        inputs: {
            CONDITION: {name: 'CONDITION', block: null, shadow: null},
            SUBSTACK: {name: 'SUBSTACK', block: steps.length > 0 ? prefix + '_b0' : null, shadow: null}
        },
        next: null, parent: null, topLevel: true, shadow: false
    };
    blockMap[top.id] = top;
    blockMap[iff.id] = iff;
    for (var i = 0; i < steps.length; i++) {
        var cid = prefix + '_b' + i;
        var numId = prefix + '_n' + i;
        blockMap[numId] = {
            id: numId, opcode: 'math_number', shadow: true, topLevel: false,
            fields: {NUM: {name: 'NUM', value: String(steps[i])}}, inputs: {}, next: null
        };
        blockMap[cid] = {
            id: cid, opcode: 'motion_movesteps', shadow: false, topLevel: false,
            fields: {},
            inputs: {STEPS: {name: 'STEPS', block: numId, shadow: numId}}, // VM format! block===shadow
            next: i + 1 < steps.length ? prefix + '_b' + (i + 1) : null, parent: prefix + '_if'
        };
    }
    return {blockMap: blockMap, topId: top.id};
}

// DESCRIPTOR format: shadow-only input has block:null
function makeDescChain(prefix, steps) {
    var c = JSON.parse(JSON.stringify(makeVmChain(prefix, steps)));
    for (var id in c.blockMap) {
        var b = c.blockMap[id];
        for (var iname in b.inputs) {
            if (b.inputs[iname].shadow && b.inputs[iname].block === b.inputs[iname].shadow) {
                b.inputs[iname].block = null;
            }
        }
    }
    return c;
}

function containerOf(chainLike) {
    var cm = {};
    for (var k in chainLike.blockMap) cm[k] = chainLike.blockMap[k];
    return {_blocks: cm};
}

it('VM-format kernel includes the shadow value', () => {
    const vm = makeVmChain('A', [10]);
    const k = blockKernel(containerOf(vm), 'A_b0');
    expect(k).toBe('>motion_movesteps STEPS=10');
});

it('VM vs descriptor agree on kernel for an identical script', () => {
    const vm = makeVmChain('A', [10, 20]);
    const de = makeDescChain('B', [10, 20]);
    expect(blockKernel(containerOf(vm), 'A_b0')).toBe(blockKernel(containerOf(de), 'B_b0'));
    expect(signatureFromContainer(containerOf(vm), 'A_top')).toBe(signatureFromContainer(containerOf(de), 'B_top'));
});

it('identical VM script vs identical descriptor diff produces no ops', () => {
    const vm = makeVmChain('A', [10, 20]);
    const de = makeDescChain('B', [10, 20]);
    const res = diffChain(containerOf(vm), vm.topId, containerOf(de), de.topId);
    expect(res.status).toBe('ok');
    expect(res.ops).toEqual([]);
});

it('changing a value in a VM script emits insert+remove of ONLY that block', () => {
    const vm = makeVmChain('A', [10, 20]);
    const de = makeDescChain('B', [10, 99]);
    const res = diffChain(containerOf(vm), vm.topId, containerOf(de), de.topId);
    expect(res.status).toBe('ok');
    const inserts = res.ops.filter(o => o.kind === 'insert');
    const removes = res.ops.filter(o => o.kind === 'remove');
    expect(inserts.length).toBe(1);
    expect(removes.length).toBe(1);
    expect(removes[0].oldId).toBe('A_b1');
});

import {planChanges} from '../../../src/lib/ai-block-reconciler.js';

// Simulates the reader's readWorkspaceScripts for a real VM target.
function vmExisting(chainLike) {
    const top = chainLike.blockMap[chainLike.topId];
    const existing = [];
    existing.push({
        blockId: chainLike.topId,
        topOpcode: top.opcode,
        signature: signatureFromContainer(containerOf(chainLike), chainLike.topId)
    });
    return existing;
}

it('an unchanged VM script is KEPT by the plan (no delete)', () => {
    const vm = makeVmChain('A', [10, 20]);
    const de = makeDescChain('B', [10, 20]);
    const plan = planChanges({blockMap: de.blockMap, topBlocks: [{id: 'B_top'}]}, vmExisting(vm), {});
    expect(plan.keep.length).toBe(1);
    expect(plan.keep[0].oldId).toBe('A_top');
    expect(plan.replace.length).toBe(0);
    expect(plan.remove.length).toBe(0);
});

it('a changed VM script is REPLACED in place, Edit does not wipe the whole chain', () => {
    const vm = makeVmChain('A', [10, 20]);
    const de = makeDescChain('B', [10, 99]);
    const plan = planChanges({blockMap: de.blockMap, topBlocks: [{id: 'B_top'}]}, vmExisting(vm), {});
    expect(plan.replace.length).toBe(1);
    expect(plan.replace[0].oldId).toBe('A_top');
    expect(plan.remove.length).toBe(0);
});
