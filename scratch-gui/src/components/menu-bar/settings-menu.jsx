import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState, useEffect, useCallback} from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';


import AiMenu from './ai-menu.jsx';
import LanguageMenu from './language-menu.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import ThemeMenu from './theme-menu.jsx';
import {MenuItem, MenuSection, Submenu} from '../menu/menu.jsx';
import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';
import settingsIcon from './icon--settings.svg';
import {setReducedMotion} from '../../reducers/animations';

const LS_DEFAULT_PATH = 'scratchDefaultPath';
const LS_DEFAULT_PATH_ENABLED = 'scratchDefaultPathEnabled';

var SettingsMenu = ({
    canChangeLanguage,
    canChangeTheme,
    isRtl,
    onRequestClose,
    onRequestOpen,
    settingsMenuOpen,
    reducedMotion,
    onSetReducedMotion
}) => {
    const [defaultPath, setDefaultPath] = useState(() => localStorage.getItem(LS_DEFAULT_PATH) || '');
    const [defaultPathEnabled, setDefaultPathEnabled] = useState(
        () => localStorage.getItem(LS_DEFAULT_PATH_ENABLED) === 'true'
    );

    useEffect(() => {
        localStorage.setItem(LS_DEFAULT_PATH, defaultPath);
    }, [defaultPath]);

    useEffect(() => {
        localStorage.setItem(LS_DEFAULT_PATH_ENABLED, defaultPathEnabled ? 'true' : '');
    }, [defaultPathEnabled]);

    const handleToggleDefaultPath = useCallback(() => {
        setDefaultPathEnabled(prev => !prev);
    }, []);

    const handleSelectDefaultFolder = useCallback(async () => {
        try {
            const {open} = await import('@tauri-apps/plugin-dialog');
            const selected = await open({directory: true, multiple: false});
            if (selected) {
                setDefaultPath(selected);
            }
        } catch (e) {
            console.warn('Folder picker not available:', e);
        }
    }, []);

    const handleToggleReducedMotion = useCallback(() => {
        onSetReducedMotion(!reducedMotion);
    }, [reducedMotion, onSetReducedMotion]);

    return (
        <div
            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, {
                [menuBarStyles.active]: settingsMenuOpen
            })}
            onMouseUp={onRequestOpen}
        >
            <img
                src={settingsIcon}
            />
            <span className={styles.dropdownLabel}>
                <FormattedMessage
                    defaultMessage="Settings"
                    description="Settings menu"
                    id="gui.menuBar.settings"
                />
            </span>
            <img src={dropdownCaret} />
            <MenuBarMenu
                className={menuBarStyles.menuBarMenu}
                open={settingsMenuOpen}
                place={isRtl ? 'left' : 'right'}
                onRequestClose={onRequestClose}
            >
                <MenuSection>
                    {canChangeLanguage && <LanguageMenu onRequestCloseSettings={onRequestClose} />}
                    {canChangeTheme && <ThemeMenu onRequestCloseSettings={onRequestClose} />}
                    <AiMenu onRequestCloseSettings={onRequestClose} />
                </MenuSection>
                <MenuSection>
                    <MenuItem onClick={handleToggleReducedMotion}>
                        <div className={styles.option}>
                            <span style={{display: 'inline-block', width: '1.5rem', textAlign: 'center'}}>
                                {reducedMotion ? '\u2713' : '\u00A0'}
                            </span>
                            <span className={styles.submenuLabel}>
                                <FormattedMessage
                                    defaultMessage="Rendimiento (sin animaciones)"
                                    description="Toggle to disable animations for performance"
                                    id="gui.menuBar.reducedMotion"
                                />
                            </span>
                        </div>
                    </MenuItem>
                </MenuSection>
                <MenuSection>
                    <MenuItem onClick={() => setDefaultPathEnabled(prev => !prev)}>
                        <div className={styles.option}>
                            <span style={{display: 'inline-block', width: '1.5rem', textAlign: 'center'}}>
                                {defaultPathEnabled ? '\u2713' : '\u00A0'}
                            </span>
                            <span className={styles.submenuLabel}>
                                <FormattedMessage
                                    defaultMessage="Default save path"
                                    description="Toggle for default save path"
                                    id="gui.menuBar.defaultSavePath"
                                />
                            </span>
                            {defaultPathEnabled && (
                                <img className={styles.expandCaret} src={dropdownCaret} />
                            )}
                        </div>
                        <Submenu
                            place={isRtl ? 'left' : 'right'}
                            style={!defaultPathEnabled ? {
                                opacity: 0,
                                transform: 'scaleX(0)',
                                pointerEvents: 'none'
                            } : undefined}
                        >
                            <MenuItem
                                key="select-folder"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleSelectDefaultFolder();
                                }}
                            >
                                <span style={{display: 'inline-block', width: '1.5rem'}} />
                                {defaultPath ? (
                                    <span>{defaultPath}</span>
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Select folder..."
                                        description="Button to select default save folder"
                                        id="gui.menuBar.selectFolder"
                                    />
                                )}
                            </MenuItem>
                        </Submenu>
                    </MenuItem>
                </MenuSection>
            </MenuBarMenu>
        </div>
    );
};

SettingsMenu.propTypes = {
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    isRtl: PropTypes.bool,
    onRequestClose: PropTypes.func,
    onRequestOpen: PropTypes.func,
    settingsMenuOpen: PropTypes.bool,
    reducedMotion: PropTypes.bool,
    onSetReducedMotion: PropTypes.func
};

var mapStateToProps = function (state) {
    return {
        reducedMotion: state.scratchGui.animations.reducedMotion
    };
};

var mapDispatchToProps = function (dispatch) {
    return {
        onSetReducedMotion: function (value) {
            dispatch(setReducedMotion(value));
        }
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsMenu);
