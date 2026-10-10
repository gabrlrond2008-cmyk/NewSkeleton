import {defineMessages} from 'react-intl';

var verifierMessages = defineMessages({
    couldNotRead: {
        id: 'gui.aiBlocks.verifier.couldNotRead',
        defaultMessage: 'Could not read the created blocks',
        description: 'Error when created blocks cannot be read for verification'
    },
    missingBlocks: {
        id: 'gui.aiBlocks.verifier.missingBlocks',
        defaultMessage: 'Missing blocks: expected {expected}, created {created}',
        description: 'Error when fewer blocks were created than expected'
    },
    missingOpcode: {
        id: 'gui.aiBlocks.verifier.missingOpcode',
        defaultMessage: 'Missing opcode {opcode}: expected {expected}, found {found}',
        description: 'Error when a specific opcode count is less than expected'
    }
});

function safeFormat(intl, msgDef, values) {
    if (intl && typeof intl.formatMessage === 'function') {
        try {
            return intl.formatMessage(msgDef, values);
        } catch (e) {
            // fallback if ICU format fails
        }
    }
    var res = msgDef.defaultMessage || '';
    if (values) {
        for (var k in values) {
            res = res.replace(new RegExp('\\{' + k + '\\}', 'g'), String(values[k]));
        }
    }
    return res;
}

function verifyBlocks(blockData, workspace, intl) {
    if (!blockData || !blockData.blockMap || !workspace ||
            typeof workspace.getAllBlocks !== 'function') {
        return {ok: true, issues: [], actualCount: 0};
    }

    var intended = blockData.blockMap;
    var intendedCount = 0;
    for (var id in intended) {
        if (!Object.prototype.hasOwnProperty.call(intended, id)) continue;
        if (!intended[id].shadow) intendedCount++;
    }

    var issues = [];

    var actual = workspace.getAllBlocks();
    if (!actual) {
        issues.push(safeFormat(intl, verifierMessages.couldNotRead));
        return {ok: false, issues: issues, actualCount: 0};
    }

    var actualNonShadow = 0;
    var actualOpcodes = {};
    for (var i = 0; i < actual.length; i++) {
        var blk = actual[i];
        if (typeof blk.isShadow === 'function' && blk.isShadow()) continue;
        var opcode = blk.type;
        if (!opcode) continue;
        actualNonShadow++;
        actualOpcodes[opcode] = (actualOpcodes[opcode] || 0) + 1;
    }

    if (actualNonShadow < intendedCount) {
        issues.push(safeFormat(intl, verifierMessages.missingBlocks, {expected: intendedCount, created: actualNonShadow}));
    }

    var intendedOpcodes = {};
    for (var bid in intended) {
        var b = intended[bid];
        if (!b.shadow) {
            intendedOpcodes[b.opcode] = (intendedOpcodes[b.opcode] || 0) + 1;
        }
    }

    for (var op in intendedOpcodes) {
        var expected = intendedOpcodes[op];
        var found = actualOpcodes[op] || 0;
        if (found < expected) {
            issues.push(safeFormat(intl, verifierMessages.missingOpcode, {opcode: op, expected: expected, found: found}));
        }
    }

    if (issues.length > 0) {
        console.warn('[AI Blocks] Verificación: ' + issues.length + ' problema(s):', issues);
        return {ok: false, issues: issues, actualCount: actualNonShadow};
    }

    console.log('[AI Blocks] Verificación: OK — ' + intendedCount + ' bloques creados correctamente');
    return {ok: true, issues: [], actualCount: actualNonShadow};
}

export {verifyBlocks};
