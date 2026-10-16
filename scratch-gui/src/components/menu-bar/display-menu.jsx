import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';

import check from './check.svg';
import {MenuItem, MenuSection, Submenu} from '../menu/menu.jsx';
import {openDisplayMenu, displayMenuOpen, openSwipesMenu, swipesMenuOpen} from '../../reducers/menus.js';
import {
    setBlocksPosition,
    setAiBarPosition,
    setStagePosition,
    setBlocksAnimating,
    setSwipeOrder,
    setHorizontalSwipeOrder
} from '../../reducers/display-settings.js';

import styles from './settings-menu.css';
import dropdownCaret from './dropdown-caret.svg';

const messages = defineMessages({
    displayMenuLabel: {
        id: 'gui.displayMenu.menuLabel',
        defaultMessage: 'Display',
        description: 'Display submenu in settings menu'
    },
    blocksSection: {
        id: 'gui.displayMenu.blocksSection',
        defaultMessage: 'Blocks Palette',
        description: 'Section header for blocks position'
    },
    blocksLeft: {
        id: 'gui.displayMenu.blocksLeft',
        defaultMessage: 'Left (Default)',
        description: 'Blocks palette positioned on the left'
    },
    blocksRight: {
        id: 'gui.displayMenu.blocksRight',
        defaultMessage: 'Right',
        description: 'Blocks palette positioned on the right'
    },
    aiBarSection: {
        id: 'gui.displayMenu.aiBarSection',
        defaultMessage: 'Fist Assistant Bar',
        description: 'Section header for Fist assistant bar position'
    },
    aiBarBottom: {
        id: 'gui.displayMenu.aiBarBottom',
        defaultMessage: 'Bottom (Default)',
        description: 'Fist bar positioned at the bottom'
    },
    aiBarTop: {
        id: 'gui.displayMenu.aiBarTop',
        defaultMessage: 'Top',
        description: 'Fist bar positioned at the top'
    },
    stageSection: {
        id: 'gui.displayMenu.stageSection',
        defaultMessage: 'Stage / Simulation',
        description: 'Section header for stage position'
    },
    stageRight: {
        id: 'gui.displayMenu.stageRight',
        defaultMessage: 'Right (Default)',
        description: 'Stage positioned on the right'
    },
    stageLeft: {
        id: 'gui.displayMenu.stageLeft',
        defaultMessage: 'Left',
        description: 'Stage positioned on the left'
    },
    swipesMenuLabel: {
        id: 'gui.displayMenu.swipesMenuLabel',
        defaultMessage: 'Swipe Gestures',
        description: 'Swipes submenu in display menu'
    },
    verticalSection: {
        id: 'gui.displayMenu.verticalSection',
        defaultMessage: 'Fist Bar (Vertical)',
        description: 'Section header for vertical swipe on Fist bar'
    },
    swipeUpCloseDownOpen: {
        id: 'gui.displayMenu.swipeUpCloseDownOpen',
        defaultMessage: 'Up: Close / Down: Open',
        description: 'Swipe up to close, swipe down to open'
    },
    swipeUpOpenDownClose: {
        id: 'gui.displayMenu.swipeUpOpenDownClose',
        defaultMessage: 'Up: Open / Down: Close',
        description: 'Swipe up to open, swipe down to close'
    },
    horizontalSection: {
        id: 'gui.displayMenu.horizontalSection',
        defaultMessage: 'Sides: Blocks & Simulator (Horizontal)',
        description: 'Section header for horizontal swipe on sides'
    },
    swipeLeftCloseRightOpen: {
        id: 'gui.displayMenu.swipeLeftCloseRightOpen',
        defaultMessage: 'Left: Close / Right: Open',
        description: 'Swipe left to close, swipe right to open'
    },
    swipeLeftOpenRightClose: {
        id: 'gui.displayMenu.swipeLeftOpenRightClose',
        defaultMessage: 'Left: Open / Right: Close',
        description: 'Swipe left to open, swipe right to close'
    }
});

const SPANISH_TRANSLATIONS = {
    'gui.displayMenu.menuLabel': 'Visualización',
    'gui.displayMenu.blocksSection': 'Barra de Bloques',
    'gui.displayMenu.blocksLeft': 'Izquierda (Por defecto)',
    'gui.displayMenu.blocksRight': 'Derecha',
    'gui.displayMenu.aiBarSection': 'Barra de Fist (IA)',
    'gui.displayMenu.aiBarBottom': 'Abajo (Por defecto)',
    'gui.displayMenu.aiBarTop': 'Arriba',
    'gui.displayMenu.stageSection': 'Simulación / Escenario',
    'gui.displayMenu.stageRight': 'Derecha (Por defecto)',
    'gui.displayMenu.stageLeft': 'Izquierda',
    'gui.displayMenu.swipesMenuLabel': 'Gestos y Swipes',
    'gui.displayMenu.verticalSection': 'Barra de Fist (Vertical)',
    'gui.displayMenu.swipeUpCloseDownOpen': 'Arriba cerrar / Abajo abrir (Invertido)',
    'gui.displayMenu.swipeUpOpenDownClose': 'Arriba abrir / Abajo cerrar (Estándar)',
    'gui.displayMenu.horizontalSection': 'Lados: Bloques y Simulador (Horizontal)',
    'gui.displayMenu.swipeLeftCloseRightOpen': 'Izq. cerrar / Der. abrir (Por defecto)',
    'gui.displayMenu.swipeLeftOpenRightClose': 'Izq. abrir / Der. cerrar (Invertido)'
};

function formatMsg(intl, msgDescriptor) {
    var locale = (intl && intl.locale) ? intl.locale.split('-')[0].toLowerCase() : 'en';
    if (locale === 'es' && SPANISH_TRANSLATIONS[msgDescriptor.id]) {
        return SPANISH_TRANSLATIONS[msgDescriptor.id];
    }
    return intl ? intl.formatMessage(msgDescriptor) : msgDescriptor.defaultMessage;
}

const DisplayIcon = () => (
    <svg
        style={{width: 20, height: 20, flexShrink: 0}}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

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

const DisplayMenuItem = ({isSelected, label, onClick}) => (
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

DisplayMenuItem.propTypes = {
    isSelected: PropTypes.bool,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired
};

const DisplayMenu = ({
    intl,
    isRtl,
    menuOpen,
    swipesMenuOpen,
    onRequestOpen,
    onRequestCloseSettings,
    blocksPosition,
    aiBarPosition,
    stagePosition,
    swipeOrder,
    horizontalSwipeOrder,
    onSetBlocksPosition,
    onSetAiBarPosition,
    onSetStagePosition,
    onSetBlocksAnimating,
    onSetSwipeOrder,
    onSetHorizontalSwipeOrder,
    onOpenSwipesMenu
}) => {
    // 1. Blocks position switch with 2-stage downward disappear -> upward appear animation
    const handleSelectBlocksPosition = useCallback(newPos => e => {
        e.stopPropagation();
        if (newPos === blocksPosition) return;

        // Stage 1: Slide down offscreen
        onSetBlocksAnimating('exiting-down');

        setTimeout(() => {
            // Re-anchor to new side and prepare entry from below
            onSetBlocksPosition(newPos);
            onSetBlocksAnimating('entering-up');

            setTimeout(() => {
                onSetBlocksAnimating(null);
                window.dispatchEvent(new Event('resize'));
            }, 340);
        }, 280);

        onRequestCloseSettings();
    }, [blocksPosition, onSetBlocksPosition, onSetBlocksAnimating, onRequestCloseSettings]);

    // 2. Fist AI Bar position switch (bottom / top)
    const handleSelectAiBarPosition = useCallback(newPos => e => {
        e.stopPropagation();
        if (newPos === aiBarPosition) return;
        onSetAiBarPosition(newPos);
        onRequestCloseSettings();
    }, [aiBarPosition, onSetAiBarPosition, onRequestCloseSettings]);

    // 3. Stage / VM simulation position switch (right / left)
    const handleSelectStagePosition = useCallback(newPos => e => {
        e.stopPropagation();
        if (newPos === stagePosition) return;
        onSetStagePosition(newPos);
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 120);
        onRequestCloseSettings();
    }, [stagePosition, onSetStagePosition, onRequestCloseSettings]);

    // 4. Gestos / Swipes submenu deployment
    const handleToggleSwipes = useCallback(e => {
        e.stopPropagation();
        onOpenSwipesMenu();
    }, [onOpenSwipesMenu]);

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
                <DisplayIcon />
                <span className={styles.submenuLabel}>
                    {formatMsg(intl, messages.displayMenuLabel)}
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                />
            </div>
            <Submenu place={isRtl ? 'left' : 'right'} className={styles.displaySubmenu}>
                {/* 1. Blocks Position */}
                <MenuSection>
                    <SectionHeader title={formatMsg(intl, messages.blocksSection)} />
                    <DisplayMenuItem
                        isSelected={blocksPosition === 'left'}
                        label={formatMsg(intl, messages.blocksLeft)}
                        onClick={handleSelectBlocksPosition('left')}
                    />
                    <DisplayMenuItem
                        isSelected={blocksPosition === 'right'}
                        label={formatMsg(intl, messages.blocksRight)}
                        onClick={handleSelectBlocksPosition('right')}
                    />
                </MenuSection>

                {/* 2. Fist Assistant Bar */}
                <MenuSection>
                    <SectionHeader title={formatMsg(intl, messages.aiBarSection)} />
                    <DisplayMenuItem
                        isSelected={aiBarPosition === 'bottom'}
                        label={formatMsg(intl, messages.aiBarBottom)}
                        onClick={handleSelectAiBarPosition('bottom')}
                    />
                    <DisplayMenuItem
                        isSelected={aiBarPosition === 'top'}
                        label={formatMsg(intl, messages.aiBarTop)}
                        onClick={handleSelectAiBarPosition('top')}
                    />
                </MenuSection>

                {/* 3. Stage / VM Simulation */}
                <MenuSection>
                    <SectionHeader title={formatMsg(intl, messages.stageSection)} />
                    <DisplayMenuItem
                        isSelected={stagePosition === 'right'}
                        label={formatMsg(intl, messages.stageRight)}
                        onClick={handleSelectStagePosition('right')}
                    />
                    <DisplayMenuItem
                        isSelected={stagePosition === 'left'}
                        label={formatMsg(intl, messages.stageLeft)}
                        onClick={handleSelectStagePosition('left')}
                    />
                </MenuSection>

                {/* 4. Gestos y Swipes (Submenú desplegable desde Display) */}
                <MenuSection>
                    <MenuItem
                        expanded={swipesMenuOpen}
                        onClick={handleToggleSwipes}
                        className={styles.nestedSubmenuItem}
                    >
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
                            {/* Vertical Swipes */}
                            <MenuSection>
                                <SectionHeader title={formatMsg(intl, messages.verticalSection)} />
                                <DisplayMenuItem
                                    isSelected={swipeOrder === 'up-close-down-open'}
                                    label={formatMsg(intl, messages.swipeUpCloseDownOpen)}
                                    onClick={handleSelectSwipeOrder('up-close-down-open')}
                                />
                                <DisplayMenuItem
                                    isSelected={swipeOrder === 'up-open-down-close'}
                                    label={formatMsg(intl, messages.swipeUpOpenDownClose)}
                                    onClick={handleSelectSwipeOrder('up-open-down-close')}
                                />
                            </MenuSection>

                            {/* Horizontal Swipes */}
                            <MenuSection>
                                <SectionHeader title={formatMsg(intl, messages.horizontalSection)} />
                                <DisplayMenuItem
                                    isSelected={horizontalSwipeOrder === 'left-close-right-open'}
                                    label={formatMsg(intl, messages.swipeLeftCloseRightOpen)}
                                    onClick={handleSelectHorizontalSwipeOrder('left-close-right-open')}
                                />
                                <DisplayMenuItem
                                    isSelected={horizontalSwipeOrder === 'left-open-right-close'}
                                    label={formatMsg(intl, messages.swipeLeftOpenRightClose)}
                                    onClick={handleSelectHorizontalSwipeOrder('left-open-right-close')}
                                />
                            </MenuSection>
                        </Submenu>
                    </MenuItem>
                </MenuSection>
            </Submenu>
        </MenuItem>
    );
};

DisplayMenu.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    swipesMenuOpen: PropTypes.bool,
    onRequestOpen: PropTypes.func.isRequired,
    onRequestCloseSettings: PropTypes.func.isRequired,
    blocksPosition: PropTypes.string,
    aiBarPosition: PropTypes.string,
    stagePosition: PropTypes.string,
    swipeOrder: PropTypes.string,
    horizontalSwipeOrder: PropTypes.string,
    onSetBlocksPosition: PropTypes.func.isRequired,
    onSetAiBarPosition: PropTypes.func.isRequired,
    onSetStagePosition: PropTypes.func.isRequired,
    onSetBlocksAnimating: PropTypes.func.isRequired,
    onSetSwipeOrder: PropTypes.func.isRequired,
    onSetHorizontalSwipeOrder: PropTypes.func.isRequired,
    onOpenSwipesMenu: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    menuOpen: displayMenuOpen(state),
    swipesMenuOpen: swipesMenuOpen(state),
    blocksPosition: state.scratchGui.displaySettings.blocksPosition,
    aiBarPosition: state.scratchGui.displaySettings.aiBarPosition,
    stagePosition: state.scratchGui.displaySettings.stagePosition,
    swipeOrder: state.scratchGui.displaySettings.swipeOrder,
    horizontalSwipeOrder: state.scratchGui.displaySettings.horizontalSwipeOrder
});

const mapDispatchToProps = dispatch => ({
    onRequestOpen: () => dispatch(openDisplayMenu()),
    onSetBlocksPosition: pos => dispatch(setBlocksPosition(pos)),
    onSetAiBarPosition: pos => dispatch(setAiBarPosition(pos)),
    onSetStagePosition: pos => dispatch(setStagePosition(pos)),
    onSetBlocksAnimating: anim => dispatch(setBlocksAnimating(anim)),
    onSetSwipeOrder: order => dispatch(setSwipeOrder(order)),
    onSetHorizontalSwipeOrder: order => dispatch(setHorizontalSwipeOrder(order)),
    onOpenSwipesMenu: () => dispatch(openSwipesMenu())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(DisplayMenu));
