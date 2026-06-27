import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import caturdayIcon from './icon--caturday.svg';
import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {DEFAULT_THEME, HIGH_CONTRAST_THEME, themeMap} from '../../lib/themes';
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

const ThemeMenu = ({
    isRtl,
    menuOpen,
    onChangeTheme,
    onRequestOpen,
    theme,
    caturdayMode,
    onToggleCaturday
}) => {
    const enabledThemes = [DEFAULT_THEME, HIGH_CONTRAST_THEME];
    const themeInfo = themeMap[theme];

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
                <MenuItem onClick={function (e) { e.stopPropagation(); onToggleCaturday(); }}>
                    <div className={styles.option}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: caturdayMode})}
                            src={check}
                        />
                        <img className={styles.icon} src={caturdayIcon} />
                        <span className={styles.submenuLabel}>Caturday</span>
                    </div>
                </MenuItem>
            </Submenu>
        </MenuItem>
    );
};

ThemeMenu.propTypes = {
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    onRequestCloseSettings: PropTypes.func,
    onRequestOpen: PropTypes.func,
    theme: PropTypes.string,
    caturdayMode: PropTypes.bool,
    onToggleCaturday: PropTypes.func
};

var mapStateToProps = function (state) {
    return {
        isRtl: state.locales.isRtl,
        menuOpen: themeMenuOpen(state),
        theme: state.scratchGui.theme.theme,
        caturdayMode: state.scratchGui.timeTravel.year === '2020'
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

var mergeProps = function (stateProps, dispatchProps, ownProps) {
    return Object.assign({}, ownProps, stateProps, dispatchProps, {
        onToggleCaturday: function () {
            dispatchProps.dispatch(setTimeTravel(
                stateProps.caturdayMode ? 'NOW' : '2020'
            ));
        }
    });
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(ThemeMenu);
