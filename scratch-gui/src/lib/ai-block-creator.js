function createBlocks(vm, blockData) {
    if (!vm || !vm.editingTarget) {
        console.error('[AI Blocks] No editing target');
        return {success: false, error: 'No editing target', total: 0, errors: []};
    }

    if (!blockData || !blockData.blockMap) {
        console.error('[AI Blocks] No block data');
        return {success: false, error: 'No block data', total: 0, errors: []};
    }

    var targetBlocks = vm.editingTarget.blocks;
    var blockMap = blockData.blockMap;
    var total = 0;
    var errors = [];
    var scriptsBefore = targetBlocks._scripts ? targetBlocks._scripts.length : -1;
    var blocksBefore = Object.keys(targetBlocks._blocks).length;

    console.group('[AI Blocks] createBlocks');
    console.log('Block map entries:', Object.keys(blockMap).length);
    console.log('Blocks in _blocks before:', blocksBefore);
    console.log('Scripts in _scripts before:', scriptsBefore);
    console.log('Top blocks from descriptor:', blockData.topBlocks ? blockData.topBlocks.length : 0);

    // Shadows must be created before their parents
    var order = [];
    var created = {};

    function addToOrder(id) {
        if (created[id]) return;
        var block = blockMap[id];
        if (!block) return;

        // Shadow blocks have no dependencies
        if (block.shadow) {
            order.push(id);
            created[id] = true;
            return;
        }

        // Create inputs (shadows and child blocks) first
        for (var inputName in block.inputs) {
            if (!Object.prototype.hasOwnProperty.call(block.inputs, inputName)) continue;
            var input = block.inputs[inputName];
            if (input.shadow && input.shadow !== input.block) {
                addToOrder(input.shadow);
            }
            if (input.block) {
                addToOrder(input.block);
            }
        }

        // Create next block (recursively processes its dependencies too)
        if (block.next) {
            addToOrder(block.next);
        }

        if (!created[id]) {
            order.push(id);
            created[id] = true;
        }
    }

    // Build order: all blocks processed via dependency graph
    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        addToOrder(id);
    }

    console.log('Creation order:', order);

    // Create blocks in order
    for (var oi = 0; oi < order.length; oi++) {
        var blockId = order[oi];
        var block = blockMap[blockId];

        if (targetBlocks._blocks[blockId]) {
            console.log('Block already exists (skipping):', blockId, block.opcode);
            continue;
        }

        var blockJSON = {
            id: block.id,
            opcode: block.opcode,
            inputs: block.inputs || {},
            fields: block.fields || {},
            next: block.next || null,
            parent: block.parent || null,
            topLevel: !!block.topLevel,
            shadow: !!block.shadow,
            mutation: block.mutation || null
        };

        if (block.topLevel && !block.shadow) {
            blockJSON.x = block.x || 30;
            blockJSON.y = block.y || 30;
        }

        try {
            targetBlocks.createBlock(blockJSON);
            total++;
            console.log('Created:', block.opcode, 'topLevel:', blockJSON.topLevel, 'shadow:', blockJSON.shadow, 'parent:', blockJSON.parent);
        } catch (e) {
            errors.push(block.opcode + ': ' + e.message);
            console.error('Failed to create block', block.opcode, ':', e.message);
        }
    }

    // Verify blocks after creation
    var blocksAfter = Object.keys(targetBlocks._blocks).length;
    var scriptsAfter = targetBlocks._scripts ? targetBlocks._scripts.length : -1;
    console.log('Blocks created:', total);
    console.log('Blocks in _blocks after:', blocksAfter, '(new:', blocksAfter - blocksBefore + ')');
    console.log('Scripts in _scripts after:', scriptsAfter, '(new:', scriptsAfter - scriptsBefore + ')');
    if (targetBlocks._scripts) {
        console.log('Script IDs:', targetBlocks._scripts);
    }

    // Check first topLevel block in _scripts: verify next chain
    if (targetBlocks._scripts && targetBlocks._scripts.length > 0) {
        var firstScript = targetBlocks._scripts[0];
        console.log('First script block:', firstScript, targetBlocks._blocks[firstScript] ? targetBlocks._blocks[firstScript].opcode : 'NOT FOUND');
        if (targetBlocks._blocks[firstScript]) {
            console.log('First script next:', targetBlocks._blocks[firstScript].next);
        }
    }

    // Emit workspace update to refresh the UI
    try {
        vm.emitWorkspaceUpdate();
        console.log('emitWorkspaceUpdate() OK');
    } catch (e) {
        errors.push('emitWorkspaceUpdate: ' + e.message);
        console.error('emitWorkspaceUpdate() failed:', e);
        // Fallback: try requestBlocksUpdate via runtime
        try {
            vm.runtime.requestBlocksUpdate();
            console.log('requestBlocksUpdate() fallback OK');
        } catch (e2) {
            console.error('requestBlocksUpdate() also failed:', e2);
        }
    }

    // Extra fallback: directly set editing target to force UI update
    // (setEditingTarget checks equal ID and returns early, but emit same event)
    // Actually setEditingTarget returns if same targetId, so we emit the event directly
    try {
        vm.emit('workspaceUpdate', {xml: ''}); // will be ignored
    } catch (_e) {}

    console.groupEnd();

    return {
        success: errors.length === 0,
        total: total,
        errors: errors,
        blockIds: Object.keys(blockMap)
    };
}

export default createBlocks;
