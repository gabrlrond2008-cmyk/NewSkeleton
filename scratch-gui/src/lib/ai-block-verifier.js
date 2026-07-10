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
        defaultMessage: 'Missing "{opcode}": expected {expected}, found {found}',
        description: 'Error when a specific opcode count is less than expected'
    }
});

function verifyBlocks(blockData, vm, intl) {
    if (!blockData || !blockData.blockMap || !vm || !vm.editingTarget) {
        return {ok: true, issues: []};
    }

    var intended = blockData.blockMap;
    var intendedTop = blockData.topBlocks || [];
    var intendedCount = 0;
    for (var id in intended) {
        if (!Object.prototype.hasOwnProperty.call(intended, id)) continue;
        if (!intended[id].shadow) intendedCount++;
    }

    var issues = [];

    var actual = vm.editingTarget.blocks;
    if (!actual || !actual._blocks) {
        issues.push(intl ? intl.formatMessage(verifierMessages.couldNotRead) : verifierMessages.couldNotRead.defaultMessage);
        return {ok: false, issues: issues};
    }

    var actualNonShadow = 0;
    for (var aid in actual._blocks) {
        if (!actual._blocks[aid].shadow) actualNonShadow++;
    }

    if (actualNonShadow < intendedCount) {
        issues.push(intl ? intl.formatMessage(verifierMessages.missingBlocks, {expected: intendedCount, created: actualNonShadow}) : verifierMessages.missingBlocks.defaultMessage.replace('{expected}', intendedCount).replace('{created}', actualNonShadow));
    }

    var intendedOpcodes = {};
    for (var bid in intended) {
        var b = intended[bid];
        if (!b.shadow) {
            intendedOpcodes[b.opcode] = (intendedOpcodes[b.opcode] || 0) + 1;
        }
    }

    var actualOpcodes = {};
    for (var aid2 in actual._blocks) {
        var b2 = actual._blocks[aid2];
        if (!b2.shadow) {
            actualOpcodes[b2.opcode] = (actualOpcodes[b2.opcode] || 0) + 1;
        }
    }

    for (var op in intendedOpcodes) {
        var expected = intendedOpcodes[op];
        var found = actualOpcodes[op] || 0;
        if (found < expected) {
            issues.push(intl ? intl.formatMessage(verifierMessages.missingOpcode, {opcode: op, expected: expected, found: found}) : verifierMessages.missingOpcode.defaultMessage.replace('{opcode}', op).replace('{expected}', expected).replace('{found}', found));
        }
    }

    if (issues.length > 0) {
        console.warn('[AI Blocks] Verificación: ' + issues.length + ' problema(s):', issues);
        return {ok: false, issues: issues};
    }

    console.log('[AI Blocks] Verificación: OK — ' + intendedCount + ' bloques creados correctamente');
    return {ok: true, issues: []};
}

export {verifyBlocks};
