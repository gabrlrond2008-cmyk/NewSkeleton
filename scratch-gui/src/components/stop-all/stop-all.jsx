import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import stopAllIcon from './icon--stop-all.svg';
import styles from './stop-all.css';

const messages = defineMessages({
    stop: {
        id: 'gui.stopAll.stop',
        defaultMessage: 'Stop',
        description: 'Tooltip for stop all button'
    }
});

const StopAllComponent = function (props) {
    const {
        active,
        className,
        onClick,
        intl,
        title,
        ...componentProps
    } = props;
    return (
        <img
            className={classNames(
                className,
                styles.stopAll,
                {
                    [styles.isActive]: active
                }
            )}
            draggable={false}
            src={stopAllIcon}
            title={title || intl.formatMessage(messages.stop)}
            onClick={onClick}
            {...componentProps}
        />
    );
};

StopAllComponent.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    intl: intlShape,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};

StopAllComponent.defaultProps = {
    active: false
};

export default injectIntl(StopAllComponent);
