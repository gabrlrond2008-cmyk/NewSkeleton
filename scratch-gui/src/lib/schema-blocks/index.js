function getEdgesFromConnections(workspace, Blockly) {
    if (!workspace || !Blockly) {
        console.warn('[schema] getEdgesFromConnections: no workspace or Blockly');
        return [];
    }
    try {
        var allBlocks = workspace.getAllBlocks(false);
        var edges = [];
        var seen = new Set();

        console.log('[schema] getEdgesFromConnections: total blocks:', allBlocks.length);
        for (var i = 0; i < allBlocks.length; i++) {
            var block = allBlocks[i];
            if (!block || block.isShadow() || seen.has(block.id)) continue;
            seen.add(block.id);
            console.log('[schema] processing block:', block.type, block.id, 'next:', !!(block.nextConnection && block.nextConnection.isConnected()), 'inputs:', block.inputList ? block.inputList.length : 0);

            var nc = block.nextConnection;
            if (nc && nc.isConnected()) {
                var nb = nc.targetBlock();
                if (nb && !nb.isShadow() && nb.workspace) {
                    edges.push({
                        id: 'n_' + block.id + '_' + nb.id,
                        source: block,
                        target: nb,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                        label: null
                    });
                }
            }

            var inputs = block.inputList || [];
            for (var j = 0; j < inputs.length; j++) {
                var inp = inputs[j];
                if (inp.connection && inp.connection.type === Blockly.NEXT_STATEMENT && inp.connection.isConnected()) {
                    var sb = inp.connection.targetBlock();
                    if (sb && !sb.isShadow() && sb.workspace) {
                        edges.push({
                            id: 's_' + block.id + '_' + sb.id,
                            source: block,
                            target: sb,
                            sourceHandle: inp.name === 'SUBSTACK2' ? 'no' : 'yes',
                            targetHandle: 'top',
                            label: inp.name === 'SUBSTACK2' ? 'No' : 'S\u00ed'
                        });
                    }
                }
            }
        }
        return edges;
    } catch (e) {
        console.error('[schema] getEdgesFromConnections error:', e.message);
        return [];
    }
}

function getPortPosition(block, handleType) {
    if (!block) return {x: 0, y: 0};
    try {
        var pos = block.getRelativeToSurfaceXY();
        var w = block.width || 100;
        var h = block.height || 40;

        switch (handleType) {
            case 'top':
                return {x: pos.x + w / 2, y: pos.y};
            case 'bottom':
                return {x: pos.x + w / 2, y: pos.y + h};
            case 'yes': {
                var ys = block.schemaStatementOffsets_ && block.schemaStatementOffsets_.SUBSTACK;
                return {x: pos.x, y: pos.y + (ys != null ? ys : h / 2)};
            }
            case 'no': {
                var yn = block.schemaStatementOffsets_ && block.schemaStatementOffsets_.SUBSTACK2;
                return {x: pos.x + w, y: pos.y + (yn != null ? yn : h / 2)};
            }
        }
        return {x: pos.x + w / 2, y: pos.y + h / 2};
    } catch (e) {
        console.error('[schema] getPortPosition error:', e.message);
        return {x: 0, y: 0};
    }
}

function computePorts(workspace, Blockly) {
    if (!workspace) return [];
    try {
        var allBlocks = workspace.getAllBlocks(false);
        var portList = [];
        for (var i = 0; i < allBlocks.length; i++) {
            var block = allBlocks[i];
            if (!block || block.isShadow()) continue;
            if (block.previousConnection) {
                portList.push({block: block, handle: 'top', type: 'input'});
            }
            if (block.nextConnection) {
                portList.push({block: block, handle: 'bottom', type: 'output'});
            }
            var inputs = block.inputList || [];
            for (var j = 0; j < inputs.length; j++) {
                var inp = inputs[j];
                if (inp.connection && inp.connection.type === Blockly.NEXT_STATEMENT) {
                    portList.push({
                        block: block,
                        handle: inp.name === 'SUBSTACK2' ? 'no' : 'yes',
                        type: inp.name === 'SUBSTACK2' ? 'branchNo' : 'branch',
                        label: inp.name
                    });
                }
            }
        }
        return portList;
    } catch (e) {
        console.error('[schema] computePorts error:', e.message);
        return [];
    }
}

function getCompactHeight(block, Blockly) {
    try {
        var inputs = block.inputList || [];
        var stmtInputs = [];
        for (var j = 0; j < inputs.length; j++) {
            if (inputs[j].connection && inputs[j].connection.type === Blockly.NEXT_STATEMENT) {
                stmtInputs.push(inputs[j]);
            }
        }
        if (stmtInputs.length === 0) return block.height;

        var blockPos = block.getRelativeToSurfaceXY();
        var firstStmtY = Infinity;
        for (var s = 0; s < stmtInputs.length; s++) {
            var conn = stmtInputs[s].connection;
            if (conn.y_ != null && isFinite(conn.y_) && conn.y_ > 0) {
                firstStmtY = Math.min(firstStmtY, conn.y_);
            }
        }
        if (isFinite(firstStmtY)) {
            var compactH = Math.max(30, firstStmtY - blockPos.y + 6);
            console.log('[schema] compact:', block.type, 'original:', block.height, 'compact:', compactH, 'stmtInputs:', stmtInputs.length, 'firstStmtY:', firstStmtY, 'blockPos.y:', blockPos.y);
            return compactH;
        }
        console.warn('[schema] compact fallback: no valid connection y_, using subtraction');
        return Math.max(30, block.height - stmtInputs.length * 40);
    } catch (e) {
        console.warn('[schema] getCompactHeight fallback:', e.message);
        return block.height;
    }
}

function flattenBlockSvgPaths(Blockly) {
    if (!Blockly || !Blockly.BlockSvg) return;
    try {
        var origRender = Blockly.BlockSvg.prototype.render;
        if (!origRender || origRender.__schemaFlat) return;

        Blockly.BlockSvg.prototype.render = function () {
            origRender.call(this);
            if (this.workspace && this.workspace.useLineConnections) {
                try {
                    var inputs = this.inputList || [];

                    for (var j = 0; j < inputs.length; j++) {
                        var inp = inputs[j];
                        if (inp.connection && inp.connection.type === Blockly.NEXT_STATEMENT) {
                            if (inp.connection.y_ != null && isFinite(inp.connection.y_) &&
                                inp.connection.y_ > 0 && this.xy_ && isFinite(this.xy_.y)) {
                                if (!this.schemaStatementOffsets_) this.schemaStatementOffsets_ = {};
                                this.schemaStatementOffsets_[inp.name] = inp.connection.y_ - this.xy_.y;
                            }
                        }
                    }

                    var pathEl = this.svgPath_;
                    if (pathEl && pathEl.tagName !== 'path') {
                        pathEl = pathEl.querySelector('.blocklyPath');
                    }
                    if (!pathEl || pathEl.tagName !== 'path') {
                        pathEl = this.svgGroup_.querySelector('.blocklyPath');
                    }
                    if (pathEl) {
                        var hasStmt = false;
                        var hasConnectedStmt = false;
                        for (var s = 0; s < inputs.length; s++) {
                            if (inputs[s].connection && inputs[s].connection.type === Blockly.NEXT_STATEMENT) {
                                hasStmt = true;
                                if (inputs[s].connection.isConnected()) {
                                    hasConnectedStmt = true;
                                }
                            }
                        }

                        var w = this.width;
                        var h = this.height;

                        if (hasStmt && !hasConnectedStmt) {
                            h = getCompactHeight(this, Blockly);
                            this.height = h;
                        }

                        if (w > 0 && h > 0) {
                            var r = Math.min(6, w / 2, h / 2);
                            pathEl.setAttribute('d',
                                'M ' + r + ',0 ' +
                                'h ' + (w - 2 * r) + ' ' +
                                'a ' + r + ',' + r + ' 0 0,1 ' + r + ',' + r + ' ' +
                                'v ' + (h - 2 * r) + ' ' +
                                'a ' + r + ',' + r + ' 0 0,1 -' + r + ',' + r + ' ' +
                                'h -' + (w - 2 * r) + ' ' +
                                'a ' + r + ',' + r + ' 0 0,1 -' + r + ',-' + r + ' ' +
                                'v -' + (h - 2 * r) + ' ' +
                                'a ' + r + ',' + r + ' 0 0,1 ' + r + ',-' + r + ' ' +
                                'z'
                            );
                        }
                    }
                } catch (ee) {
                    console.warn('[schema] render flatten error:', ee.message);
                }
            }
        };
        Blockly.BlockSvg.prototype.render.__schemaFlat = true;
    } catch (e) {
        console.error('[schema] flattenBlockSvgPaths patch error:', e.message);
    }
}

export {
    getEdgesFromConnections,
    getPortPosition,
    computePorts,
    flattenBlockSvgPaths
};
