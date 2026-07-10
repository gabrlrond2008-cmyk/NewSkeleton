import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import filterIcon from './icon--filter.svg';
import xIcon from './icon--x.svg';
import styles from './filter.css';

const messages = defineMessages({
    search: {
        id: 'gui.filter.search',
        defaultMessage: 'Search',
        description: 'Placeholder text for search/filter input'
    }
});

const FilterComponent = props => {
    const {
        className,
        onChange,
        onClear,
        intl,
        placeholderText,
        filterQuery,
        inputClassName
    } = props;
    return (
        <div
            className={classNames(className, styles.filter, {
                [styles.isActive]: filterQuery.length > 0
            })}
        >
            <img
                className={styles.filterIcon}
                src={filterIcon}
            />
            <input
                className={classNames(styles.filterInput, inputClassName)}
                placeholder={placeholderText || intl.formatMessage(messages.search)}
                type="text"
                value={filterQuery}
                onChange={onChange}
            />
            <div
                className={styles.xIconWrapper}
                onClick={onClear}
            >
                <img
                    className={styles.xIcon}
                    src={xIcon}
                />
            </div>
        </div>
    );
};

FilterComponent.propTypes = {
    className: PropTypes.string,
    filterQuery: PropTypes.string,
    inputClassName: PropTypes.string,
    intl: intlShape,
    onChange: PropTypes.func,
    onClear: PropTypes.func,
    placeholderText: PropTypes.string
};
FilterComponent.defaultProps = {
    placeholderText: undefined
};
export default injectIntl(FilterComponent);
