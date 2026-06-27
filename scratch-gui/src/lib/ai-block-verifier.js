function verifyBlocks(blockData, vm) {
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
        issues.push('No se pudieron leer los bloques creados');
        return {ok: false, issues: issues};
    }

    var actualNonShadow = 0;
    for (var aid in actual._blocks) {
        if (!actual._blocks[aid].shadow) actualNonShadow++;
    }

    if (actualNonShadow < intendedCount) {
        issues.push('Faltan bloques: se esperaban ' + intendedCount + ', se crearon ' + actualNonShadow);
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
            issues.push('Falta/n "' + op + '": se esperaban ' + expected + ', se encontraron ' + found);
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
