import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import styles from './tab-3d.css';

var Tab3DComponent = function (props) {
    return (
        <Box className={styles.container}>
            <div className={styles.placeholder}>
                <svg viewBox="0 0 24 24" width="48" height="48" className={styles.icon}>
                    <path d="M21 5v14H3V5h18zm-1 1H4v12h16V6zm-8 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 1.5c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zm0 5c-1.93 0-3.5-1.57-3.5-3.5S9.07 7.5 11 7.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="#999"/>
                </svg>
                <h2 className={styles.title}>3D</h2>
                <p className={styles.subtitle}>Próximamente</p>
            </div>
        </Box>
    );
};

Tab3DComponent.propTypes = {
    vm: PropTypes.object
};

export default Tab3DComponent;
