import {resolveEdits} from '../../../src/lib/ai-edit-resolver.js';

// Green flag → motion_movesteps STEPS=n (a simple script to edit).
function makeChain(prefix, steps) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: 'event_whenflagclicked',
        fields: {}, inputs: {}, next: prefix + '_mv', parent: null, topLevel: true, shadow: false
    };
    var numId = prefix + '_num';
    blockMap[numId] = {
        id: numId, opcode: 'math_number', shadow: true, topLevel: false,
        fields: {NUM: {name: 'NUM', value: String(steps)}}, inputs: {}, next: null
    };
    var mv = {
        id: prefix + '_mv', opcode: 'motion_movesteps', shadow: false, topLevel: false,
        fields: {}, inputs: {STEPS: {name: 'STEPS', block: null, shadow: numId}},
        next: null, parent: prefix + '_top'
    };
    blockMap[top.id] = top;
    blockMap[mv.id] = mv;
    return {blockMap: blockMap, topId: top.id};
}

// Green flag → control_if → SUBSTACK [movesteps 10, movesteps 20]
function makeIfChain(prefix) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: 'event_whenflagclicked',
        fields: {}, inputs: {}, next: prefix + '_if', parent: null, topLevel: true, shadow: false
    };
    var iff = {
        id: prefix + '_if', opcode: 'control_if', fields: {}, mutation: null,
        inputs: {
            CONDITION: {name: 'CONDITION', block: prefix + '_cond', shadow: null},
            SUBSTACK: {name: 'SUBSTACK', block: prefix + '_b0', shadow: null}
        },
        next: null, parent: null, topLevel: true, shadow: false
    };
    blockMap[top.id] = top;
    blockMap[iff.id] = iff;
    blockMap[prefix + '_cond'] = {
        id: prefix + '_cond', opcode: 'operator_gt', shadow: false, topLevel: false,
        fields: {}, inputs: {}, next: null, parent: prefix + '_if'
    };
    for (var i = 0; i < 2; i++) {
        var cid = prefix + '_b' + i;
        var numId = prefix + '_n' + i;
        blockMap[numId] = {
            id: numId, opcode: 'math_number', shadow: true, topLevel: false,
            fields: {NUM: {name: 'NUM', value: String(10 + i * 10)}}, inputs: {}, next: null
        };
        blockMap[cid] = {
            id: cid, opcode: 'motion_movesteps', shadow: false, topLevel: false,
            fields: {}, inputs: {STEPS: {name: 'STEPS', block: null, shadow: numId}},
            next: i + 1 < 2 ? prefix + '_b' + (i + 1) : null, parent: prefix + '_if'
        };
    }
    return {blockMap: blockMap, topId: top.id};
}

function existingScriptsFor(chain, topOpcode) {
    return [{blockId: chain.topId, topOpcode: topOpcode, signature: ''}];
}

function containerOf(chain) {
    return {_blocks: chain.blockMap};
}

describe('resolveEdits — remove / change / insert', () => {
    test('remove resolves the target block id', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'remove', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10'}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops.length).toBe(1);
        expect(res.ops[0].kind).toBe('remove');
        expect(res.ops[0].oldId).toBe('A_mv');
        expect(res.counts.removed).toBe(1);
    });

    test('change mutates a same-opcode block IN PLACE when only values differ', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10', blocks: [{opcode: 'motion_movesteps', inputs: {STEPS: 20}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops.length).toBe(1);
        const op = res.ops[0];
        expect(op.kind).toBe('mutate');
        expect(op.oldId).toBe('A_mv');
        // the movesteps block is a child of the hat via `next`
        expect(op.atBlock).toBe('A_top');
        expect(op.atSlot).toBe('next');
        expect(op.runIds.length).toBeGreaterThan(0);
        expect(res.counts.changed).toBe(1);
        // the new block is available in the combined map for the mutation
        expect(res.blockMap[op.newId]).toBeDefined();
        expect(res.blockMap[op.newId].opcode).toBe('motion_movesteps');
    });

    test('insert after a block uses that block as the anchor', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'insert', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10', socket: 'next', blocks: [{opcode: 'looks_say', inputs: {MESSAGE: 'hola'}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('insert');
        expect(res.ops[0].atBlock).toBe('A_mv');
        expect(res.ops[0].atSlot).toBe('next');
        expect(res.ops[0].stacked).toBe(true);
        expect(res.counts.inserted).toBe(1);
    });

    test('insert into a populated SUBSTACK appends after its tail', () => {
        const c = makeIfChain('A');
        const res = resolveEdits(
            [{op: 'insert', chain: 'event_whenflagclicked', target: 'control_if', socket: 'SUBSTACK', blocks: [{opcode: 'looks_say', inputs: {MESSAGE: 'hola'}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        const op = res.ops[0];
        expect(op.kind).toBe('insert');
        // appends at the tail of the substack (the second movesteps block)
        expect(op.atBlock).toBe('A_b1');
        expect(op.atSlot).toBe('next');
        expect(op.stacked).toBe(true);
    });

    test('insert into an empty socket (CONDITION value input) targets that input', () => {
        const setChain = {
            blockMap: {},
            topId: 'S_top'
        };
        setChain.blockMap['S_top'] = {
            id: 'S_top', opcode: 'event_whenflagclicked', fields: {}, inputs: {},
            next: 'S_set', parent: null, topLevel: true, shadow: false
        };
        setChain.blockMap['S_set'] = {
            id: 'S_set', opcode: 'data_setvariableto', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}},
            inputs: {VALUE: {name: 'VALUE', block: null, shadow: null}},
            next: null, parent: 'S_top'
        };
        const res = resolveEdits(
            [{op: 'insert', chain: 'event_whenflagclicked', target: 'data_setvariableto', socket: 'VALUE', blocks: [{opcode: 'sensing_answer'}]}],
            existingScriptsFor(setChain, 'event_whenflagclicked'),
            containerOf(setChain)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('insert');
        expect(res.ops[0].atBlock).toBe('S_set');
        expect(res.ops[0].atSlot).toBe('VALUE');
        expect(res.ops[0].stacked).toBe(false);
    });

    test('insert into a populated value input replaces the reporter (no stacking)', () => {
        const setChain = {
            blockMap: {},
            topId: 'T_top'
        };
        setChain.blockMap['T_top'] = {
            id: 'T_top', opcode: 'event_whenflagclicked', fields: {}, inputs: {},
            next: 'T_set', parent: null, topLevel: true, shadow: false
        };
        setChain.blockMap['T_set'] = {
            id: 'T_set', opcode: 'data_setvariableto', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}},
            inputs: {VALUE: {name: 'VALUE', block: 'T_r', shadow: null}},
            next: null, parent: 'T_top'
        };
        setChain.blockMap['T_r'] = {
            id: 'T_r', opcode: 'data_variable', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}}, inputs: {}, next: null, parent: 'T_set'
        };
        const res = resolveEdits(
            [{op: 'insert', chain: 'event_whenflagclicked', target: 'data_setvariableto', socket: 'VALUE', blocks: [{opcode: 'sensing_answer'}]}],
            existingScriptsFor(setChain, 'event_whenflagclicked'),
            containerOf(setChain)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops.length).toBe(1);
        expect(res.ops[0].kind).toBe('replace');
        expect(res.ops[0].oldId).toBe('T_r');
        expect(res.ops[0].atBlock).toBe('T_set');
        expect(res.ops[0].atSlot).toBe('VALUE');
        expect(res.ops[0].stacked).toBe(false);
    });

    test('target matches by bare opcode when the value differs', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'motion_movesteps', blocks: [{opcode: 'motion_movesteps', inputs: {STEPS: 5}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].oldId).toBe('A_mv');
    });
});

describe('resolveEdits — scalar changes mutate in place', () => {
    test('same opcode + different shadow value → mutate', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10', blocks: [{opcode: 'motion_movesteps', inputs: {STEPS: 15}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('mutate');
        expect(res.ops[0].oldId).toBe('A_mv');
        expect(res.counts.changed).toBe(1);
    });

    test('same opcode + different variable field → mutate', () => {
        const setChain = {
            blockMap: {},
            topId: 'V_top'
        };
        setChain.blockMap['V_top'] = {
            id: 'V_top', opcode: 'event_whenflagclicked', fields: {}, inputs: {},
            next: 'V_set', parent: null, topLevel: true, shadow: false
        };
        setChain.blockMap['V_set'] = {
            id: 'V_set', opcode: 'data_setvariableto', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}},
            inputs: {VALUE: {name: 'VALUE', block: null, shadow: 'V_val'}},
            next: null, parent: 'V_top'
        };
        setChain.blockMap['V_val'] = {
            id: 'V_val', opcode: 'math_number', shadow: true, topLevel: false,
            fields: {NUM: {name: 'NUM', value: '1'}}, inputs: {}, next: null, parent: 'V_set'
        };
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'data_setvariableto', blocks: [{opcode: 'data_setvariableto', fields: {VARIABLE: 'score'}, inputs: {VALUE: 1}}]}],
            existingScriptsFor(setChain, 'event_whenflagclicked'),
            containerOf(setChain)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('mutate');
        expect(res.ops[0].oldId).toBe('V_set');
    });

    test('different opcode → replace (structural change)', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10', blocks: [{opcode: 'looks_say', inputs: {MESSAGE: 'hola'}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('replace');
        expect(res.ops[0].oldId).toBe('A_mv');
    });

    test('new input present in old but different real child opcode → replace', () => {
        const setChain = {
            blockMap: {},
            topId: 'G_top'
        };
        setChain.blockMap['G_top'] = {
            id: 'G_top', opcode: 'event_whenflagclicked', fields: {}, inputs: {},
            next: 'G_set', parent: null, topLevel: true, shadow: false
        };
        setChain.blockMap['G_set'] = {
            id: 'G_set', opcode: 'data_setvariableto', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}},
            inputs: {VALUE: {name: 'VALUE', block: 'G_r', shadow: null}},
            next: null, parent: 'G_top'
        };
        setChain.blockMap['G_r'] = {
            id: 'G_r', opcode: 'data_variable', shadow: false, topLevel: false,
            fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}}, inputs: {}, next: null, parent: 'G_set'
        };
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'data_setvariableto', blocks: [{opcode: 'data_setvariableto', fields: {VARIABLE: 'puntos'}, inputs: {VALUE: {opcode: 'sensing_answer'}}}]}],
            existingScriptsFor(setChain, 'event_whenflagclicked'),
            containerOf(setChain)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('replace');
    });

    test('control_if with only CONDITION in the new → mutate, SUBSTACK untouched', () => {
        const c = makeIfChain('A');
        const res = resolveEdits(
            [{op: 'change', chain: 'event_whenflagclicked', target: 'control_if', blocks: [{opcode: 'control_if', inputs: {CONDITION: {opcode: 'operator_gt'}}}]}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.unresolved.length).toBe(0);
        expect(res.ops[0].kind).toBe('mutate');
        expect(res.ops[0].oldId).toBe('A_if');
    });
});

describe('resolveEdits — unresolved targets never delete', () => {
    test('unknown chain reports unresolved', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'remove', chain: 'event_whenkeypressed', target: 'motion_movesteps STEPS=10'}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.ops.length).toBe(0);
        expect(res.unresolved.length).toBe(1);
        expect(res.unresolved[0]).toContain('event_whenkeypressed');
    });

    test('unknown block reports unresolved', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'remove', chain: 'event_whenflagclicked', target: 'looks_say MESSAGE=hola'}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.ops.length).toBe(0);
        expect(res.unresolved.length).toBe(1);
    });

    test('unknown operation reports unresolved', () => {
        const c = makeChain('A', 10);
        const res = resolveEdits(
            [{op: 'wipe', chain: 'event_whenflagclicked', target: 'motion_movesteps STEPS=10'}],
            existingScriptsFor(c, 'event_whenflagclicked'),
            containerOf(c)
        );
        expect(res.ops.length).toBe(0);
        expect(res.unresolved.length).toBe(1);
    });
});
