import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {DEFAULT_THEME, HIGH_CONTRAST_THEME, DARK_THEME, themeMap} from '../../lib/themes';
import {persistTheme} from '../../lib/themes/themePersistance';
import {openThemeMenu, themeMenuOpen} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {setTimeTravel} from '../../reducers/time-travel';

import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';

const ThemeMenuItem = props => {
    const themeInfo = themeMap[props.theme];

    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <img
                    className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                    src={check}
                />
                <img
                    className={styles.icon}
                    src={themeInfo.icon}
                />
                <FormattedMessage {...themeInfo.label} />
            </div>
        </MenuItem>);
};

ThemeMenuItem.propTypes = {
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    theme: PropTypes.string
};

const TimeTravelMenuItem = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                src={check}
            />
            <span className={styles.submenuLabel}>{props.label}</span>
        </div>
    </MenuItem>
);

TimeTravelMenuItem.propTypes = {
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    label: PropTypes.node
};

const ThemeMenu = ({
    isRtl,
    menuOpen,
    onChangeTheme,
    onRequestOpen,
    onRequestCloseSettings,
    theme,
    timeTravelMode,
    onSetMode
}) => {
    const enabledThemes = [DEFAULT_THEME, DARK_THEME, HIGH_CONTRAST_THEME];
    const themeInfo = themeMap[theme];

    const handleSetMode = mode => e => {
        e.stopPropagation();
        onSetMode(mode);
        onRequestCloseSettings();
    };

    return (
        <MenuItem expanded={menuOpen} onClick={onRequestOpen}>
            <div className={styles.option}>
                <img
                    src={themeInfo.icon}
                    style={{width: 24}}
                />
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Color Mode"
                        description="Color mode sub-menu"
                        id="gui.menuBar.colorMode"
                    />
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                />
            </div>
            <Submenu place={isRtl ? 'left' : 'right'}>
                {enabledThemes.map(enabledTheme => (
                    <ThemeMenuItem
                        key={enabledTheme}
                        isSelected={theme === enabledTheme}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={e => { e.stopPropagation(); onChangeTheme(enabledTheme); }}
                        theme={enabledTheme}
                    />)
                )}
                <div style={{height: 1, background: 'rgba(0,0,0,0.15)', margin: '4px 8px'}} />
                <TimeTravelMenuItem
                    isSelected={timeTravelMode === 'NOW'}
                    onClick={handleSetMode('NOW')}
                    label={
                        <FormattedMessage
                            defaultMessage="Normal"
                            description="Normal mode option"
                            id="gui.menuBar.normalMode"
                        />
                    }
                />
                <TimeTravelMenuItem
                    isSelected={timeTravelMode === '2020'}
                    onClick={handleSetMode('2020')}
                    label={
                            <FormattedMessage
                                defaultMessage="Caturday"
                                description="Caturday mode option"
                                id="gui.menuBar.caturdayMode"
                            />
                    }
                />
                <TimeTravelMenuItem
                    isSelected={timeTravelMode === '1990'}
                    onClick={handleSetMode('1990')}
                    label={
                        <FormattedMessage
                            defaultMessage="Nineties (1990)"
                            description="Nineties time travel mode"
                            id="gui.menuBar.ninetiesMode"
                        />
                    }
                />
                <TimeTravelMenuItem
                    isSelected={timeTravelMode === '1920'}
                    onClick={handleSetMode('1920')}
                    label={
                        <FormattedMessage
                            defaultMessage="Old Timey (1920)"
                            description="Old Timey vintage time travel mode"
                            id="gui.menuBar.oldtimeyMode"
                        />
                    }
                />
                <TimeTravelMenuItem
                    isSelected={timeTravelMode === '220022BC'}
                    onClick={handleSetMode('220022BC')}
                    label={
                        <FormattedMessage
                            defaultMessage="Prehistoric"
                            description="Prehistoric time travel mode"
                            id="gui.menuBar.prehistoricMode"
                        />
                    }
                />
            </Submenu>
        </MenuItem>
    );
};

ThemeMenu.propTypes = {
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpen: PropTypes.func,
    theme: PropTypes.string,
    timeTravelMode: PropTypes.string,
    onSetMode: PropTypes.func
};

var mapStateToProps = function (state) {
    return {
        isRtl: state.locales.isRtl,
        menuOpen: themeMenuOpen(state),
        theme: state.scratchGui.theme.theme,
        timeTravelMode: state.scratchGui.timeTravel.year
    };
};

var mapDispatchToProps = function (dispatch, ownProps) {
    return {
        dispatch: dispatch,
        onChangeTheme: theme => {
            dispatch(setTheme(theme));
            ownProps.onRequestCloseSettings();
            persistTheme(theme);
        },
        onRequestOpen: () => dispatch(openThemeMenu())
    };
};

var applyModeFilter = function (mode) {
    if (mode === '1920') {
        document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
        document.documentElement.style.height = '100%';
    } else if (mode === '1990') {
        document.documentElement.style.filter = 'hue-rotate(40deg)';
        document.documentElement.style.height = '100%';
    } else {
        document.documentElement.style.filter = '';
        document.documentElement.style.height = '';
    }
};

var mergeProps = function (stateProps, dispatchProps, ownProps) {
    return Object.assign({}, ownProps, stateProps, dispatchProps, {
        onSetMode: function (mode) {
            document.documentElement.dataset.timeTravel = mode;
            applyModeFilter(mode);
            dispatchProps.dispatch(setTimeTravel(mode));
        }
    });
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(ThemeMenu);
