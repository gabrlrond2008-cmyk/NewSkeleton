var flyStyleInjected = false;

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t) {
    return t * t * t;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function isReducedMotion() {
    return typeof document !== 'undefined' &&
        typeof document.body !== 'undefined' &&
        document.body.classList.contains('reduced-motion');
}

function collectType(node, catId, out) {
    if (!node) return;
    if (typeof node.getAttribute === 'function') {
        var type = node.getAttribute('type');
        if (type) out[type] = catId;
        var children = node.childNodes;
        for (var i = 0; children && i < children.length; i++) {
            collectType(children[i], catId, out);
        }
    }
}

function buildOpcodeCategoryMap(toolbox) {
    var out = {};
    if (!toolbox || !toolbox.categoryMenu_ || !toolbox.categoryMenu_.categories_) return out;
    var cats = toolbox.categoryMenu_.categories_;
    for (var i = 0; i < cats.length; i++) {
        var cat = cats[i];
        if (!cat || !cat.id_) continue;
        var contents = cat.getContents ? cat.getContents() : null;
        if (!contents) continue;
        var nodes = null;
        if (Array.isArray(contents)) {
            nodes = contents;
        } else if (typeof contents !== 'string') {
            nodes = [contents];
        }
        if (!nodes) continue;
        for (var j = 0; j < nodes.length; j++) {
            collectType(nodes[j], cat.id_, out);
        }
    }
    return out;
}

function findCategoryItem(toolbox, catId) {
    var cats = toolbox.categoryMenu_ && toolbox.categoryMenu_.categories_;
    if (!cats) return null;
    for (var i = 0; i < cats.length; i++) {
        if (cats[i].id_ === catId) return cats[i];
    }
    return null;
}

function selectCategory(toolbox, catId) {
    try {
        if (toolbox.getSelectedCategoryId && toolbox.getSelectedCategoryId() === catId) return;
        var cat = findCategoryItem(toolbox, catId);
        if (cat && typeof toolbox.setSelectedItem === 'function') {
            toolbox.setSelectedItem(cat, false);
        }
    } catch (e) {
        console.warn('[AI Blocks] No se pudo cambiar de categoría:', e.message);
    }
}

function findFlyoutBlock(flyout, opcode) {
    try {
        var ws = flyout && flyout.getWorkspace ? flyout.getWorkspace() : null;
        if (!ws || typeof ws.getAllBlocks !== 'function') return null;
        var all = ws.getAllBlocks(true);
        var fallback = null;
        for (var i = 0; i < all.length; i++) {
            var b = all[i];
            if (!b) continue;
            if (typeof b.isShadow === 'function' && b.isShadow()) continue;
            if (b.type !== opcode) continue;
            if (typeof b.getParent === 'function' && !b.getParent()) return b;
            if (!fallback) fallback = b;
        }
        return fallback;
    } catch (e) {
        return null;
    }
}

function ensureFlyoutPickStyle() {
    if (flyStyleInjected) return;
    try {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = '@keyframes aiFlyoutPick{0%,100%{filter:none}40%{filter:drop-shadow(0 0 9px #fff)brightness(1.3)}}' +
            '.aiFlyoutPick{animation:aiFlyoutPick 360ms ease-out}';
        (document.head || document.documentElement).appendChild(style);
        flyStyleInjected = true;
    } catch (e) {
        // non-fatal
    }
}

function pulseFlyoutBlock(flyBlock) {
    try {
        var root = flyBlock.getSvgRoot();
        if (!root || !root.classList) return;
        ensureFlyoutPickStyle();
        root.classList.add('aiFlyoutPick');
        setTimeout(function () {
            if (root.classList) root.classList.remove('aiFlyoutPick');
        }, 420);
    } catch (e) {
        // non-fatal
    }
}

function leftEdgePoint(destBlock, scale) {
    var rect = destBlock.getSvgRoot().getBoundingClientRect();
    return {x: rect.left - 380 * (scale || 1), y: rect.top};
}

function orderChain(block) {
    if (typeof block.getDescendants === 'function') {
        var desc = block.getDescendants(false);
        var out = [];
        for (var i = 0; i < desc.length; i++) {
            var b = desc[i];
            if (b && !(typeof b.isShadow === 'function' && b.isShadow())) out.push(b);
        }
        return out;
    }
    return [block];
}

/**
 * Animate a placed top-level block (and its whole chain) flying from a screen
 * point to its final workspace position.
 * @param {*} destBlock The placed top-level Blockly block
 * @param {*} workspace The main Blockly workspace
 * @param {{x:number,y:number}} startPoint Starting screen point
 * @param {number} durationMs Flight duration
 * @return {!Promise}
 */
function animateFlight(destBlock, workspace, startPoint, durationMs) {
    var scale = workspace && workspace.scale ? workspace.scale : 1;
    var base = null;
    var end = null;
    try {
        base = destBlock.getRelativeToSurfaceXY();
    } catch (e) {
        base = null;
    }
    try {
        var rect = destBlock.getSvgRoot().getBoundingClientRect();
        end = {x: rect.left, y: rect.top};
    } catch (e) {
        end = null;
    }
    if (!base || !end) return Promise.resolve();

    var t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return new Promise(function (resolve) {
        function frame() {
            try {
                if (destBlock.isDisposed && destBlock.isDisposed()) {
                    resolve();
                    return;
                }
                var now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                var t = Math.min((now - t0) / durationMs, 1);
                var k = easeOutCubic(t);
                var sx = lerp(startPoint.x, end.x, k);
                var sy = lerp(startPoint.y, end.y, k);
                var dx = (sx - end.x) / scale;
                var dy = (sy - end.y) / scale;
                destBlock.translate(base.x + dx, base.y + dy);
                if (t < 1 && typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            } catch (e) {
                resolve();
            }
        }
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(frame);
        } else {
            destBlock.translate(base.x, base.y);
            resolve();
        }
    });
}

/**
 * Animate AI-placed blocks one chain at a time. For each chain the flyout
 * navigates to the category of its blocks (highlighting each in turn), then
 * the whole chain flies from the flyout into place.
 * @param {*} workspace The main Blockly workspace
 * @param {!Array<string>} topBlockIds ids of the placed top-level blocks
 * @param {{browseMs:number, flightMs:number, capBrowsedBlocks:number}} opts
 * @return {!Promise}
 */
function flyInFromToolbox(workspace, topBlockIds, opts) {
    var options = opts || {};
    var browseMs = options.browseMs >= 0 ? options.browseMs : 130;
    var flightMs = options.flightMs >= 0 ? options.flightMs : 300;
    var cap = options.capBrowsedBlocks >= 0 ? options.capBrowsedBlocks : 6;

    if (isReducedMotion()) return Promise.resolve();
    if (!workspace || !topBlockIds || topBlockIds.length === 0) return Promise.resolve();

    var flyout = null;
    var toolbox = null;
    try {
        flyout = workspace.getFlyout ? workspace.getFlyout() : null;
        toolbox = workspace.toolbox_ || null;
    } catch (e) {
        flyout = null;
        toolbox = null;
    }
    var browsable = !!(flyout && toolbox && flyout.isVisible && flyout.isVisible());
    var opcodeMap = browsable ? buildOpcodeCategoryMap(toolbox) : {};

    var ids = topBlockIds.slice();

    function browseChainBlocks(blocks) {
        return new Promise(function (resolveNext) {
            var startPoint = null;
            var bi = 0;
            var browsed = 0;

            function step() {
                if (!browsable || bi >= blocks.length || browsed >= cap || !blocks[bi]) {
                    resolveNext(startPoint);
                    return;
                }
                var b = blocks[bi];
                if (!b.type) {
                    bi++;
                    step();
                    return;
                }
                if (bi > 0 && blocks[bi - 1].type === b.type) {
                    bi++; // dedupe consecutive opcodes
                    step();
                    return;
                }
                var catId = opcodeMap[b.type];
                if (catId) selectCategory(toolbox, catId);

                var fb = findFlyoutBlock(flyout, b.type);
                if (fb) {
                    pulseFlyoutBlock(fb);
                    if (!startPoint) {
                        try {
                            var fbRect = fb.getSvgRoot().getBoundingClientRect();
                            startPoint = {x: fbRect.left, y: fbRect.top};
                        } catch (e) {
                            startPoint = null;
                        }
                    }
                }
                bi++;
                browsed++;
                if (browseMs > 0) {
                    delay(browseMs).then(step);
                } else {
                    step();
                }
            }

            step();
        });
    }

    function processChain(index) {
        if (index >= ids.length) return Promise.resolve();
        var id = ids[index];
        var dest = workspace.getBlockById ? workspace.getBlockById(id) : null;
        if (!dest || (dest.isDisposed && dest.isDisposed())) {
            return processChain(index + 1);
        }

        var blocks = orderChain(dest);
        return browseChainBlocks(blocks).then(function (startPoint) {
            var useStart = startPoint;
            if (!useStart) {
                try {
                    useStart = leftEdgePoint(dest, workspace.scale || 1);
                } catch (e) {
                    useStart = null;
                }
            }
            var finalize = useStart && typeof dest.translate === 'function' ?
                animateFlight(dest, workspace, useStart, flightMs) :
                delay(flightMs);
            return finalize.then(function () {
                return processChain(index + 1);
            });
        });
    }

    return processChain(0);
}

function orderChainPreBlocks(topBlock) {
    var out = [];
    function walk(b) {
        if (!b || (typeof b.isShadow === 'function' && b.isShadow())) return;
        out.push(b);
        if (b.inputList) {
            for (var i = 0; i < b.inputList.length; i++) {
                var input = b.inputList[i];
                var con = input ? input.connection : null;
                var child = (con && typeof con.targetBlock === 'function') ? con.targetBlock() : null;
                if (child) walk(child);
            }
        }
        var next = (typeof b.getNextBlock === 'function') ? b.getNextBlock() : null;
        if (next) walk(next);
    }
    walk(topBlock);
    return out;
}

/**
 * Shared core of the "blocks fly into place" animation. Snapshots the given
 * blocks' final positions, hides them, then reveals + flies each one (parents
 * before children, using parent-relative offsets for nested blocks).
 * @param {*} workspace
 * @param {!Array<*>} ordered blocks in pre-order to animate
 * @param {Object} opts
 * @return {!Promise}
 */
function animateOrdered(workspace, ordered, opts) {
    var options = opts || {};
    var browseMs = options.browseMs >= 0 ? options.browseMs : 130;
    var flightMs = options.flightMs >= 0 ? options.flightMs : 230;
    var pauseMs = options.pauseMs >= 0 ? options.pauseMs : 60;
    var emergeMs = options.emergeMs >= 0 ? options.emergeMs : 45;
    var scaleStart = options.scaleStart > 0 ? options.scaleStart : 0.2;
    var outDx = options.outDx >= 0 ? options.outDx : 320;

    if (isReducedMotion()) return Promise.resolve();
    if (!workspace || !ordered || !ordered.length) return Promise.resolve();

    var flyout = null;
    var toolbox = null;
    try { flyout = workspace.getFlyout ? workspace.getFlyout() : null; } catch (e) { flyout = null; }
    try { toolbox = workspace.toolbox_ || null; } catch (e) { toolbox = null; }
    var browsable = !!(flyout && toolbox && flyout.isVisible && flyout.isVisible());
    var opcodeMap = browsable ? buildOpcodeCategoryMap(toolbox) : {};
    var scale = (workspace && workspace.scale) || 1;

    var snaps = [];
    for (var i = 0; i < ordered.length; i++) {
        var block = ordered[i];
        var root = null;
        try { root = (typeof block.getSvgRoot === 'function') ? block.getSvgRoot() : null; } catch (e) { root = null; }
        if (!root) continue;
        var abs = null;
        try { abs = block.getRelativeToSurfaceXY(); } catch (e) { abs = null; }
        if (!abs) continue;
        var parentRel = null;
        var parent = null;
        try { parent = (typeof block.getParent === 'function' && block.getParent()) || null; } catch (e) { parent = null; }
        if (parent) {
            try {
                var pAbs = parent.getRelativeToSurfaceXY();
                parentRel = {x: abs.x - pAbs.x, y: abs.y - pAbs.y};
            } catch (e) { parentRel = null; }
        }
        try { root.style.opacity = 0; } catch (e) {}
        snaps.push({block: block, root: root, absX: abs.x, absY: abs.y, parentRel: parentRel});
    }
    if (snaps.length === 0) return Promise.resolve();

    var index = 0;
    var currentCategory = null;

    function setBlockTransform(block, x, y, s) {
        try {
            var root = (typeof block.getSvgRoot === 'function') ? block.getSvgRoot() : null;
            var t = 'translate(' + x + ',' + y + ')';
            if (s && s !== 1) t += ' scale(' + s + ')';
            if (root && typeof root.setAttribute === 'function') {
                root.setAttribute('transform', t);
            } else if (typeof block.translate === 'function') {
                block.translate(x, y);
            }
        } catch (e) {}
    }

    function animateOne(snap, startScreen) {
        return new Promise(function (resolve) {
            var t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
            var endScreen = null;
            if (!snap.parentRel) {
                try {
                    var r = snap.root.getBoundingClientRect();
                    endScreen = {x: r.left, y: r.top};
                } catch (e) { endScreen = null; }
            }
            // The block is already visible on the workspace: reveal it NOW so the
            // viewer sees it come out of the flyout and travel into place.
            try { snap.root.style.opacity = 1; } catch (e) {}

            var totalMs = emergeMs + flightMs;
            function frame() {
                try {
                    if (snap.block.isDisposed && snap.block.isDisposed()) {
                        try { snap.root.style.opacity = 1; } catch (e) {}
                        resolve();
                        return;
                    }
                    var now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                    var elapsed = now - t0;
                    if (elapsed < emergeMs) {
                        // Phase 1: "emerge" - the block pops out of the flyout edge,
                        // growing from scaleStart to full size before taking off.
                        var ek = easeOutCubic(Math.max(elapsed / emergeMs, 0));
                        var es = lerp(scaleStart, 1, ek);
                        if (snap.parentRel) {
                            setBlockTransform(snap.block, snap.parentRel.x - outDx, snap.parentRel.y, es);
                        } else if (startScreen && endScreen) {
                            setBlockTransform(snap.block,
                                snap.absX + (startScreen.x - endScreen.x) / scale,
                                snap.absY + (startScreen.y - endScreen.y) / scale, es);
                        } else {
                            setBlockTransform(snap.block, snap.absX, snap.absY, es);
                        }
                    } else {
                        // Phase 2: flight from the launch point to the socket.
                        var p = Math.min((elapsed - emergeMs) / flightMs, 1);
                        var k = easeOutCubic(p);
                        if (snap.parentRel) {
                            setBlockTransform(snap.block,
                                lerp(snap.parentRel.x - outDx, snap.parentRel.x, k), snap.parentRel.y, 1);
                        } else if (startScreen && endScreen) {
                            var sx = lerp(startScreen.x, endScreen.x, k);
                            var sy = lerp(startScreen.y, endScreen.y, k);
                            setBlockTransform(snap.block,
                                snap.absX + (sx - endScreen.x) / scale,
                                snap.absY + (sy - endScreen.y) / scale, 1);
                        }
                    }
                    if (elapsed < totalMs && typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(frame);
                    } else {
                        if (snap.parentRel) {
                            snap.block.translate(snap.parentRel.x, snap.parentRel.y);
                        } else {
                            snap.block.translate(snap.absX, snap.absY);
                        }
                        try { snap.root.style.opacity = 1; } catch (e) {}
                        resolve();
                    }
                } catch (e) {
                    try {
                        if (snap.parentRel) {
                            snap.block.translate(snap.parentRel.x, snap.parentRel.y);
                        } else {
                            snap.block.translate(snap.absX, snap.absY);
                        }
                        snap.root.style.opacity = 1;
                    } catch (e2) {}
                    resolve();
                }
            }
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(frame);
            } else {
                if (snap.parentRel) snap.block.translate(snap.parentRel.x, snap.parentRel.y);
                else snap.block.translate(snap.absX, snap.absY);
                try { snap.root.style.opacity = 1; } catch (e) {}
                resolve();
            }
        });
    }

    function next() {
        if (index >= snaps.length) return Promise.resolve();
        var snap = snaps[index];
        index++;

        var startScreen = null;
        var navDwell = 0;
        var opcode = snap.block.type;
        if (browsable && opcode) {
            var catId = opcodeMap[opcode];
            if (catId && catId !== currentCategory) {
                selectCategory(toolbox, catId);
                currentCategory = catId;
                navDwell = browseMs;
            }
            var fb = findFlyoutBlock(flyout, opcode);
            if (fb) {
                pulseFlyoutBlock(fb);
                if (!snap.parentRel && typeof fb.getSvgRoot === 'function') {
                    try {
                        var fr = fb.getSvgRoot().getBoundingClientRect();
                        startScreen = {x: fr.left, y: fr.top};
                    } catch (e) { startScreen = null; }
                }
            }
        }
        if (!snap.parentRel && !startScreen) {
            try {
                var ll = leftEdgePoint(snap.block, scale);
                startScreen = {x: ll.x, y: ll.y};
            } catch (e) { startScreen = null; }
        }

        var flight = function () {
            return animateOne(snap, startScreen).then(function () {
                if (pauseMs > 0) return delay(pauseMs);
            });
        };
        if (navDwell > 0) {
            return delay(navDwell).then(flight).then(next);
        }
        return flight().then(next);
    }

    return next();
}

/**
 * Animate the just-placed blocks one by one, in pre-order, each flying out of
 * its own category in the toolbox/flyout into its socket. Works over the already
 * loaded program: real positions are captured up front, blocks are hidden and
 * then revealed one at a time as they fly into place (parent before child).
 * @param {*} workspace The main Blockly workspace
 * @param {!Array<string>} topBlockIds ids of the placed top-level blocks
 * @param {Object} opts
 * @return {!Promise}
 */
function assembleBlocksInOrder(workspace, topBlockIds, opts) {
    if (!workspace || !topBlockIds || !topBlockIds.length) return Promise.resolve();
    var ordered = [];
    for (var t = 0; t < topBlockIds.length; t++) {
        var tb = workspace.getBlockById ? workspace.getBlockById(topBlockIds[t]) : null;
        if (!tb || (tb.isDisposed && tb.isDisposed())) continue;
        var seq = orderChainPreBlocks(tb);
        for (var s = 0; s < seq.length; s++) ordered.push(seq[s]);
    }
    if (ordered.length === 0) return Promise.resolve();
    return animateOrdered(workspace, ordered, opts);
}

/**
 * Animate ONLY the given blocks into their sockets. Unlike
 * assembleBlocksInOrder this accepts blocks that are already part of an
 * existing (live) chain — newly inserted nested blocks — and leaves every
 * other block frozen in place.
 * @param {*} workspace
 * @param {!Array<string>} blockIds ids of the just-inserted blocks
 * @param {Object} opts
 * @return {!Promise}
 */
function flyInBlocks(workspace, blockIds, opts) {
    if (!workspace || !blockIds || !blockIds.length) return Promise.resolve();
    var ordered = [];
    for (var i = 0; i < blockIds.length; i++) {
        var blk = workspace.getBlockById ? workspace.getBlockById(blockIds[i]) : null;
        if (!blk || (blk.isDisposed && blk.isDisposed())) continue;
        if (typeof blk.isShadow === 'function' && blk.isShadow()) continue;
        ordered.push(blk);
    }
    if (ordered.length === 0) return Promise.resolve();
    return animateOrdered(workspace, ordered, opts);
}

/**
 * Pure: the workspace point a block snap should occupy at exit progress k,
 * travelling `dx` workspace units leftwards (toward the flyout) as it leaves.
 * @param {{absX:number, absY:number, parentRel:?{x:number,y:number}}} snap
 * @param {number} k eased progress 0..1
 * @param {number} dx distance travelled when k=1
 * @return {{x:number, y:number}}
 */
function computeExitPoint(snap, k, dx) {
    if (snap && snap.parentRel) {
        return {x: snap.parentRel.x - dx * k, y: snap.parentRel.y};
    }
    return {x: snap.absX - dx * k, y: snap.absY};
}

/**
 * Shared "reverse fly-in" exit: the removed blocks fly leftwards toward the
 * flyout while fading, exactly opposite to the way AI blocks appear, then are
 * disposed. Only top-level roots are translated (their nested SVG roots live
 * inside the parent group and travel with them); nested blocks just fade.
 * @param {*} workspace The main Blockly workspace
 * @param {!Array<string>} blockIds roots of the blocks to remove (disposed at end)
 * @param {number} ms Duration of the exit
 * @return {!Promise}
 */
function animateExit(workspace, blockIds, ms) {
    if (!workspace || !blockIds || !blockIds.length) return Promise.resolve();
    var duration = ms && ms > 0 ? ms : 200;
    var EXIT_DX = 320;

    var targets = [];
    for (var i = 0; i < blockIds.length; i++) {
        var blk = workspace.getBlockById ? workspace.getBlockById(blockIds[i]) : null;
        if (!blk || (typeof blk.isDisposed === 'function' && blk.isDisposed())) continue;
        targets.push(blk);
    }
    if (targets.length === 0) return Promise.resolve();

    function disposeTargets() {
        for (var k = 0; k < targets.length; k++) {
            try { if (targets[k].dispose) targets[k].dispose(false); } catch (e) {}
        }
    }

    // Snapshot every non-shadow block in the removed subtrees BEFORE any
    // disposal so the exit has real positions to animate from.
    var snaps = [];
    for (var t = 0; t < targets.length; t++) {
        var target = targets[t];
        var list = [];
        if (typeof target.getDescendants === 'function') {
            try { list = target.getDescendants(false) || []; } catch (e) { list = []; }
        } else {
            list = [target];
        }
        for (var d = 0; d < list.length; d++) {
            var db = list[d];
            if (!db || (typeof db.isShadow === 'function' && db.isShadow())) continue;
            var root = (typeof db.getSvgRoot === 'function') ? db.getSvgRoot() : null;
            if (!root || !root.style) continue;
            var abs = null;
            try {
                abs = (typeof db.getRelativeToSurfaceXY === 'function') ? db.getRelativeToSurfaceXY() : null;
            } catch (e) { abs = null; }
            var parentRel = null;
            if (abs) {
                try {
                    var parent = (typeof db.getParent === 'function') ? db.getParent() : null;
                    if (parent && typeof parent.getRelativeToSurfaceXY === 'function') {
                        var pa = parent.getRelativeToSurfaceXY();
                        parentRel = {x: abs.x - pa.x, y: abs.y - pa.y};
                    }
                } catch (e2) {}
            }
            snaps.push({
                block: db,
                root: root,
                absX: abs ? abs.x : 0,
                absY: abs ? abs.y : 0,
                parentRel: parentRel,
                positioned: !!abs && typeof db.translate === 'function' && !parentRel
            });
        }
    }
    if (snaps.length === 0) {
        disposeTargets();
        return Promise.resolve();
    }

    function disposeImmediately() {
        disposeTargets();
        return Promise.resolve();
    }
    if (isReducedMotion()) return disposeImmediately();

    return new Promise(function (resolve) {
        var t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        function frame() {
            try {
                var now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                var p = Math.min((now - t0) / duration, 1);
                var ek = easeInCubic(p);
                for (var r = 0; r < snaps.length; r++) {
                    var snap = snaps[r];
                    if (snap.block.isDisposed && snap.block.isDisposed()) continue;
                    if (snap.positioned) {
                        var pt = computeExitPoint(snap, ek, EXIT_DX);
                        try { snap.block.translate(pt.x, pt.y); } catch (e) {}
                    }
                    try { snap.root.style.opacity = 1 - ek; } catch (e) {}
                }
                if (p < 1 && typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(frame);
                } else {
                    disposeTargets();
                    resolve();
                }
            } catch (e) {
                disposeTargets();
                resolve();
            }
        }
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(frame);
        } else {
            disposeTargets();
            resolve();
        }
    });
}

/**
 * Fade out and dispose the given blocks by flying them toward the flyout. Used
 * by the block-level diff for removed nested blocks; leaves other blocks alone.
 * @param {*} workspace
 * @param {!Array<string>} blockIds
 * @param {number} ms
 * @return {!Promise}
 */
function fadeOutBlocks(workspace, blockIds, ms) {
    return animateExit(workspace, blockIds, ms);
}

function fadeOutChains(workspace, topBlockIds, ms) {
    return animateExit(workspace, topBlockIds, ms);
}

export {
    flyInFromToolbox,
    assembleBlocksInOrder,
    flyInBlocks,
    fadeOutChains,
    fadeOutBlocks,
    animateExit,
    computeExitPoint,
    buildOpcodeCategoryMap,
    orderChainPreBlocks,
    easeOutCubic,
    easeInCubic,
    lerp,
    leftEdgePoint,
    animateFlight
};