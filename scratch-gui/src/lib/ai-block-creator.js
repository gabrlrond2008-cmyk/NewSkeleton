function resolveVarId(vm, varName, varType) {
    if (!vm || !vm.runtime) return null;
    var stage = vm.runtime.getTargetForStage ? vm.runtime.getTargetForStage() : null;
    if (!stage) return null;
    var type = varType || '';
    var strName = String(varName);
    var lowerName = strName.toLowerCase();

    // 1. Look in stage.variables
    if (stage.variables) {
        for (var vid in stage.variables) {
            var v = stage.variables[vid];
            if ((v.name === strName || (type === 'broadcast_msg' && v.name.toLowerCase() === lowerName)) && (v.type || '') === type) {
                return vid;
            }
        }
    }
    // 2. Look in editingTarget.variables
    if (vm.editingTarget && vm.editingTarget.variables) {
        for (var tid in vm.editingTarget.variables) {
            var tv = vm.editingTarget.variables[tid];
            if ((tv.name === strName || (type === 'broadcast_msg' && tv.name.toLowerCase() === lowerName)) && (tv.type || '') === type) {
                return tid;
            }
        }
    }

    // 3. Not found: create it on stage so VM and Blockly have the exact matching variable!
    var prefix = (type === 'broadcast_msg') ? 'msg_' : ((type === 'list') ? 'list_' : 'var_');
    var newId = prefix + strName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 8);
    try {
        if (typeof stage.createVariable === 'function') {
            stage.createVariable(newId, strName, type, false);
            return newId;
        }
    } catch (_cErr) {}

    return newId;
}

function createBlocks(vm, blockData, customTarget) {
    var target = customTarget || (vm && vm.editingTarget);
    if (!vm || !target) {
        console.error('[AI Blocks] No target for createBlocks');
        return {success: false, error: 'No target for createBlocks', total: 0, errors: []};
    }

    if (!blockData || !blockData.blockMap) {
        console.error('[AI Blocks] No block data');
        return {success: false, error: 'No block data', total: 0, errors: []};
    }

    var targetBlocks = target.blocks;
    if (!targetBlocks || !targetBlocks._blocks) {
        console.error('[AI Blocks] Target has no blocks store');
        return {success: false, error: 'Target has no blocks store', total: 0, errors: []};
    }
    var blockMap = blockData.blockMap;
    var total = 0;
    var errors = [];
    var scriptsBefore = targetBlocks._scripts ? targetBlocks._scripts.length : -1;
    var blocksBefore = Object.keys(targetBlocks._blocks).length;

    console.group('[AI Blocks] createBlocks (' + (target.getName ? target.getName() : target.id) + ')');
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

        // Resolve variable/list/broadcast field IDs from VM so Blockly FieldVariable works
        var resolvedFields = {};
        var rawFields = block.fields || {};
        for (var fk in rawFields) {
            if (!Object.prototype.hasOwnProperty.call(rawFields, fk)) continue;
            var ff = rawFields[fk];
            if (!ff) continue;
            var val = typeof ff === 'object' ? ff.value : ff;
            if (val === null || val === undefined) continue;

            var targetFk = fk;
            if (targetFk === 'CHOICE' || targetFk === 'BROADCAST_OPTION_MENU') targetFk = 'BROADCAST_OPTION';

            if (targetFk === 'BROADCAST_OPTION') {
                var bId = resolveVarId(vm, val, 'broadcast_msg');
                resolvedFields[targetFk] = { name: targetFk, value: String(val), id: bId, variableType: 'broadcast_msg' };
            } else if (targetFk === 'VARIABLE') {
                var vId = resolveVarId(vm, val, '');
                resolvedFields[targetFk] = { name: targetFk, value: String(val), id: vId, variableType: '' };
            } else if (targetFk === 'LIST') {
                var lId = resolveVarId(vm, val, 'list');
                resolvedFields[targetFk] = { name: targetFk, value: String(val), id: lId, variableType: 'list' };
            } else {
                resolvedFields[targetFk] = typeof ff === 'object' ? { name: ff.name || targetFk, value: String(val) } : { name: targetFk, value: String(val) };
            }
        }

        // Guarantee broadcast hat and menu blocks have BROADCAST_OPTION field properly initialized
        if ((block.opcode === 'event_whenbroadcastreceived' || block.opcode === 'event_broadcast_menu') && !resolvedFields.BROADCAST_OPTION) {
            var defMsg = 'mensaje1';
            var defBId = resolveVarId(vm, defMsg, 'broadcast_msg');
            resolvedFields.BROADCAST_OPTION = { name: 'BROADCAST_OPTION', value: defMsg, id: defBId, variableType: 'broadcast_msg' };
        }

        var blockJSON = {
            id: block.id,
            opcode: block.opcode,
            inputs: block.inputs || {},
            fields: resolvedFields,
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

    if (typeof targetBlocks.resetCache === 'function') {
        try {
            targetBlocks.resetCache();
        } catch (_rcErr) {}
    }

    console.groupEnd();

    return {
        success: errors.length === 0,
        total: total,
        errors: errors,
        blockIds: Object.keys(blockMap)
    };
}

export default createBlocks;
