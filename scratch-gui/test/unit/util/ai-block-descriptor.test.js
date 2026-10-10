import {parse} from '../../../src/lib/ai-block-descriptor';
import {autoCorrect} from '../../../src/lib/ai-block-autocorrect';
import {blocksToXML} from '../../../src/lib/ai-block-to-xml';

function jsonFor(operand2) {
    return JSON.stringify({
        scripts: [{
            blocks: [
                {opcode: 'event_whenflagclicked'},
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_equals',
                            inputs: {
                                OPERAND1: {opcode: 'sensing_answer'},
                                OPERAND2: operand2
                            }
                        },
                        SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]
                    }
                }
            ]
        }]
    });
}

function jsonIfEquals(operand1, operand2) {
    return JSON.stringify({
        scripts: [{
            blocks: [
                {opcode: 'event_whenflagclicked'},
                {
                    opcode: 'control_if',
                    inputs: {
                        CONDITION: {
                            opcode: 'operator_equals',
                            inputs: {OPERAND1: operand1, OPERAND2: operand2}
                        },
                        SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]
                    }
                }
            ]
        }]
    });
}

describe('ai-block-descriptor rejects symbols in comparison operands', () => {
    test('a bare symbol like "*" becomes 0 and is reported as an error', () => {
        const parsed = parse(jsonFor('*'));
        expect(parsed.valid).toBe(false);
        const hasError = parsed.errors.some(e => e.indexOf('"*"') !== -1 && e.indexOf('OPERAND2') !== -1);
        expect(hasError).toBe(true);

        let zeroShadow = null;
        for (const id in parsed.blockMap) {
            const b = parsed.blockMap[id];
            if (b.shadow && b.opcode === 'math_number') {
                const parent = parsed.blockMap[b.parent];
                if (parent && parent.opcode === 'operator_equals' && parent.inputs.OPERAND2 &&
                        parent.inputs.OPERAND2.shadow === id) {
                    zeroShadow = b;
                }
            }
        }
        expect(zeroShadow).not.toBeNull();
        expect(zeroShadow.fields.NUM.value).toBe('0');
    });

    test('a partial expression like "2 + 2" is reported (not silently truncated to 2)', () => {
        const parsed = parse(jsonFor('2 + 2'));
        const hasError = parsed.errors.some(e => e.indexOf('"2 + 2"') !== -1);
        expect(hasError).toBe(true);
    });

    test('an operation nested as a real block is NOT flagged', () => {
        const parsed = parse(jsonFor({opcode: 'operator_add', inputs: {NUM1: 2, NUM2: 3}}));
        expect(parsed.errors.filter(e => e.indexOf('no numérico') !== -1)).toEqual([]);
        expect(parsed.valid).toBe(true);
    });

    test('a clean number like "0" or "10" is NOT flagged', () => {
        expect(parse(jsonFor(0)).errors.filter(e => e.indexOf('no numérico') !== -1)).toEqual([]);
        expect(parse(jsonFor('10')).errors.filter(e => e.indexOf('no numérico') !== -1)).toEqual([]);
    });
});

describe('ai-block-descriptor auto-converts plain names to real reporters', () => {
    function jsonForCustom(operand1, operand2) {
        return JSON.stringify({
            scripts: [{
                blocks: [
                    {opcode: 'event_whenflagclicked'},
                    {
                        opcode: 'control_if',
                        inputs: {
                            CONDITION: {
                                opcode: 'operator_equals',
                                inputs: {OPERAND1: operand1, OPERAND2: operand2}
                            },
                            SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]
                        }
                    }
                ]
            }]
        });
    }

    function findInputBlock(parsed, blockOpcode, inputName) {
        for (const id in parsed.blockMap) {
            const b = parsed.blockMap[id];
            if (b.opcode === blockOpcode && b.inputs[inputName] && b.inputs[inputName].block) {
                return parsed.blockMap[b.inputs[inputName].block];
            }
        }
        return null;
    }

    test('"respuesta" in a comparison operand becomes sensing_answer', () => {
        const parsed = parse(jsonForCustom('respuesta', 0));
        expect(parsed.errors.filter(e => e.indexOf('no numérico') !== -1)).toEqual([]);
        const op1 = findInputBlock(parsed, 'operator_equals', 'OPERAND1');
        expect(op1).not.toBeNull();
        expect(op1.opcode).toBe('sensing_answer');
    });

    test('a variable name like "puntos" becomes data_variable with VARIABLE field', () => {
        const parsed = parse(jsonForCustom('puntos', 0));
        expect(parsed.errors.filter(e => e.indexOf('no numérico') !== -1)).toEqual([]);
        const op1 = findInputBlock(parsed, 'operator_equals', 'OPERAND1');
        expect(op1).not.toBeNull();
        expect(op1.opcode).toBe('data_variable');
        expect(op1.fields.VARIABLE.value).toBe('puntos');
    });

    test('a symbol like "*" is still rejected: error reported and no reporter auto-created', () => {
        const parsed = parse(jsonForCustom('respuesta', '*'));
        const hasError = parsed.errors.some(e => e.indexOf('"*"') !== -1);
        expect(hasError).toBe(true);
        const op2 = findInputBlock(parsed, 'operator_equals', 'OPERAND2');
        expect(op2).toBeNull();
    });

    test('end-to-end: calculator "si respuesta = 0" with sloppy plain-string operands still builds XML', () => {
        const json = JSON.stringify({
            scripts: [{
                blocks: [
                    {opcode: 'event_whenflagclicked'},
                    {
                        opcode: 'control_if',
                        inputs: {
                            CONDITION: {
                                opcode: 'operator_equals',
                                inputs: {OPERAND1: 'respuesta', OPERAND2: 0}
                            },
                            SUBSTACK: [{
                                opcode: 'data_setvariableto',
                                fields: {VARIABLE: 'resultado'},
                                inputs: {VALUE: {
                                    opcode: 'operator_add',
                                    inputs: {
                                        NUM1: {opcode: 'data_variable', fields: {VARIABLE: 'num1'}},
                                        NUM2: {opcode: 'data_variable', fields: {VARIABLE: 'num2'}}
                                    }
                                }}
                            }]
                        }
                    }
                ]
            }]
        });
        const corrected = autoCorrect(parse(json));
        const xml = blocksToXML(corrected);
        expect(xml).toContain('type="operator_equals"');
        expect(xml).toContain('type="sensing_answer"');
        expect(xml).toContain('type="operator_add"');
        expect(xml).toContain('type="data_variable"');
        expect(xml).toContain('<field name="NUM">0</field>');
    });
});

describe('ai-block-descriptor never creates boolean shadow blocks', () => {
    function findBooleanShadow(parsed) {
        for (const id in parsed.blockMap) {
            if (parsed.blockMap[id].opcode === 'boolean') return parsed.blockMap[id];
        }
        return null;
    }

    test('a control_if with a reporter condition has NO boolean shadow and null shadow on CONDITION', () => {
        const parsed = parse(jsonIfEquals('respuesta', 0));
        expect(findBooleanShadow(parsed)).toBeNull();

        let ifBlock = null;
        for (const id in parsed.blockMap) {
            if (parsed.blockMap[id].opcode === 'control_if') ifBlock = parsed.blockMap[id];
        }
        expect(ifBlock).not.toBeNull();
        expect(ifBlock.inputs.CONDITION.shadow).toBeNull();
        expect(ifBlock.inputs.CONDITION.block).not.toBeNull();
    });

    test('a boolean literal like "true" in CONDITION is reported and produces no shadow', () => {
        const json = JSON.stringify({
            scripts: [{
                blocks: [
                    {opcode: 'event_whenflagclicked'},
                    {opcode: 'control_if', inputs: {CONDITION: true, SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]}}
                ]
            }]
        });
        const parsed = parse(json);
        expect(parsed.valid).toBe(false);
        expect(findBooleanShadow(parsed)).toBeNull();
        const hasError = parsed.errors.some(e => e.indexOf('reporter booleano') !== -1 && e.indexOf('CONDITION') !== -1);
        expect(hasError).toBe(true);
    });
});

describe('ai-block-descriptor contextual text shadow for auto-converted words', () => {
    function findOpcode(parsed, opcode) {
        for (const id in parsed.blockMap) {
            if (parsed.blockMap[id].opcode === opcode) return parsed.blockMap[id];
        }
        return null;
    }

    test('"puntos" auto-converted to data_variable keeps a text shadow with the word', () => {
        const json = JSON.stringify({
            scripts: [{
                blocks: [
                    {opcode: 'event_whenflagclicked'},
                    {
                        opcode: 'control_if',
                        inputs: {
                            CONDITION: {
                                opcode: 'operator_equals',
                                inputs: {OPERAND1: 'puntos', OPERAND2: 0}
                            },
                            SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]
                        }
                    }
                ]
            }]
        });
        const parsed = parse(json);
        const eq = findOpcode(parsed, 'operator_equals');
        expect(eq).not.toBeNull();
        const entry = eq.inputs.OPERAND1;
        expect(entry.block).not.toBeNull();
        expect(parsed.blockMap[entry.block].opcode).toBe('data_variable');
        expect(entry.shadow).not.toBeNull();
        const shadow = parsed.blockMap[entry.shadow];
        expect(shadow.opcode).toBe('text');
        expect(shadow.fields.TEXT.value).toBe('puntos');
    });
});

describe('ai-block-descriptor auto-initializes referenced-but-unassigned variables', () => {
    function setVariableBlocks(parsed) {
        const out = [];
        for (const id in parsed.blockMap) {
            const b = parsed.blockMap[id];
            if (b.opcode === 'data_setvariableto') {
                out.push({
                    block: b,
                    valueShadow: b.inputs.VALUE && b.inputs.VALUE.shadow ?
                        parsed.blockMap[b.inputs.VALUE.shadow] : null
                });
            }
        }
        return out;
    }

    test('a variable referenced but never assigned gets data_setvariableto with its own name at the top', () => {
        const parsed = parse(jsonIfEquals('hola', 0));
        const setBlocks = setVariableBlocks(parsed);
        expect(setBlocks.length).toBeGreaterThan(0);
        const holaSet = setBlocks.filter(s => s.block.fields.VARIABLE.value === 'hola');
        expect(holaSet.length).toBe(1);
        expect(holaSet[0].valueShadow.opcode).toBe('text');
        expect(holaSet[0].valueShadow.fields.TEXT.value).toBe('hola');

        const hat = parsed.blockMap[parsed.topBlocks[0].id];
        expect(parsed.blockMap[hat.next].fields.VARIABLE.value).toBe('hola');
        expect(parsed.errors.some(e => e.indexOf('hola') !== -1)).toBe(true);
    });

    test('a variable already assigned is NOT re-initialized', () => {
        const json = JSON.stringify({
            scripts: [{
                blocks: [
                    {opcode: 'event_whenflagclicked'},
                    {opcode: 'data_setvariableto', fields: {VARIABLE: 'puntos'}, inputs: {VALUE: 5}},
                    {opcode: 'control_if', inputs: {
                        CONDITION: {
                            opcode: 'operator_equals',
                            inputs: {OPERAND1: {opcode: 'sensing_answer'}, OPERAND2: {opcode: 'data_variable', fields: {VARIABLE: 'puntos'}}}
                        },
                        SUBSTACK: [{opcode: 'motion_movesteps', inputs: {STEPS: 10}}]
                    }}
                ]
            }]
        });
        const parsed = parse(json);
        const setBlocks = setVariableBlocks(parsed);
        expect(setBlocks.length).toBe(1);
        expect(setBlocks[0].block.fields.VARIABLE.value).toBe('puntos');
        expect(parsed.errors.some(e => e.indexOf('VAC') !== -1)).toBe(false);
    });

    test('a set block whose value was left empty gets filled with the variable name', () => {
        const descriptor = [
            '@bloques',
            'event_whenflagclicked',
            'control_if',
            '  CONDITION: >operator_equals<',
            '    OPERAND1: >sensing_answer<',
            '    OPERAND2: >data_variable< VARIABLE="hola"',
            '  SUBSTACK:',
            '    motion_movesteps STEPS=10',
            'data_setvariableto VARIABLE="hola"',
            '  VALUE: ""'
        ].join('\n');

        const parsed = parse(descriptor);
        expect(parsed).not.toBeNull();
        let setBlock = null;
        for (const id in parsed.blockMap) {
            const b = parsed.blockMap[id];
            if (b.opcode === 'data_setvariableto' && b.fields.VARIABLE.value === 'hola') {
                setBlock = b;
                break;
            }
        }
        expect(setBlock).not.toBeNull();
        const valueShadow = parsed.blockMap[setBlock.inputs.VALUE.shadow];
        expect(valueShadow.opcode).toBe('text');
        expect(valueShadow.fields.TEXT.value).toBe('hola');
        expect(parsed.errors.some(e => e.indexOf('valor vacío') !== -1)).toBe(true);
    });
});
