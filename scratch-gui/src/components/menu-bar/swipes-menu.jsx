import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import check from './check.svg';
import {MenuItem, MenuSection, Submenu} from '../menu/menu.jsx';
import {openSwipesMenu, swipesMenuOpen} from '../../reducers/menus.js';
import {setSwipeOrder, setHorizontalSwipeOrder} from '../../reducers/display-settings.js';

import styles from './settings-menu.css';
import dropdownCaret from './dropdown-caret.svg';

const messages = defineMessages({
    swipesMenuLabel: {
        id: 'gui.swipesMenu.menuLabel',
        defaultMessage: 'Swipe Gestures',
        description: 'Swipes submenu in settings menu'
    },
    verticalSection: {
        id: 'gui.swipesMenu.verticalSection',
        defaultMessage: 'Fist Bar (Vertical)',
        description: 'Section header for vertical swipe on Fist bar'
    },
    swipeUpCloseDownOpen: {
        id: 'gui.swipesMenu.swipeUpCloseDownOpen',
        defaultMessage: 'Up: Close / Down: Open',
        description: 'Swipe up to close, swipe down to open'
    },
    swipeUpOpenDownClose: {
        id: 'gui.swipesMenu.swipeUpOpenDownClose',
        defaultMessage: 'Up: Open / Down: Close',
        description: 'Swipe up to open, swipe down to close'
    },
    horizontalSection: {
        id: 'gui.swipesMenu.horizontalSection',
        defaultMessage: 'Sides: Blocks & Simulator (Horizontal)',
        description: 'Section header for horizontal swipe on sides'
    },
    swipeLeftCloseRightOpen: {
        id: 'gui.swipesMenu.swipeLeftCloseRightOpen',
        defaultMessage: 'Left: Close / Right: Open',
        description: 'Swipe left to close, swipe right to open'
    },
    swipeLeftOpenRightClose: {
        id: 'gui.swipesMenu.swipeLeftOpenRightClose',
        defaultMessage: 'Left: Open / Right: Close',
        description: 'Swipe left to open, swipe right to close'
    }
});

const SPANISH_TRANSLATIONS = {
    'gui.swipesMenu.menuLabel': 'Gestos y Swipes',
    'gui.swipesMenu.verticalSection': 'Barra de Fist (Vertical)',
    'gui.swipesMenu.swipeUpCloseDownOpen': 'Arriba cerrar / Abajo abrir (Invertido)',
    'gui.swipesMenu.swipeUpOpenDownClose': 'Arriba abrir / Abajo cerrar (Estándar)',
    'gui.swipesMenu.horizontalSection': 'Lados: Bloques y Simulador (Horizontal)',
    'gui.swipesMenu.swipeLeftCloseRightOpen': 'Izq. cerrar / Der. abrir (Por defecto)',
    'gui.swipesMenu.swipeLeftOpenRightClose': 'Izq. abrir / Der. cerrar (Invertido)'
};

function formatMsg(intl, msgDescriptor) {
    var locale = (intl && intl.locale) ? intl.locale.split('-')[0].toLowerCase() : 'en';
    if (locale === 'es' && SPANISH_TRANSLATIONS[msgDescriptor.id]) {
        return SPANISH_TRANSLATIONS[msgDescriptor.id];
    }
    return intl ? intl.formatMessage(msgDescriptor) : msgDescriptor.defaultMessage;
}

const SwipesIcon = () => (
    <svg
        style={{width: 20, height: 20, flexShrink: 0}}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M7 15l5 5 5-5" />
        <path d="M7 9l5-5 5 5" />
    </svg>
);

const SectionHeader = ({title}) => (
    <div
        style={{
            padding: '6px 14px 4px 14px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#64748b',
            userSelect: 'none'
        }}
    >
        {title}
    </div>
);

SectionHeader.propTypes = {
    title: PropTypes.node.isRequired
};

const SwipesMenuItem = ({isSelected, label, onClick}) => (
    <MenuItem onClick={onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: isSelected})}
                src={check}
            />
            <span className={styles.submenuLabel}>{label}</span>
        </div>
    </MenuItem>
);

SwipesMenuItem.propTypes = {
    isSelected: PropTypes.bool,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired
};

const SwipesMenu = ({
    intl,
    isRtl,
    menuOpen,
    onRequestOpen,
    onRequestCloseSettings,
    swipeOrder,
    horizontalSwipeOrder,
    onSetSwipeOrder,
    onSetHorizontalSwipeOrder
}) => {
    const handleSelectSwipeOrder = useCallback(newOrder => e => {
        e.stopPropagation();
        if (newOrder === swipeOrder) return;
        onSetSwipeOrder(newOrder);
        onRequestCloseSettings();
    }, [swipeOrder, onSetSwipeOrder, onRequestCloseSettings]);

    const handleSelectHorizontalSwipeOrder = useCallback(newOrder => e => {
        e.stopPropagation();
        if (newOrder === horizontalSwipeOrder) return;
        onSetHorizontalSwipeOrder(newOrder);
        onRequestCloseSettings();
    }, [horizontalSwipeOrder, onSetHorizontalSwipeOrder, onRequestCloseSettings]);

    return (
        <MenuItem expanded={menuOpen} onClick={onRequestOpen}>
            <div className={styles.option}>
                <SwipesIcon />
                <span className={styles.submenuLabel}>
                    {formatMsg(intl, messages.swipesMenuLabel)}
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                />
            </div>
            <Submenu place={isRtl ? 'left' : 'right'}>
                {/* 1. Fist Bar (Vertical) */}
                <MenuSection>
                    <SectionHeader title={formatMsg(intl, messages.verticalSection)} />
                    <SwipesMenuItem
                        isSelected={swipeOrder === 'up-close-down-open'}
                        label={formatMsg(intl, messages.swipeUpCloseDownOpen)}
                        onClick={handleSelectSwipeOrder('up-close-down-open')}
                    />
                    <SwipesMenuItem
                        isSelected={swipeOrder === 'up-open-down-close'}
                        label={formatMsg(intl, messages.swipeUpOpenDownClose)}
                        onClick={handleSelectSwipeOrder('up-open-down-close')}
                    />
                </MenuSection>

                {/* 2. Sides: Blocks & Simulator (Horizontal) */}
                <MenuSection>
                    <SectionHeader title={formatMsg(intl, messages.horizontalSection)} />
                    <SwipesMenuItem
                        isSelected={horizontalSwipeOrder === 'left-close-right-open'}
                        label={formatMsg(intl, messages.swipeLeftCloseRightOpen)}
                        onClick={handleSelectHorizontalSwipeOrder('left-close-right-open')}
                    />
                    <SwipesMenuItem
                        isSelected={horizontalSwipeOrder === 'left-open-right-close'}
                        label={formatMsg(intl, messages.swipeLeftOpenRightClose)}
                        onClick={handleSelectHorizontalSwipeOrder('left-open-right-close')}
                    />
                </MenuSection>
            </Submenu>
        </MenuItem>
    );
};

SwipesMenu.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onRequestOpen: PropTypes.func.isRequired,
    onRequestCloseSettings: PropTypes.func.isRequired,
    swipeOrder: PropTypes.string,
    horizontalSwipeOrder: PropTypes.string,
    onSetSwipeOrder: PropTypes.func.isRequired,
    onSetHorizontalSwipeOrder: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    menuOpen: swipesMenuOpen(state),
    swipeOrder: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.swipeOrder : 'up-close-down-open',
    horizontalSwipeOrder: state.scratchGui.displaySettings ? state.scratchGui.displaySettings.horizontalSwipeOrder : 'left-close-right-open'
});

const mapDispatchToProps = dispatch => ({
    onRequestOpen: () => dispatch(openSwipesMenu()),
    onSetSwipeOrder: order => dispatch(setSwipeOrder(order)),
    onSetHorizontalSwipeOrder: order => dispatch(setHorizontalSwipeOrder(order))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(SwipesMenu));
