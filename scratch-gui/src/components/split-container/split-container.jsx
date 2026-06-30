import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import ResizeHandle from '../resize-handle/resize-handle.jsx';
import styles from './split-container.css';

var SplitContainer = function (props) {
    var panels = props.panels;
    var primaryIndex = props.primaryIndex;
    var secondaryIndex = props.secondaryIndex;
    var splitMode = props.splitMode;
    var splitRatio = props.splitRatio;
    var splitDirection = props.splitDirection;
    var onRatioChange = props.onRatioChange;
    var onCloseSecondary = props.onCloseSecondary;
    var onSwap = props.onSwap;

    var containerRef = useRef(null);
    var [exiting, setExiting] = useState(false);
    var rafRef = useRef(null);

    var hasSecondary = splitMode && secondaryIndex != null && secondaryIndex !== primaryIndex;

    var handleClose = useCallback(function () {
        setExiting(true);
        setTimeout(function () {
            onCloseSecondary();
            setExiting(false);
        }, 200);
    }, [onCloseSecondary]);

    var handleRatioChange = useCallback(function (ratio) {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(function () {
            rafRef.current = null;
            onRatioChange(ratio);
        });
    }, [onRatioChange]);

    useEffect(function () {
        window.dispatchEvent(new Event('resize'));
    }, [splitMode, primaryIndex, secondaryIndex]);

    // Route wheel events to the scroll-focused panel instead of letting
    // them bubble to Blockly's document listener.
    useEffect(function () {
        var el = containerRef.current;
        if (!el) return;
        var handler = function (e) {
            if (e.target.closest('.blocklySvg, .blocklyMainWorkspace')) return;
            e.stopPropagation();
        };
        el.addEventListener('wheel', handler, {passive: true});
        return function () { el.removeEventListener('wheel', handler); };
    }, []);

    useEffect(function () {
        return function () {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Single panelStack — ALL panels rendered once, positioned via CSS.
    // No panel ever unmounts, so Blockly workspace / CostumeTab / etc.
    // survive swaps between primary and secondary.
    var percKey = splitDirection === 'vertical' ? 'top' : 'left';
    var percDir = splitDirection === 'vertical' ? 'height' : 'width';
    var primSize = splitRatio;

    return (
        <div
            ref={containerRef}
            className={classNames(
                styles.container,
                styles[splitDirection],
                {[styles.splitActive]: hasSecondary}
            )}
        >
            <div className={styles.panelStack}>
                {panels.map(function (panel, i) {
                    var isPrimary = i === primaryIndex;
                    var isSecondary = hasSecondary && i === secondaryIndex;

                    var panelStyle = {};
                    if (isPrimary) {
                        panelStyle[percKey] = 0;
                        panelStyle[percDir] = (hasSecondary ? primSize : 1) * 100 + '%';
                    } else if (isSecondary) {
                        panelStyle[percKey] = primSize * 100 + '%';
                        panelStyle[percDir] = (1 - primSize) * 100 + '%';
                    }
                    // Hidden panels: no inline styles needed — CSS defaults (top:0;left:0;right:0;bottom:0)
                    // keep them filling the panelStack; opacity/visibility hide them.

                    return (
                        <div
                            key={i}
                            className={classNames(styles.panelItem, {
                                [styles.panelActive]: isPrimary || isSecondary,
                                [styles.panelSecondary]: isSecondary,
                                [styles.secondaryExit]: exiting && isSecondary
                            })}
                            style={panelStyle}
                        >
                            {panel}
                        </div>
                    );
                })}
            </div>
            {hasSecondary && (
                <div
                    className={styles.handleWrapper}
                    style={{
                        [percKey]: primSize * 100 + '%',
                        transform: splitDirection === 'horizontal'
                            ? 'translateX(-50%)'
                            : 'translateY(-50%)'
                    }}
                >
                    <ResizeHandle
                        direction={splitDirection}
                        containerRef={containerRef}
                        onRatioChange={handleRatioChange}
                        onSwap={onSwap}
                    />
                </div>
            )}
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
    onCloseSecondary: PropTypes.func.isRequired,
    onSwap: PropTypes.func
};

SplitContainer.defaultProps = {
    splitMode: false,
    splitRatio: 0.5,
    splitDirection: 'horizontal'
};

export default React.memo(SplitContainer);
