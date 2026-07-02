function toSchemaXml(vmXml) {
    if (!vmXml || vmXml.trim().length === 0) return {xml: vmXml, edges: []};

    var parser = new DOMParser();
    var doc;
    try {
        doc = parser.parseFromString(vmXml, 'text/xml');
    } catch (e) {
        return {xml: vmXml, edges: []};
    }

    var edges = [];
    var pending = [];

    function extractChild(blockEl, childTag, connType) {
        var connEl = blockEl.querySelector(':scope > ' + childTag);
        if (!connEl) return;
        var childBlock = connEl.querySelector(':scope > block');
        if (!childBlock) return;

        var name = childTag === 'statement' ? connEl.getAttribute('name') || 'SUBSTACK' : null;
        var srcId = blockEl.getAttribute('id');
        var tgtId = childBlock.getAttribute('id');

        connEl.removeChild(childBlock);
        blockEl.parentNode.insertBefore(childBlock, blockEl.nextSibling);
        connEl.parentNode.removeChild(connEl);

        if (srcId && tgtId) {
            edges.push({
                id: connType + '_' + srcId + '_' + tgtId,
                sourceId: srcId,
                targetId: tgtId,
                type: connType,
                name: name
            });
        }
        pending.push(childBlock);
    }

    function renameBlockType(blockEl) {
        var bt = blockEl.getAttribute('type');
        if (bt && bt.indexOf('schema_') !== 0) {
            blockEl.setAttribute('type', 'schema_' + bt);
        }
    }

    var blocks = doc.querySelectorAll('block');
    for (var i = 0; i < blocks.length; i++) {
        pending.push(blocks[i]);
    }

    while (pending.length > 0) {
        var p = pending.shift();
        renameBlockType(p);
        extractChild(p, 'next', 'next');
        extractChild(p, 'statement', 'statement');
    }

    var shadows = doc.querySelectorAll('shadow');
    for (var j = 0; j < shadows.length; j++) {
        renameBlockType(shadows[j]);
    }

    var serializer = new XMLSerializer();
    return {xml: serializer.serializeToString(doc), edges: edges};
}

function toVmxXml(schemaXml, edges) {
    if (!schemaXml || schemaXml.trim().length === 0) return schemaXml;

    var parser = new DOMParser();
    var doc;
    try {
        doc = parser.parseFromString(schemaXml, 'text/xml');
    } catch (e) {
        return schemaXml;
    }

    var allBlocks = doc.querySelectorAll('block, shadow');
    for (var i = 0; i < allBlocks.length; i++) {
        var b = allBlocks[i];
        var t = b.getAttribute('type');
        if (t && t.indexOf('schema_') === 0) {
            b.setAttribute('type', t.substring(7));
        }
    }

    if (!edges || edges.length === 0) {
        var s = new XMLSerializer();
        return s.serializeToString(doc);
    }

    var idToEl = {};
    var topBlocks = doc.querySelectorAll('block');
    for (var k = 0; k < topBlocks.length; k++) {
        var id = topBlocks[k].getAttribute('id');
        if (id) idToEl[id] = topBlocks[k];
    }

    var usedTargets = {};
    for (var m = 0; m < edges.length; m++) {
        usedTargets[edges[m].targetId] = true;
    }

    function attachChildren(parentEl, sourceId) {
        var outgoing = [];
        for (var n = 0; n < edges.length; n++) {
            if (edges[n].sourceId === sourceId) {
                outgoing.push(edges[n]);
            }
        }
        for (var p = 0; p < outgoing.length; p++) {
            var edge = outgoing[p];
            var childEl = idToEl[edge.targetId];
            if (!childEl) continue;
            var parent = childEl.parentNode;
            if (!parent) continue;
            if (parent.tagName && (parent.tagName.toLowerCase() === 'next' || parent.tagName.toLowerCase() === 'statement')) {
                continue;
            }
            if (edge.type === 'next') {
                var nextWrap = doc.createElement('next');
                parent.removeChild(childEl);
                nextWrap.appendChild(childEl);
                parentEl.appendChild(nextWrap);
            } else if (edge.type === 'statement') {
                var stmtWrap = doc.createElement('statement');
                stmtWrap.setAttribute('name', edge.name || 'SUBSTACK');
                parent.removeChild(childEl);
                stmtWrap.appendChild(childEl);
                parentEl.appendChild(stmtWrap);
            }
            attachChildren(childEl, edge.targetId);
        }
    }

    var roots = [];
    for (var q = 0; q < topBlocks.length; q++) {
        var rId = topBlocks[q].getAttribute('id');
        if (rId && !usedTargets[rId]) {
            roots.push(topBlocks[q]);
        }
    }

    for (var r = 0; r < roots.length; r++) {
        var rootId = roots[r].getAttribute('id');
        if (rootId) {
            attachChildren(roots[r], rootId);
        }
    }

    var serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
}

export {
    toSchemaXml,
    toVmxXml
};
