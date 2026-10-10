import {autoCorrect} from '../../../src/lib/ai-block-autocorrect';
import {validate} from '../../../src/lib/ai-block-validator';

function block(id, opcode, opts) {
    return Object.assign({
        id: id, opcode: opcode, fields: {}, inputs: {},
        next: null, parent: null, topLevel: false, shadow: false, mutation: null
    }, opts || {});
}

function numberShadow(id, value) {
    return block(id, 'math_number', {shadow: true, fields: {NUM: {name: 'NUM', value: String(value)}}});
}

describe('comparison operands accept value reporters (fix)', () => {
    test('sensing_answer stays inside operator_equals OPERAND1', () => {
        const wait = block('wait', 'control_wait_until', {topLevel: true});
        const eq = block('eq', 'operator_equals');
        const ans = block('ans', 'sensing_answer');
        const zero = numberShadow('zero', 0);
        wait.inputs.CONDITION = {name: 'CONDITION', block: 'eq', shadow: null};
        eq.inputs.OPERAND1 = {name: 'OPERAND1', block: 'ans', shadow: null};
        eq.inputs.OPERAND2 = {name: 'OPERAND2', block: null, shadow: 'zero'};
        const blockMap = {wait: wait, eq: eq, ans: ans, zero: zero};
        blockMap.zero.parent = 'eq';

        const corrected = autoCorrect({blockMap: blockMap, topBlocks: [wait]});
        expect(corrected.blockMap.eq.inputs.OPERAND1.block).toBe('ans');
        expect(validate(corrected, null).valid).toBe(true);
    });

    test('variable and nested arithmetic reporter stay inside operator_gt', () => {
        const ifb = block('ifb', 'control_if', {topLevel: true});
        const gt = block('gt', 'operator_gt');
        const add = block('add', 'operator_add');
        const varB = block('v1', 'data_variable', {fields: {VARIABLE: {name: 'VARIABLE', value: 'puntos'}}});
        const two = numberShadow('two', 2);
        const five = numberShadow('five', 5);
        const move = block('move', 'motion_movesteps', {
            fields: {STEPS: {name: 'STEPS', value: '10'}},
            inputs: {STEPS: {name: 'STEPS', block: null, shadow: 'shSteps'}}
        });
        const shSteps = numberShadow('shSteps', 10);
        ifb.inputs.CONDITION = {name: 'CONDITION', block: 'gt'};
        ifb.inputs.SUBSTACK = {name: 'SUBSTACK', block: 'move'};
        gt.inputs.OPERAND1 = {name: 'OPERAND1', block: 'add'};
        gt.inputs.OPERAND2 = {name: 'OPERAND2', block: null, shadow: 'five'};
        add.inputs.NUM1 = {name: 'NUM1', block: 'v1'};
        add.inputs.NUM2 = {name: 'NUM2', block: null, shadow: 'two'};
        const blockMap = {ifb: ifb, gt: gt, add: add, v1: varB, two: two, five: five, move: move, shSteps: shSteps};
        blockMap.two.parent = 'add';
        blockMap.five.parent = 'gt';
        blockMap.move.parent = 'ifb';
        blockMap.shSteps.parent = 'move';

        const corrected = autoCorrect({blockMap: blockMap, topBlocks: [ifb]});
        expect(corrected.blockMap.gt.inputs.OPERAND1.block).toBe('add');
        expect(corrected.blockMap.add.inputs.NUM1.block).toBe('v1');
        expect(validate(corrected, null).valid).toBe(true);
    });

    test('boolean and/or still reject non-boolean operands', () => {
        const andb = block('and', 'operator_and');
        const bad = block('bad', 'sensing_answer');
        const md = block('md', 'sensing_mousedown');
        andb.inputs.OPERAND1 = {name: 'OPERAND1', block: 'bad'};
        andb.inputs.OPERAND2 = {name: 'OPERAND2', block: 'md'};

        const corrected = autoCorrect({blockMap: {and: andb, bad: bad, md: md}, topBlocks: [andb]});
        expect(corrected.blockMap.and.inputs.OPERAND1.block).toBeNull();
        expect(corrected.blockMap.and.inputs.OPERAND2.block).toBe('md');
    });
});
