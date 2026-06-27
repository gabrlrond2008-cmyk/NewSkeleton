import PropTypes from 'prop-types';
import React from 'react';

import styles from './watermark.css';

const Watermark = props => (
    props.costumeURL ? (
        <img
            className={styles.spriteImage}
            src={props.costumeURL}
        />
    ) : null
);

Watermark.propTypes = {
    costumeURL: PropTypes.string
};

export default Watermark;
