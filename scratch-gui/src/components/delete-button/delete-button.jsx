import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './delete-button.css';
import deleteIcon from './icon--delete.svg';

const messages = defineMessages({
    delete: {
        id: 'gui.deleteButton.delete',
        defaultMessage: 'Delete',
        description: 'Accessibility label for delete button'
    }
});

const DeleteButton = props => {
    const {intl, ...rest} = props;
    return (
        <div
            aria-label={rest['aria-label'] || intl.formatMessage(messages.delete)}
            className={classNames(
                styles.deleteButton,
                rest.className
            )}
            role="button"
            tabIndex={rest.tabIndex}
            onClick={rest.onClick}
        >
            <div
                className={classNames(styles.deleteButtonVisible, {
                    [styles.deleteButtonClicked]: rest.isConfirmationModalOpened
                })}
            >
                <img
                    className={styles.deleteIcon}
                    src={deleteIcon}
                />
            </div>
        </div>
    );
};

DeleteButton.propTypes = {
    'aria-label': PropTypes.string,
    className: PropTypes.string,
    intl: intlShape,
    onClick: PropTypes.func.isRequired,
    isConfirmationModalOpened: PropTypes.bool,
    tabIndex: PropTypes.number
};

DeleteButton.defaultProps = {
    tabIndex: 0
};

export default injectIntl(DeleteButton);
