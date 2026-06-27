import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef} from 'react';
import classNames from 'classnames';

import styles from './resize-handle.css';

const ResizeHandle = ({direction, containerRef, onRatioChange}) => {
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
        });
    }, [direction, containerRef, onRatioChange]);

    const handlePointerUp = useCallback(() => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.dispatchEvent(new Event('resize'));
    }, []);

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
        />
    );
};

ResizeHandle.propTypes = {
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    containerRef: PropTypes.shape({current: PropTypes.any}).isRequired,
    onRatioChange: PropTypes.func.isRequired
};

ResizeHandle.defaultProps = {
    direction: 'horizontal'
};

export default React.memo(ResizeHandle);
