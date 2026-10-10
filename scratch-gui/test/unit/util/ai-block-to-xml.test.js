import {blocksToXML, chainToXML} from '../../../src/lib/ai-block-to-xml';

const simpleMap = () => ({
    hat: {
        id: 'hat',
        opcode: 'event_whenflagclicked',
        fields: {},
        inputs: {},
        shadow: false,
        topLevel: true,
        x: 30,
        y: 30,
        next: 'move'
    },
    move: {
        id: 'move',
        opcode: 'motion_movesteps',
        fields: {STEPS: {value: '10'}},
        inputs: {},
        shadow: false,
        topLevel: false,
        next: null
    }
});

const varMap = () => ({
    set: {
        id: 'set',
        opcode: 'data_setvariableto',
        fields: {VARIABLE: {value: 'puntos'}, VALUE: {value: '1'}},
        inputs: {},
        shadow: false,
        topLevel: true,
        x: 30,
        y: 30,
        next: null
    }
});

describe('ai-block-to-xml blocksToXML', () => {
    test('emits top-level block and its chained next block', () => {
        const xml = blocksToXML({blockMap: simpleMap(), topBlocks: [simpleMap().hat]});
        expect(xml).toContain('type="event_whenflagclicked"');
        expect(xml).toContain('type="motion_movesteps"');
        expect(xml).toContain('<field name="STEPS">10</field>');
    });

    test('reuses existing variable id from the passed vm (fix A)', () => {
        const vm = {editingTarget: {variables: {abc123: {name: 'puntos', type: ''}}}};
        const xml = blocksToXML({blockMap: varMap(), topBlocks: [varMap().set]}, vm);
        expect(xml).toContain('<variable id="abc123" type="">puntos</variable>');
        expect(xml).toContain('<field name="VARIABLE" id="abc123"');
    });

    test('ignores window.vm (never assigned) and falls back to the passed vm', () => {
        window.vm = {editingTarget: {variables: {other: {name: 'otra', type: ''}}}};
        const vm = {editingTarget: {variables: {abc123: {name: 'puntos', type: ''}}}};
        const xml = blocksToXML({blockMap: varMap(), topBlocks: [varMap().set]}, vm);
        expect(xml).toContain('<variable id="abc123" type="">puntos</variable>');
        delete window.vm;
    });

    test('without a vm, generates a new id used consistently by variable and field', () => {
        const xml = blocksToXML({blockMap: varMap(), topBlocks: [varMap().set]});
        const idMatch = xml.match(/<variable id="(var_puntos_[a-z0-9]+)" type="">puntos<\/variable>/);
        expect(idMatch).not.toBeNull();
        expect(xml).toContain('<field name="VARIABLE" id="' + idMatch[1] + '"');
    });
});

describe('ai-block-to-xml chainToXML', () => {
    test('builds a chain from the block object passed in topBlocks (fix B)', () => {
        const chainXml = chainToXML('hat', {blockMap: simpleMap(), topBlocks: [simpleMap().hat]}, {});
        expect(chainXml).toContain('type="event_whenflagclicked"');
        expect(chainXml).toContain('type="motion_movesteps"');
    });

    test('returns empty string for unknown top block id', () => {
        expect(chainToXML('nope', {blockMap: simpleMap(), topBlocks: []}, {})).toBe('');
    });
});

describe('ai-block-to-xml never emits boolean shadow blocks', () => {
    const boolShadowMap = () => ({
        hat: {id: 'hat', opcode: 'event_whenflagclicked', fields: {}, inputs: {}, shadow: false,
            topLevel: true, x: 30, y: 30, next: 'if'},
        if: {id: 'if', opcode: 'control_if', fields: {}, shadow: false, topLevel: false, next: null,
            inputs: {CONDITION: {name: 'CONDITION', block: 'eq', shadow: 'boolShadow'}}},
        eq: {id: 'eq', opcode: 'operator_equals', fields: {}, inputs: {}, shadow: false,
            topLevel: false, next: null},
        boolShadow: {id: 'boolShadow', opcode: 'boolean',
            fields: {BOOL: {value: 'false'}}, inputs: {}, shadow: true, topLevel: false, next: null}
    });

    test('drops a boolean shadow sitting next to a real reporter block', () => {
        const xml = blocksToXML({blockMap: boolShadowMap(), topBlocks: [boolShadowMap().hat]});
        expect(xml).toContain('type="control_if"');
        expect(xml).toContain('type="operator_equals"');
        expect(xml.indexOf('type="boolean"')).toBe(-1);
    });

    test('drops a boolean shadow even when it is the only child of the socket', () => {
        const map = boolShadowMap();
        map.if.inputs.CONDITION.block = null;
        const xml = blocksToXML({blockMap: map, topBlocks: [map.hat]});
        expect(xml.indexOf('type="boolean"')).toBe(-1);
        expect(xml).toContain('<value name="CONDITION">');
    });
});

describe('ai-block-to-xml skips empty variable fields', () => {
    const emptyVarMap = () => ({
        set: {
            id: 'set', opcode: 'data_setvariableto',
            fields: {VARIABLE: {value: '   '}, VALUE: {value: '1'}},
            inputs: {}, shadow: false, topLevel: true, x: 30, y: 30, next: null
        }
    });

    test('does not emit a VARIABLE field with an empty name', () => {
        const xml = blocksToXML({blockMap: emptyVarMap(), topBlocks: [emptyVarMap().set]});
        expect(xml.indexOf('<field name="VARIABLE"')).toBe(-1);
        expect(xml.indexOf('<variable id=')).toBe(-1);
        expect(xml).toContain('type="data_setvariableto"');
    });
});
