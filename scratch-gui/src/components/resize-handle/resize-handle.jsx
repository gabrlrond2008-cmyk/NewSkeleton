import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef} from 'react';
import classNames from 'classnames';

import styles from './resize-handle.css';

var SNAP_POINTS = [1 / 3, 1 / 2, 2 / 3];
var SNAP_THRESHOLD = 0.08;

const ResizeHandle = ({direction, containerRef, onRatioChange, onSwap}) => {
    const draggingRef = useRef(false);
    const rafRef = useRef(null);

    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        draggingRef.current = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }, [direction]);

    const handlePointerMove = useCallback((e) => {
        if (!draggingRef.current || !containerRef.current) return;
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const rect = containerRef.current.getBoundingClientRect();
            const ratio = direction === 'horizontal'
                ? (e.clientX - rect.left) / rect.width
                : (e.clientY - rect.top) / rect.height;
            onRatioChange(Math.max(0.15, Math.min(0.85, ratio)));
            window.dispatchEvent(new Event('resize'));
        });
    }, [direction, containerRef, onRatioChange]);

    const handlePointerUp = useCallback((e) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.dispatchEvent(new Event('resize'));

        // Snap to nearest point if within threshold
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const ratio = direction === 'horizontal'
                ? (e.clientX - rect.left) / rect.width
                : (e.clientY - rect.top) / rect.height;
            for (var si = 0; si < SNAP_POINTS.length; si++) {
                if (Math.abs(ratio - SNAP_POINTS[si]) < SNAP_THRESHOLD) {
                    onRatioChange(SNAP_POINTS[si]);
                    return;
                }
            }
        }
    }, [direction, containerRef, onRatioChange]);

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [handlePointerMove, handlePointerUp]);

    return (
        <div
            className={classNames(styles.handle, styles[direction])}
            onPointerDown={handlePointerDown}
            role="separator"
            tabIndex={0}
        >
            <button
                className={styles.swapButton}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSwap}
                title="Swap panels"
                type="button"
            >
                &#x21C4;
            </button>
        </div>
    );
};

ResizeHandle.propTypes = {
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    containerRef: PropTypes.shape({current: PropTypes.any}).isRequired,
    onRatioChange: PropTypes.func.isRequired,
    onSwap: PropTypes.func
};

ResizeHandle.defaultProps = {
    direction: 'horizontal'
};

export default React.memo(ResizeHandle);
