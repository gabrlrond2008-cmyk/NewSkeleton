import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import greenFlagIcon from './icon--green-flag.svg';
import styles from './green-flag.css';

const messages = defineMessages({
    go: {
        id: 'gui.greenFlag.go',
        defaultMessage: 'Go',
        description: 'Tooltip for green flag button'
    }
});

const GreenFlagComponent = function (props) {
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
                styles.greenFlag,
                {
                    [styles.isActive]: active
                }
            )}
            draggable={false}
            src={greenFlagIcon}
            title={title || intl.formatMessage(messages.go)}
            onClick={onClick}
            {...componentProps}
        />
    );
};
GreenFlagComponent.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    intl: intlShape,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};
GreenFlagComponent.defaultProps = {
    active: false
};
export default injectIntl(GreenFlagComponent);
