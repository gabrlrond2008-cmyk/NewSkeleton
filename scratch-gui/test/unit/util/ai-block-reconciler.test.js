import {readWorkspaceScripts, signatureFromContainer} from '../../../src/lib/ai-workspace-reader.js';
import {planChanges} from '../../../src/lib/ai-block-reconciler.js';

function makeChain(prefix, steps, hasNested, hat) {
    var blockMap = {};
    var top = {
        id: prefix + '_top', opcode: hat || 'event_whenflagclicked',
        fields: {}, inputs: {}, next: prefix + '_mv', parent: null, topLevel: true, shadow: false
    };
    var mvId = prefix + '_mv';
    var move = {
        id: mvId, opcode: 'motion_movesteps', fields: {}, inputs: {},
        next: null, parent: null, topLevel: true, shadow: false
    };
    blockMap[top.id] = top;
    blockMap[mvId] = move;
    if (hasNested) {
        var nestedId = prefix + '_nstd';
        blockMap[nestedId] = {
            id: nestedId, opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', value: 'x'}},
            inputs: {}, next: null, parent: mvId, topLevel: false, shadow: false
        };
        move.inputs.STEPS = {name: 'STEPS', block: nestedId, shadow: null};
    } else {
        var sId = prefix + '_num';
        blockMap[sId] = {
            id: sId, opcode: 'math_number', fields: {NUM: {name: 'NUM', value: String(steps)}},
            inputs: {}, next: null, parent: mvId, topLevel: false, shadow: true
        };
        move.inputs.STEPS = {name: 'STEPS', block: null, shadow: sId};
    }
    return {blockMap: blockMap, topId: top.id};
}

function parsedFrom(chains) {
    var blockMap = {};
    var topBlocks = [];
    for (var i = 0; i < chains.length; i++) {
        var c = chains[i];
        for (var id in c.blockMap) blockMap[id] = c.blockMap[id];
        topBlocks.push({id: c.topId, shadow: false});
    }
    return {blockMap: blockMap, topBlocks: topBlocks};
}

function existingFrom(chains) {
    var container = {_blocks: {}, _scripts: []};
    for (var i = 0; i < chains.length; i++) {
        var c = chains[i];
        for (var id in c.blockMap) container._blocks[id] = c.blockMap[id];
        container._scripts.push(c.topId);
    }
    return container._scripts.map(function (tid) {
        return {blockId: tid, topOpcode: container._blocks[tid].opcode, signature: signatureFromContainer(container, tid)};
    });
}

describe('signatureFromContainer', () => {
    test('produces the canonical text readWorkspace would print', () => {
        const c = makeChain('A', 10, false);
        const sig = signatureFromContainer({_blocks: c.blockMap}, c.topId);
        expect(sig).toContain('>event_whenflagclicked');
        expect(sig).toContain('>motion_movesteps STEPS=10');
    });

    test('nested reporters are indented lines', () => {
        const c = makeChain('B', 0, true);
        const sig = signatureFromContainer({_blocks: c.blockMap}, c.topId);
        expect(sig).toContain('STEPS: >data_variable<');
    });
});

describe('readWorkspaceScripts', () => {
    test('returns one script per top-level chain with valid signatures', () => {
        const c = makeChain('C', 10, false);
        const vm = {editingTarget: {blocks: {_blocks: c.blockMap, _scripts: [c.topId]}}};
        const out = readWorkspaceScripts(vm);
        expect(out).toHaveLength(1);
        expect(out[0].blockId).toBe(c.topId);
        expect(out[0].signature).toBe(signatureFromContainer({_blocks: c.blockMap}, c.topId));
    });

    test('returns nothing when vm is missing or there are no scripts', () => {
        expect(readWorkspaceScripts(null)).toEqual([]);
        expect(readWorkspaceScripts({editingTarget: {blocks: {_scripts: []}}})).toEqual([]);
    });
});

describe('planChanges', () => {
    test('identical scripts are kept, nothing added or removed', () => {
        const old = makeChain('K', 10, false);
        const plan = planChanges(parsedFrom([makeChain('K2', 10, false)]), existingFrom([old]), {});
        expect(plan.keep).toHaveLength(1);
        expect(plan.keep[0].oldId).toBe(old.topId);
        expect(plan.add).toHaveLength(0);
        expect(plan.remove).toHaveLength(0);
        expect(plan.replace).toHaveLength(0);
    });

    test('never deletes unlisted scripts by default', () => {
        const old = makeChain('R1', 10, false);
        const plan = planChanges(parsedFrom([]), existingFrom([old]), {});
        expect(plan.remove).toHaveLength(0);
        expect(plan.keep).toHaveLength(0);
        expect(plan.add).toHaveLength(0);
    });

    test('deleteScripts removes only the scripts the model asked to delete', () => {
        const old1 = makeChain('R1', 10, false);
        const old2 = makeChain('R2', 6, true);
        const plan = planChanges(parsedFrom([]), existingFrom([old1, old2]), {
            deleteScripts: ['event_whenflagclicked']
        });
        expect(plan.remove).toHaveLength(2);
    });

    test('clearExisting edits: unlisted scripts are never removed, changed scripts are replaces', () => {
        const edited = makeChain('E1', 3, false);
        const untouched = makeChain('E2', 8, false, 'event_whenkeypressed');
        const out = makeChain('E3', 5, false);
        const plan = planChanges(parsedFrom([out]), existingFrom([edited, untouched]), {
            clearExisting: true
        });
        // `untouched` was NOT reproduced — it must survive (omission = keep).
        expect(plan.remove).toHaveLength(0);
        expect(plan.replace).toHaveLength(1);
        expect(plan.replace[0].oldId).toBe(edited.topId);
        expect(plan.add).toHaveLength(0);
    });

    test('clearExisting with identical scripts keeps them and never drops the unlisted one', () => {
        const keep = makeChain('F1', 10, false);
        const drop = makeChain('F2', 7, true, 'event_whenkeypressed');
        const plan = planChanges(parsedFrom([keep]), existingFrom([keep, drop]), {
            clearExisting: true
        });
        expect(plan.keep).toHaveLength(1);
        expect(plan.remove).toHaveLength(0);
    });

    test('clearExisting false never deletes unlisted scripts', () => {
        const old = makeChain('G1', 10, false);
        const plan = planChanges(parsedFrom([makeChain('G2', 10, false)]), existingFrom([old]), {
            clearExisting: false
        });
        expect(plan.remove).toHaveLength(0);
        expect(plan.keep).toHaveLength(1);
    });

    test('clearAll removes everything unpaired', () => {
        const old = makeChain('Q1', 10, false);
        const keeps = makeChain('Q2', 10, false);
        const other = makeChain('Q3', 5, true);
        const plan = planChanges(parsedFrom([keeps]), existingFrom([old, other]), {clearAll: true});
        expect(plan.remove).toHaveLength(1);
        expect(plan.remove[0].oldId).toBe(other.topId);
        expect(plan.keep).toHaveLength(1);
        expect(plan.add).toHaveLength(0);
    });

    test('a changed script becomes a replace paired by top opcode', () => {
        const old = makeChain('X1', 10, false);
        const changed = makeChain('X2', 15, false);
        const plan = planChanges(parsedFrom([changed]), existingFrom([old]), {});
        expect(plan.replace).toHaveLength(1);
        expect(plan.replace[0].oldId).toBe(old.topId);
        expect(plan.replace[0].newId).toBe('X2_top');
        expect(plan.add).toHaveLength(0);
        expect(plan.remove).toHaveLength(0);
    });

    test('a brand new script is added', () => {
        const newChain = makeChain('N1', 5, false);
        const plan = planChanges(parsedFrom([newChain]), [], {});
        expect(plan.add).toHaveLength(1);
        expect(plan.add[0].newId).toBe(newChain.topId);
        expect(plan.keep).toHaveLength(0);
    });

    test('duplicate identical scripts: one kept, leftover removed only when requested', () => {
        const e1 = makeChain('M1', 7, false);
        const e2 = makeChain('M2', 7, false);
        const plan = planChanges(parsedFrom([makeChain('M3', 7, false)]), existingFrom([e1, e2]), {});
        expect(plan.keep).toHaveLength(1);
        expect(plan.remove).toHaveLength(0);
    });
});