import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import styles from './split-context-menu.css';

const TAB_OPTIONS = [
    {index: 1, label: 'Costumes'},
    {index: 2, label: 'Sounds'},
    {index: 3, label: 'AI'}
];

const SplitContextMenu = ({
    visible,
    position,
    activeTabIndex,
    onSelect,
    onClose
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Delay listener to avoid immediate close from the right-click
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible, onClose]);

    if (!visible || !position) return null;

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className={styles.overlay}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className={styles.menu}>
                {TAB_OPTIONS.map(opt => (
                    <button
                        key={opt.index}
                        className={classNames(styles.menuItem, {
                            [styles.menuItemActive]: opt.index === activeTabIndex,
                            [styles.menuItemDisabled]: opt.index === activeTabIndex
                        })}
                        disabled={opt.index === activeTabIndex}
                        onClick={() => {
                            onClose();
                            onSelect(opt.index);
                        }}
                        type="button"
                    >
                        <span className={styles.menuItemIcon}>
                            {opt.index === 1 ? 'C' : opt.index === 2 ? 'S' : 'A'}
                        </span>
                        <span className={styles.menuItemLabel}>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};

SplitContextMenu.propTypes = {
    visible: PropTypes.bool,
    position: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    activeTabIndex: PropTypes.number,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default React.memo(SplitContextMenu);
