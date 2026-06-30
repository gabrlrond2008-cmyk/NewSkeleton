import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import styles from './tab-bar.css';

const GHOST_OFFSET_X = 16;
const GHOST_OFFSET_Y = -12;
const DRAG_THRESHOLD = 5;

const TabBar = ({
    tabs,
    tabOrder,
    activeTabIndex,
    secondaryTabIndex,
    splitPrimaryIndex,
    splitMode,
    onTabClick,
    onTabReorder,
    onSetSecondaryTab,
    onActivateTab,
    onDragToSplitPanel,
    rtl
}) => {
    const cachedPair = useRef(null);
    const [, rerender] = useState(0);
    const tabListRef = useRef(null);
    const dragRef = useRef(null);
    const wasDraggedRef = useRef(false);

    const [insertIdx, setInsertIdx] = useState(null);
    const [dragGhost, setDragGhost] = useState(null);

    if (splitPrimaryIndex != null && secondaryTabIndex != null) {
        cachedPair.current = [splitPrimaryIndex, secondaryTabIndex];
    }

    useEffect(() => {
        if (!splitMode && cachedPair.current) {
            const timer = setTimeout(() => {
                cachedPair.current = null;
                rerender(n => n + 1);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [splitMode]);

    const handlePointerDown = useCallback((e, panelIdx) => {
        if (e.button !== 0) return;
        e.preventDefault();
        wasDraggedRef.current = false;
        const tab = tabs[panelIdx];
        if (!tab) return;
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            panelIdx,
            ghostX: rect.left,
            ghostY: rect.top,
            ghostW: rect.width,
            ghostH: rect.height,
            isDragging: false
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [tabs]);

    const handlePointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const d = dragRef.current;
        if (!d.isDragging) {
            if (Math.abs(e.movementX) + Math.abs(e.movementY) < DRAG_THRESHOLD) return;
            d.isDragging = true;
            wasDraggedRef.current = true;
        }
        d.ghostX = e.clientX + GHOST_OFFSET_X;
        d.ghostY = e.clientY + GHOST_OFFSET_Y;

        var target = document.elementFromPoint(e.clientX, e.clientY);
        var posEl = target ? target.closest('[data-tab-pos]') : null;
        if (posEl) {
            var pos = parseInt(posEl.getAttribute('data-tab-pos'), 10);
            var rect = posEl.getBoundingClientRect();
            var mid = rect.left + rect.width / 2;
            var newIdx = e.clientX < mid ? pos : pos + 1;
            if (newIdx !== insertIdx) {
                setInsertIdx(newIdx);
            }
            if (onDragToSplitPanel) onDragToSplitPanel(false);
        } else {
            if (insertIdx != null) setInsertIdx(null);
            var bodyEl = target ? target.closest('[data-tabs-body]') : null;
            if (bodyEl && onDragToSplitPanel) {
                var bodyRect = bodyEl.getBoundingClientRect();
                var half = e.clientX < bodyRect.left + bodyRect.width / 2 ? 'left' : 'right';
                onDragToSplitPanel(true, half);
            } else if (onDragToSplitPanel) {
                onDragToSplitPanel(false);
            }
        }
        if (d.isDragging) {
            setDragGhost({
                x: d.ghostX,
                y: d.ghostY,
                w: d.ghostW,
                h: d.ghostH,
                panelIdx: d.panelIdx
            });
        }
    }, [insertIdx, onDragToSplitPanel]);

    const handlePointerUp = useCallback((e) => {
        if (!dragRef.current) return;
        var d = dragRef.current;
        var wasDragging = d.isDragging;
        dragRef.current = null;
        setDragGhost(null);
        setInsertIdx(null);
        if (onDragToSplitPanel) onDragToSplitPanel(false);
        if (!wasDragging) return;
        e.preventDefault();

        var target = document.elementFromPoint(e.clientX, e.clientY);
        var posEl = target ? target.closest('[data-tab-pos]') : null;
        if (posEl && insertIdx != null) {
            if (onTabReorder) {
                var order = tabOrder.filter(function (i) { return i !== d.panelIdx; });
                order.splice(insertIdx, 0, d.panelIdx);
                onTabReorder(order);
            }
            return;
        }
        var bodyEl = target ? target.closest('[data-tabs-body]') : null;
        if (bodyEl && onSetSecondaryTab) {
            if (d.panelIdx !== activeTabIndex) {
                var bodyRect = bodyEl.getBoundingClientRect();
                var bodyMid = bodyRect.left + bodyRect.width / 2;
                if (e.clientX < bodyMid && onActivateTab) {
                    // Left half: dropped tab becomes PRIMARY, active becomes SECONDARY
                    var origActive = activeTabIndex;
                    onActivateTab(d.panelIdx);
                    onSetSecondaryTab(origActive);
                } else {
                    // Right half: active stays PRIMARY, dropped becomes SECONDARY
                    onSetSecondaryTab(d.panelIdx);
                }
            }
        }
    }, [insertIdx, tabOrder, onTabReorder, onSetSecondaryTab, onActivateTab, activeTabIndex, onDragToSplitPanel]);

    useEffect(function () {
        return function () {
            dragRef.current = null;
        };
    }, []);

    // FLIP animation: when tabs reorder, old tabs slide smoothly to new positions
    var prevRectsRef = useRef(null);
    var mountedRef = useRef(false);
    useLayoutEffect(function () {
        var container = tabListRef.current;
        if (!container) return;

        if (!mountedRef.current) {
            mountedRef.current = true;
            prevRectsRef.current = captureTabRects(container);
            return;
        }

        // Skip during active drag (insert indicator re-renders would jitter)
        if (dragRef.current) {
            prevRectsRef.current = captureTabRects(container);
            return;
        }

        var old = prevRectsRef.current;
        var current = captureTabRects(container);

        var hasMotion = false;
        Object.keys(current).forEach(function (key) {
            var prev = old[key];
            var curr = current[key];
            if (prev && curr) {
                var dx = prev.left - curr.left;
                if (Math.abs(dx) > 2) {
                    var el = container.querySelector('[data-tab-pos="' + key + '"]');
                    if (el) {
                        el.style.transform = 'translateX(' + dx + 'px)';
                        hasMotion = true;
                    }
                }
            }
        });

        if (hasMotion) {
            requestAnimationFrame(function () {
                var items = container.querySelectorAll('[data-tab-pos]');
                for (var j = 0; j < items.length; j++) {
                    items[j].style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                    items[j].style.transform = '';
                }
                setTimeout(function () {
                    for (var k = 0; k < items.length; k++) {
                        items[k].style.transition = '';
                    }
                }, 300);
            });
        }

        prevRectsRef.current = current;
    });

    function captureTabRects(container) {
        var rects = {};
        var items = container.querySelectorAll('[data-tab-pos]');
        for (var i = 0; i < items.length; i++) {
            rects[items[i].getAttribute('data-tab-pos')] = items[i].getBoundingClientRect();
        }
        return rects;
    }

    var orderedPanels = tabOrder.map(function (panelIdx, visPos) {
        return {
            panelIdx: panelIdx,
            visPos: visPos,
            tab: tabs[panelIdx],
            isSelected: panelIdx === activeTabIndex
        };
    });

    var isExiting = !splitMode && cachedPair.current != null;
    var useFused = splitMode || isExiting;

    var pA, pB;
    if (useFused && cachedPair.current) {
        pA = cachedPair.current[0];
        pB = cachedPair.current[1];
    } else {
        pA = splitPrimaryIndex;
        pB = secondaryTabIndex;
    }

    var renderTab = function (panelIdx, visPos, tab, isSelected, extraClass) {
        return (
            <React.Fragment key={tab.id}>
                {insertIdx === visPos && <div className={styles.insertIndicator} />}
                <div
                    data-tab-pos={visPos}
                    className={classNames(styles.tab, extraClass, {
                        [styles.selected]: isSelected
                    })}
                    onPointerDown={(e) => handlePointerDown(e, panelIdx)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={function (e) {
                        if (wasDraggedRef.current) {
                            wasDraggedRef.current = false;
                            return;
                        }
                        onTabClick(panelIdx);
                    }}
                    role="tab"
                    tabIndex={0}
                    onKeyDown={function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTabClick(panelIdx);
                        }
                    }}
                >
                    {tab.icon && (
                        <img className={styles.tabIcon} src={tab.icon} alt="" />
                    )}
                    <span>{tab.label}</span>
                </div>
            </React.Fragment>
        );
    };

    var tabListContent;
    if (!useFused || pA == null || pB == null) {
        tabListContent = (
            <React.Fragment>
                {orderedPanels.map(function (_a) {
                    return renderTab(_a.panelIdx, _a.visPos, _a.tab, _a.isSelected);
                })}
                {insertIdx === orderedPanels.length && <div className={styles.insertIndicator} />}
            </React.Fragment>
        );
    } else {
        var splitIndices = [pA, pB].sort(function (a, b) { return a - b; });
        var otherIndices = tabOrder.filter(function (i) { return !splitIndices.includes(i); });
        var isActiveInSplit = activeTabIndex === pA || activeTabIndex === pB;
        tabListContent = (
            <React.Fragment>
                <div
                    className={classNames(styles.fusedTab, {
                        [styles.fusedExit]: isExiting,
                        [styles.fusedDimmed]: !isActiveInSplit
                    })}
                    onClick={function () {
                        if (wasDraggedRef.current) {
                            wasDraggedRef.current = false;
                            return;
                        }
                        onTabClick(-1);
                    }}
                    role="tab"
                    tabIndex={0}
                    onKeyDown={function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTabClick(-1);
                        }
                    }}
                >
                    <span className={styles.fusedPart}>
                        <img className={styles.fusedIcon} src={tabs[splitIndices[0]].icon} alt="" />
                    </span>
                    <span className={styles.fusedDivider} />
                    <span className={styles.fusedPart}>
                        <img className={styles.fusedIcon} src={tabs[splitIndices[1]].icon} alt="" />
                    </span>
                </div>
                {otherIndices.map(function (panelIdx) {
                    var tab = tabs[panelIdx];
                    var orderedPos = tabOrder.indexOf(panelIdx);
                    var isOtherSelected = !isActiveInSplit && panelIdx === activeTabIndex;
                    return renderTab(panelIdx, orderedPos, tab, isOtherSelected, isOtherSelected ? null : styles.dimmed);
                })}
                {insertIdx === tabOrder.length && <div className={styles.insertIndicator} />}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <div
                ref={tabListRef}
                className={classNames(styles.tabList, {[styles.rtl]: rtl})}
            >
                {tabListContent}
            </div>
            {dragGhost && (
                <div
                    className={styles.dragGhost}
                    style={{
                        left: dragGhost.x,
                        top: dragGhost.y,
                        width: dragGhost.w,
                        height: dragGhost.h
                    }}
                >
                    {tabs[dragGhost.panelIdx] && tabs[dragGhost.panelIdx].icon && (
                        <img className={styles.tabIcon} src={tabs[dragGhost.panelIdx].icon} alt="" />
                    )}
                    <span>{tabs[dragGhost.panelIdx] ? tabs[dragGhost.panelIdx].label : ''}</span>
                </div>
            )}
        </React.Fragment>
    );
};

TabBar.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        icon: PropTypes.string
    })).isRequired,
    tabOrder: PropTypes.arrayOf(PropTypes.number),
    activeTabIndex: PropTypes.number.isRequired,
    secondaryTabIndex: PropTypes.number,
    splitPrimaryIndex: PropTypes.number,
    splitMode: PropTypes.bool,
    onTabClick: PropTypes.func.isRequired,
    onTabReorder: PropTypes.func,
    onSetSecondaryTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onDragToSplitPanel: PropTypes.func,
    rtl: PropTypes.bool
};

TabBar.defaultProps = {
    tabOrder: [0, 1, 2, 3]
};

export default React.memo(TabBar);
