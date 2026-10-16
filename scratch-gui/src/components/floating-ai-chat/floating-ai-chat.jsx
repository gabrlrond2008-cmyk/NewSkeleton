import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import AiTab from '../../containers/ai-tab.jsx';
import {FIST_CAT_FACE, FIST_CAT_ICON} from '../../lib/fist-cat-face';

import styles from './floating-ai-chat.css';

var DEFAULT_W = 460;
var DEFAULT_H = 560;
var MIN_W = 360;
var MIN_H = 420;

var HANDLE_NAMES = [
    'top', 'bottom', 'left', 'right',
    'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
];


function findPathBetweenBlocks(start, target) {
    if (!start || !target) return null;
    if (start.id === target.id) return [start];

    function searchForward(fromBlock, toBlock) {
        var visited = [];
        function search(cur) {
            if (!cur) return false;
            visited.push(cur);
            if (cur.id === toBlock.id) return true;

            // Check statement inputs (like substacks inside if/repeat)
            if (cur.inputList) {
                for (var i = 0; i < cur.inputList.length; i++) {
                    var inp = cur.inputList[i];
                    if (inp && inp.connection && inp.connection.targetBlock) {
                        var child = inp.connection.targetBlock();
                        if (child && search(child)) return true;
                    }
                }
            }

            // Check next block in sequence
            var next = cur.getNextBlock ? cur.getNextBlock() : cur.next;
            if (next && search(next)) return true;

            visited.pop();
            return false;
        }

        if (search(fromBlock)) {
            return visited.slice();
        }
        return null;
    }

    var forward = searchForward(start, target);
    if (forward) return forward;

    var backward = searchForward(target, start);
    if (backward) return backward;

    return null;
}

var FloatingAiChat = function (props) {
    var {
        activeTabId,
        isOpen,
        onToggle,
        vm,
        pendingExplain,
        projectKey,
        onClearExplain,
        onActivateTab,
        isPaletteCollapsed,
        blocksPosition = 'left',
        aiBarPosition = 'bottom',
        stagePosition = 'right',
        showSplit = false,
        secondaryTabId = null,
        splitRatio = 0.5,
        isStageCollapsed = false,
        swipeOrder = 'up-close-down-open'
    } = props;

    var [isDetached, setIsDetached] = useState(false);
    var [dockMode, setDockMode] = useState('docked'); // 'docked' | 'accordion'
    var [isDraggingDock, setIsDraggingDock] = useState(false);
    var [isHoldingHandle, setIsHoldingHandle] = useState(false);
    var [dockDragPos, setDockDragPos] = useState({x: 0, y: 0});
    var [animState, setAnimState] = useState(null); // 'contracting' | 'falling' | 'landing' | 'expandingToPanel' | 'pillTravelingUp' | 'pillTravelingDown' | null
    var [fallStyles, setFallStyles] = useState({});
    var [travelStyles, setTravelStyles] = useState({});
    var prevAiBarPos = useRef(aiBarPosition);

    // Block referencing & analysis states
    var [isSelectingBlocks, setIsSelectingBlocks] = useState(false);
    var [selectedBlockIds, setSelectedBlockIds] = useState([]);
    var [pendingPrefixText, setPendingPrefixText] = useState('');
    var [blockSelectionResult, setBlockSelectionResult] = useState(null);

    var isSelectingBlocksRef = useRef(false);
    isSelectingBlocksRef.current = isSelectingBlocks;
    var selectedBlockIdsRef = useRef([]);
    selectedBlockIdsRef.current = selectedBlockIds;

    var isEs = (typeof localStorage !== 'undefined' && localStorage.getItem('scratchlanguage') ?
        localStorage.getItem('scratchlanguage').toLowerCase().startsWith('es') :
        (typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('es')));

    var [containerPos, setContainerPos] = useState(null);
    var [panelPos, setPanelPos] = useState(function () {
        if (typeof window !== 'undefined') {
            var stagePanel = document.querySelector('[class*="stage-and-target-wrapper"]');
            var maxRight = stagePanel ? stagePanel.getBoundingClientRect().left : window.innerWidth - 360;
            return {
                x: Math.max(16, maxRight - DEFAULT_W - 20),
                y: 80
            };
        }
        return {x: 16, y: 80};
    });
    var [panelSize, setPanelSize] = useState({w: DEFAULT_W, h: DEFAULT_H});
    var [guidanceMsg, setGuidanceMsg] = useState();
    var [guidanceClosing, setGuidanceClosing] = useState(false);
    var [reanalyzeTick, setReanalyzeTick] = useState(0);

    var containerRef = useRef(null);
    var panelRef = useRef(null);
    var dragRef = useRef({dragging: false, wasDragged: false, ox: 0, oy: 0});
    var panelDragRef = useRef({dragging: false, ox: 0, oy: 0});
    var resizeRef = useRef({active: false, dir: '', sx: 0, sy: 0, sw: 0, sh: 0, spx: 0, spy: 0});
    var dragDetachRef = useRef({startY: 0, startX: 0, hasDragged: false, active: false});
    var cleanupTimeoutsRef = useRef([]);

    function addTimeout(fn, delay) {
        var id = setTimeout(fn, delay);
        cleanupTimeoutsRef.current.push(id);
        return id;
    }

    function clearAllTimeouts() {
        cleanupTimeoutsRef.current.forEach(function (id) {
            clearTimeout(id);
        });
        cleanupTimeoutsRef.current = [];
    }

    useEffect(function () {
        return function () {
            clearAllTimeouts();
        };
    }, []);

    useEffect(function () {
        if (typeof document === 'undefined') return;
        var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
        var offset = '0px';
        if (isCode && !isDetached && !isDraggingDock && aiBarPosition !== 'top') {
            if (dockMode === 'accordion') {
                offset = 'calc(-1 * min(52vh, 480px) - 10px)';
            } else {
                offset = '-48px';
            }
        }
        document.documentElement.style.setProperty('--blockly-zoom-offset', offset);
        return function () {
            document.documentElement.style.setProperty('--blockly-zoom-offset', '0px');
        };
    }, [activeTabId, isDetached, isDraggingDock, dockMode, aiBarPosition, showSplit, secondaryTabId]);

    // Animate pill when aiBarPosition switches between top and bottom
    useEffect(function () {
        if (prevAiBarPos.current === aiBarPosition) return;
        var oldPos = prevAiBarPos.current;
        prevAiBarPos.current = aiBarPosition;

        var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
        if (!isCode || isDetached) return;

        if (dockMode === 'accordion') {
            setDockMode('docked');
            onToggle(false);
        }

        var bounds = getWorkspaceBounds();
        var paletteOffset = isPaletteCollapsed ? 16 : 324;
        var currentDockLeft;
        var currentDockWidth;
        if (blocksPosition === 'right') {
            currentDockLeft = Math.round(bounds.left);
            currentDockWidth = Math.round(Math.max(180, bounds.right - bounds.left - paletteOffset));
        } else {
            var effectiveOffset = (bounds.width < 500 && !isPaletteCollapsed) ? 0 : paletteOffset;
            currentDockLeft = Math.round(bounds.left + effectiveOffset);
            currentDockWidth = Math.round(Math.max(180, bounds.right - currentDockLeft));
        }

        var dockCenterX = currentDockLeft + currentDockWidth / 2;
        var pillX = Math.round(dockCenterX - 120);

        var currentDockTop = Math.round(bounds.top);
        var currentDockBottom = Math.round(bounds.bottom - 38);

        var startY = oldPos === 'top' ? currentDockTop : currentDockBottom;
        var targetY = aiBarPosition === 'top' ? currentDockTop : currentDockBottom;
        var isGoingUp = aiBarPosition === 'top';

        setTravelStyles({
            '--travel-start-x': pillX + 'px',
            '--travel-start-y': startY + 'px',
            '--travel-target-x': pillX + 'px',
            '--travel-target-y': targetY + 'px'
        });

        clearAllTimeouts();
        setAnimState(isGoingUp ? 'pillTravelingUp' : 'pillTravelingDown');

        addTimeout(function () {
            setAnimState('landing');

            addTimeout(function () {
                setAnimState(null);
            }, 400);
        }, 340);
    }, [aiBarPosition, activeTabId, isDetached, isPaletteCollapsed, blocksPosition, dockMode, onToggle, showSplit, secondaryTabId]);

    function getWorkspaceBounds() {
        var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
        if (isCode) {
            var codeEl = document.querySelector('[data-code-panel="true"]') ||
                         document.querySelector('[data-tabs-body] [class*="blocksWrapper"]') ||
                         document.querySelector('[data-tabs-body]');
            if (codeEl) {
                return codeEl.getBoundingClientRect();
            }
        }
        var el = document.querySelector('[data-tabs-body]') ||
                 document.querySelector('.' + styles.tabsBody) ||
                 document.querySelector('.blocklySvg');
        if (el) {
            return el.getBoundingClientRect();
        }
        var stagePanel = document.querySelector('[class*="stage-and-target-wrapper"]');
        var stageRect = stagePanel ? stagePanel.getBoundingClientRect() : null;
        var left = 0;
        var right = window.innerWidth;
        if (stageRect) {
            if (stagePosition === 'left') {
                left = Math.round(stageRect.right);
                right = window.innerWidth;
            } else {
                left = 0;
                right = Math.round(stageRect.left);
            }
        } else {
            right = window.innerWidth - 360;
        }
        return {
            left: left,
            top: 92,
            right: right,
            bottom: window.innerHeight,
            width: right - left,
            height: window.innerHeight - 92
        };
    }

    useLayoutEffect(function () {
        function positionContextually() {
            var bounds = getWorkspaceBounds();

            // Pinned permanently in one single place at bottom-right of the workspace
            setContainerPos({
                left: Math.round(bounds.right - 56),
                top: Math.round(bounds.bottom - 56)
            });

            setPanelPos(function (prev) {
                var maxPx = Math.max(bounds.left + 8, bounds.right - panelSize.w - 12);
                var maxPy = Math.max(bounds.top + 8, bounds.bottom - panelSize.h - 12);
                return {
                    x: Math.round(Math.max(bounds.left + 8, Math.min(maxPx, prev.x))),
                    y: Math.round(Math.max(bounds.top + 8, Math.min(maxPy, prev.y)))
                };
            });
        }
        positionContextually();
        window.addEventListener('resize', positionContextually);
        return function () { window.removeEventListener('resize', positionContextually); };
    }, [activeTabId, panelSize.w, panelSize.h, showSplit, secondaryTabId, splitRatio, isStageCollapsed, isPaletteCollapsed, blocksPosition, aiBarPosition, stagePosition]);

    useEffect(function () {
        if (pendingExplain) {
            var timer = setTimeout(function () {
                var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
                if (isCode && !isDetached) {
                    setDockMode('accordion');
                }
                onToggle(true);
            }, 0);
            return function () { clearTimeout(timer); };
        }
    }, [pendingExplain, activeTabId, isDetached, showSplit, secondaryTabId]);

    useEffect(function () {
        var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
        if (isOpen && (isDetached || !isCode)) {
            var bounds = getWorkspaceBounds();
            setPanelPos(function (prev) {
                var targetX = bounds.right - panelSize.w - 20;
                if (targetX < bounds.left + 16) {
                    targetX = bounds.left + 16;
                }
                var targetY = bounds.top + 20;
                var maxPx = Math.max(bounds.left + 8, bounds.right - panelSize.w - 12);
                var maxPy = Math.max(bounds.top + 8, bounds.bottom - panelSize.h - 12);
                var x = Math.min(maxPx, Math.max(bounds.left + 8, prev.x > 0 ? prev.x : targetX));
                var y = Math.min(maxPy, Math.max(bounds.top + 8, prev.y > 0 ? prev.y : targetY));
                return {x: Math.round(x), y: Math.round(y)};
            });
        }
    }, [isOpen, isDetached, activeTabId, showSplit, secondaryTabId]);

    var isAnalyzing = guidanceMsg === '';
    var hasGuidance = guidanceMsg && guidanceMsg.length > 0;
    var showGuidance = hasGuidance || guidanceClosing;
    var guidanceClass = styles.guidanceBanner + ' ' + (
        guidanceClosing ? styles.guidanceExit : styles.guidanceEnter
    );

    function handleFaceClick() {
        if (isAnalyzing) return;
        if (containerRef.current) {
            var eyes = containerRef.current.querySelectorAll('.fistEye');
            for (var i = 0; i < eyes.length; i++) {
                var eye = eyes[i];
                eye.style.transformBox = 'fill-box';
                eye.style.transformOrigin = 'center';
                eye.style.transition = 'transform 0.12s ease-in-out';
                eye.style.transform = 'scaleY(0.1)';
                (function (el) {
                    setTimeout(function () { el.style.transform = 'scaleY(1)'; }, 120);
                }(eye));
            }
        }
        onToggle(!isOpen);
    }

    // === Drag to Detach from Dock Bar with Live Contracted Drag Pill ===

    var wheelLockRef = useRef(false);

    function handleDockPointerDown(e) {
        if (e.button !== 0) return;
        if (e.target.closest('button')) return;
        setIsHoldingHandle(true);
        dragDetachRef.current = {
            startY: e.clientY,
            startX: e.clientX,
            hasDragged: false,
            isSwipe: false,
            swipeDirection: null,
            active: true
        };
        window.addEventListener('pointermove', handleDockPointerMove);
        window.addEventListener('pointerup', handleDockPointerUp);
    }

    function handleDockPointerMove(e) {
        if (!dragDetachRef.current.active) return;
        var rawDy = e.clientY - dragDetachRef.current.startY;
        var rawDx = e.clientX - dragDetachRef.current.startX;
        var absDy = Math.abs(rawDy);
        var absDx = Math.abs(rawDx);

        // 1. Deliberate undock drag: pulled far away (> 75px vertically into workspace or > 90px horizontally)
        if (absDy > 75 || absDx > 90) {
            dragDetachRef.current.hasDragged = true;
            setIsDraggingDock(true);
            setDockDragPos({x: e.clientX, y: e.clientY});
            return;
        }

        // 2. Normal swipe detection (moved between 12px and 75px vertically)
        if (absDy >= 12 && absDy >= absDx) {
            dragDetachRef.current.isSwipe = true;
            dragDetachRef.current.swipeDirection = rawDy < 0 ? 'up' : 'down';
        }
    }

    function handleDockPointerUp(e) {
        if (!dragDetachRef.current.active) return;
        dragDetachRef.current.active = false;
        setIsHoldingHandle(false);
        window.removeEventListener('pointermove', handleDockPointerMove);
        window.removeEventListener('pointerup', handleDockPointerUp);

        if (dragDetachRef.current.hasDragged) {
            // User deliberately dragged far away: undock to floating window
            setIsDraggingDock(false);
            var bounds = getWorkspaceBounds();
            var targetX = Math.round(Math.max(bounds.left + 8, Math.min(bounds.right - panelSize.w - 8, e.clientX - panelSize.w / 2)));
            var targetY = Math.round(Math.max(bounds.top + 8, Math.min(bounds.bottom - panelSize.h - 8, e.clientY - 24)));
            setPanelPos({x: targetX, y: targetY});
            setIsDetached(true);
            setDockMode('docked');
            setAnimState('expandingToPanel');
            onToggle(true);
            addTimeout(function () {
                setAnimState(null);
            }, 280);
            return;
        }

        // Check if a swipe occurred
        if (dragDetachRef.current.isSwipe && dragDetachRef.current.swipeDirection) {
            var dir = dragDetachRef.current.swipeDirection; // 'up' or 'down'

            if (swipeOrder === 'up-close-down-open') {
                if (dir === 'up') {
                    // Up -> Close
                    setDockMode('docked');
                    onToggle(false);
                } else {
                    // Down -> Open
                    setDockMode('accordion');
                    onToggle(true);
                }
            } else {
                // 'up-open-down-close'
                if (dir === 'up') {
                    // Up -> Open
                    setDockMode('accordion');
                    onToggle(true);
                } else {
                    // Down -> Close
                    setDockMode('docked');
                    onToggle(false);
                }
            }
            return;
        }

        // Pure click/tap without dragging: toggle accordion
        var next = dockMode === 'accordion' ? 'docked' : 'accordion';
        setDockMode(next);
        onToggle(next === 'accordion');
    }

    function handleDockWheel(e) {
        var rawDy = e.deltaY;
        if (Math.abs(rawDy) < 6) return;

        if (wheelLockRef.current) return;
        wheelLockRef.current = true;
        setTimeout(function () {
            wheelLockRef.current = false;
        }, 260);

        var isUp = rawDy < 0;
        var isDown = rawDy > 0;

        if (swipeOrder === 'up-close-down-open') {
            if (isUp && dockMode === 'accordion') {
                setDockMode('docked');
                onToggle(false);
            } else if (isDown && dockMode === 'docked') {
                setDockMode('accordion');
                onToggle(true);
            }
        } else {
            // 'up-open-down-close'
            if (isUp && dockMode === 'docked') {
                setDockMode('accordion');
                onToggle(true);
            } else if (isDown && dockMode === 'accordion') {
                setDockMode('docked');
                onToggle(false);
            }
        }
    }

    function handleExplicitDetach() {
        var bounds = getWorkspaceBounds();
        setIsDetached(true);
        setDockMode('docked');
        setAnimState('expandingToPanel');
        onToggle(true);
        setPanelPos({
            x: Math.round(Math.max(bounds.left + 16, bounds.right - panelSize.w - 20)),
            y: Math.round(Math.max(bounds.top + 60, bounds.bottom - panelSize.h - 50))
        });
        addTimeout(function () {
            setAnimState(null);
        }, 280);
    }

    // === Close Floating Panel with Gravity & Single Unified Landing Settle ===

    function handleClosePanel() {
        var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
        if (isCode) {
            clearAllTimeouts();
            var bounds = getWorkspaceBounds();
            var paletteOffset = isPaletteCollapsed ? 16 : 324;
            var currentDockLeft;
            var currentDockWidth;
            if (blocksPosition === 'right') {
                currentDockLeft = Math.round(bounds.left);
                currentDockWidth = Math.round(Math.max(180, bounds.right - bounds.left - paletteOffset));
            } else {
                var effectiveOffset = (bounds.width < 500 && !isPaletteCollapsed) ? 0 : paletteOffset;
                currentDockLeft = Math.round(bounds.left + effectiveOffset);
                currentDockWidth = Math.round(Math.max(180, bounds.right - currentDockLeft));
            }
            var isTop = aiBarPosition === 'top';
            var dockY = isTop ? Math.round(bounds.top) : (bounds.bottom - 38);
            var dockCenterX = currentDockLeft + currentDockWidth / 2;
            var deltaY = Math.max(30, Math.abs(dockY - panelPos.y));

            // Duration with realistic gravitational acceleration
            var duration = Math.min(440, Math.max(180, Math.round(Math.sqrt(deltaY / 0.6) * 12)));
            var contractedStartX = Math.round(panelPos.x + (panelSize.w - 240) / 2);

            setFallStyles({
                '--fall-start-x': contractedStartX + 'px',
                '--fall-start-y': panelPos.y + 'px',
                '--fall-target-x': Math.round(dockCenterX - 120) + 'px',
                '--fall-target-y': Math.round(dockY) + 'px',
                '--fall-duration': duration + 'ms'
            });

            // Phase 1: Rapidly contract floating window into bar (180ms)
            setAnimState('contracting');

            addTimeout(function () {
                // Phase 2: Dedicated falling bar accelerates down with gravity
                setAnimState('falling');

                addTimeout(function () {
                    // Phase 3: Settle at dock with unified squish, tab rebound, and horizontal expand
                    setIsDetached(false);
                    setDockMode('docked');
                    setAnimState('landing');

                    addTimeout(function () {
                        // Phase 4: Settle into normal resting state
                        setAnimState(null);
                        onToggle(false);
                    }, 400);
                }, duration);
            }, 180);
        } else {
            onToggle(false);
        }
    }

    // === AiTab callback: analyzing / guidance ===

    function handleInstructFromChat(msg) {
        if (msg === '') {
            setGuidanceClosing(false);
            setGuidanceMsg('');
        } else if (msg) {
            setGuidanceClosing(false);
            setGuidanceMsg(msg);
            var isCode = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
            if (isCode && !isDetached) {
                setDockMode('accordion');
            }
            onToggle(true);
        }
    }

    function closeGuidance() {
        setGuidanceClosing(true);
        setTimeout(function () {
            setGuidanceClosing(false);
            setGuidanceMsg(undefined);
        }, 280);
    }

    function handleReanalyze() {
        setGuidanceMsg('');
        setReanalyzeTick(function (t) { return t + 1; });
    }

    function handleCancelAnalysis() {
        closeGuidance();
    }

    // === Block selection & analysis handlers (@bloques) ===

    var handleStartBlockSelection = useCallback(function (prefix) {
        if (onActivateTab && activeTabId !== 'code') {
            onActivateTab('code');
        }
        setPendingPrefixText(prefix || '');
        setSelectedBlockIds([]);
        setIsSelectingBlocks(true);
        setDockMode('docked');
        onToggle(false);
    }, [onActivateTab, activeTabId, onToggle]);

    var handleClearBlockSelectionResult = useCallback(function () {
        setBlockSelectionResult(null);
    }, []);

    var handleCancelBlockSelection = useCallback(function () {
        if (typeof window !== 'undefined' && window.Blockly && window.Blockly.getMainWorkspace) {
            var ws = window.Blockly.getMainWorkspace();
            if (ws) {
                selectedBlockIdsRef.current.forEach(function (id) {
                    try {
                        ws.glowBlock(id, false);
                    } catch (_e) {}
                });
            }
        }
        setSelectedBlockIds([]);
        setIsSelectingBlocks(false);
        setPendingPrefixText('');
        setDockMode('accordion');
        onToggle(true);
    }, [onToggle]);

    var handleConfirmBlockSelection = useCallback(function () {
        var ids = selectedBlockIdsRef.current.slice();
        if (ids.length === 0) return;

        // Clear glow on workspace
        if (typeof window !== 'undefined' && window.Blockly && window.Blockly.getMainWorkspace) {
            var ws = window.Blockly.getMainWorkspace();
            if (ws) {
                ids.forEach(function (id) {
                    try {
                        ws.glowBlock(id, false);
                    } catch (_e) {}
                });
            }
        }

        var targetName = (vm && vm.editingTarget) ? vm.editingTarget.getName() : 'Sprite';
        var wsRef = (typeof window !== 'undefined' && window.Blockly && window.Blockly.getMainWorkspace) ?
            window.Blockly.getMainWorkspace() : null;

        var blockNames = [];
        var blocksListText = ids.map(function (id, idx) {
            var bData = vm && vm.editingTarget && vm.editingTarget.blocks ? vm.editingTarget.blocks._blocks[id] : null;
            var wsB = wsRef ? wsRef.getBlockById(id) : null;
            var blockText = (wsB && typeof wsB.toString === 'function') ? wsB.toString() : (bData ? bData.opcode : id);
            blockNames.push(blockText);
            var opcode = bData ? bData.opcode : (wsB ? wsB.type : '');
            var fields = (bData && bData.fields) ? Object.keys(bData.fields).map(function (k) {
                var fv = bData.fields[k];
                return k + ': ' + (fv && typeof fv === 'object' ? (fv.value || fv.name || JSON.stringify(fv)) : fv);
            }).join(', ') : '';
            return (idx + 1) + '. [' + opcode + '] "' + blockText + '"' + (fields ? ' (Campos: ' + fields + ')' : '');
        }).join('\n');

        var userPrefix = pendingPrefixText.trim();
        var prompt = '';
        if (isEs) {
            prompt = '🔍 **Modo Depurador de Bloques (@bloques)**\n\n' +
                'Por favor, analiza y depura los siguientes ' + ids.length + ' bloques seleccionados en el objeto "' + targetName + '":\n\n' +
                blocksListText + '\n\n' +
                (userPrefix ? ('**Consulta del usuario:** ' + userPrefix + '\n\n') : '') +
                '**Instrucciones de depuración y análisis:**\n' +
                '1. Explica paso a paso qué hace este bloque o secuencia en este objeto.\n' +
                '2. Analiza sus conexiones (bloque anterior, siguiente, entradas/condiciones y subpilas).\n' +
                '3. Diagnostica posibles errores de lógica, bucles infinitos, condiciones de carrera o valores inesperados.\n' +
                '4. Sugiere optimizaciones o correcciones si es necesario.';
        } else {
            prompt = '🔍 **Block Debugger & Analysis Mode (@blocks)**\n\n' +
                'Please analyze and debug the following ' + ids.length + ' selected block(s) in sprite/target "' + targetName + '":\n\n' +
                blocksListText + '\n\n' +
                (userPrefix ? ('**User query:** ' + userPrefix + '\n\n') : '') +
                '**Debugging and analysis instructions:**\n' +
                '1. Explain step-by-step what this block or sequence does.\n' +
                '2. Analyze connections (parent, next, inputs, conditions, substacks).\n' +
                '3. Diagnose potential logic bugs, infinite loops, race conditions, or unexpected values.\n' +
                '4. Provide suggestions for optimization or bug fixes.';
        }

        setBlockSelectionResult({
            blockIds: ids,
            blockNames: blockNames,
            prompt: prompt
        });

        setIsSelectingBlocks(false);
        setPendingPrefixText('');
        setDockMode('accordion');
        onToggle(true);
    }, [vm, pendingPrefixText, isEs, onToggle]);

    var handleCancelSelectionRef = useRef(handleCancelBlockSelection);
    handleCancelSelectionRef.current = handleCancelBlockSelection;
    var handleConfirmSelectionRef = useRef(handleConfirmBlockSelection);
    handleConfirmSelectionRef.current = handleConfirmBlockSelection;

    // === Workspace block selection interaction effect ===
    useEffect(function () {
        if (!isSelectingBlocks) return;

        var prevCursor = document.body.style.cursor;
        document.body.style.cursor = 'crosshair';

        var dragStartBlock = null;
        var dragStartX = 0;
        var dragStartY = 0;
        var hasDragged = false;

        function getBlockFromSvgElement(el) {
            if (!el || typeof window === 'undefined' || !window.Blockly || !window.Blockly.getMainWorkspace) {
                return null;
            }
            var ws = window.Blockly.getMainWorkspace();
            if (!ws) return null;

            var draggable = el.closest ? el.closest('.blocklyDraggable') : null;
            if (!draggable) {
                var blockGroup = el.closest ? el.closest('g[data-id], .blocklyBlockCanvas g') : null;
                if (blockGroup) draggable = blockGroup.closest('.blocklyDraggable') || blockGroup;
            }
            if (!draggable) return null;

            var dataId = draggable.getAttribute('data-id');
            if (dataId) {
                var bById = ws.getBlockById(dataId);
                if (bById) return bById;
            }

            var allBlocks = ws.getAllBlocks();
            for (var i = 0; i < allBlocks.length; i++) {
                var b = allBlocks[i];
                if (b && b.getSvgRoot && b.getSvgRoot() === draggable) {
                    return b;
                }
            }

            var curr = draggable;
            while (curr && curr !== ws.getCanvas()) {
                for (var j = 0; j < allBlocks.length; j++) {
                    var candidate = allBlocks[j];
                    if (candidate && candidate.getSvgRoot && candidate.getSvgRoot() === curr) {
                        return candidate;
                    }
                }
                curr = curr.parentNode;
            }

            return null;
        }

        function handlePointerDownCapture(e) {
            if (e.target && e.target.closest && e.target.closest('.' + styles.dockBarContainer)) {
                return;
            }

            var block = getBlockFromSvgElement(e.target);
            if (block) {
                if (block.isShadow && block.isShadow() && block.getParent && block.getParent()) {
                    block = block.getParent();
                }
                dragStartBlock = block;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                hasDragged = false;

                e.stopPropagation();
                e.preventDefault();
            }
        }

        function handlePointerMoveCapture(e) {
            if (!dragStartBlock) return;
            var dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
            if (dist > 8) {
                hasDragged = true;
            }
        }

        function handlePointerUpCapture(e) {
            if (e.target && e.target.closest && e.target.closest('.' + styles.dockBarContainer)) {
                return;
            }

            if (!dragStartBlock) return;

            e.stopPropagation();
            e.preventDefault();

            var endBlock = getBlockFromSvgElement(e.target);
            if (endBlock && endBlock.isShadow && endBlock.isShadow() && endBlock.getParent && endBlock.getParent()) {
                endBlock = endBlock.getParent();
            }

            var ws = (window.Blockly && window.Blockly.getMainWorkspace) ? window.Blockly.getMainWorkspace() : null;

            if (hasDragged && endBlock && endBlock.id !== dragStartBlock.id) {
                // Mode 2: Range / Tramo drag
                var path = findPathBetweenBlocks(dragStartBlock, endBlock);
                var tramoIds = path ? path.map(function (b) { return b.id; }) : [dragStartBlock.id, endBlock.id];

                var nextIds;
                if (e.shiftKey) {
                    var existing = selectedBlockIdsRef.current.slice();
                    tramoIds.forEach(function (id) {
                        if (existing.indexOf(id) === -1) existing.push(id);
                    });
                    nextIds = existing;
                } else {
                    nextIds = tramoIds;
                }

                if (ws) {
                    selectedBlockIdsRef.current.forEach(function (id) {
                        if (nextIds.indexOf(id) === -1) {
                            try {
                                ws.glowBlock(id, false);
                            } catch (_e) {}
                        }
                    });
                    nextIds.forEach(function (id) {
                        try {
                            ws.glowBlock(id, true);
                        } catch (_e) {}
                    });
                }
                setSelectedBlockIds(nextIds);
            } else {
                var targetBlock = endBlock || dragStartBlock;
                if (e.shiftKey) {
                    // Mode 3: Shift + click (one by one)
                    var currentList = selectedBlockIdsRef.current.slice();
                    var foundIdx = currentList.indexOf(targetBlock.id);
                    if (foundIdx !== -1) {
                        currentList.splice(foundIdx, 1);
                        if (ws) {
                            try {
                                ws.glowBlock(targetBlock.id, false);
                            } catch (_e) {}
                        }
                    } else {
                        currentList.push(targetBlock.id);
                        if (ws) {
                            try {
                                ws.glowBlock(targetBlock.id, true);
                            } catch (_e) {}
                        }
                    }
                    setSelectedBlockIds(currentList);
                } else {
                    // Mode 1: Single click (block and its direct connections)
                    var connectedIds = [targetBlock.id];

                    if (targetBlock.getNextBlock && targetBlock.getNextBlock()) {
                        connectedIds.push(targetBlock.getNextBlock().id);
                    }
                    if (targetBlock.getParent && targetBlock.getParent()) {
                        connectedIds.push(targetBlock.getParent().id);
                    }
                    if (targetBlock.inputList) {
                        targetBlock.inputList.forEach(function (inp) {
                            if (inp.connection && inp.connection.targetBlock) {
                                var tb = inp.connection.targetBlock();
                                if (tb && tb.id && connectedIds.indexOf(tb.id) === -1) {
                                    connectedIds.push(tb.id);
                                }
                            }
                        });
                    }

                    if (ws) {
                        selectedBlockIdsRef.current.forEach(function (id) {
                            if (connectedIds.indexOf(id) === -1) {
                                try {
                                    ws.glowBlock(id, false);
                                } catch (_e) {}
                            }
                        });
                        connectedIds.forEach(function (id) {
                            try {
                                ws.glowBlock(id, true);
                            } catch (_e) {}
                        });
                    }
                    setSelectedBlockIds(connectedIds);
                }
            }

            dragStartBlock = null;
            hasDragged = false;
        }

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelSelectionRef.current();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedBlockIdsRef.current.length > 0) {
                    handleConfirmSelectionRef.current();
                }
            }
        }

        document.addEventListener('pointerdown', handlePointerDownCapture, true);
        document.addEventListener('pointermove', handlePointerMoveCapture, true);
        document.addEventListener('pointerup', handlePointerUpCapture, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return function () {
            document.body.style.cursor = prevCursor;
            document.removeEventListener('pointerdown', handlePointerDownCapture, true);
            document.removeEventListener('pointermove', handlePointerMoveCapture, true);
            document.removeEventListener('pointerup', handlePointerUpCapture, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isSelectingBlocks]);

    // === Panel drag ===

    function handleHeaderPointerDown(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var rect = panelRef.current.getBoundingClientRect();
        panelDragRef.current = {
            dragging: true,
            ox: e.clientX - rect.left,
            oy: e.clientY - rect.top
        };
        document.addEventListener('pointermove', handlePanelDrag);
        document.addEventListener('pointerup', stopPanelDrag);
    }

    function handlePanelDrag(e) {
        if (!panelDragRef.current.dragging) return;
        var d = panelDragRef.current;
        var bounds = getWorkspaceBounds();
        var targetX = e.clientX - d.ox;
        var targetY = e.clientY - d.oy;

        var minX = bounds.left + 8;
        var maxX = Math.max(minX, bounds.right - panelSize.w - 8);
        var minY = bounds.top + 8;
        var maxY = Math.max(minY, bounds.bottom - panelSize.h - 8);

        setPanelPos({
            x: Math.round(Math.min(maxX, Math.max(minX, targetX))),
            y: Math.round(Math.min(maxY, Math.max(minY, targetY)))
        });
    }

    function stopPanelDrag() {
        panelDragRef.current.dragging = false;
        document.removeEventListener('pointermove', handlePanelDrag);
        document.removeEventListener('pointerup', stopPanelDrag);
    }

    // === Panel resize ===

    function handleResizeStart(dir, e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = {
            active: true,
            dir: dir,
            sx: e.clientX,
            sy: e.clientY,
            sw: panelSize.w,
            sh: panelSize.h,
            spx: panelPos.x,
            spy: panelPos.y
        };
        document.addEventListener('pointermove', handleResizeMove);
        document.addEventListener('pointerup', stopResize);
    }

    function handleResizeMove(e) {
        if (!resizeRef.current.active) return;
        var rd = resizeRef.current;
        var bounds = getWorkspaceBounds();
        var dx = e.clientX - rd.sx;
        var dy = e.clientY - rd.sy;
        var nw = rd.sw;
        var nh = rd.sh;
        var nx = rd.spx;
        var ny = rd.spy;

        if (rd.dir.indexOf('right') >= 0) {
            nw = Math.max(MIN_W, rd.sw + dx);
            if (nx + nw > bounds.right - 8) {
                nw = Math.max(MIN_W, bounds.right - 8 - nx);
            }
        }
        if (rd.dir.indexOf('left') >= 0) {
            var rawNw = rd.sw - dx;
            var proposedNx = rd.spx + (rd.sw - rawNw);
            if (proposedNx < bounds.left + 8) {
                proposedNx = bounds.left + 8;
                rawNw = (rd.spx + rd.sw) - proposedNx;
            }
            nw = Math.max(MIN_W, rawNw);
            nx = proposedNx;
        }
        if (rd.dir.indexOf('bottom') >= 0) {
            nh = Math.max(MIN_H, rd.sh + dy);
            if (ny + nh > bounds.bottom - 8) {
                nh = Math.max(MIN_H, bounds.bottom - 8 - ny);
            }
        }
        if (rd.dir.indexOf('top') >= 0) {
            var rawNh = rd.sh - dy;
            var proposedNy = rd.spy + (rd.sh - rawNh);
            if (proposedNy < bounds.top + 8) {
                proposedNy = bounds.top + 8;
                rawNh = (rd.spy + rd.sh) - proposedNy;
            }
            nh = Math.max(MIN_H, rawNh);
            ny = proposedNy;
        }

        setPanelSize({w: Math.round(nw), h: Math.round(nh)});
        setPanelPos({x: Math.round(nx), y: Math.round(ny)});
    }

    function stopResize() {
        resizeRef.current.active = false;
        document.removeEventListener('pointermove', handleResizeMove);
        document.removeEventListener('pointerup', stopResize);
    }

    function makeResizeHandler(dir) {
        return function (e) { handleResizeStart(dir, e); };
    }

    var bounds = getWorkspaceBounds();
    var paletteOffset = isPaletteCollapsed ? 16 : 324;
    var dockLeft;
    var dockWidth;
    if (blocksPosition === 'right') {
        dockLeft = Math.round(bounds.left);
        dockWidth = Math.round(Math.max(180, bounds.right - bounds.left - paletteOffset));
    } else {
        var effectiveOffset = (bounds.width < 500 && !isPaletteCollapsed) ? 0 : paletteOffset;
        dockLeft = Math.round(bounds.left + effectiveOffset);
        dockWidth = Math.round(Math.max(180, bounds.right - dockLeft));
    }

    var dockTop = Math.round(bounds.top);
    var isCodeView = activeTabId === 'code' || (Boolean(showSplit) && secondaryTabId === 'code');
    var isTraveling = animState === 'pillTravelingUp' || animState === 'pillTravelingDown';
    var showDockBar = isCodeView && (!isDetached || isSelectingBlocks) && !isTraveling;

    var containerStyle = containerPos ? {
        left: containerPos.left + 'px',
        top: containerPos.top + 'px',
        bottom: 'auto',
        right: 'auto'
    } : {};

    var faceClass = styles.face + (isAnalyzing ? ' ' + styles.analyzing : '');
    var faceTitle = isAnalyzing ?
        (isEs ? 'Analizando...' : 'Analyzing...') :
        (isOpen ? (isEs ? 'Cerrar Fist' : 'Close Fist') : (isEs ? 'Abrir Fist' : 'Open Fist'));

    var isUpClose = swipeOrder === 'up-close-down-open';
    var dockHeaderTitle = dockMode === 'accordion' ?
        (isEs ?
            (isUpClose ? 'Deslizar hacia arriba o clic para cerrar' : 'Deslizar hacia abajo o clic para cerrar') :
            (isUpClose ? 'Swipe up or click to close' : 'Swipe down or click to close')) :
        (isEs ?
            (isUpClose ? 'Deslizar hacia abajo o clic para abrir (arrastrar para desacoplar)' : 'Deslizar hacia arriba o clic para abrir (arrastrar para desacoplar)') :
            (isUpClose ? 'Swipe down or click to open (drag to undock)' : 'Swipe up or click to open (drag to undock)'));

    return (
        <>
            {/* Non-code views: floating button face launcher */}
            {!isCodeView && (
                <div
                    ref={containerRef}
                    className={styles.floatingContainer}
                    style={containerStyle}
                >
                    <div
                        className={faceClass}
                        onClick={handleFaceClick}
                        role="button"
                        tabIndex="0"
                        title={faceTitle}
                    >
                        <div
                            className={styles.catFace}
                            dangerouslySetInnerHTML={{__html: FIST_CAT_FACE}}
                        />
                    </div>
                </div>
            )}

            {/* Code view: Accordion Dock Bar */}
            {showDockBar && (
                <div
                    className={
                        styles.dockBarContainer +
                        (aiBarPosition === 'top' ? ' ' + styles.dockTop : '') +
                        (dockMode === 'accordion' ? ' ' + styles.dockExpanded : '') +
                        (isDraggingDock ? ' ' + styles.dockBeingDragged : '') +
                        (animState === 'landing' ? ' ' + styles.dockLanding : '') +
                        (isUpClose ? ' ' + styles.swipeOrderInverted : '') +
                        (isSelectingBlocks ? (' ' + styles.dockSelectingMode) : '')
                    }
                    style={{
                        left: dockLeft + 'px',
                        width: dockWidth + 'px',
                        top: aiBarPosition === 'top' ? (dockTop + 'px') : 'auto',
                        bottom: aiBarPosition === 'top' ? 'auto' : 0,
                        height: (dockMode === 'accordion' && !isSelectingBlocks) ? 'min(52vh, 480px)' : '38px'
                    }}
                >
                    <div
                        className={styles.dockBarHeader + (isSelectingBlocks ? (' ' + styles.dockSelectingBar) : '')}
                        onPointerDown={isSelectingBlocks ? undefined : handleDockPointerDown}
                        onWheel={isSelectingBlocks ? undefined : handleDockWheel}
                        title={isSelectingBlocks ? undefined : dockHeaderTitle}
                    >
                        {isSelectingBlocks ? (
                            <div className={styles.dockSelectingHeader}>
                                <div className={styles.dockSelectingLeft}>
                                    <span className={styles.dockSelectingIcon}>🎯</span>
                                    <span className={styles.dockSelectingTitle}>
                                        {isEs ? 'Seleccione el bloque/s a analizar' : 'Select block(s) to analyze'}
                                    </span>
                                    <span className={styles.dockSelectingCountBadge}>
                                        {selectedBlockIds.length}{' '}
                                        {isEs ?
                                            (selectedBlockIds.length === 1 ? 'bloque' : 'bloques') :
                                            (selectedBlockIds.length === 1 ? 'block' : 'blocks')}
                                    </span>
                                    <span className={styles.dockSelectingHint}>
                                        {isEs ?
                                            '• Clic: bloque y conexiones • Arrastrar: tramo • Shift+Clic: uno a uno' :
                                            '• Click: block & connections • Drag: range • Shift+Click: one by one'}
                                    </span>
                                </div>
                                <div className={styles.dockSelectingActions}>
                                    <button
                                        type="button"
                                        className={styles.dockSelectingCancelBtn}
                                        onClick={handleCancelBlockSelection}
                                        title={isEs ? 'Cancelar selección (Esc)' : 'Cancel selection (Esc)'}
                                    >
                                        ✕ {isEs ? 'Cancelar' : 'Cancel'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.dockSelectingConfirmBtn}
                                        disabled={selectedBlockIds.length === 0}
                                        onClick={handleConfirmBlockSelection}
                                        title={isEs ? 'Analizar bloques seleccionados (Enter)' : 'Analyze selected blocks (Enter)'}
                                    >
                                        ✔ {isEs ? 'Analizar' : 'Analyze'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.dockLeft}>
                                    <div
                                        className={styles.dockCatIcon}
                                        dangerouslySetInnerHTML={{__html: FIST_CAT_ICON}}
                                    />
                                    <span className={styles.dockTitle}>
                                        Fist
                                    </span>
                                </div>
                                <div className={styles.dockCenter}>
                                    <div className={styles.dockCenterHandle + (isHoldingHandle ? ' ' + styles.isHolding : '')}>
                                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleLeft} />
                                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleRight} />
                                    </div>
                                </div>
                                <div className={styles.dockRight} />
                            </>
                        )}
                    </div>

                    {/* Accordion Chat Body */}
                    {dockMode === 'accordion' && !isSelectingBlocks && (
                        <div className={styles.dockBody}>
                            <AiTab
                                vm={vm}
                                pendingExplain={pendingExplain}
                                projectKey={projectKey}
                                onClearExplain={onClearExplain}
                                onMentorGuidance={handleInstructFromChat}
                                reanalyzeTick={reanalyzeTick}
                                onActivateTab={onActivateTab}
                                onStartBlockSelection={handleStartBlockSelection}
                                blockSelectionResult={blockSelectionResult}
                                onClearBlockSelectionResult={handleClearBlockSelectionResult}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Live Drag Preview Pill while dragging up from the dock */}
            {/* Live Drag Preview Pill while dragging up from the dock */}
            {isDraggingDock && (
                <div
                    className={styles.dockDragPill}
                    style={{
                        left: (dockDragPos.x - 120) + 'px',
                        top: (dockDragPos.y - 19) + 'px'
                    }}
                >
                    <div className={styles.dockLeft}>
                        <div
                            className={styles.dockCatIcon}
                            dangerouslySetInnerHTML={{__html: FIST_CAT_ICON}}
                        />
                        <span className={styles.dockTitle}>
                            Fist
                        </span>
                    </div>
                    <div className={styles.dockCenterHandle}>
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleLeft + ' ' + styles.isThick} />
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleRight + ' ' + styles.isThick} />
                    </div>
                    <div className={styles.dockRightSpacer} />
                </div>
            )}

            {/* Dedicated Traveling Pill (when switching dock position between top and bottom) */}
            {(animState === 'pillTravelingUp' || animState === 'pillTravelingDown') && (
                <div
                    className={
                        styles.dockTravelPill +
                        (animState === 'pillTravelingUp' ? ' ' + styles.travelUp : ' ' + styles.travelDown)
                    }
                    style={travelStyles}
                >
                    <div className={styles.dockLeft}>
                        <div
                            className={styles.dockCatIcon}
                            dangerouslySetInnerHTML={{__html: FIST_CAT_ICON}}
                        />
                        <span className={styles.dockTitle}>
                            Fist
                        </span>
                    </div>
                    <div className={styles.dockCenterHandle}>
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleLeft + ' ' + styles.isThick} />
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleRight + ' ' + styles.isThick} />
                    </div>
                    <div className={styles.dockRightSpacer} />
                </div>
            )}

            {/* Dedicated Falling / Flying Bar (when closing with gravity) */}
            {animState === 'falling' && (
                <div
                    className={
                        styles.fallingBar +
                        (aiBarPosition === 'top' ? ' ' + styles.flyUp : '')
                    }
                    style={fallStyles}
                >
                    <div className={styles.dockLeft}>
                        <div
                            className={styles.dockCatIcon}
                            dangerouslySetInnerHTML={{__html: FIST_CAT_ICON}}
                        />
                        <span className={styles.dockTitle}>
                            Fist
                        </span>
                    </div>
                    <div className={styles.dockCenterHandle}>
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleLeft} />
                        <span className={styles.dockHandleSegment + ' ' + styles.dockHandleRight} />
                    </div>
                    <div className={styles.dockRightSpacer} />
                </div>
            )}

            {/* Floating Window (when detached or non-code tab open or contracting) */}
            {(isDetached || !isCodeView || animState === 'contracting') && animState !== 'falling' && !isSelectingBlocks && (
                <div
                    ref={panelRef}
                    className={
                        styles.panel +
                        ((isOpen || isDetached || animState === 'contracting') ? ' ' + styles.panelOpen : '') +
                        (animState === 'contracting' ? ' ' + styles.panelContracting : '') +
                        (animState === 'expandingToPanel' ? ' ' + styles.panelExpandingFromPill : '')
                    }
                    style={{
                        left: (animState === 'contracting' ? Math.round(panelPos.x + (panelSize.w - 240) / 2) : panelPos.x) + 'px',
                        top: panelPos.y + 'px',
                        width: (animState === 'contracting' ? 240 : panelSize.w) + 'px',
                        height: (animState === 'contracting' ? 38 : panelSize.h) + 'px'
                    }}
                >
                    <div
                        className={styles.header}
                        onPointerDown={handleHeaderPointerDown}
                    >
                        <span className={styles.headerTitle}>
                            <div
                                className={styles.headerCat}
                                dangerouslySetInnerHTML={{__html: FIST_CAT_ICON}}
                            />
                            Fist
                        </span>
                        <div className={styles.headerCenterHandle}>
                            <span className={styles.dockHandleSegment + ' ' + styles.dockHandleLeft} />
                            <span className={styles.dockHandleSegment + ' ' + styles.dockHandleRight} />
                        </div>
                        <button
                            className={styles.headerCloseBtn}
                            onClick={handleClosePanel}
                            type="button"
                            title={isCodeView ? (isEs ? 'Acoplar a barra de Fist' : 'Dock to Fist bar') : (isEs ? 'Cerrar' : 'Close')}
                        >
                            &times;
                        </button>
                    </div>
                    <div className={styles.chatBody}>
                        {showGuidance && (
                            <div className={guidanceClass}>
                                <div className={styles.message}>{guidanceMsg}</div>
                                <div className={styles.btnRow}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={handleCancelAnalysis}
                                        type="button"
                                        title="Return to AI Chat"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={styles.reanalyzeBtn}
                                        onClick={handleReanalyze}
                                        type="button"
                                        title="Re-analyze current blocks"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M1 4v6h6M23 20v-6h-6" />
                                            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                                        </svg>
                                        Re-analyze
                                    </button>
                                </div>
                            </div>
                        )}
                        <AiTab
                            vm={vm}
                            pendingExplain={pendingExplain}
                            projectKey={projectKey}
                            onClearExplain={onClearExplain}
                            onMentorGuidance={handleInstructFromChat}
                            reanalyzeTick={reanalyzeTick}
                            onActivateTab={onActivateTab}
                            onStartBlockSelection={handleStartBlockSelection}
                            blockSelectionResult={blockSelectionResult}
                            onClearBlockSelectionResult={handleClearBlockSelectionResult}
                        />
                    </div>
                    {animState !== 'contracting' && HANDLE_NAMES.map(function (name) {
                        return (
                            <div
                                key={name}
                                className={styles.resizeHandle + ' ' + styles['handle' + name.charAt(0).toUpperCase() + name.slice(1)]}
                                onPointerDown={makeResizeHandler(name)}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
};

FloatingAiChat.propTypes = {
    activeTabId: PropTypes.string,
    isOpen: PropTypes.bool,
    onToggle: PropTypes.func,
    vm: PropTypes.object,
    pendingExplain: PropTypes.string,
    projectKey: PropTypes.number,
    onClearExplain: PropTypes.func,
    onActivateTab: PropTypes.func,
    isPaletteCollapsed: PropTypes.bool,
    onTogglePalette: PropTypes.func,
    blocksPosition: PropTypes.string,
    aiBarPosition: PropTypes.string,
    stagePosition: PropTypes.string,
    showSplit: PropTypes.bool,
    secondaryTabId: PropTypes.string,
    splitRatio: PropTypes.number,
    isStageCollapsed: PropTypes.bool
};

export default FloatingAiChat;
