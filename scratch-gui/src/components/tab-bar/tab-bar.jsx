import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import styles from './tab-bar.css';

const TabBar = ({
    tabs,
    activeTabIndex,
    secondaryTabIndex,
    splitPrimaryIndex,
    splitMode,
    onTabClick,
    rtl
}) => {
    const cachedPair = useRef(null);
    const [, rerender] = useState(0);

    if (splitPrimaryIndex != null && secondaryTabIndex != null) {
        cachedPair.current = [splitPrimaryIndex, secondaryTabIndex];
    }

    useEffect(() => {
        if (!splitMode && cachedPair.current) {
            const timer = setTimeout(() => {
                cachedPair.current = null;
                rerender(n => n + 1);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [splitMode]);

    const isExiting = !splitMode && cachedPair.current != null;
    const useFused = splitMode || isExiting;

    const [pA, pB] = useFused && cachedPair.current ?
        cachedPair.current :
        [splitPrimaryIndex, secondaryTabIndex];

    if (!useFused || pA == null || pB == null) {
        return (
            <div className={classNames(styles.tabList, {[styles.rtl]: rtl})}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab.id}
                        className={classNames(styles.tab, {
                            [styles.selected]: i === activeTabIndex
                        })}
                        onClick={() => onTabClick(i)}
                        role="tab"
                        type="button"
                    >
                        {tab.icon && (
                            <img
                                className={styles.tabIcon}
                                draggable={false}
                                src={tab.icon}
                                alt=""
                            />
                        )}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    const splitIndices = [pA, pB].sort((a, b) => a - b);
    const otherIndices = tabs
        .map((_, i) => i)
        .filter(i => !splitIndices.includes(i));
    const isActiveInSplit = activeTabIndex === pA || activeTabIndex === pB;

    return (
        <div className={classNames(styles.tabList, {[styles.rtl]: rtl})}>
            <button
                className={classNames(styles.fusedTab, {
                    [styles.fusedExit]: isExiting,
                    [styles.fusedDimmed]: !isActiveInSplit
                })}
                onClick={() => onTabClick(-1)}
                role="tab"
                type="button"
            >
                <span className={styles.fusedPart}>
                    <img
                        className={styles.fusedIcon}
                        draggable={false}
                        src={tabs[splitIndices[0]].icon}
                        alt=""
                    />
                </span>
                <span className={styles.fusedDivider} />
                <span className={styles.fusedPart}>
                    <img
                        className={styles.fusedIcon}
                        draggable={false}
                        src={tabs[splitIndices[1]].icon}
                        alt=""
                    />
                </span>
            </button>
            {otherIndices.map(otherIdx => (
                <button
                    key={tabs[otherIdx].id}
                    className={classNames(styles.tab, {
                        [styles.dimmed]: isActiveInSplit,
                        [styles.selected]: !isActiveInSplit && otherIdx === activeTabIndex
                    })}
                    onClick={() => onTabClick(otherIdx)}
                    role="tab"
                    type="button"
                >
                    {tabs[otherIdx].icon && (
                        <img
                            className={styles.tabIcon}
                            draggable={false}
                            src={tabs[otherIdx].icon}
                            alt=""
                        />
                    )}
                    <span>{tabs[otherIdx].label}</span>
                </button>
            ))}
        </div>
    );
};

TabBar.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        icon: PropTypes.string
    })).isRequired,
    activeTabIndex: PropTypes.number.isRequired,
    secondaryTabIndex: PropTypes.number,
    splitPrimaryIndex: PropTypes.number,
    splitMode: PropTypes.bool,
    onTabClick: PropTypes.func.isRequired,
    rtl: PropTypes.bool
};

export default React.memo(TabBar);
