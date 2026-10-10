import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
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

var FloatingAiChat = function (props) {
    var {
        isOpen,
        onToggle,
        vm,
        pendingExplain,
        projectKey,
        onClearExplain,
        onActivateTab
    } = props;

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

    function getWorkspaceBounds() {
        var el = document.querySelector('[data-tabs-body]') ||
                 document.querySelector('.' + styles.tabsBody) ||
                 document.querySelector('.blocklySvg');
        if (el) {
            return el.getBoundingClientRect();
        }
        var stagePanel = document.querySelector('[class*="stage-and-target-wrapper"]');
        var maxRight = stagePanel ? stagePanel.getBoundingClientRect().left : window.innerWidth - 360;
        return {
            left: 0,
            top: 48,
            right: maxRight,
            bottom: window.innerHeight,
            width: maxRight,
            height: window.innerHeight - 48
        };
    }

    useLayoutEffect(function () {
        function positionAboveZoom() {
            var bounds = getWorkspaceBounds();
            var zoomEl = document.querySelector('.blocklyZoom');
            if (zoomEl) {
                var rect = zoomEl.getBoundingClientRect();
                var btnLeft = Math.min(bounds.right - 56, Math.max(bounds.left + 8, rect.right - 48));
                var btnTop = Math.min(bounds.bottom - 56, Math.max(bounds.top + 8, rect.top - 8 - 48));
                setContainerPos({
                    left: Math.round(btnLeft),
                    top: Math.round(btnTop)
                });
            } else {
                setContainerPos({
                    left: Math.round(Math.max(bounds.left + 8, bounds.right - 48 - 20)),
                    top: Math.round(Math.max(bounds.top + 8, bounds.bottom - 48 - 20))
                });
            }

            // Also keep panel inside workspace bounds if needed
            setPanelPos(function (prev) {
                var maxPx = Math.max(bounds.left + 8, bounds.right - panelSize.w - 12);
                var maxPy = Math.max(bounds.top + 8, bounds.bottom - panelSize.h - 12);
                return {
                    x: Math.round(Math.max(bounds.left + 8, Math.min(maxPx, prev.x))),
                    y: Math.round(Math.max(bounds.top + 8, Math.min(maxPy, prev.y)))
                };
            });
        }
        positionAboveZoom();
        window.addEventListener('resize', positionAboveZoom);
        return function () { window.removeEventListener('resize', positionAboveZoom); };
    }, [panelSize.w, panelSize.h]);

    useEffect(function () {
        if (pendingExplain && !isOpen) {
            onToggle(true);
        }
    }, [pendingExplain]);

    // Position panel nicely in workspace when first opened
    useEffect(function () {
        if (isOpen) {
            var bounds = getWorkspaceBounds();
            setPanelPos(function (prev) {
                // If it was defaulted outside or overflowing into stage area, position nicely
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
    }, [isOpen]);

    var isAnalyzing = guidanceMsg === '';
    var hasGuidance = guidanceMsg && guidanceMsg.length > 0;
    var showGuidance = hasGuidance || guidanceClosing;
    var guidanceClass = styles.guidanceBanner + ' ' + (
        guidanceClosing ? styles.guidanceExit : styles.guidanceEnter
    );

    // === Container drag (via face) ===

    function startContainerDrag(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var rect = containerRef.current.getBoundingClientRect();
        dragRef.current = {
            dragging: true,
            wasDragged: false,
            ox: e.clientX - rect.left,
            oy: e.clientY - rect.top
        };
        document.addEventListener('pointermove', onContainerDrag);
        document.addEventListener('pointerup', stopContainerDrag);
    }

    function onContainerDrag(e) {
        if (!dragRef.current.dragging) return;
        dragRef.current.wasDragged = true;
        var d = dragRef.current;
        var bounds = getWorkspaceBounds();
        var targetLeft = e.clientX - d.ox;
        var targetTop = e.clientY - d.oy;

        var minLeft = bounds.left + 8;
        var maxLeft = bounds.right - 56;
        var minTop = bounds.top + 8;
        var maxTop = bounds.bottom - 56;

        setContainerPos({
            left: Math.round(Math.min(maxLeft, Math.max(minLeft, targetLeft))),
            top: Math.round(Math.min(maxTop, Math.max(minTop, targetTop)))
        });
    }

    function stopContainerDrag() {
        dragRef.current.dragging = false;
        document.removeEventListener('pointermove', onContainerDrag);
        document.removeEventListener('pointerup', stopContainerDrag);
    }

    // === Face click ===

    function handleFaceClick() {
        if (dragRef.current.wasDragged) return;
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

    // === AiTab callback: analyzing / guidance ===

    function handleInstructFromChat(msg) {
        if (msg === '') {
            setGuidanceClosing(false);
            setGuidanceMsg('');
        } else if (msg) {
            setGuidanceClosing(false);
            setGuidanceMsg(msg);
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

    var containerStyle = containerPos ? {
        left: containerPos.left + 'px',
        top: containerPos.top + 'px',
        bottom: 'auto',
        right: 'auto'
    } : {};

    var faceClass = styles.face + (isAnalyzing ? ' ' + styles.analyzing : '');

    var faceTitle = isAnalyzing ? 'Analyzing...' :
        (isOpen ? 'Close AI Chat' : 'Open AI Chat');

    return (
        <>
            <div
                ref={containerRef}
                className={styles.floatingContainer}
                style={containerStyle}
            >
                <div
                    className={faceClass}
                    onPointerDown={startContainerDrag}
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
            <div
                ref={panelRef}
                className={styles.panel + (isOpen ? ' ' + styles.panelOpen : '')}
                style={{
                    left: panelPos.x + 'px',
                    top: panelPos.y + 'px',
                    width: panelSize.w + 'px',
                    height: panelSize.h + 'px'
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
                        AI Chat
                    </span>
                    <button
                        className={styles.headerCloseBtn}
                        onClick={function () { onToggle(false); }}
                        type="button"
                        title="Close"
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
                                        <path d="M1 4v6h6M23 20v-6h-6"/>
                                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
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
                    />
                </div>
                {HANDLE_NAMES.map(function (name) {
                    return (
                        <div
                            key={name}
                            className={styles.resizeHandle + ' ' + styles['handle' + name.charAt(0).toUpperCase() + name.slice(1)]}
                            onPointerDown={makeResizeHandler(name)}
                        />
                    );
                })}
            </div>
        </>
    );
};

FloatingAiChat.propTypes = {
    isOpen: PropTypes.bool,
    onToggle: PropTypes.func,
    vm: PropTypes.object,
    pendingExplain: PropTypes.string,
    projectKey: PropTypes.number,
    onClearExplain: PropTypes.func,
    onActivateTab: PropTypes.func
};

export default FloatingAiChat;
