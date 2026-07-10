import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import styles from './new-project-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.newProjectModal.title',
        defaultMessage: 'Are you sure?',
        description: 'Title for the new project confirmation modal'
    },
    message: {
        id: 'gui.newProjectModal.message',
        defaultMessage: 'Creating a new project will discard all unsaved changes.',
        description: 'Warning message when creating a new project'
    },
    cancel: {
        id: 'gui.newProjectModal.cancel',
        defaultMessage: 'Cancel',
        description: 'Cancel button on new project modal'
    },
    continue: {
        id: 'gui.newProjectModal.continue',
        defaultMessage: 'Continue',
        description: 'Continue button on new project modal'
    }
});

const NewProjectModal = function ({exiting, intl, onCancel, onConfirm}) {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.blurBackdrop} onClick={onCancel} />
            <div className={classNames(styles.modalContent, {[styles.exit]: exiting})}>
                <div className={styles.headerBar}>
                    {intl.formatMessage(messages.title)}
                </div>
                <div className={styles.body}>
                    <div className={styles.message}>
                        {intl.formatMessage(messages.message)}
                    </div>
                    <div className={styles.buttons}>
                        <button
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={onCancel}
                        >
                            {intl.formatMessage(messages.cancel)}
                        </button>
                        <button
                            className={`${styles.button} ${styles.continueButton}`}
                            onClick={onConfirm}
                        >
                            {intl.formatMessage(messages.continue)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

NewProjectModal.propTypes = {
    exiting: PropTypes.bool,
    intl: intlShape,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
};

export default injectIntl(NewProjectModal);