import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './tab-bar.css';
import {ALL_TABS} from '../../reducers/editor-tab';

var PROGRAMMING_TABS = ['code', 'costumes', 'sounds', 'ai', 'simulacion'];
var ELECTRONICS_TABS = ['control', 'circuitos', '3d'];

const GHOST_OFFSET_X = 16;
const GHOST_OFFSET_Y = -12;
const DRAG_THRESHOLD = 5;

const tabNameMessages = defineMessages({
    code: {
        id: 'gui.tabBar.code',
        defaultMessage: 'Code',
        description: 'Tab label for code editor'
    },
    costumes: {
        id: 'gui.tabBar.costumes',
        defaultMessage: 'Costumes',
        description: 'Tab label for costumes'
    },
    sounds: {
        id: 'gui.tabBar.sounds',
        defaultMessage: 'Sounds',
        description: 'Tab label for sounds'
    },
    ai: {
        id: 'gui.tabBar.ai',
        defaultMessage: 'AI',
        description: 'Tab label for AI tab'
    },
    simulacion: {
        id: 'gui.tabBar.simulacion',
        defaultMessage: 'Simulation',
        description: 'Tab label for simulation tab'
    },
    control: {
        id: 'gui.tabBar.control',
        defaultMessage: 'Control',
        description: 'Tab label for control tab'
    },
    circuitos: {
        id: 'gui.tabBar.circuitos',
        defaultMessage: 'Circuits',
        description: 'Tab label for circuits tab'
    },
    '3d': {
        id: 'gui.tabBar.3d',
        defaultMessage: '3D',
        description: 'Tab label for 3D tab'
    },
    addTab: {
        id: 'gui.tabBar.addTab',
        defaultMessage: 'Add tab',
        description: 'Title for add tab button'
    },
    programmingHeader: {
        id: 'gui.addMenu.programming',
        defaultMessage: 'Programming',
        description: 'Section header for programming tabs in the add tab menu'
    },
    electronicsHeader: {
        id: 'gui.addMenu.electronics',
        defaultMessage: 'Electronics',
        description: 'Section header for electronics tabs in the add tab menu'
    }
});

const TabBar = ({
    intl,
    tabs,
    openTabs,
    activeTabId,
    secondaryTabId,
    splitMode,
    onTabClick,
    onTabReorder,
    onOpenTab,
    onCloseTab,
    onActivateTab,
    onSetSecondaryTab,
    onDragToSplitPanel,
    rtl
}) => {
    const cachedPair = useRef(null);
    const [, rerender] = useState(0);
    const tabListRef = useRef(null);
    const dragRef = useRef(null);
    const wasDraggedRef = useRef(false);
    const [addMenuState, setAddMenuState] = useState('closed'); // 'closed' | 'open' | 'closing'
    const addBtnRef = useRef(null);

    const openAddMenu = useCallback(function () {
        setAddMenuState('open');
    }, []);

    const closeAddMenu = useCallback(function () {
        setAddMenuState('closing');
        setTimeout(function () { setAddMenuState('closed'); }, 200);
    }, []);

    const toggleAddMenu = useCallback(function () {
        if (addMenuState === 'open') {
            closeAddMenu();
        } else if (addMenuState === 'closed') {
            openAddMenu();
        }
    }, [addMenuState, openAddMenu, closeAddMenu]);

    const [insertIdx, setInsertIdx] = useState(null);
    const [dragGhost, setDragGhost] = useState(null);

    const availableTabs = ALL_TABS.filter(function (t) {
        return openTabs.indexOf(t) === -1;
    });

    useEffect(function () {
        if (addMenuState !== 'open') return;
        var handler = function (e) {
            if (addBtnRef.current && !addBtnRef.current.contains(e.target)) {
                closeAddMenu();
            }
        };
        document.addEventListener('pointerdown', handler);
        return function () { document.removeEventListener('pointerdown', handler); };
    }, [addMenuState, closeAddMenu]);

    const handleClose = useCallback(function (e, tabId) {
        e.stopPropagation();
        onCloseTab(tabId);
    }, [onCloseTab]);

    const handlePointerDown = useCallback((e, tabId) => {
        if (e.button !== 0) return;
        e.preventDefault();
        wasDraggedRef.current = false;
        var rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            tabId: tabId,
            ghostX: rect.left,
            ghostY: rect.top,
            ghostW: rect.width,
            ghostH: rect.height,
            isDragging: false
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        var d = dragRef.current;
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
                tabId: d.tabId
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
        if (posEl && insertIdx != null && onTabReorder) {
            var tid = d.tabId;
            var newOrder = openTabs.filter(function (t) { return t !== tid; });
            newOrder.splice(insertIdx, 0, tid);
            onTabReorder(newOrder);
            return;
        }
        var bodyEl = target ? target.closest('[data-tabs-body]') : null;
        if (bodyEl && onSetSecondaryTab) {
            if (d.tabId !== activeTabId) {
                onSetSecondaryTab(d.tabId);
            }
        }
    }, [insertIdx, openTabs, onTabReorder, onActivateTab, onSetSecondaryTab, activeTabId, onDragToSplitPanel]);

    useEffect(function () {
        return function () {
            dragRef.current = null;
        };
    }, []);

    // FLIP animation
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

    var renderAddMenuColumn = function (tabIds, availableTabs, headerMsgId) {
        var visibleTabs = tabIds.filter(function (t) { return availableTabs.indexOf(t) !== -1; });
        if (visibleTabs.length === 0) return null;
        return (
            <div className={styles.addMenuColumn}>
                <div className={styles.addMenuHeader}>
                    {intl.formatMessage(tabNameMessages[headerMsgId])}
                </div>
                {visibleTabs.map(function (tabId) {
                    var tabData = tabs[tabId];
                    return (
                        <div
                            key={tabId}
                            className={styles.addMenuTab}
                            onClick={function () {
                                onOpenTab(tabId);
                                closeAddMenu();
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={function (e) {
                                if (e.key === 'Enter') {
                                    onOpenTab(tabId);
                                    closeAddMenu();
                                }
                            }}
                        >
                            {tabData && tabData.icon && (
                                <img className={styles.addMenuTabIcon} src={tabData.icon} alt="" />
                            )}
                            <span>{tabData ? tabData.label : intl.formatMessage(tabNameMessages[tabId]) || tabId}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    var renderTab = function (tabId, visPos, tabData, isSelected) {
        var canClose = tabData && tabData.canClose;
        return (
            <React.Fragment key={tabId}>
                {insertIdx === visPos && <div className={styles.insertIndicator} />}
                <div
                    data-tab-pos={visPos}
                    className={classNames(
                        styles.tab,
                        styles.tabEnter,
                        {[styles.selected]: isSelected}
                    )}
                    onPointerDown={(e) => handlePointerDown(e, tabId)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={function (e) {
                        if (wasDraggedRef.current) {
                            wasDraggedRef.current = false;
                            return;
                        }
                        onTabClick(tabId);
                    }}
                    role="tab"
                    tabIndex={0}
                    onKeyDown={function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTabClick(tabId);
                        }
                    }}
                >
                    {tabData && tabData.icon && (
                        <img className={styles.tabIcon} src={tabData.icon} alt="" />
                    )}
                    <span>{tabData ? tabData.label : intl.formatMessage(tabNameMessages[tabId]) || tabId}</span>
                    {canClose && (
                        <span
                            className={styles.closeBtn}
                            onPointerDown={function (e) { e.stopPropagation(); }}
                            onClick={function (e) { return handleClose(e, tabId); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={function (e) {
                                if (e.key === 'Enter') handleClose(e, tabId);
                            }}
                        >
                            &times;
                        </span>
                    )}
                </div>
            </React.Fragment>
        );
    };

    var tabListContent = openTabs.map(function (tabId, visPos) {
        var tabData = tabs[tabId];
        var isSelected = tabId === activeTabId;
        return renderTab(tabId, visPos, tabData, isSelected);
    });

    return (
        <React.Fragment>
            <div
                ref={tabListRef}
                className={classNames(styles.tabList, {[styles.rtl]: rtl})}
            >
                {tabListContent}
                {insertIdx === openTabs.length && <div className={styles.insertIndicator} />}
                {availableTabs.length > 0 && (
                    <div className={styles.addTabWrapper} ref={addBtnRef}>
                        <button
                            className={classNames(styles.tab, styles.addTabBtn, {
                                [styles.addTabOpen]: addMenuState === 'open'
                            })}
                            onClick={toggleAddMenu}
                            title={intl.formatMessage(tabNameMessages.addTab)}
                        >
                            <span>+</span>
                        </button>
                        {addMenuState !== 'closed' && (
                            <div className={classNames(styles.addMenu, {
                                [styles.addMenuClosing]: addMenuState === 'closing'
                            })}>
                                {renderAddMenuColumn(PROGRAMMING_TABS, availableTabs, 'programmingHeader')}
                                {PROGRAMMING_TABS.some(function (t) { return availableTabs.indexOf(t) !== -1; }) &&
                                    ELECTRONICS_TABS.some(function (t) { return availableTabs.indexOf(t) !== -1; }) && (
                                    <div className={styles.addMenuDivider} />
                                )}
                                {renderAddMenuColumn(ELECTRONICS_TABS, availableTabs, 'electronicsHeader')}
                            </div>
                        )}
                    </div>
                )}
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
                    {tabs[dragGhost.tabId] && tabs[dragGhost.tabId].icon && (
                        <img className={styles.tabIcon} src={tabs[dragGhost.tabId].icon} alt="" />
                    )}
                    <span>{tabs[dragGhost.tabId] ? tabs[dragGhost.tabId].label : ''}</span>
                </div>
            )}
        </React.Fragment>
    );
};

TabBar.propTypes = {
    intl: intlShape,
    tabs: PropTypes.objectOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.node,
        icon: PropTypes.string,
        canClose: PropTypes.bool
    })),
    openTabs: PropTypes.arrayOf(PropTypes.string),
    activeTabId: PropTypes.string,
    secondaryTabId: PropTypes.string,
    splitMode: PropTypes.bool,
    onTabClick: PropTypes.func,
    onTabReorder: PropTypes.func,
    onOpenTab: PropTypes.func,
    onCloseTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onSetSecondaryTab: PropTypes.func,
    onDragToSplitPanel: PropTypes.func,
    rtl: PropTypes.bool
};

TabBar.defaultProps = {
    openTabs: ['code']
};

export default React.memo(injectIntl(TabBar));
