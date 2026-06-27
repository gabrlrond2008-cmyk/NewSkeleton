import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {buildSearchIndex, searchBlocks} from '../../lib/block-search-index.js';
import styles from './block-search.css';

const BlockSearch = ({workspace, ScratchBlocks, toolboxXML, onSearch}) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    const index = useMemo(() => {
        if (!workspace || !ScratchBlocks) return null;
        return buildSearchIndex(workspace, ScratchBlocks, toolboxXML);
    }, [workspace, ScratchBlocks, toolboxXML]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.length < 2) {
            onSearch('', []);
            return;
        }
        if (!index) return;
        debounceRef.current = setTimeout(() => {
            const res = searchBlocks(index, query);
            onSearch(query, res);
        }, 80);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, index, onSearch]);

    const handleInputChange = useCallback((e) => {
        setQuery(e.target.value);
    }, []);

    const handleClear = useCallback(() => {
        setQuery('');
        onSearch('', []);
        inputRef.current?.focus();
    }, [onSearch]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.inputWrapper}>
                <svg className={styles.icon} viewBox="0 0 24 24" width="12" height="12">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                        fill="currentColor"/>
                </svg>
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    placeholder="Search"
                    value={query}
                    onChange={handleInputChange}
                />
                {query && (
                    <button className={styles.clear} onClick={handleClear} type="button">&times;</button>
                )}
            </div>
        </div>
    );
};

BlockSearch.propTypes = {
    workspace: PropTypes.object,
    ScratchBlocks: PropTypes.object,
    toolboxXML: PropTypes.string,
    onSearch: PropTypes.func
};

export default React.memo(BlockSearch);
