import {diffChain, boundedSubset, chainOf} from '../../../src/lib/ai-block-diff.js';
import {blockKernel, subtreeSignature, signatureFromContainer} from '../../../src/lib/ai-workspace-reader.js';

// A chain: green flag → (optional) control_if → [children statements] with STEPS
// values, so the substack content can be edited between old and new.
function makeIfChain(prefix, steps) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: 'event_whenflagclicked',
        fields: {}, inputs: {}, next: prefix + '_if', parent: null, topLevel: true, shadow: false
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
            inputs: {STEPS: {name: 'STEPS', block: null, shadow: numId}},
            next: i + 1 < steps.length ? prefix + '_b' + (i + 1) : null, parent: prefix + '_if'
        };
    }
    return {blockMap: blockMap, topId: top.id};
}

// A chain: green flag → data_setvariableto whose VALUE is an inline reporter.
function makeSetChain(prefix, reporter) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: 'event_whenflagclicked',
        fields: {}, inputs: {}, next: prefix + '_set', parent: null, topLevel: true, shadow: false
    };
    var set = {
        id: prefix + '_set', opcode: 'data_setvariableto', shadow: false, topLevel: true,
        fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}},
        inputs: {VALUE: {name: 'VALUE', block: prefix + '_r', shadow: null}},
        next: null, parent: null
    };
    blockMap[top.id] = top;
    blockMap[set.id] = set;
    if (reporter) {
        blockMap[prefix + '_r'] = {
            id: prefix + '_r', opcode: reporter.opcode, shadow: false, topLevel: false,
            fields: reporter.fields || {}, inputs: reporter.inputs || {}, next: null, parent: prefix + '_set'
        };
    } else {
        set.inputs.VALUE.block = null;
    }
    return {blockMap: blockMap, topId: top.id};
}

function containerOf(chain) {
    return {_blocks: chain.blockMap};
}

describe('blockKernel / subtreeSignature', () => {
    test('kernel ignores children, subtree includes them', () => {
        const c = makeIfChain('K', [10]);
        const ifId = Object.keys(c.blockMap).find(id => c.blockMap[id].opcode === 'control_if');
        expect(blockKernel(containerOf(c), c.topId)).toBe('>event_whenflagclicked');
        expect(blockKernel(containerOf(c), ifId)).toBe('>control_if');
        const full = subtreeSignature(containerOf(c), c.topId);
        expect(full).toBe('>event_whenflagclicked');
        const sub = subtreeSignature(containerOf(c), ifId);
        expect(sub).toContain('>motion_movesteps STEPS=10');
    });
});

describe('diffChain block-level', () => {
    test('identical scripts produce no ops', () => {
        const old = makeIfChain('A', [10, 20]);
        const neu = makeIfChain('B', [10, 20]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        expect(res.ops.length).toBe(0);
    });

    test('inserting a block IN THE MIDDLE of the if SUBSTACK keeps siblings', () => {
        const old = makeIfChain('A', [10, 30]);
        const neu = makeIfChain('B', [10, 25, 30]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        // The trailing old sibling (STEPS=30) is only a value-change away from the
        // new middle block, so it is mutated in place; the unchanged 30 is then a
        // plain insert after it. Both old blocks keep their live ids.
        const mutates = res.ops.filter(o => o.kind === 'mutate');
        expect(mutates.length).toBe(1);
        expect(mutates[0].oldId).toBe('A_b1');
        expect(mutates[0].atSlot).toBe('next');
        const inserts = res.ops.filter(o => o.kind === 'insert');
        expect(inserts.length).toBe(1);
        expect(inserts[0].runIds).toEqual(['B_b2']);
        expect(res.ops.filter(o => o.kind === 'remove').length).toBe(0);
    });

    test('removing the last block of the SUBSTACK emits a remove', () => {
        const old = makeIfChain('A', [10, 20]);
        const neu = makeIfChain('B', [10]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        const removes = res.ops.filter(o => o.kind === 'remove');
        expect(removes.length).toBe(1);
        expect(removes[0].oldId).toBe('A_b1');
    });

    test('a value change on a chain child mutates it IN PLACE (no insert/remove)', () => {
        const old = makeIfChain('A', [10, 20]);
        const neu = makeIfChain('B', [10, 99]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        expect(res.ops.length).toBe(1);
        expect(res.ops[0].kind).toBe('mutate');
        expect(res.ops[0].oldId).toBe('A_b1');
        expect(res.ops[0].newId).toBe('B_b1');
        expect(res.ops[0].stacked).toBe(true);
        expect(res.ops.filter(o => o.kind === 'insert').length).toBe(0);
        expect(res.ops.filter(o => o.kind === 'remove').length).toBe(0);
    });

    test('mutating the FIRST child of a substack anchors at the statement socket', () => {
        const old = makeIfChain('A', [10, 20]);
        const neu = makeIfChain('B', [99, 20]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const mutates = res.ops.filter(o => o.kind === 'mutate');
        expect(mutates.length).toBe(1);
        expect(mutates[0].oldId).toBe('A_b0');
        expect(mutates[0].newId).toBe('B_b0');
        expect(mutates[0].atBlock).toBe('A_if');
        expect(mutates[0].atSlot).toBe('SUBSTACK');
        expect(res.ops.filter(o => o.kind === 'remove').length).toBe(0);
    });

    test('a changed inline reporter becomes a replace at the VALUE socket', () => {
        const old = makeSetChain('A', {opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', value: 'x'}}});
        const neu = makeSetChain('B', {opcode: 'operator_add', inputs: {}});
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const replacements = res.ops.filter(o => o.kind === 'replace');
        expect(replacements.length).toBe(1);
        expect(replacements[0].oldId).toBe('A_r');
        expect(replacements[0].atSlot).toBe('VALUE');
        expect(replacements[0].runIds).toEqual(['B_r']);
    });

    test('a same-skeleton reporter field change mutates IN PLACE at the VALUE socket', () => {
        const old = makeSetChain('A', {opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', value: 'x'}}});
        const neu = makeSetChain('B', {opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', value: 'y'}}});
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const mutates = res.ops.filter(o => o.kind === 'mutate');
        expect(mutates.length).toBe(1);
        expect(mutates[0].oldId).toBe('A_r');
        expect(mutates[0].newId).toBe('B_r');
        expect(mutates[0].atBlock).toBe('A_set');
        expect(mutates[0].atSlot).toBe('VALUE');
        expect(mutates[0].stacked).toBe(false);
        expect(res.ops.filter(o => o.kind === 'replace').length).toBe(0);
        expect(res.ops.filter(o => o.kind === 'insert').length).toBe(0);
        expect(res.ops.filter(o => o.kind === 'remove').length).toBe(0);
    });

    test('a changed hat is unsupported (whole-chain fallback)', () => {
        const old = makeIfChain('A', [10]);
        const neu = makeIfChain('B', [10]);
        // different hat on the new chain
        neu.blockMap[neu.topId].opcode = 'event_whenkeypressed';
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('unsupported');
    });

    test('mutable blocks (procedures) are unsupported', () => {
        const old = makeIfChain('A', [10]);
        const neu = makeIfChain('B', [10]);
        const proc = neu.topId + '_p';
        neu.blockMap[proc] = {
            id: proc, opcode: 'procedures_call', shadow: false, topLevel: true,
            fields: {}, inputs: {}, next: null, mutation: {proccode: 'x'}
        };
        neu.blockMap[neu.topId].next = proc;
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('unsupported');
    });

    test('a structural mutation on control_if stays editable (edit in place, not wipe)', () => {
        const old = makeIfChain('A', [10]);
        const neu = makeIfChain('B', [10, 42]);
        // The VM stores a mutation object on control_if (as the XML writer used
        // to emit). It must NOT force the whole chain out of the diff.
        neu.blockMap[neu.topId] = Object.assign({}, neu.blockMap[neu.topId]);
        for (let id in neu.blockMap) {
            if (neu.blockMap[id].opcode === 'control_if') {
                neu.blockMap[id] = Object.assign({}, neu.blockMap[id], {mutation: {tagName: 'mutation', children: []}});
            }
        }
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const inserts = res.ops.filter(o => o.kind === 'insert');
        expect(inserts.length).toBe(1);
        expect(inserts[0].atBlock).toBe('A_b0');
        expect(inserts[0].atSlot).toBe('next');
    });

    test('control_if_else edits both substacks in place', () => {
        const old = makeIfChain('A', [10]);
        const neu = makeIfChain('B', [10]);
        const ifNew = neu.blockMap['B_if'];
        // Both sides are control_if_else (same kernel); the new one fills an
        // empty SUBSTACK2, so the change is a single insert inside the socket.
        for (const c1 of [old, neu]) {
            for (let id in c1.blockMap) {
                const b = c1.blockMap[id];
                if (b.opcode === 'control_if') {
                    b.opcode = 'control_if_else';
                    b.mutation = {tagName: 'mutation', haselse: 'true', children: []};
                    b.inputs.SUBSTACK2 = {name: 'SUBSTACK2', block: null, shadow: null};
                }
            }
        }
        // give the VM side (old) an else branch, and the new side keeps it empty? No:
        // new side ADDS content to the else socket.
        old.blockMap['A_if'].inputs.SUBSTACK2 = {name: 'SUBSTACK2', block: null, shadow: null};
        ifNew.inputs.SUBSTACK2 = {name: 'SUBSTACK2', block: 'B_e0', shadow: null};
        neu.blockMap['B_e0'] = {
            id: 'B_e0', opcode: 'motion_movesteps', shadow: false, topLevel: false,
            fields: {}, inputs: {STEPS: {name: 'STEPS', block: 'B_e0n', shadow: 'B_e0n'}},
            next: null, parent: 'B_if'
        };
        neu.blockMap['B_e0n'] = {
            id: 'B_e0n', opcode: 'math_number', shadow: true, topLevel: false,
            fields: {NUM: {name: 'NUM', value: '5'}}, inputs: {}, next: null
        };
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const inserts = res.ops.filter(o => o.kind === 'insert');
        const substack2Insert = inserts.filter(o => o.atSlot === 'SUBSTACK2');
        expect(substack2Insert.length).toBe(1);
        expect(substack2Insert[0].atBlock).toBe('A_if');
    });

    test('append at the end of the script uses the last matched block as anchor', () => {
        const old = makeIfChain('A', [10]);
        const neu = makeIfChain('B', [10, 42]);
        const res = diffChain(containerOf(old), old.topId, containerOf(neu), neu.topId);
        expect(res.status).toBe('ok');
        const inserts = res.ops.filter(o => o.kind === 'insert');
        expect(inserts.length).toBe(1);
        expect(inserts[0].atBlock).toBe('A_b0');
        expect(inserts[0].atSlot).toBe('next');
    });
});

describe('boundedSubset', () => {
    test('trims the outgoing next at the run boundary', () => {
        const old = makeIfChain('S', [10, 20]);
        // run = only the last block; its next points to nothing (it is the tail here)
        const subs = boundedSubset(containerOf(old), ['S_b1']);
        expect(subs._blocks['S_b1']).toBeDefined();
        expect(subs._blocks['S_b1'].next).toBeNull();
    });

    test('copy includes input children of the run membership', () => {
        const c = makeIfChain('T', [10, 20]);
        const subs = boundedSubset(containerOf(c), ['T_b0']);
        expect(subs._blocks['T_n0']).toBeDefined();
        expect(subs._blocks['T_n1']).toBeUndefined();
        expect(subs._blocks['T_b0'].next).toBeNull();
    });
});