import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import styles from './ai-select.css';

var AiSelect = function (props) {
    var {value, options, onChange, placeholder} = props;
    var [open, setOpen] = useState(false);
    var [position, setPosition] = useState({top: 0, left: 0});
    var [search, setSearch] = useState('');
    var triggerRef = useRef(null);
    var dropdownRef = useRef(null);
    var searchRef = useRef(null);

    // Focus search input when dropdown opens
    useEffect(function () {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    var selectedLabel = '';
    if (options) {
        for (var i = 0; i < options.length; i++) {
            if (options[i].value === value) {
                selectedLabel = options[i].label;
                break;
            }
        }
    }

    var filtered = options ? options.filter(function (opt) {
        if (opt.disabled) return true;
        if (!search) return true;
        return opt.label.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    }) : [];

    var handleTrigger = useCallback(function () {
        setOpen(function (prev) {
            if (!prev && triggerRef.current) {
                var rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.right + 4
                });
                setSearch('');
            }
            return !prev;
        });
    }, []);

    var handleSelect = useCallback(function (newValue) {
        onChange(newValue);
        setOpen(false);
        setSearch('');
    }, [onChange]);

    var handleSearchKeyDown = useCallback(function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Select first non-disabled filtered option
            for (var fi = 0; fi < filtered.length; fi++) {
                if (!filtered[fi].disabled) {
                    handleSelect(filtered[fi].value);
                    return;
                }
            }
        }
        if (e.key === 'Escape') {
            setOpen(false);
        }
        e.stopPropagation();
    }, [filtered, handleSelect]);

    useEffect(function () {
        if (!open) return;
        function handleMouseDown(e) {
            if (triggerRef.current && triggerRef.current.contains(e.target)) return;
            if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
            setOpen(false);
        }
        function handleKey(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        function handleScrollEvent() {
            if (triggerRef.current) {
                var r = triggerRef.current.getBoundingClientRect();
                setPosition({top: r.top, left: r.right + 4});
            }
        }
        // Evita que mouseup dentro del dropdown cierre menus del menu bar
        function stopMouseUp(e) { e.stopPropagation(); }
        var timer = requestAnimationFrame(function () {
            document.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('keydown', handleKey);
            document.addEventListener('scroll', handleScrollEvent, true);
            if (dropdownRef.current) {
                dropdownRef.current.addEventListener('mouseup', stopMouseUp);
            }
        });
        return function () {
            cancelAnimationFrame(timer);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('scroll', handleScrollEvent, true);
            if (dropdownRef.current) {
                dropdownRef.current.removeEventListener('mouseup', stopMouseUp);
            }
        };
    }, [open]);

    return (
        <div className={styles.wrapper}>
            <button
                ref={triggerRef}
                className={styles.trigger + (open ? ' ' + styles.triggerOpen : '')}
                onClick={handleTrigger}
                type="button"
            >
                <span>{selectedLabel || placeholder || 'Seleccionar...'}</span>
                <span className={styles.arrow}>{'>'}</span>
            </button>
            {open && ReactDOM.createPortal(
                <div
                    ref={dropdownRef}
                    className={styles.dropdown}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left
                    }}
                >
                    <div className={styles.searchWrap}>
                        <input
                            ref={searchRef}
                            className={styles.search}
                            type="text"
                            placeholder="Buscar modelo..."
                            value={search}
                            onChange={function (e) { setSearch(e.target.value); }}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                    <div className={styles.list}>
                        {filtered.length === 0 && (
                            <div className={styles.empty}>Sin resultados</div>
                        )}
                        {filtered.map(function (opt) {
                            if (opt.disabled) {
                                return (
                                    <div key={opt.value} className={styles.separator}>
                                        {opt.label}
                                    </div>
                                );
                            }
                            return (
                                <button
                                    key={opt.value}
                                    className={styles.option + (opt.value === value ? ' ' + styles.optionActive : '')}
                                    onClick={function () { handleSelect(opt.value); }}
                                    type="button"
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

AiSelect.propTypes = {
    value: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string
    })),
    onChange: PropTypes.func,
    placeholder: PropTypes.string
};

export default AiSelect;
