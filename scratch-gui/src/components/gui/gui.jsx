import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import VM from 'scratch-vm';
import Renderer from 'scratch-render';

import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import FloatingAiChat from '../floating-ai-chat/floating-ai-chat.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import CircuitosTab from '../../containers/circuitos-tab.jsx';
import Tab3D from '../../containers/tab-3d.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import WebGlModal from '../../containers/webgl-modal.jsx';
import TipsLibrary from '../../containers/tips-library.jsx';
import Cards from '../../containers/cards.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';

import layout, {STAGE_SIZE_MODES, STAGE_DISPLAY_SIZES} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {themeMap} from '../../lib/themes';

import styles from './gui.css';
import addExtensionIcon from './icon--extensions.svg';
import codeIcon from './icon--code.svg';
import costumesIcon from './icon--costumes.svg';
import soundsIcon from './icon--sounds.svg';
import controlIcon from './icon--control.svg';
import circuitosIcon from './icon--circuitos.svg';
import icon3d from './icon--3d.svg';
import DebugModal from '../debug-modal/debug-modal.jsx';
import DeviceSelector from '../device-selector/device-selector.jsx';
import getDevices from '../../lib/libraries/devices/devices.jsx';
import controlVm from '../../lib/control-vm';
import TabBar from '../tab-bar/tab-bar.jsx';
import SplitContainer from '../split-container/split-container.jsx';
import OldtimeyMode from '../oldtimey-mode/oldtimey-mode.jsx';
import NinetiesMode from '../nineties-mode/nineties-mode.jsx';
import PrehistoricMode from '../prehistoric-mode/prehistoric-mode.jsx';
const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    },
    controlTab: {
        id: 'gui.gui.controlTab',
        defaultMessage: 'Control',
        description: 'Tab label for control tab'
    },
    circuitosTab: {
        id: 'gui.gui.circuitosTab',
        defaultMessage: 'Circuits',
        description: 'Tab label for circuits tab'
    },
    tab3d: {
        id: 'gui.gui.tab3d',
        defaultMessage: '3D',
        description: 'Tab label for 3D tab'
    },
    dropToSplit: {
        id: 'gui.gui.dropToSplit',
        defaultMessage: 'Drop here for split screen',
        description: 'Text shown when dragging a tab to split the view'
    },
    selectDevice: {
        id: 'gui.gui.selectDevice',
        defaultMessage: 'Select Device',
        description: 'Title for the device selection library'
    },
    showPalette: {
        id: 'gui.gui.showPalette',
        defaultMessage: 'Show blocks palette (click or swipe)',
        description: 'Tooltip to expand blocks palette'
    },
    collapsePalette: {
        id: 'gui.gui.collapsePalette',
        defaultMessage: 'Collapse blocks palette (click or swipe)',
        description: 'Tooltip to collapse blocks palette'
    },
    showSimulator: {
        id: 'gui.gui.showSimulator',
        defaultMessage: 'Show simulator',
        description: 'Tooltip to expand simulator panel'
    },
    collapseSimulator: {
        id: 'gui.gui.collapseSimulator',
        defaultMessage: 'Collapse simulator',
        description: 'Tooltip to collapse simulator panel'
    }
});

const TAB_REGISTRY = {
    code: {
        id: 'code',
        label: <FormattedMessage defaultMessage="Code" id="gui.gui.codeTab" />,
        icon: codeIcon,
        canClose: false
    },
    costumes: {
        id: 'costumes',
        label: null,
        icon: costumesIcon,
        canClose: true
    },
    sounds: {
        id: 'sounds',
        label: <FormattedMessage defaultMessage="Sounds" id="gui.gui.soundsTab" />,
        icon: soundsIcon,
        canClose: true
    },
    control: {
        id: 'control',
        label: <FormattedMessage {...messages.controlTab} />,
        icon: controlIcon,
        canClose: true
    },
    circuitos: {
        id: 'circuitos',
        label: <FormattedMessage {...messages.circuitosTab} />,
        icon: circuitosIcon,
        canClose: true
    },
    '3d': {
        id: '3d',
        label: <FormattedMessage {...messages.tab3d} />,
        icon: icon3d,
        canClose: true
    }
};

let isRendererSupported = null;

function isBlocklyDraggingActive() {
    if (typeof document === 'undefined') return false;
    if (document.body.classList.contains('blocklyDragging')) return true;
    if (document.querySelector('.blocklyDragging')) return true;
    var dragSurface = document.querySelector('.blocklyBlockDragSurface');
    if (dragSurface && dragSurface.style.display !== 'none' && dragSurface.querySelector('g')) return true;
    if (typeof window !== 'undefined' && window.Blockly) {
        if (typeof window.Blockly.dragMode_ !== 'undefined' && window.Blockly.dragMode_ !== 0) return true;
        if (window.Blockly.mainWorkspace && typeof window.Blockly.mainWorkspace.isDragging === 'function' && window.Blockly.mainWorkspace.isDragging()) return true;
        if (window.Blockly.getMainWorkspace) {
            var ws = window.Blockly.getMainWorkspace();
            if (ws && typeof ws.isDragging === 'function' && ws.isDragging()) return true;
        }
    }
    return false;
}

function getHorizontalSwipeAction(dx, position, order) {
    if (Math.abs(dx) < 14) return null;
    var isRight = dx > 0;
    var isLeft = dx < 0;

    // Moving towards screen edge:
    // When element is on 'left': moving left (dx < 0) pushes towards edge.
    // When element is on 'right': moving right (dx > 0) pushes towards edge.
    var isTowardsEdge = (position === 'left' && isLeft) || (position === 'right' && isRight);
    var isTowardsCenter = (position === 'left' && isRight) || (position === 'right' && isLeft);

    if (order === 'left-close-right-open') {
        if (isTowardsEdge) return 'close';
        if (isTowardsCenter) return 'open';
    } else {
        // 'left-open-right-close' (inverted)
        if (isTowardsEdge) return 'open';
        if (isTowardsCenter) return 'close';
    }
    return null;
}

const GUIComponent = props => {
    const {
        activeTabId,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        blocksId,
        blocksTabVisible,
        cardsVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        debugModalVisible,
        deviceLibraryVisible,
        enableCommunity,
        intl,
        isCreating,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isTelemetryEnabled,
        loading,
        reducedMotion,
        onClickAbout,
        onActivateTab,
        onOpenTab,
        onCloseTab,
        onExtensionButtonClick,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseDebugModal,
        onRequestCloseDeviceLibrary,
        onRequestOpenDeviceLibrary,
        onSelectDevice,
        onClearDevice,
        selectedDevice,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        openTabs,
        hiddenTabs,
        backdropLibraryVisible,
        secondaryTabId,
        showComingSoon,
        splitMode,
        splitRatio,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        tipsLibraryVisible,
        toolboxXML,
        vm,
        pendingExplain,
        projectKey,
        onSetSecondaryTab,
        onSetSplitRatio,
        onSwapTabs,
        onReorderTabs,
        onClearExplain,
        onSetProjectKey,
        onSetHasBeenSaved,
        onRestoreTabs,
        splitPrimaryIndex,
        blocksPosition = 'left',
        aiBarPosition = 'bottom',
        stagePosition = 'right',
        blocksAnimating = null,
        swipeOrder = 'up-close-down-open',
        horizontalSwipeOrder = 'left-close-right-open',
        ...componentProps
    } = omit(props, 'dispatch');
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    const [workspaceHandle, setWorkspaceHandle] = useState(null);
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const handleAiChatToggle = useCallback(function (open) {
        setAiChatOpen(open);
    }, []);
    const [blocksPaletteCollapsed, setBlocksPaletteCollapsed] = useState(false);
    const swipeLockedRef = useRef(false);
    const wheelDecelTimerRef = useRef(null);

    const [blocksWrapperNode, setBlocksWrapperNode] = useState(null);
    const blocksWrapperRef = useRef(null);
    const handleSetBlocksWrapper = useCallback(node => {
        blocksWrapperRef.current = node;
        setBlocksWrapperNode(node);
    }, []);

    const executePaletteAction = useCallback(function (shouldCollapse) {
        if (swipeLockedRef.current) {
            clearTimeout(wheelDecelTimerRef.current);
            wheelDecelTimerRef.current = setTimeout(function () {
                swipeLockedRef.current = false;
            }, 300);
            return;
        }

        swipeLockedRef.current = true;
        clearTimeout(wheelDecelTimerRef.current);
        wheelDecelTimerRef.current = setTimeout(function () {
            swipeLockedRef.current = false;
        }, 400);

        setBlocksPaletteCollapsed(function (prev) {
            if (prev === shouldCollapse) return prev;
            setTimeout(function () {
                window.dispatchEvent(new Event('resize'));
                if (workspaceHandle && workspaceHandle.ScratchBlocks && workspaceHandle.workspace) {
                    try {
                        workspaceHandle.ScratchBlocks.svgResize(workspaceHandle.workspace);
                    } catch (_) {}
                }
            }, 320);
            return shouldCollapse;
        });
    }, [workspaceHandle]);

    const toggleDragRef = useRef({startX: 0, hasDragged: false, active: false});
    const handleTogglePalette = useCallback(function () {
        executePaletteAction(!blocksPaletteCollapsed);
    }, [blocksPaletteCollapsed, executePaletteAction]);

    const handleToggleClick = useCallback(function () {
        if (toggleDragRef.current.hasDragged) {
            toggleDragRef.current.hasDragged = false;
            return;
        }
        handleTogglePalette();
    }, [handleTogglePalette]);

    const handleTogglePointerDown = useCallback(function (e) {
        if (e.button !== 0) return;
        toggleDragRef.current = {startX: e.clientX, hasDragged: false, active: true};
        var onPointerMove = function (moveEvent) {
            if (!toggleDragRef.current.active) return;
            var dx = moveEvent.clientX - toggleDragRef.current.startX;
            if (Math.abs(dx) > 14) {
                toggleDragRef.current.hasDragged = true;
                toggleDragRef.current.active = false;
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);

                var action = getHorizontalSwipeAction(dx, blocksPosition, horizontalSwipeOrder);
                if (action === 'close' && !blocksPaletteCollapsed) {
                    executePaletteAction(true);
                } else if (action === 'open' && blocksPaletteCollapsed) {
                    executePaletteAction(false);
                }
            }
        };
        var onPointerUp = function () {
            toggleDragRef.current.active = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }, [blocksPaletteCollapsed, executePaletteAction, blocksPosition, horizontalSwipeOrder]);

    const blocksWheelLockRef = useRef(false);

    // Native capture listeners on blocksWrapperNode to guarantee Blockly NEVER swallows swipe events!
    useEffect(function () {
        var el = blocksWrapperNode || blocksWrapperRef.current;
        if (!el) return;

        var dragData = null;

        var onCapturePointerDown = function (e) {
            if (e.button !== 0) return;
            var target = e.target;
            if (!target) return;

            // 1. NEVER trigger a palette swipe if interacting with blocks, workspace, inputs, buttons, or scrollbars!
            if (target.closest) {
                if (
                    target.closest('.blocklyDraggable') ||
                    target.closest('.blocklyBlockCanvas') ||
                    target.closest('.blocklyFlyoutElements') ||
                    target.closest('.blocklyEditableText') ||
                    target.closest('.blocklyNonEditableText') ||
                    target.closest('.blocklyWidgetDiv') ||
                    target.closest('.blocklyDropDownDiv') ||
                    target.closest('.blocklyFlyoutButton') ||
                    target.closest('.blocklyFlyoutCheckbox') ||
                    target.closest('.blocklyScrollbarHandle')
                ) {
                    return;
                }
            }

            if (isBlocklyDraggingActive()) return;

            var rect = el.getBoundingClientRect();

            // 2. Identify if pointerdown is genuinely on the palette toggle bar or empty category column
            var isInsidePalette = false;
            if (target.closest) {
                isInsidePalette = Boolean(
                    target.closest('[class*="paletteCollapseToggle"]') ||
                    target.closest('.blocklyToolboxWrapper') ||
                    target.closest('.blocklyToolboxDiv') ||
                    target.closest('[class*="extensionButtonContainer"]') ||
                    target.closest('.blocklyFlyoutBackground')
                );
            }

            // If palette is collapsed, also allow swiping open from the thin edge strip (45px)
            if (!isInsidePalette && blocksPaletteCollapsed) {
                if (blocksPosition === 'right') {
                    if (e.clientX >= rect.right - 45 && e.clientX <= rect.right) {
                        isInsidePalette = true;
                    }
                } else {
                    if (e.clientX >= rect.left && e.clientX <= rect.left + 45) {
                        isInsidePalette = true;
                    }
                }
            }

            if (!isInsidePalette) return;

            dragData = {
                startX: e.clientX,
                startY: e.clientY,
                active: true
            };

            var onPointerMove = function (moveEvent) {
                if (!dragData || !dragData.active) return;

                // If user is dragging a block anywhere, cancel swipe immediately
                if (isBlocklyDraggingActive()) {
                    dragData.active = false;
                    cleanupMove();
                    return;
                }

                if (moveEvent.target && moveEvent.target.closest && (
                    moveEvent.target.closest('.blocklyDraggable') ||
                    moveEvent.target.closest('.blocklyBlockDragSurface') ||
                    moveEvent.target.closest('.blocklyBlockCanvas')
                )) {
                    dragData.active = false;
                    cleanupMove();
                    return;
                }

                var dx = moveEvent.clientX - dragData.startX;
                var dy = moveEvent.clientY - dragData.startY;

                // Require intentional swipe: at least 38px horizontally with dominant horizontal vector
                if (Math.abs(dx) >= 38 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    dragData.active = false;
                    cleanupMove();

                    var action = getHorizontalSwipeAction(dx, blocksPosition, horizontalSwipeOrder);
                    if (action === 'close' && !blocksPaletteCollapsed) {
                        executePaletteAction(true);
                    } else if (action === 'open' && blocksPaletteCollapsed) {
                        executePaletteAction(false);
                    }
                }
            };

            var onPointerUp = function () {
                if (dragData) dragData.active = false;
                cleanupMove();
            };

            var cleanupMove = function () {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        };

        var onCaptureWheel = function (e) {
            var dx = e.deltaX;
            var dy = e.deltaY;

            // Only handle dominant horizontal scrolls
            if (Math.abs(dx) < 18 || Math.abs(dx) <= Math.abs(dy) * 1.4) {
                return;
            }

            if (isBlocklyDraggingActive()) {
                return;
            }

            var target = e.target;
            if (!target) return;

            if (target.closest && (
                target.closest('.blocklyDraggable') ||
                target.closest('.blocklyBlockCanvas') ||
                target.closest('.blocklyFlyoutElements')
            )) {
                return;
            }

            var rect = el.getBoundingClientRect();
            var isInside = false;

            if (target.closest) {
                isInside = Boolean(
                    target.closest('[class*="paletteCollapseToggle"]') ||
                    target.closest('.blocklyToolboxWrapper') ||
                    target.closest('.blocklyToolboxDiv') ||
                    target.closest('[class*="extensionButtonContainer"]') ||
                    target.closest('.blocklyFlyoutBackground')
                );
            }

            if (!isInside && blocksPaletteCollapsed) {
                if (blocksPosition === 'right') {
                    if (e.clientX >= rect.right - 45 && e.clientX <= rect.right) isInside = true;
                } else {
                    if (e.clientX >= rect.left && e.clientX <= rect.left + 45) isInside = true;
                }
            }

            if (!isInside) return;

            if (blocksWheelLockRef.current) return;
            blocksWheelLockRef.current = true;
            setTimeout(function () {
                blocksWheelLockRef.current = false;
            }, 280);

            var action = getHorizontalSwipeAction(dx, blocksPosition, horizontalSwipeOrder);
            if (action === 'close' && !blocksPaletteCollapsed) {
                executePaletteAction(true);
            } else if (action === 'open' && blocksPaletteCollapsed) {
                executePaletteAction(false);
            }
        };

        el.addEventListener('pointerdown', onCapturePointerDown, {capture: true, passive: true});
        el.addEventListener('wheel', onCaptureWheel, {capture: true, passive: false});

        return function () {
            el.removeEventListener('pointerdown', onCapturePointerDown, {capture: true});
            el.removeEventListener('wheel', onCaptureWheel, {capture: true});
        };
    }, [blocksWrapperNode, blocksPaletteCollapsed, executePaletteAction, blocksPosition, horizontalSwipeOrder]);

    const [isDragToSplit, setIsDragToSplit] = useState(false);
    const [dragZone, setDragZone] = useState(null);
    const [isFullSize, setIsFullSize] = useState(
        typeof window !== 'undefined' ?
            window.matchMedia(`(min-width: ${layout.fullSizeMinWidth}px)`).matches :
            true
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia(`(min-width: ${layout.fullSizeMinWidth}px)`);
        const handler = e => setIsFullSize(e.matches);
        mql.addListener(handler);
        return () => mql.removeListener(handler);
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.classList.toggle('reduced-motion', reducedMotion);
        return () => document.body.classList.remove('reduced-motion');
    }, [reducedMotion]);

    useEffect(function () {
        if (pendingExplain && !aiChatOpen) {
            setAiChatOpen(true);
        }
    }, [pendingExplain]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.timeTravel = blocksId;
    }, [blocksId]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    const flexWrapperRef = useRef(null);
    const stageResizeRafRef = useRef(null);
    const [stagePanelWidth, setStagePanelWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('scratch_stage_panel_width');
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 340 && parsed <= 900) {
                    return parsed;
                }
            }
        }
        return 430;
    });
    const [isDraggingStageResize, setIsDraggingStageResize] = useState(false);

    const handleStageResizePointerDown = useCallback(e => {
        e.preventDefault();
        setIsDraggingStageResize(true);
        const startX = e.clientX;
        const startWidth = stagePanelWidth;
        const isRtlMode = isRtl;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onPointerMove = moveEvent => {
            if (stageResizeRafRef.current) return;
            stageResizeRafRef.current = requestAnimationFrame(() => {
                stageResizeRafRef.current = null;
                if (!flexWrapperRef.current) return;
                const containerRect = flexWrapperRef.current.getBoundingClientRect();
                const totalW = containerRect.width;

                const deltaX = (isRtlMode || stagePosition === 'left') ?
                    (moveEvent.clientX - startX) :
                    (startX - moveEvent.clientX);
                const nextWidth = startWidth + deltaX;

                const minW = 340;
                const maxW = Math.max(minW, Math.min(850, totalW - 320));
                const clamped = Math.round(Math.min(maxW, Math.max(minW, nextWidth)));

                setStagePanelWidth(clamped);
                window.dispatchEvent(new Event('resize'));
            });
        };

        const onPointerUp = () => {
            setIsDraggingStageResize(false);
            if (stageResizeRafRef.current) {
                cancelAnimationFrame(stageResizeRafRef.current);
                stageResizeRafRef.current = null;
            }
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            setStagePanelWidth(current => {
                try {
                    localStorage.setItem('scratch_stage_panel_width', current.toString());
                } catch (err) {}
                return current;
            });
            window.dispatchEvent(new Event('resize'));
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }, [stagePanelWidth, isRtl, stagePosition]);

    const handleStageResizeDoubleClick = useCallback(() => {
        setStagePanelWidth(430);
        try {
            localStorage.setItem('scratch_stage_panel_width', '430');
        } catch (err) {}
        window.dispatchEvent(new Event('resize'));
    }, []);

    const [isStageCollapsed, setIsStageCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('scratch_stage_collapsed') === 'true';
        }
        return false;
    });

    const [stageWrapperNode, setStageWrapperNode] = useState(null);
    const stageWrapperRef = useRef(null);
    const handleSetStageWrapper = useCallback(node => {
        stageWrapperRef.current = node;
        setStageWrapperNode(node);
    }, []);

    const executeStageAction = useCallback(function (shouldCollapse) {
        setIsStageCollapsed(function (prev) {
            if (prev === shouldCollapse) return prev;
            try {
                localStorage.setItem('scratch_stage_collapsed', String(shouldCollapse));
            } catch (_) {}
            setTimeout(function () {
                window.dispatchEvent(new Event('resize'));
            }, 50);
            setTimeout(function () {
                window.dispatchEvent(new Event('resize'));
            }, 320);
            return shouldCollapse;
        });
    }, []);

    const handleToggleStageCollapse = useCallback(() => {
        executeStageAction(!isStageCollapsed);
    }, [executeStageAction, isStageCollapsed]);

    const stageWheelLockRef = useRef(false);

    // Native capture listeners on stageWrapperNode to guarantee swipes across the entire simulator area work smoothly!
    useEffect(function () {
        var el = stageWrapperNode || stageWrapperRef.current;
        if (!el) return;

        var stageDrag = null;

        var onCapturePointerDown = function (e) {
            if (e.button !== 0) return;
            var target = e.target;
            // Never intercept clicks on the running Scratch project canvas, buttons, or input boxes
            if (target && (target.tagName === 'CANVAS' || target.closest('button') || target.closest('input') || target.closest('select'))) {
                return;
            }

            stageDrag = {
                startX: e.clientX,
                startY: e.clientY,
                active: true
            };

            var onPointerMove = function (moveEvent) {
                if (!stageDrag || !stageDrag.active) return;
                var dx = moveEvent.clientX - stageDrag.startX;
                var dy = moveEvent.clientY - stageDrag.startY;

                if (Math.abs(dx) >= 20 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                    stageDrag.active = false;
                    cleanupMove();

                    var action = getHorizontalSwipeAction(dx, stagePosition, horizontalSwipeOrder);
                    if (action === 'close' && !isStageCollapsed) {
                        executeStageAction(true);
                    } else if (action === 'open' && isStageCollapsed) {
                        executeStageAction(false);
                    }
                }
            };

            var onPointerUp = function () {
                if (stageDrag) stageDrag.active = false;
                cleanupMove();
            };

            var cleanupMove = function () {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        };

        var onCaptureWheel = function (e) {
            var dx = e.deltaX;
            var dy = e.deltaY;
            if (Math.abs(dx) < 14 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

            if (stageWheelLockRef.current) return;
            stageWheelLockRef.current = true;
            setTimeout(function () {
                stageWheelLockRef.current = false;
            }, 280);

            var action = getHorizontalSwipeAction(dx, stagePosition, horizontalSwipeOrder);
            if (action === 'close' && !isStageCollapsed) {
                executeStageAction(true);
            } else if (action === 'open' && isStageCollapsed) {
                executeStageAction(false);
            }
        };

        el.addEventListener('pointerdown', onCapturePointerDown, {capture: true, passive: true});
        el.addEventListener('wheel', onCaptureWheel, {capture: true, passive: false});

        return function () {
            el.removeEventListener('pointerdown', onCapturePointerDown, {capture: true});
            el.removeEventListener('wheel', onCaptureWheel, {capture: true});
        };
    }, [stageWrapperNode, isStageCollapsed, executeStageAction, stagePosition, horizontalSwipeOrder]);

    const stageToggleDragRef = useRef({startX: 0, hasDragged: false, active: false});
    const handleStageTogglePointerDown = useCallback(function (e) {
        if (e.button !== 0) return;
        stageToggleDragRef.current = {startX: e.clientX, hasDragged: false, active: true};
        var onPointerMove = function (moveEvent) {
            if (!stageToggleDragRef.current.active) return;
            var dx = moveEvent.clientX - stageToggleDragRef.current.startX;
            if (Math.abs(dx) > 14) {
                stageToggleDragRef.current.hasDragged = true;
                stageToggleDragRef.current.active = false;
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);

                var action = getHorizontalSwipeAction(dx, stagePosition, horizontalSwipeOrder);
                if (action === 'close' && !isStageCollapsed) {
                    executeStageAction(true);
                } else if (action === 'open' && isStageCollapsed) {
                    executeStageAction(false);
                }
            }
        };
        var onPointerUp = function () {
            stageToggleDragRef.current.active = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }, [isStageCollapsed, stagePosition, horizontalSwipeOrder, executeStageAction]);

    const handleStageWheel = useCallback(function (e) {
        var dx = e.deltaX;
        var dy = e.deltaY;
        if (Math.abs(dx) < 14 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

        if (stageWheelLockRef.current) return;
        stageWheelLockRef.current = true;
        setTimeout(function () {
            stageWheelLockRef.current = false;
        }, 280);

        var action = getHorizontalSwipeAction(dx, stagePosition, horizontalSwipeOrder);
        if (action === 'close' && !isStageCollapsed) {
            executeStageAction(true);
        } else if (action === 'open' && isStageCollapsed) {
            executeStageAction(false);
        }
    }, [isStageCollapsed, stagePosition, horizontalSwipeOrder, executeStageAction]);

    const dynamicStageDimensions = useMemo(() => {
        if (isFullScreen) return null;
        const availWidth = Math.max(200, stagePanelWidth - 16);
        const maxH = typeof window !== 'undefined' ?
            Math.max(160, window.innerHeight - 48 - 44 - 180) :
            360;
        const maxWByHeight = Math.round(maxH * (4 / 3));

        let width;
        if (stageSizeMode === STAGE_SIZE_MODES.small) {
            width = Math.min(240, availWidth);
        } else {
            width = Math.min(availWidth, maxWByHeight, 640);
            width = Math.max(200, width);
        }
        const height = Math.round(width * 0.75);
        return {
            width: Math.round(width),
            height: Math.round(height),
            scale: width / 480
        };
    }, [stagePanelWidth, stageSizeMode, isFullScreen]);

    const stageSize = resolveStageSize(stageSizeMode, isFullSize);

    if (isRendererSupported === null) {
        isRendererSupported = Renderer.isSupported();
    }

    const tabsConfig = useMemo(() => {
        const costsmesLabel = targetIsStage ? (
            <FormattedMessage
                defaultMessage="Backdrops"
                id="gui.gui.backdropsTab"
            />
        ) : (
            <FormattedMessage
                defaultMessage="Costumes"
                id="gui.gui.costumesTab"
            />
        );
        return {
            code: TAB_REGISTRY.code,
            costumes: Object.assign({}, TAB_REGISTRY.costumes, {label: costsmesLabel}),
            sounds: TAB_REGISTRY.sounds,
            control: TAB_REGISTRY.control,
            circuitos: TAB_REGISTRY.circuitos,
            '3d': TAB_REGISTRY['3d']
        };
    }, [targetIsStage]);

    const codePanel = useMemo(() => (
        <Box
            className={classNames(
                styles.blocksWrapper,
                {
                    [styles.paletteCollapsed]: blocksPaletteCollapsed,
                    [styles.blocksRight]: blocksPosition === 'right',
                    [styles.blocksExitingDown]: blocksAnimating === 'exiting-down',
                    [styles.blocksEnteringUp]: blocksAnimating === 'entering-up'
                }
            )}
            componentRef={handleSetBlocksWrapper}
            data-code-panel="true"
        >
            <Blocks
                key={`${blocksId}/${theme}`}
                canUseCloud={canUseCloud}
                grow={1}
                isVisible={blocksTabVisible}
                onWorkspaceReady={setWorkspaceHandle}
                options={{
                    media: `${basePath}static/${themeMap[theme].blocksMediaFolder}/`
                }}
                stageSize={stageSize}
                theme={theme}
                vm={vm}
            />
            <Box
                className={classNames(
                    styles.extensionButtonContainer,
                    {
                        [styles.paletteCollapsed]: blocksPaletteCollapsed,
                        [styles.positionRight]: blocksPosition === 'right',
                        [styles.blocksExitingDown]: blocksAnimating === 'exiting-down',
                        [styles.blocksEnteringUp]: blocksAnimating === 'entering-up'
                    }
                )}
            >
                <button
                    className={styles.extensionButton}
                    title={intl.formatMessage(messages.addExtension)}
                    onClick={onExtensionButtonClick}
                >
                    <img
                        className={styles.extensionButtonIcon}
                        draggable={false}
                        src={addExtensionIcon}
                    />
                </button>
            </Box>
            <button
                className={classNames(
                    styles.paletteCollapseToggle,
                    {
                        [styles.paletteCollapsed]: blocksPaletteCollapsed,
                        [styles.positionRight]: blocksPosition === 'right',
                        [styles.blocksExitingDown]: blocksAnimating === 'exiting-down',
                        [styles.blocksEnteringUp]: blocksAnimating === 'entering-up'
                    }
                )}
                onClick={handleToggleClick}
                onPointerDown={handleTogglePointerDown}
                title={((intl && intl.locale && intl.locale.toLowerCase().startsWith('es')) ?
                    (blocksPaletteCollapsed ? 'Mostrar paleta de bloques (clic o deslizar)' : 'Colapsar paleta de bloques (clic o deslizar)') :
                    (intl ?
                        intl.formatMessage(blocksPaletteCollapsed ? messages.showPalette : messages.collapsePalette) :
                        (blocksPaletteCollapsed ? 'Show blocks palette (click or swipe)' : 'Collapse blocks palette (click or swipe)'))
                )}
                type="button"
            >
                <svg
                    className={styles.paletteCollapseIcon}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {blocksPosition === 'right' ? (
                        blocksPaletteCollapsed ? (
                            <polyline points="15 18 9 12 15 6" />
                        ) : (
                            <polyline points="9 18 15 12 9 6" />
                        )
                    ) : (
                        blocksPaletteCollapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )
                    )}
                </svg>
            </button>
        </Box>
    ), [blocksId, theme, canUseCloud, blocksTabVisible, vm, basePath, stageSize, blocksPaletteCollapsed, blocksPosition, blocksAnimating, intl, onExtensionButtonClick, handleToggleClick, handleSetBlocksWrapper, handleTogglePointerDown]);

    const costumePanel = useMemo(() => <CostumeTab vm={vm} />, [vm]);
    const soundPanel = useMemo(() => <SoundTab vm={vm} />, [vm]);

    const controlPanel = useMemo(() => (
        <Box
            className={classNames(
                styles.blocksWrapper,
                {
                    [styles.blocksRight]: blocksPosition === 'right'
                }
            )}
        >
            <Blocks
                key={'control/' + theme}
                canUseCloud={canUseCloud}
                grow={1}
                isVisible={true}
                options={{
                    media: basePath + 'static/' + themeMap[theme].blocksMediaFolder + '/'
                }}
                stageSize={stageSize}
                theme={theme}
                vm={controlVm}
            />
        </Box>
    ), [theme, canUseCloud, controlVm, basePath, stageSize, blocksPosition]);

    const circuitosPanel = useMemo(() => <CircuitosTab vm={vm} />, [vm]);
    const tab3dPanel = useMemo(() => <Tab3D vm={vm} />, [vm]);

    const allPanels = useMemo(function () {
        return {
            code: codePanel,
            costumes: costumePanel,
            sounds: soundPanel,
            control: controlPanel,
            circuitos: circuitosPanel,
            '3d': tab3dPanel
        };
    }, [codePanel, costumePanel, soundPanel, controlPanel, circuitosPanel, tab3dPanel]);

    const [panels, panelsList] = useMemo(function () {
        const list = openTabs.slice();
        hiddenTabs.forEach(function (tid) {
            if (list.indexOf(tid) === -1) list.push(tid);
        });
        return [list.map(function (tabId) { return allPanels[tabId]; }), list];
    }, [openTabs, hiddenTabs, allPanels]);

    var primaryIdx = panelsList.indexOf(activeTabId);
    var secondaryIdx = secondaryTabId ? panelsList.indexOf(secondaryTabId) : null;
    var partnerIdx = (splitMode && secondaryIdx != null && primaryIdx >= 0) ?
        secondaryIdx : null;
    var showSplit = partnerIdx != null && primaryIdx >= 0 && secondaryIdx >= 0;

    const handleTabClick = useCallback(function (tabId) {
        if (tabId === -1) {
            if (splitMode) onActivateTab(splitPrimaryIndex);
            return;
        }
        onActivateTab(tabId);
    }, [splitMode, onActivateTab, splitPrimaryIndex]);

    const handleCloseSecondary = useCallback(() => {
        onSetSecondaryTab(null);
    }, [onSetSecondaryTab]);

    const handleSwap = useCallback(() => {
        onSwapTabs();
    }, [onSwapTabs]);

    const handleDragToSplitPanel = useCallback((active, zone) => {
        setIsDragToSplit(active);
        setDragZone(active ? zone : null);
    }, []);

    const handleRatioChange = useCallback(ratio => {
        onSetSplitRatio(ratio);
    }, [onSetSplitRatio]);

    const handleTabReorder = useCallback(newOrder => {
        onReorderTabs(newOrder);
    }, [onReorderTabs]);

    const renderEditor = () => (
        <Box className={styles.bodyWrapper}>
            <Box
                className={classNames(styles.flexWrapper, {[styles.stageLeft]: stagePosition === 'left'})}
                componentRef={el => { flexWrapperRef.current = el; }}
            >
                <Box className={styles.editorWrapper}>
                    <TabBar
                        tabs={tabsConfig}
                        openTabs={openTabs}
                        activeTabId={activeTabId}
                        secondaryTabId={secondaryTabId}
                        splitMode={splitMode}
                        onTabClick={handleTabClick}
                        onTabReorder={handleTabReorder}
                        onOpenTab={onOpenTab}
                        onCloseTab={onCloseTab}
                        onActivateTab={onActivateTab}
                        onSetSecondaryTab={onSetSecondaryTab}
                        onDragToSplitPanel={handleDragToSplitPanel}
                        rtl={isRtl}
                    />
                    <div className={styles.tabsBody} data-tabs-body>
                        <SplitContainer
                            panels={panels}
                            primaryIndex={primaryIdx >= 0 ? primaryIdx : 0}
                            secondaryIndex={partnerIdx}
                            splitMode={showSplit}
                            splitRatio={splitRatio}
                            splitDirection="horizontal"
                            onRatioChange={handleRatioChange}
                            onCloseSecondary={handleCloseSecondary}
                            onSwap={handleSwap}
                        />
                        {isDragToSplit && !showSplit && dragZone && (
                            <div className={classNames(styles.dropIndicator, dragZone === 'left' ? styles.dropLeft : styles.dropRight)}>
                                <span><FormattedMessage {...messages.dropToSplit} /></span>
                            </div>
                        )}
                        {!showSplit && activeTabId === 'code' && (
                            <Box className={styles.watermark}>
                                <Watermark selectedDevice={selectedDevice} />
                            </Box>
                        )}
                        <FloatingAiChat
                            activeTabId={activeTabId}
                            isOpen={aiChatOpen}
                            onToggle={handleAiChatToggle}
                            vm={vm}
                            pendingExplain={pendingExplain}
                            projectKey={projectKey}
                            onClearExplain={onClearExplain}
                            onActivateTab={onActivateTab}
                            isPaletteCollapsed={blocksPaletteCollapsed}
                            onTogglePalette={handleTogglePalette}
                            blocksPosition={blocksPosition}
                            aiBarPosition={aiBarPosition}
                            stagePosition={stagePosition}
                            showSplit={showSplit}
                            secondaryTabId={secondaryTabId}
                            splitRatio={splitRatio}
                            isStageCollapsed={isStageCollapsed}
                            swipeOrder={swipeOrder}
                        />
                    </div>
                </Box>
                {!isFullScreen && !isStageCollapsed && (
                    <div
                        className={classNames(
                            styles.stageResizeHandle,
                            {[styles.isActive]: isDraggingStageResize}
                        )}
                        onPointerDown={handleStageResizePointerDown}
                        onDoubleClick={handleStageResizeDoubleClick}
                        role="separator"
                        aria-orientation="vertical"
                        tabIndex={0}
                        title={((intl && intl.locale && intl.locale.toLowerCase().startsWith('es')) ?
                            'Arrastrar para redimensionar (doble clic para restablecer)' :
                            'Drag to resize (double click to reset)'
                        )}
                    />
                )}
                {!isFullScreen && (
                    <button
                        className={classNames(
                            styles.stageCollapseToggle,
                            {
                                [styles.stageCollapsed]: isStageCollapsed,
                                [styles.stageLeft]: stagePosition === 'left'
                            }
                        )}
                        onClick={handleToggleStageCollapse}
                        onWheel={handleStageWheel}
                        onPointerDown={handleStageTogglePointerDown}
                        title={((intl && intl.locale && intl.locale.toLowerCase().startsWith('es')) ?
                            (isStageCollapsed ? 'Mostrar simulador' : 'Colapsar simulador') :
                            (intl ?
                                intl.formatMessage(isStageCollapsed ? messages.showSimulator : messages.collapseSimulator) :
                                (isStageCollapsed ? 'Show simulator' : 'Collapse simulator'))
                        )}
                        type="button"
                    >
                        <svg
                            className={styles.paletteCollapseIcon}
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {stagePosition === 'left' ? (
                                isStageCollapsed ? (
                                    <polyline points="9 18 15 12 9 6" />
                                ) : (
                                    <polyline points="15 18 9 12 15 6" />
                                )
                            ) : (
                                isStageCollapsed ? (
                                    <polyline points="15 18 9 12 15 6" />
                                ) : (
                                    <polyline points="9 18 15 12 9 6" />
                                )
                            )}
                        </svg>
                    </button>
                )}
                <Box
                    className={classNames(styles.stageAndTargetWrapper, styles[stageSize], {
                        [styles.stageCollapsed]: isStageCollapsed
                    })}
                    componentRef={handleSetStageWrapper}
                    style={isStageCollapsed ? {width: 0} : {width: `${stagePanelWidth}px`}}
                    data-stage-panel="true"
                    data-panel-right="true"
                >
                    <StageWrapper
                        isFullScreen={isFullScreen}
                        isRendererSupported={isRendererSupported}
                        isRtl={isRtl}
                        loading={loading}
                        stageSize={dynamicStageDimensions || stageSize}
                        vm={vm}
                    />
                    <Box className={styles.targetWrapper}>
                        <TargetPane
                            stageSize={stageSize}
                            vm={vm}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return isPlayerOnly ? (
        <StageWrapper
            isFullScreen={isFullScreen}
            isRendererSupported={isRendererSupported}
            isRtl={isRtl}
            loading={loading}
            stageSize={STAGE_SIZE_MODES.large}
            vm={vm}
        >
            {alertsVisible ? (
                <Alerts className={styles.alertsContainer} />
            ) : null}
        </StageWrapper>
    ) : (
        <Box
            className={styles.pageWrapper}
            dir={isRtl ? 'rtl' : 'ltr'}
            {...componentProps}
        >
            {telemetryModalVisible ? (
                <TelemetryModal
                    isRtl={isRtl}
                    isTelemetryEnabled={isTelemetryEnabled}
                    onCancel={onTelemetryModalCancel}
                    onOptIn={onTelemetryModalOptIn}
                    onOptOut={onTelemetryModalOptOut}
                    onRequestClose={onRequestCloseTelemetryModal}
                    onShowPrivacyPolicy={onShowPrivacyPolicy}
                />
            ) : null}
            {loading ? (
                <Loader />
            ) : null}
            {isCreating ? (
                <Loader messageId="gui.loader.creating" />
            ) : null}
            {isRendererSupported ? null : (
                <WebGlModal isRtl={isRtl} />
            )}
            {tipsLibraryVisible ? (
                <TipsLibrary />
            ) : null}
            {cardsVisible ? (
                <Cards />
            ) : null}
            {alertsVisible ? (
                <Alerts className={styles.alertsContainer} />
            ) : null}
            {connectionModalVisible ? (
                <ConnectionModal vm={vm} />
            ) : null}
            {costumeLibraryVisible ? (
                <CostumeLibrary
                    vm={vm}
                    onRequestClose={onRequestCloseCostumeLibrary}
                />
            ) : null}
            {<DebugModal
                isOpen={debugModalVisible}
                onClose={onRequestCloseDebugModal}
            />}
            {backdropLibraryVisible ? (
                <BackdropLibrary
                    vm={vm}
                    onRequestClose={onRequestCloseBackdropLibrary}
                />
            ) : null}
            <DeviceSelector
                deviceData={getDevices(intl)}
                onRequestClose={onRequestCloseDeviceLibrary}
                onDeviceSelected={device => {
                    if (device.deviceId !== 'null') {
                        onSelectDevice(device);
                    } else {
                        onClearDevice();
                    }
                    onRequestCloseDeviceLibrary();
                }}
                title={intl.formatMessage(messages.selectDevice)}
                visible={deviceLibraryVisible}
            />
            <MenuBar
                activeTabId={activeTabId}
                authorId={authorId}
                authorThumbnailUrl={authorThumbnailUrl}
                authorUsername={authorUsername}
                canChangeLanguage={canChangeLanguage}
                canChangeTheme={canChangeTheme}
                canCreateCopy={canCreateCopy}
                canCreateNew={canCreateNew}
                canEditTitle={canEditTitle}
                canManageFiles={canManageFiles}
                canRemix={canRemix}
                canSave={canSave}
                canShare={canShare}
                className={styles.menuBarPosition}
                enableCommunity={enableCommunity}
                isShared={isShared}
                showComingSoon={showComingSoon}
                onClickAbout={onClickAbout}
                onProjectTelemetryEvent={onProjectTelemetryEvent}
                onSeeCommunity={onSeeCommunity}
                onShare={onShare}
                onStartSelectingFileUpload={onStartSelectingFileUpload}
                onRequestOpenDeviceLibrary={onRequestOpenDeviceLibrary}
                selectedDevice={selectedDevice}
            />
            {renderEditor()}
            <DragLayer />
            <OldtimeyMode />
            <NinetiesMode />
            <PrehistoricMode />
        </Box>
    );
};

GUIComponent.propTypes = {
    activeTabId: PropTypes.string,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropLibraryVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    cardsVisible: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    debugModalVisible: PropTypes.bool,
    deviceLibraryVisible: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateTab: PropTypes.func,
    onOpenTab: PropTypes.func,
    onCloseTab: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseDebugModal: PropTypes.func,
    onRequestCloseDeviceLibrary: PropTypes.func,
    onRequestOpenDeviceLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    openTabs: PropTypes.arrayOf(PropTypes.string),
    secondaryTabId: PropTypes.string,
    splitMode: PropTypes.bool,
    splitRatio: PropTypes.number,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.string,
    tipsLibraryVisible: PropTypes.bool,
    toolboxXML: PropTypes.string,
    reducedMotion: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onSetSecondaryTab: PropTypes.func,
    onSetSplitRatio: PropTypes.func,
    onSwapTabs: PropTypes.func,
    onReorderTabs: PropTypes.func,
    onClearExplain: PropTypes.func,
    onSetProjectKey: PropTypes.func,
    selectedDevice: PropTypes.object,
    blocksPosition: PropTypes.string,
    aiBarPosition: PropTypes.string,
    stagePosition: PropTypes.string,
    blocksAnimating: PropTypes.string,
    swipeOrder: PropTypes.string,
    horizontalSwipeOrder: PropTypes.string
};

GUIComponent.defaultProps = {
    basePath: './',
    blocksId: 'original',
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
    splitRatio: 0.5,
    selectedDevice: null,
    blocksPosition: 'left',
    aiBarPosition: 'bottom',
    stagePosition: 'right',
    blocksAnimating: null,
    swipeOrder: 'up-close-down-open',
    horizontalSwipeOrder: 'left-close-right-open'
};

const mapStateToProps = state => ({
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    theme: state.scratchGui.theme.theme,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    reducedMotion: state.scratchGui.animations.reducedMotion,
    selectedDevice: state.scratchGui.device.selectedDevice,
    blocksPosition: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.blocksPosition : 'left',
    aiBarPosition: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.aiBarPosition : 'bottom',
    stagePosition: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.stagePosition : 'right',
    blocksAnimating: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.blocksAnimating : null,
    swipeOrder: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.swipeOrder : 'up-close-down-open',
    horizontalSwipeOrder: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.horizontalSwipeOrder : 'left-close-right-open'
});

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));
