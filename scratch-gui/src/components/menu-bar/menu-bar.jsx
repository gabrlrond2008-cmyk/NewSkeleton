import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';

import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import AuthorInfo from './author-info.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

import {
    manualUpdateProject,
    requestNewProject,
    remixProject,
    saveProjectAsCopy
} from '../../reducers/project-state';
import {
    openAboutMenu,
    closeAboutMenu,
    aboutMenuOpen,
    openFileMenu,
    closeFileMenu,
    fileMenuOpen,
    settingsMenuOpen,
    openSettingsMenu,
    closeSettingsMenu
} from '../../reducers/menus';

import collectMetadata from '../../lib/collect-metadata';
import {getSharedMessages} from '../../lib/ai-shared-state';
import {serializeConversation} from '../../lib/ai-flynt-data';
import controlVm from '../../lib/control-vm';

import styles from './menu-bar.css';

import dropdownCaret from './dropdown-caret.svg';
import aboutIcon from './icon--about.svg';
import fileIcon from './icon--file.svg';
import deviceIcon from './icon--device.svg';

import sharedMessages from '../../lib/shared-messages';

var ELECTRONICS_TABS = ['control', 'circuitos', '3d'];

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};


MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const AboutButton = props => (
    <Button
        className={classNames(styles.menuBarItem, styles.hoverable)}
        iconClassName={styles.aboutIcon}
        iconSrc={aboutIcon}
        onClick={props.onClick}
    />
);

AboutButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

class MenuBar extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickNew',
            'handleClickRemix',
            'handleClickSave',
            'handleClickSaveAsCopy',
            'handleKeyPress',
            'handleSaveToComputer'
        ]);
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
    handleClickNew () {
        this.props.onRequestCloseFile();
        this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning),
            function (ready) {
                if (ready) {
                    this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
                }
            }.bind(this)
        );
    }
    handleClickRemix () {
        this.props.onClickRemix();
        this.props.onRequestCloseFile();
    }
    handleClickSave () {
        this.props.onClickSave();
        this.props.onRequestCloseFile();
    }
    handleClickSaveAsCopy () {
        this.props.onClickSaveAsCopy();
        this.props.onRequestCloseFile();
    }
    handleKeyPress (event) {
        const modifier = bowser.mac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key === 's') {
            this.props.onClickSave();
            event.preventDefault();
        }
    }
    async handleSaveToComputer () {
        this.props.onRequestCloseFile();
        try {
            // Gather AI data from localStorage for .flynt bundle
            var aiData = {};
            try {
                var trainingRaw = localStorage.getItem('ai_training_data');
                if (trainingRaw) aiData.training = JSON.parse(trainingRaw);
                var sessionRaw = localStorage.getItem('ai_session');
                if (sessionRaw) aiData.session = JSON.parse(sessionRaw);
                var prov = localStorage.getItem('ai_provider') || '';
                aiData.settings = {
                    provider: prov,
                    model: localStorage.getItem(prov + '_model') || '',
                    trainingEnabled: localStorage.getItem('ai_training_enabled')
                };
            } catch (_) {}

            var deviceData = this.props.selectedDevice ? {
                deviceId: this.props.selectedDevice.deviceId,
                name: this.props.selectedDevice.name,
                manufactor: this.props.selectedDevice.manufactor
            } : null;

            // Gather live AI conversation + generated media for the .flynt bundle
            try {
                var liveMessages = getSharedMessages();
                var convData = await serializeConversation(liveMessages);
                if (convData.conversation.length > 0) {
                    aiData.conversation = convData.conversation;
                    aiData.media = convData.media;
                }
            } catch (_) {}

            // Robotics program (tabs control/circuitos) → second project file
            var controlProgram = null;
            try {
                if (controlVm && controlVm.toJSON) {
                    controlProgram = controlVm.toJSON();
                }
            } catch (_) {}

            const content = await this.props.vm.saveProjectFlynt(aiData, deviceData, controlProgram);
            // Blob -> bytes (new Uint8Array(blob) produces an empty array, so read the ArrayBuffer first)
            const contentBytes = Array.from(new Uint8Array(await content.arrayBuffer()));
            const filename = this.getProjectFilename();

            const defaultPath = localStorage.getItem('scratchDefaultPath');
            const defaultPathEnabled = localStorage.getItem('scratchDefaultPathEnabled') === 'true';

            if (defaultPathEnabled && defaultPath) {
                const filePath = `${defaultPath}\\${filename}`;
                await invoke('save_file', { path: filePath, content: contentBytes });
            } else {
                const filePath = await save({
                    defaultPath: filename,
                    filters: [{ name: 'Flynt Project', extensions: ['flynt'] }]
                });
                if (filePath) {
                    await invoke('save_file', { path: filePath, content: contentBytes });
                }
            }
        } catch (e) {
            if (e instanceof Error && e.message === 'NotInvoking') {
                // User cancelled the dialog
                return;
            }
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Tauri save not available, using browser download fallback:', e);
            }
        }
        if (this.props.onProjectTelemetryEvent) {
            const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
            this.props.onProjectTelemetryEvent('projectDidSave', metadata);
        }
    }

    getProjectFilename () {
        let filenameTitle = this.props.projectTitle;
        if (!filenameTitle || filenameTitle.length === 0) {
            filenameTitle = this.props.intl.formatMessage(sharedMessages.scratchProject);
        }
        return `${filenameTitle.substring(0, 100)}.flynt`;
    }
    buildAboutMenu (onClickAbout) {
        if (!onClickAbout) {
            // hide the button
            return null;
        }
        if (typeof onClickAbout === 'function') {
            // make a button which calls a function
            return <AboutButton onClick={onClickAbout} />;
        }
        // assume it's an array of objects
        // each item must have a 'title' FormattedMessage and a 'handleClick' function
        // generate a menu with items for each object in the array
        return (
            <div
                className={classNames(styles.menuBarItem, styles.hoverable, {
                    [styles.active]: this.props.aboutMenuOpen
                })}
                onMouseUp={this.props.onRequestOpenAbout}
            >
                <img
                    className={styles.aboutIcon}
                    src={aboutIcon}
                />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    open={this.props.aboutMenuOpen}
                    place={this.props.isRtl ? 'right' : 'left'}
                    onRequestClose={this.props.onRequestCloseAbout}
                >
                    {
                        onClickAbout.map(itemProps => (
                            <MenuItem
                                key={itemProps.title}
                                isRtl={this.props.isRtl}
                                onClick={this.wrapAboutMenuCallback(itemProps.onClick)}
                            >
                                {itemProps.title}
                            </MenuItem>
                        ))
                    }
                </MenuBarMenu>
            </div>
        );
    }
    wrapAboutMenuCallback (callback) {
        return () => {
            callback();
            this.props.onRequestCloseAbout();
        };
    }
    render () {
        const saveNowMessage = (
            <FormattedMessage
                defaultMessage="Save now"
                description="Menu bar item for saving now"
                id="gui.menuBar.saveNow"
            />
        );
        const createCopyMessage = (
            <FormattedMessage
                defaultMessage="Save as a copy"
                description="Menu bar item for saving as a copy"
                id="gui.menuBar.saveAsCopy"
            />
        );
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const newProjectMessage = (
            <FormattedMessage
                defaultMessage="New"
                description="Menu bar item for creating a new project"
                id="gui.menuBar.new"
            />
        );
        // Show the About button only if we have a handler for it (like in the desktop app)
        const aboutButton = this.buildAboutMenu(this.props.onClickAbout);
        return (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar
                )}
            >
                <div className={styles.mainMenu}>
                    <div className={styles.fileGroup}>
                        {(this.props.canChangeTheme || this.props.canChangeLanguage) && (<SettingsMenu
                            canChangeLanguage={this.props.canChangeLanguage}
                            canChangeTheme={this.props.canChangeTheme}
                            isRtl={this.props.isRtl}
                            onRequestClose={this.props.onRequestCloseSettings}
                            onRequestOpen={this.props.onClickSettings}
                            settingsMenuOpen={this.props.settingsMenuOpen}
                        />)}
                        {(this.props.canManageFiles) && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.fileMenuOpen
                                })}
                                onMouseUp={this.props.onClickFile}
                            >
                                <img src={fileIcon} />
                                <span className={styles.collapsibleLabel}>
                                    <FormattedMessage
                                        defaultMessage="File"
                                        description="Text for file dropdown menu"
                                        id="gui.menuBar.file"
                                    />
                                </span>
                                <img src={dropdownCaret} />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.fileMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                    onRequestClose={this.props.onRequestCloseFile}
                                >
                                    <MenuSection>
                                        <MenuItem
                                            isRtl={this.props.isRtl}
                                            onClick={this.handleClickNew}
                                        >
                                            {newProjectMessage}
                                        </MenuItem>
                                    </MenuSection>
                                    {(this.props.canSave || this.props.canCreateCopy || this.props.canRemix) && (
                                        <MenuSection>
                                            {this.props.canSave && (
                                                <MenuItem onClick={this.handleClickSave}>
                                                    {saveNowMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canCreateCopy && (
                                                <MenuItem onClick={this.handleClickSaveAsCopy}>
                                                    {createCopyMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canRemix && (
                                                <MenuItem onClick={this.handleClickRemix}>
                                                    {remixMessage}
                                                </MenuItem>
                                            )}
                                        </MenuSection>
                                    )}
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.props.onStartSelectingFileUpload}
                                        >
                                            {this.props.intl.formatMessage(sharedMessages.loadFromComputerTitle)}
                                        </MenuItem>
                                        <MenuItem onClick={this.handleSaveToComputer}>
                                            <FormattedMessage
                                                defaultMessage="Save to your computer"
                                                description="Menu bar item for downloading a project to your computer" // eslint-disable-line max-len
                                                id="gui.menuBar.downloadToComputer"
                                            />
                                        </MenuItem>
                                    </MenuSection>
                                </MenuBarMenu>
                            </div>
                        )}

                        {ELECTRONICS_TABS.indexOf(this.props.activeTabId) !== -1 && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable)}
                                onMouseUp={this.props.onRequestOpenDeviceLibrary}
                            >
                                <img className={styles.deviceIconImg} src={this.props.selectedDevice ? this.props.selectedDevice.iconURL : deviceIcon} />
                                <span className={classNames(styles.collapsibleLabel)}>
                                    {this.props.selectedDevice ? this.props.selectedDevice.name : this.props.intl.formatMessage(sharedMessages.selectDevice)}
                                </span>
                            </div>
                        )}

                    </div>
                </div>
                {this.props.canEditTitle ? (
                    <div className={classNames(styles.menuBarItem, styles.titleFieldCentered)}>
                        <MenuBarItemTooltip
                            enable
                            id="title-field"
                        >
                            <ProjectTitleInput />
                        </MenuBarItemTooltip>
                    </div>
                ) : ((this.props.authorUsername && this.props.authorUsername !== this.props.username) ? (
                    <AuthorInfo
                        className={styles.authorInfo}
                        imageUrl={this.props.authorThumbnailUrl}
                        projectTitle={this.props.projectTitle}
                        userId={this.props.authorId}
                        username={this.props.authorUsername}
                    />
                ) : null)}
                <div className={styles.accountInfoGroup} />

                {aboutButton}
            </Box>
        );
    }
}

MenuBar.propTypes = {
    aboutMenuOpen: PropTypes.bool,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    activeTabId: PropTypes.string,
    canSave: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    fileMenuOpen: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickFile: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onClickSettings: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseAbout: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpenDeviceLibrary: PropTypes.func,
    onRequestOpenAbout: PropTypes.func,
    selectedDevice: PropTypes.shape({
        name: PropTypes.string
    }),
    onStartSelectingFileUpload: PropTypes.func,
    projectTitle: PropTypes.string,
    settingsMenuOpen: PropTypes.bool,
    username: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired
};



const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user = state.session && state.session.session && state.session.session.user;
    return {
        aboutMenuOpen: aboutMenuOpen(state),
        fileMenuOpen: fileMenuOpen(state),
        isRtl: state.locales.isRtl,
        locale: state.locales.locale,
        projectTitle: state.scratchGui.projectTitle,
        settingsMenuOpen: settingsMenuOpen(state),
        username: user ? user.username : null,
        vm: state.scratchGui.vm,
        selectedDevice: state.scratchGui.device.selectedDevice
    };
};

const mapDispatchToProps = dispatch => ({
    onClickFile: () => dispatch(openFileMenu()),
    onRequestCloseFile: () => dispatch(closeFileMenu()),
    onRequestOpenAbout: () => dispatch(openAboutMenu()),
    onRequestCloseAbout: () => dispatch(closeAboutMenu()),
    onClickSettings: () => dispatch(openSettingsMenu()),
    onRequestCloseSettings: () => dispatch(closeSettingsMenu()),
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickRemix: () => dispatch(remixProject()),
    onClickSave: () => dispatch(manualUpdateProject()),
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy())
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
