import {autoCorrect} from '../../../src/lib/ai-block-autocorrect';

function block(id, opcode, opts) {
    return Object.assign({
        id: id, opcode: opcode, fields: {}, inputs: {},
        next: null, parent: null, topLevel: false, shadow: false, mutation: null
    }, opts || {});
}

function numberShadow(id, value) {
    return block(id, 'math_number', {shadow: true, fields: {NUM: {name: 'NUM', value: String(value)}}});
}

describe('ai-block-autocorrect error propagation and operand filling', () => {
    test('autoCorrect preserves the parse errors so they reach the UI/fix loop', () => {
        const corrected = autoCorrect({
            blockMap: {},
            topBlocks: [],
            errors: ['Variable "x" se asignó con valor vacío → se rellenó con "x".']
        });
        expect(corrected.errors).toHaveLength(1);
        expect(corrected.errors[0]).toContain('se rellenó');
        expect(corrected.valid).toBe(false);
    });

    test('autoCorrect returns no errors and valid true for clean input', () => {
        const corrected = autoCorrect({blockMap: {}, topBlocks: []});
        expect(corrected.errors).toHaveLength(0);
        expect(corrected.valid).toBe(true);
    });

    test('operator_add missing NUM2 is filled with a math_number 0 shadow', () => {
        const move = block('move', 'motion_movesteps', {topLevel: true});
        const add = block('add', 'operator_add');
        const sh1 = numberShadow('sh1', 0);
        move.inputs.STEPS = {name: 'STEPS', block: 'add', shadow: null};
        add.inputs.NUM1 = {name: 'NUM1', block: null, shadow: 'sh1'};

        const corrected = autoCorrect({blockMap: {move: move, add: add, sh1: sh1}, topBlocks: [move]});
        const addAfter = corrected.blockMap.add;
        expect(addAfter.inputs.NUM2).toBeDefined();
        expect(addAfter.inputs.NUM2.shadow).toBeTruthy();
        const num2 = corrected.blockMap[addAfter.inputs.NUM2.shadow];
        expect(num2.opcode).toBe('math_number');
        expect(num2.fields.NUM.value).toBe('0');
    });

    test('operator_subtract with both operands missing gets both filled', () => {
        const sub = block('sub', 'operator_subtract', {topLevel: true});
        const corrected = autoCorrect({blockMap: {sub: sub}, topBlocks: [sub]});
        const subAfter = corrected.blockMap.sub;
        expect(subAfter.inputs.NUM1.shadow).toBeTruthy();
        expect(subAfter.inputs.NUM2.shadow).toBeTruthy();
        expect(corrected.blockMap[subAfter.inputs.NUM1.shadow].fields.NUM.value).toBe('0');
    });
});
