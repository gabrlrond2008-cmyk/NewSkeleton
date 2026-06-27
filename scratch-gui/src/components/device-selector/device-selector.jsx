import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from './device-selector.css';

const ANIMATION_DURATION = 300;

const DeviceSelector = ({
    deviceData,
    onRequestClose,
    onDeviceSelected,
    title,
    visible
}) => {
    const [phase, setPhase] = React.useState('hidden');
    const timerRef = React.useRef(null);
    const rafRef = React.useRef(null);

    React.useEffect(() => {
        if (visible && phase === 'hidden') {
            setPhase('entering');

            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = requestAnimationFrame(() => {
                    setPhase('visible');
                    rafRef.current = null;
                });
            });
        } else if (!visible && (phase === 'visible' || phase === 'entering')) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            setPhase('exiting');
            timerRef.current = setTimeout(() => {
                setPhase('hidden');
                timerRef.current = null;
            }, ANIMATION_DURATION);
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [visible]);

    const handleSelect = device => {
        onDeviceSelected(device);
        onRequestClose();
    };

    if (phase === 'hidden') return null;

    const panelOpen = phase === 'visible';
    const backdropVisible = phase === 'visible';

    return (
        <div className={styles.overlay}>
            <div
                className={classNames(styles.backdrop, {
                    [styles.backdropVisible]: backdropVisible
                })}
                onClick={onRequestClose}
            />
            <div
                className={classNames(styles.panel, {
                    [styles.panelOpen]: panelOpen
                })}
                role="dialog"
            >
                <div className={styles.header}>
                    <span className={styles.headerTitle}>{title}</span>
                    <button
                        className={styles.closeButton}
                        onClick={onRequestClose}
                    >
                        &times;
                    </button>
                </div>
                <div className={styles.grid}>
                    {deviceData.map((device, index) => (
                        <div
                            className={styles.card}
                            key={device.deviceId || index}
                            onClick={() => handleSelect(device)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') handleSelect(device); }}
                        >
                            <div className={styles.cardImageWrapper}>
                                {device.iconURL && (
                                    <img
                                        className={styles.cardImage}
                                        src={device.iconURL}
                                        alt={device.name}
                                    />
                                )}
                            </div>
                            <div className={styles.cardName}>{device.name}</div>
                            {device.manufactor && (
                                <div className={styles.cardManufactor}>{device.manufactor}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

DeviceSelector.propTypes = {
    deviceData: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        deviceId: PropTypes.string.isRequired,
        iconURL: PropTypes.string,
        manufactor: PropTypes.string,
        description: PropTypes.string
    })).isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onDeviceSelected: PropTypes.func.isRequired,
    title: PropTypes.string,
    visible: PropTypes.bool
};

DeviceSelector.defaultProps = {
    title: 'Select Device',
    visible: false
};

export default DeviceSelector;
