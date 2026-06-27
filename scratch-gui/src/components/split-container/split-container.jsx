import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import ResizeHandle from '../resize-handle/resize-handle.jsx';
import styles from './split-container.css';

const SplitContainer = ({
    panels,
    primaryIndex,
    secondaryIndex,
    splitMode,
    splitRatio,
    splitDirection,
    onRatioChange,
    onCloseSecondary
}) => {
    const containerRef = useRef(null);
    const [exiting, setExiting] = useState(false);
    const rafRef = useRef(null);

    const handleClose = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setExiting(false);
            onCloseSecondary();
        }, 200);
    }, [onCloseSecondary]);

    const handleRatioChange = useCallback((ratio) => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            onRatioChange(ratio);
        });
    }, [onRatioChange]);

    useEffect(() => {
        window.dispatchEvent(new Event('resize'));
    }, [splitMode]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const hasSecondary = splitMode && secondaryIndex != null && secondaryIndex !== primaryIndex;

    return (
        <div
            ref={containerRef}
            className={classNames(
                styles.container,
                styles[splitDirection],
                {
                    [styles.splitActive]: hasSecondary,
                    [styles.exiting]: exiting
                }
            )}
        >
            <div className={classNames(styles.panel, styles.primaryPanel)} style={{flex: hasSecondary ? splitRatio : 1}}>
                <div className={styles.panelStack}>
                    {panels.map((panel, i) => (
                        <div
                            key={i}
                            className={classNames(styles.panelItem, {
                                [styles.panelActive]: i === primaryIndex
                            })}
                        >
                            {panel}
                        </div>
                    ))}
                </div>
            </div>
            {hasSecondary && (
                <ResizeHandle
                    direction={splitDirection}
                    containerRef={containerRef}
                    onRatioChange={handleRatioChange}
                />
            )}
            <div
                className={classNames(styles.panel, styles.secondaryPanel, {
                    [styles.secondaryExit]: exiting
                })}
                style={{
                    flex: hasSecondary ? 1 - splitRatio : 0,
                    display: hasSecondary ? '' : 'none'
                }}
            >
                <div className={styles.panelStack}>
                    {hasSecondary && secondaryIndex != null && secondaryIndex >= 0 && secondaryIndex < panels.length && (
                        <div className={classNames(styles.panelItem, styles.panelActive)}>
                            {panels[secondaryIndex]}
                        </div>
                    )}
                </div>
                {hasSecondary && (
                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        title="Close split view"
                        type="button"
                    >
                        &times;
                    </button>
                )}
            </div>
        </div>
    );
};

SplitContainer.propTypes = {
    panels: PropTypes.arrayOf(PropTypes.node).isRequired,
    primaryIndex: PropTypes.number.isRequired,
    secondaryIndex: PropTypes.number,
    splitMode: PropTypes.bool,
    splitRatio: PropTypes.number,
    splitDirection: PropTypes.oneOf(['horizontal', 'vertical']),
    onRatioChange: PropTypes.func.isRequired,
    onCloseSecondary: PropTypes.func.isRequired
};

SplitContainer.defaultProps = {
    splitMode: false,
    splitRatio: 0.5,
    splitDirection: 'horizontal'
};

export default React.memo(SplitContainer);
