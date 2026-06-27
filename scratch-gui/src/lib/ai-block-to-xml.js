var STATEMENT_INPUTS = {
    control_forever: {SUBSTACK: 1},
    control_repeat: {SUBSTACK: 1},
    control_if: {SUBSTACK: 1},
    control_if_else: {SUBSTACK: 1, SUBSTACK2: 1},
    control_repeat_until: {SUBSTACK: 1},
    control_while: {SUBSTACK: 1},
    procedures_definition: {ARGUMENTS: 1},
    argument_editor_show: {ARGUMENTS: 1}
};

var MUTATIONS = {
    control_if_else: {haselse: 'true'},
    control_if: {}
};

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function uidShort() {
    return Math.random().toString(36).substring(2, 8);
}

function blockToXML(id, blockMap, ctx) {
    var block = blockMap[id];
    if (!block) return '';
    var tagName = block.shadow ? 'shadow' : 'block';
    var attrs = 'type="' + block.opcode + '" id="' + block.id + '"';
    if (block.topLevel && !block.shadow) {
        attrs += ' x="' + (block.x || 30) + '" y="' + (block.y || 30) + '"';
    }
    var xml = '<' + tagName + ' ' + attrs + '>';

    var varMap = (ctx && ctx.existingVars) || {};
    var listMap = (ctx && ctx.existingLists) || {};
    var broadcastMap = (ctx && ctx.existingBroadcasts) || {};

    for (var f in block.fields) {
        var val = block.fields[f].value;
        var name = f;
        if (name === 'CHOICE') name = 'BROADCAST_OPTION';

        if (name === 'VARIABLE' || block.opcode === 'data_variable') {
            var varId = varMap[val] || val;
            xml += '<field name="VARIABLE" id="' + escapeXml(varId) + '" variabletype="">' + escapeXml(val) + '</field>';
        } else if (name === 'LIST') {
            var listId = listMap[val] || val;
            xml += '<field name="LIST" id="' + escapeXml(listId) + '" variabletype="list">' + escapeXml(val) + '</field>';
        } else if (name === 'BROADCAST_OPTION') {
            var msgId = broadcastMap[val] || val;
            xml += '<field name="BROADCAST_OPTION" id="' + escapeXml(msgId) + '" variabletype="broadcast_msg">' + escapeXml(val) + '</field>';
        } else {
            xml += '<field name="' + name + '">' + escapeXml(val) + '</field>';
        }
    }

    var mut = MUTATIONS[block.opcode];
    if (mut) {
        var mutAttrs = '';
        for (var mk in mut) {
            mutAttrs += ' ' + mk + '="' + mut[mk] + '"';
        }
        xml += '<mutation' + mutAttrs + '/>';
    }

    for (var iname in block.inputs) {
        var input = block.inputs[iname];
        if (input.block || input.shadow) {
            var isStatement = STATEMENT_INPUTS[block.opcode] && STATEMENT_INPUTS[block.opcode][iname];
            var tag = isStatement ? 'statement' : 'value';
            xml += '<' + tag + ' name="' + iname + '">';
            if (input.block) {
                xml += blockToXML(input.block, blockMap, ctx);
            }
            if (input.shadow && input.shadow !== input.block) {
                xml += blockToXML(input.shadow, blockMap, ctx);
            }
            xml += '</' + tag + '>';
        }
    }

    if (block.next) {
        xml += '<next>' + blockToXML(block.next, blockMap, ctx) + '</next>';
    }

    xml += '</' + tagName + '>';
    return xml;
}

function blocksToXML(blockData) {
    var blockMap = blockData.blockMap;
    var topBlocks = blockData.topBlocks;
    if (!blockMap || !topBlocks) return '';

    var referencedVars = {};
    var referencedLists = {};
    var referencedBroadcasts = {};

    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b = blockMap[id];
        
        for (var f in b.fields) {
            var val = b.fields[f].value;
            if (f === 'VARIABLE' || b.opcode === 'data_variable') {
                referencedVars[val] = true;
            } else if (f === 'LIST') {
                referencedLists[val] = true;
            } else if (f === 'CHOICE' || f === 'BROADCAST_OPTION' || f === 'BROADCAST_OPTION_MENU') {
                referencedBroadcasts[val] = true;
            }
        }
    }

    var existingVars = {};
    var existingLists = {};
    var existingBroadcasts = {};

    if (typeof window !== 'undefined' && window.vm) {
        var editingTarget = window.vm.editingTarget;
        if (editingTarget) {
            for (var vid in editingTarget.variables) {
                var v = editingTarget.variables[vid];
                if (v.type === 'list') {
                    existingLists[v.name] = vid;
                } else if (v.type === 'broadcast_msg') {
                    existingBroadcasts[v.name] = vid;
                } else {
                    existingVars[v.name] = vid;
                }
            }
        }
        var stage = window.vm.runtime && window.vm.runtime.getTargetForStage();
        if (stage && stage !== editingTarget) {
            for (var svid in stage.variables) {
                var sv = stage.variables[svid];
                if (sv.type === 'list') {
                    existingLists[sv.name] = svid;
                } else if (sv.type === 'broadcast_msg') {
                    existingBroadcasts[sv.name] = svid;
                } else {
                    existingVars[sv.name] = svid;
                }
            }
        }
    }

    var xml = '<xml>';
    xml += '<variables>';
    
    for (var varName in referencedVars) {
        var varId = existingVars[varName] || ('var_' + varName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + uidShort());
        existingVars[varName] = varId;
        xml += '<variable id="' + escapeXml(varId) + '" type="">' + escapeXml(varName) + '</variable>';
    }

    for (var listName in referencedLists) {
        var listId = existingLists[listName] || ('list_' + listName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + uidShort());
        existingLists[listName] = listId;
        xml += '<variable id="' + escapeXml(listId) + '" type="list">' + escapeXml(listName) + '</variable>';
    }

    for (var msgName in referencedBroadcasts) {
        var msgId = existingBroadcasts[msgName] || ('msg_' + msgName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + uidShort());
        existingBroadcasts[msgName] = msgId;
        xml += '<variable id="' + escapeXml(msgId) + '" type="broadcast_msg">' + escapeXml(msgName) + '</variable>';
    }

    xml += '</variables>';

    var ctx = {
        existingVars: existingVars,
        existingLists: existingLists,
        existingBroadcasts: existingBroadcasts
    };

    for (var i = 0; i < topBlocks.length; i++) {
        xml += blockToXML(topBlocks[i].id, blockMap, ctx);
    }
    xml += '</xml>';
    return xml;
}

function chainToXML(topBlockId, blockData) {
    var blockMap = blockData.blockMap;
    if (!blockMap || !topBlockId) return '';
    var topBlock = blockMap[topBlockId];
    if (!topBlock) return '';
    return blocksToXML({
        blockMap: blockMap,
        topBlocks: [topBlock]
    });
}

export {blocksToXML, chainToXML};
