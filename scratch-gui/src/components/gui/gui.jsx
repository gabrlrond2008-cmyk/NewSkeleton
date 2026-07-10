import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import VM from 'scratch-vm';
import Renderer from 'scratch-render';

import Blocks from '../../containers/blocks.jsx';
import AiTab from '../../containers/ai-tab.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import SimulationTab from '../../containers/simulation-tab.jsx';
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
import aiIcon from './icon--ai.svg';
import codeIcon from './icon--code.svg';
import costumesIcon from './icon--costumes.svg';
import soundsIcon from './icon--sounds.svg';
import simulationIcon from './icon--simulation.svg';
import controlIcon from './icon--control.svg';
import circuitosIcon from './icon--circuitos.svg';
import icon3d from './icon--3d.svg';
import DebugModal from '../debug-modal/debug-modal.jsx';
import DeviceSelector from '../device-selector/device-selector.jsx';
import getDevices from '../../lib/libraries/devices/devices.jsx';
import TabBar from '../tab-bar/tab-bar.jsx';
import SplitContainer from '../split-container/split-container.jsx';
import MentorGuide from '../mentor-guide/mentor-guide.jsx';
import OldtimeyMode from '../oldtimey-mode/oldtimey-mode.jsx';
import NinetiesMode from '../nineties-mode/nineties-mode.jsx';
import PrehistoricMode from '../prehistoric-mode/prehistoric-mode.jsx';
import {ALL_TABS} from '../../reducers/editor-tab';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    },
    aiTab: {
        id: 'gui.gui.aiTab',
        defaultMessage: 'AI',
        description: 'Tab label for AI tab'
    },
    simulationTab: {
        id: 'gui.gui.simulationTab',
        defaultMessage: 'Simulation',
        description: 'Tab label for simulation tab'
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
    ai: {
        id: 'ai',
        label: <FormattedMessage {...messages.aiTab} />,
        icon: aiIcon,
        canClose: true
    },
    simulacion: {
        id: 'simulacion',
        label: <FormattedMessage {...messages.simulationTab} />,
        icon: simulationIcon,
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
        ...componentProps
    } = omit(props, 'dispatch');
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    const [workspaceHandle, setWorkspaceHandle] = useState(null);
    const [mentorGuidanceMsg, setMentorGuidanceMsg] = useState();
    const handleMentorGuidance = useCallback(d => setMentorGuidanceMsg(d), []);
    const [reanalyzeTick, setReanalyzeTick] = useState(0);
    const handleReanalyze = useCallback(function () {
        setReanalyzeTick(function (t) { return t + 1; });
    }, []);
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

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.timeTravel = blocksId;
    }, [blocksId]);

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
            ai: TAB_REGISTRY.ai,
            simulacion: TAB_REGISTRY.simulacion,
            control: TAB_REGISTRY.control,
            circuitos: TAB_REGISTRY.circuitos,
            '3d': TAB_REGISTRY['3d']
        };
    }, [targetIsStage]);

    const codePanel = useMemo(() => (
        <Box className={styles.blocksWrapper}>
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
        </Box>
    ), [blocksId, theme, canUseCloud, blocksTabVisible, vm, basePath, stageSize]);

    const costumePanel = useMemo(() => <CostumeTab vm={vm} />, [vm]);
    const soundPanel = useMemo(() => <SoundTab vm={vm} />, [vm]);
    const aiPanel = useMemo(() => <AiTab vm={vm} pendingExplain={pendingExplain} projectKey={projectKey} onClearExplain={onClearExplain} onMentorGuidance={handleMentorGuidance} onActivateTab={onActivateTab} reanalyzeTick={reanalyzeTick} />, [vm, pendingExplain, projectKey, onClearExplain, handleMentorGuidance, onActivateTab, reanalyzeTick]);
    const simulationPanel = useMemo(() => (
        <SimulationTab
            isFullScreen={isFullScreen}
            isRendererSupported={isRendererSupported}
            isRtl={isRtl}
            loading={loading}
            stageSize={STAGE_SIZE_MODES.large}
            vm={vm}
        />
    ), [isFullScreen, isRendererSupported, isRtl, loading, vm]);

    const controlPanel = useMemo(() => (
        <Box className={styles.blocksWrapper}>
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
                vm={vm}
            />
        </Box>
    ), [theme, canUseCloud, vm, basePath, stageSize]);

    const circuitosPanel = useMemo(() => <CircuitosTab vm={vm} />, [vm]);
    const tab3dPanel = useMemo(() => <Tab3D vm={vm} />, [vm]);

    const allPanels = useMemo(function () {
        return {
            code: codePanel,
            costumes: costumePanel,
            sounds: soundPanel,
            ai: aiPanel,
            simulacion: simulationPanel,
            control: controlPanel,
            circuitos: circuitosPanel,
            '3d': tab3dPanel
        };
    }, [codePanel, costumePanel, soundPanel, aiPanel, simulationPanel, controlPanel, circuitosPanel, tab3dPanel]);

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
            <Box className={styles.flexWrapper}>
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
                            <Box className={styles.extensionButtonContainer}>
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
                        )}
                        {!showSplit && activeTabId === 'code' && (
                            <Box className={styles.watermark}>
                                <Watermark selectedDevice={selectedDevice} />
                            </Box>
                        )}
                        {activeTabId === 'code' && (
                            <MentorGuide message={mentorGuidanceMsg} onReanalyze={handleReanalyze} />
                        )}
                    </div>
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
    selectedDevice: PropTypes.object
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
    selectedDevice: null
};

const mapStateToProps = state => ({
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    theme: state.scratchGui.theme.theme,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    reducedMotion: state.scratchGui.animations.reducedMotion,
    selectedDevice: state.scratchGui.device.selectedDevice
});

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));
