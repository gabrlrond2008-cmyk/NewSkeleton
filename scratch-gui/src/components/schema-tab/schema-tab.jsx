import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';
import Box from '../box/box.jsx';
import styles from './schema-tab.css';

var SchemaTabComponent = function (props) {
    var {
        containerRef,
        dragOver,
        ...componentProps
    } = props;
    return (
        <Box
            className={classNames(styles.blocks, {
                [styles.dragOver]: dragOver
            })}
            {...componentProps}
            componentRef={containerRef}
        />
    );
};

SchemaTabComponent.propTypes = {
    containerRef: PropTypes.func,
    dragOver: PropTypes.bool
};

export default SchemaTabComponent;
