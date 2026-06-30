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

import layout, {STAGE_SIZE_MODES} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {themeMap} from '../../lib/themes';

import styles from './gui.css';
import addExtensionIcon from './icon--extensions.svg';
import aiIcon from './icon--ai.svg';
import codeIcon from './icon--code.svg';
import costumesIcon from './icon--costumes.svg';
import soundsIcon from './icon--sounds.svg';
import DebugModal from '../debug-modal/debug-modal.jsx';
import DeviceSelector from '../device-selector/device-selector.jsx';
import deviceData from '../../lib/libraries/devices/devices.jsx';
import TabBar from '../tab-bar/tab-bar.jsx';
import SplitContainer from '../split-container/split-container.jsx';
import MentorGuide from '../mentor-guide/mentor-guide.jsx';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

let isRendererSupported = null;

const TABS_CONFIG = [
    {id: 'code',
        label: <FormattedMessage
            defaultMessage="Code"
            id="gui.gui.codeTab"
        />,
        icon: codeIcon},
    {id: 'costumes', label: null, icon: costumesIcon},
    {id: 'sounds',
        label: <FormattedMessage
            defaultMessage="Sounds"
            id="gui.gui.soundsTab"
        />,
        icon: soundsIcon},
    {id: 'ai',
        label: 'AI',
        icon: aiIcon}
];

const GUIComponent = props => {
    const {
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
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
        isTotallyNormal,
        loading,
        reducedMotion,
        onClickAbout,
        onActivateTab,
        onExtensionButtonClick,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseDebugModal,
        onRequestCloseDeviceLibrary,
        onRequestOpenDeviceLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        secondaryTabIndex,
        showComingSoon,
        splitPrimaryIndex,
        splitMode,
        splitRatio,
        tabOrder,
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
        ...componentProps
    } = omit(props, 'dispatch');
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    const [selectedDevice, setSelectedDevice] = useState(null);
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
        return TABS_CONFIG.map((t, i) => i === 1 ? {...t, label: costsmesLabel} : t);
    }, [targetIsStage]);

    // Pre-rendered panels — always mounted, visibility toggled via CSS
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

    const panels = useMemo(() => [codePanel, costumePanel, soundPanel, aiPanel],
        [codePanel, costumePanel, soundPanel, aiPanel]);

    const handleTabClick = useCallback(index => {
        if (index === -1) {
            if (splitMode) onActivateTab(splitPrimaryIndex);
            return;
        }
        onActivateTab(index);
    }, [splitMode, splitPrimaryIndex, onActivateTab]);

    const isInSplit = splitMode && splitPrimaryIndex != null &&
        (activeTabIndex === splitPrimaryIndex || activeTabIndex === secondaryTabIndex);
    const partnerIndex = isInSplit ?
        (activeTabIndex === splitPrimaryIndex ? secondaryTabIndex : splitPrimaryIndex) :
        null;
    const showSplit = partnerIndex != null;

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
                        tabOrder={tabOrder}
                        activeTabIndex={activeTabIndex}
                        secondaryTabIndex={secondaryTabIndex}
                        splitPrimaryIndex={splitPrimaryIndex}
                        splitMode={splitMode}
                        onTabClick={handleTabClick}
                        onTabReorder={handleTabReorder}
                        onSetSecondaryTab={onSetSecondaryTab}
                        onActivateTab={onActivateTab}
                        onDragToSplitPanel={handleDragToSplitPanel}
                        rtl={isRtl}
                    />
                    <div className={styles.tabsBody} data-tabs-body>
                        <SplitContainer
                            panels={panels}
                            primaryIndex={activeTabIndex}
                            secondaryIndex={partnerIndex}
                            splitMode={showSplit}
                            splitRatio={splitRatio}
                            splitDirection="horizontal"
                            onRatioChange={handleRatioChange}
                            onCloseSecondary={handleCloseSecondary}
                            onSwap={handleSwap}
                        />
                        {isDragToSplit && !showSplit && dragZone && (
                            <div className={classNames(styles.dropIndicator, dragZone === 'left' ? styles.dropLeft : styles.dropRight)}>
                                <span>Soltar aquí para pantalla dividida</span>
                            </div>
                        )}
                        {!showSplit && activeTabIndex === 0 && (
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
                        {!showSplit && activeTabIndex === 0 && (
                            <Box className={styles.watermark}>
                                <Watermark selectedDevice={selectedDevice} />
                            </Box>
                        )}
                        {activeTabIndex === 0 && (
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
                deviceData={deviceData}
                onRequestClose={onRequestCloseDeviceLibrary}
                onDeviceSelected={device => {
                    if (device.deviceId !== 'null') {
                        setSelectedDevice(device);
                    } else {
                        setSelectedDevice(null);
                    }
                    onRequestCloseDeviceLibrary();
                }}
                title="Select Device"
                visible={deviceLibraryVisible}
            />
            <MenuBar
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
                isTotallyNormal={isTotallyNormal}
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
        </Box>
    );
};

GUIComponent.propTypes = {
    activeTabIndex: PropTypes.number,
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
    isTotallyNormal: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateTab: PropTypes.func,
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
    secondaryTabIndex: PropTypes.number,
    splitMode: PropTypes.bool,
    splitPrimaryIndex: PropTypes.number,
    splitRatio: PropTypes.number,
    tabOrder: PropTypes.arrayOf(PropTypes.number),
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
    onReorderTabs: PropTypes.func
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
    isTotallyNormal: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
    splitRatio: 0.5
};

const mapStateToProps = state => ({
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    theme: state.scratchGui.theme.theme,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    reducedMotion: state.scratchGui.animations.reducedMotion
});

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));
