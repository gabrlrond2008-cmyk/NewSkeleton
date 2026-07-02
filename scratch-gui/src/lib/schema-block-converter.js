var BLOCK_LIBRARY = null;
function getBlockInfo(opcode) {
    if (!BLOCK_LIBRARY) {
        try {
            BLOCK_LIBRARY = require('./ai-block-library.js');
        } catch (e) {
            return null;
        }
    }
    try {
        return BLOCK_LIBRARY.getBlockInfo(opcode);
    } catch (e) {
        return BLOCK_LIBRARY && BLOCK_LIBRARY.BLOCKS ? BLOCK_LIBRARY.BLOCKS[opcode] : null;
    }
}

var CATEGORY_COLORS = {
    motion: {bg: '#4C97FF', fg: '#fff'},
    looks: {bg: '#9966FF', fg: '#fff'},
    sound: {bg: '#CF63CF', fg: '#fff'},
    event: {bg: '#FFBF00', fg: '#fff'},
    control: {bg: '#FFAB19', fg: '#fff'},
    sensing: {bg: '#5CB1D6', fg: '#fff'},
    operator: {bg: '#59C059', fg: '#fff'},
    data: {bg: '#FF8C1A', fg: '#fff'},
    pen: {bg: '#0DA57A', fg: '#fff'},
    music: {bg: '#CF63CF', fg: '#fff'},
    internal: {bg: '#A0A0A0', fg: '#fff'}
};

function getCategoryColor(category) {
    var c = CATEGORY_COLORS[category];
    if (!c) return {bg: '#A0A0A0', fg: '#fff'};
    return c;
}

function getLabelFromOpcode(opcode) {
    var info = getBlockInfo(opcode);
    if (info) return info.d || opcode;
    return opcode.split('_').slice(1).join(' ');
}

function nextId() {
    return 'b' + (Math.random() * 1e12 | 0).toString(36);
}

function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getDefaultParamValue(fieldName) {
    var numeric = ['STEPS', 'DEGREES', 'DX', 'DY', 'X', 'Y', 'SECS', 'DIRECTION',
        'CHANGE', 'SIZE', 'VALUE', 'NUM', 'VOLUME', 'DURATION', 'TIMES',
        'FROM', 'TO', 'OPERAND1', 'OPERAND2', 'STRING1', 'STRING2',
        'LETTER', 'STRING', 'NUM1', 'NUM2'];
    for (var i = 0; i < numeric.length; i++) {
        if (fieldName === numeric[i]) return '0';
    }
    if (fieldName === 'MESSAGE' || fieldName === 'QUESTION') return '...';
    if (fieldName === 'TOWARDS') return 'mouse-pointer';
    if (fieldName === 'BROADCAST_INPUT') return 'mensaje1';
    return '?';
}

function traverseBlockChain(blockEl, blockMap, visited) {
    if (!blockEl || visited.has(blockEl)) return null;
    visited.add(blockEl);

    var type = blockEl.getAttribute('type');
    var id = blockEl.getAttribute('id') || nextId();
    var info = getBlockInfo(type);
    var category = info ? info.c : 'internal';
    var blockType = info ? info.t : 's';
    var label = info ? info.d : getLabelFromOpcode(type);
    var color = getCategoryColor(category);

    /* reporters and booleans are inputs, not standalone blocks */
    if (blockType === 'r' || blockType === 'b') return null;

    var fields = [];
    var fieldEls = blockEl.querySelectorAll('field');
    for (var fi = 0; fi < fieldEls.length; fi++) {
        var fName = fieldEls[fi].getAttribute('name');
        var fVal = fieldEls[fi].textContent;
        if (fName && fVal) {
            fields.push({name: fName, value: fVal});
        }
    }

    var params = {};
    var inputNames = info && info.i ? info.i : [];
    for (var pi = 0; pi < inputNames.length; pi++) {
        var inName = inputNames[pi];
        if (inName === 'SUBSTACK' || inName === 'SUBSTACK2') continue;
        var valueEl = blockEl.querySelector('value[name="' + inName + '"]');
        var val = getDefaultParamValue(inName);
        if (valueEl) {
            var shadow = valueEl.querySelector('shadow field');
            if (shadow) val = shadow.textContent || val;
        }
        params[inName] = {name: inName, value: val, type: 'input'};
    }

    var fieldNames = info && info.f ? info.f : [];
    for (var fpi = 0; fpi < fieldNames.length; fpi++) {
        var fn = fieldNames[fpi];
        var fieldMatch = null;
        for (var fmi = 0; fmi < fields.length; fmi++) {
            if (fields[fmi].name === fn) { fieldMatch = fields[fmi]; break; }
        }
        params[fn] = {name: fn, value: fieldMatch ? fieldMatch.value : '', type: 'field'};
    }

    var nodeId = id;
    var node = {
        id: nodeId,
        type: 'card',
        position: {x: 200, y: 40 + (Object.keys(blockMap).length * 120)},
        data: {
            label: label,
            opcode: type,
            category: category,
            color: color,
            blockType: blockType,
            fields: fields,
            params: params,
            st: info ? info.st || [] : []
        }
    };

    blockMap[id] = {node: node, el: blockEl};

    var edges = [];
    var nextEl = blockEl.querySelector('next > block');
    if (nextEl) {
        var nextResult = traverseBlockChain(nextEl, blockMap, visited);
        if (nextResult) {
            edges.push({
                id: nextId(),
                source: nodeId,
                target: nextResult.node.id,
                sourceHandle: 'bottom',
                targetHandle: 'top',
                type: 'smoothstep',
                animated: false
            });
            edges = edges.concat(nextResult.edges);
        }
    }

    var substackEl = blockEl.querySelector('statement[name="SUBSTACK"] > block');
    if (substackEl) {
        var branchResult = traverseBlockChain(substackEl, blockMap, visited);
        if (branchResult) {
            edges.push({
                id: nextId(),
                source: nodeId,
                target: branchResult.node.id,
                sourceHandle: 'yes',
                targetHandle: 'top',
                type: 'smoothstep',
                animated: false,
                label: 'Sí'
            });
            edges = edges.concat(branchResult.edges);

            if (blockType === 'c' && /control_if_else/.test(type)) {
                var substack2El = blockEl.querySelector('statement[name="SUBSTACK2"] > block');
                if (substack2El) {
                    var elseResult = traverseBlockChain(substack2El, blockMap, visited);
                    if (elseResult) {
                        edges.push({
                            id: nextId(),
                            source: nodeId,
                            target: elseResult.node.id,
                            sourceHandle: 'no',
                            targetHandle: 'top',
                            type: 'smoothstep',
                            animated: false,
                            label: 'No'
                        });
                        edges = edges.concat(elseResult.edges);
                    }
                }
            }

            if (blockType === 'c' && /control_repeat|control_forever|control_repeat_until/.test(type)) {
                edges.push({
                    id: nextId(),
                    source: nodeId,
                    target: nodeId,
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                    type: 'smoothstep',
                    animated: true,
                    label: '↻'
                });
            }
        }
    }

    return {node: node, edges: edges};
}

function workspaceToFlow(Blockly) {
    if (!Blockly) return {nodes: [], edges: []};
    var workspace = Blockly.getMainWorkspace();
    if (!workspace) return {nodes: [], edges: []};

    var xml = Blockly.Xml.workspaceToDom(workspace, true);
    var topBlocks = xml.querySelectorAll('block[type]');
    var allNodes = [];
    var allEdges = [];
    var visited = new Set();

    for (var i = 0; i < topBlocks.length; i++) {
        var blockEl = topBlocks[i];
        var parentTag = blockEl.parentElement ? blockEl.parentElement.tagName : '';
        if (parentTag === 'next' || parentTag === 'value' || parentTag === 'statement') continue;

        var result = traverseBlockChain(blockEl, {}, visited);
        if (result && result.node) {
            allNodes.push(result.node);
            for (var e = 0; e < result.edges.length; e++) {
                allEdges.push(result.edges[e]);
            }
        }
    }

    return {nodes: allNodes, edges: allEdges};
}

function flowToXml(nodes, edges) {
    var nodeMap = {};
    for (var ni = 0; ni < nodes.length; ni++) {
        nodeMap[nodes[ni].id] = nodes[ni];
    }

    var edgeMap = {};
    for (var ei = 0; ei < edges.length; ei++) {
        var e = edges[ei];
        if (!edgeMap[e.source]) edgeMap[e.source] = [];
        edgeMap[e.source].push(e);
    }

    var inboundEdges = {};
    for (var ej = 0; ej < edges.length; ej++) {
        var ed = edges[ej];
        if (ed.targetHandle === 'top') {
            inboundEdges[ed.target] = ed;
        }
    }

    var startNodes = [];
    for (var nid in nodeMap) {
        if (!inboundEdges[nid] || inboundEdges[nid].sourceHandle === 'loopback') {
            startNodes.push(nodeMap[nid]);
        }
    }

    var xmlParts = ['<xml xmlns="http://www.w3.org/1999/xhtml">'];
    for (var si = 0; si < startNodes.length; si++) {
        var xmlStr = buildBlockXml(startNodes[si], nodeMap, edgeMap, new Set());
        if (xmlStr) xmlParts.push(xmlStr);
    }
    xmlParts.push('</xml>');
    return xmlParts.join('\n');
}

function buildBlockXml(node, nodeMap, edgeMap, visited) {
    if (!node || visited.has(node.id)) return '';
    visited.add(node.id);

    var opcode = node.data.opcode;
    if (!opcode) return '';

    var id = sanitizeId(node.id);
    var childEdges = edgeMap[node.id] || [];

    var yesEdge = null;
    var noEdge = null;
    var bottomEdge = null;

    for (var ce = 0; ce < childEdges.length; ce++) {
        if (childEdges[ce].sourceHandle === 'yes') yesEdge = childEdges[ce];
        else if (childEdges[ce].sourceHandle === 'no') noEdge = childEdges[ce];
        else if (childEdges[ce].sourceHandle === 'bottom') bottomEdge = childEdges[ce];
    }

    var hasYes = !!yesEdge;

    var parts = [];
    parts.push('<block type="' + opcode + '" id="' + id + '">');

    var params = node.data.params || {};
    for (var pn in params) {
        if (params.hasOwnProperty(pn)) {
            var p = params[pn];
            if (p.type === 'field') {
                parts.push('<field name="' + pn + '">' + escapeXml(String(p.value)) + '</field>');
            }
        }
    }

    if (hasYes && yesEdge) {
        var yesTarget = nodeMap[yesEdge.target];
        if (yesTarget) {
            parts.push('<statement name="SUBSTACK">');
            var yesXml = buildBlockXml(yesTarget, nodeMap, edgeMap, visited);
            if (yesXml) parts.push(yesXml);
            parts.push('</statement>');
        }
    }
    if (hasYes && noEdge) {
        var noTarget = nodeMap[noEdge.target];
        if (noTarget) {
            parts.push('<statement name="SUBSTACK2">');
            var noXml = buildBlockXml(noTarget, nodeMap, edgeMap, visited);
            if (noXml) parts.push(noXml);
            parts.push('</statement>');
        }
    }

    if (hasYes) {
        if (bottomEdge && bottomEdge.source !== bottomEdge.target) {
            var nextTarget = nodeMap[bottomEdge.target];
            if (nextTarget) {
                var nextXml = buildBlockXml(nextTarget, nodeMap, edgeMap, visited);
                if (nextXml) {
                    parts.push('<next>');
                    parts.push(nextXml);
                    parts.push('</next>');
                }
            }
        }
    } else if (bottomEdge) {
        var next2Target = nodeMap[bottomEdge.target];
        if (next2Target) {
            var next2Xml = buildBlockXml(next2Target, nodeMap, edgeMap, visited);
            if (next2Xml) {
                parts.push('<next>');
                parts.push(next2Xml);
                parts.push('</next>');
            }
        }
    }

    parts.push('</block>');
    return parts.join('\n');
}

function getPaletteBlocks() {
    var library = null;
    try {
        library = require('./ai-block-library.js');
    } catch (e) {
        return [];
    }
    var all = library.BLOCKS || {};
    var result = [];
    var seen = {};
    for (var key in all) {
        if (all.hasOwnProperty(key)) {
            var info = all[key];
            /* reporters and booleans are inputs, not standalone blocks */
            if (info.t === 'r' || info.t === 'b') continue;
            if (!seen[info.c]) seen[info.c] = [];
            seen[info.c].push({
                opcode: key,
                label: info.d || key,
                category: info.c,
                blockType: info.t,
                inputs: info.i || [],
                fields: info.f || []
            });
        }
    }
    var categoryOrder = ['event', 'motion', 'looks', 'sound', 'control', 'sensing', 'operator', 'data', 'pen', 'music'];
    for (var ci = 0; ci < categoryOrder.length; ci++) {
        var cat = categoryOrder[ci];
        if (seen[cat]) {
            result.push({
                category: cat,
                color: CATEGORY_COLORS[cat] || {bg: '#A0A0A0', fg: '#fff'},
                blocks: seen[cat]
            });
        }
    }
    return result;
}

export {
    workspaceToFlow,
    flowToXml,
    getBlockInfo,
    getCategoryColor,
    getLabelFromOpcode,
    getPaletteBlocks,
    getDefaultParamValue,
    CATEGORY_COLORS,
    nextId
};
