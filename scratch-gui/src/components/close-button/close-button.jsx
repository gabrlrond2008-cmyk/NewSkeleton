import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './close-button.css';
import closeIcon from './icon--close.svg';
import closeIconOrange from './icon--close-orange.svg';
import backIcon from '../../lib/assets/icon--back.svg';

const messages = defineMessages({
    close: {
        id: 'gui.closeButton.close',
        defaultMessage: 'Close',
        description: 'Accessibility label for close button'
    }
});

let closeIcons = {};

const CloseButton = props => {
    const {intl, ...rest} = props;
    return (
    <div
        aria-label={rest['aria-label'] || intl.formatMessage(messages.close)}
        className={classNames(
            styles.closeButton,
            rest.className,
            {
                [styles.small]: rest.size === CloseButton.SIZE_SMALL,
                [styles.large]: rest.size === CloseButton.SIZE_LARGE,
                [styles.orange]: rest.color === CloseButton.COLOR_ORANGE
            }
        )}
        role="button"
        tabIndex="0"
        onClick={rest.onClick}
    >
        {rest.buttonType === 'back' ?
            <img
                className={styles.backIcon}
                src={backIcon}
            /> :
            <img
                className={classNames(
                    styles.closeIcon,
                    {
                        [styles[rest.color]]: (rest.color !== CloseButton.COLOR_NEUTRAL)
                    }
                )}
                src={(rest.color && closeIcons[rest.color]) ?
                    closeIcons[rest.color] :
                    closeIcon
                }
            />
        }
    </div>
);
};

CloseButton.SIZE_SMALL = 'small';
CloseButton.SIZE_LARGE = 'large';

CloseButton.COLOR_NEUTRAL = 'neutral';
CloseButton.COLOR_GREEN = 'green';
CloseButton.COLOR_ORANGE = 'orange';
closeIcons = {
    [CloseButton.COLOR_NEUTRAL]: closeIcon,
    [CloseButton.COLOR_GREEN]: closeIcon, // TODO: temporary, need green icon
    [CloseButton.COLOR_ORANGE]: closeIconOrange
};


CloseButton.propTypes = {
    'aria-label': PropTypes.string,
    buttonType: PropTypes.oneOf(['back', 'close']),
    className: PropTypes.string,
    color: PropTypes.string,
    intl: intlShape,
    onClick: PropTypes.func.isRequired,
    size: PropTypes.oneOf([CloseButton.SIZE_SMALL, CloseButton.SIZE_LARGE])
};

CloseButton.defaultProps = {
    color: CloseButton.COLOR_NEUTRAL,
    size: CloseButton.SIZE_LARGE,
    buttonType: 'close'
};

export default injectIntl(CloseButton);
