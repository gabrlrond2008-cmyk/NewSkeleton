import PropTypes from 'prop-types';
import React, {useCallback, useMemo, useState} from 'react';
import styles from './schema-flyout.css';

var CATEGORY_LABELS = {
    event: 'Eventos',
    motion: 'Movimiento',
    looks: 'Apariencia',
    sound: 'Sonido',
    control: 'Control',
    sensing: 'Sensores',
    operator: 'Operadores',
    data: 'Variables'
};

var SchemaFlyout = function (props) {
    var {
        palette,
        selectedCategory,
        onSelectCategory,
        onAddBlock
    } = props;

    var [searchQuery, setSearchQuery] = useState('');

    var handleSearchChange = useCallback(function (e) {
        setSearchQuery(e.target.value);
    }, []);

    var handleClearSearch = useCallback(function () {
        setSearchQuery('');
    }, []);

    var currentCategory = useMemo(function () {
        if (!palette || palette.length === 0) return null;
        if (searchQuery.length >= 2) return null;
        return selectedCategory || palette[0].category;
    }, [palette, selectedCategory, searchQuery]);

    var currentBlocks = useMemo(function () {
        if (!palette) return [];
        if (searchQuery.length >= 2) {
            var q = searchQuery.toLowerCase();
            var results = [];
            for (var ci = 0; ci < palette.length; ci++) {
                var cat = palette[ci];
                for (var bi = 0; bi < cat.blocks.length; bi++) {
                    var b = cat.blocks[bi];
                    if (b.label.toLowerCase().indexOf(q) !== -1 ||
                        b.opcode.toLowerCase().indexOf(q) !== -1) {
                        results.push({block: b, color: cat.color});
                    }
                }
            }
            return results;
        }
        for (var cj = 0; cj < palette.length; cj++) {
            if (palette[cj].category === currentCategory) {
                return palette[cj].blocks.map(function (b) {
                    return {block: b, color: palette[cj].color};
                });
            }
        }
        return [];
    }, [palette, currentCategory, searchQuery]);

    var handleCategoryClick = useCallback(function (catId) {
        if (onSelectCategory) onSelectCategory(catId);
        setSearchQuery('');
    }, [onSelectCategory]);

    var handleBlockClick = useCallback(function (opcode) {
        if (onAddBlock) onAddBlock(opcode);
    }, [onAddBlock]);

    if (!palette || palette.length === 0) {
        return (
            <div className={styles.flyout}>
                <div className={styles.emptyMsg}>Cargando...</div>
            </div>
        );
    }

    return (
        <div className={styles.flyout}>
            <div className={styles.categoryMenu}>
                <div className={styles.categoryMenuInner}>
                    {palette.map(function (cat) {
                        var isSelected = cat.category === currentCategory;
                        return (
                            <div
                                key={cat.category}
                                className={[
                                    styles.categoryItem,
                                    isSelected ? styles.categorySelected : ''
                                ].join(' ')}
                                style={isSelected ? {'--cat-color': cat.color.bg} : {}}
                                onClick={function () { handleCategoryClick(cat.category); }}
                                title={CATEGORY_LABELS[cat.category] || cat.category}
                            >
                                <div className={styles.categoryBubble}
                                    style={{backgroundColor: cat.color.bg}} />
                                <div className={styles.categoryLabel}>
                                    {CATEGORY_LABELS[cat.category] || cat.category}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.flyoutPanel}>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchInputWrapper}>
                        <svg className={styles.searchIcon} viewBox="0 0 24 24" width="11" height="11">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                                fill="currentColor"/>
                        </svg>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Buscar"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        {searchQuery && (
                            <button className={styles.searchClear} onClick={handleClearSearch}
                                type="button">&times;</button>
                        )}
                    </div>
                </div>

                <div className={styles.flyoutContent}>
                    {currentBlocks.length === 0 && (
                        <div className={styles.flyoutEmpty}>
                            {searchQuery ? 'Sin resultados' : 'Sin bloques'}
                        </div>
                    )}
                    {currentBlocks.map(function (item) {
                        var b = item.block;
                        var bgColor = item.color ? item.color.bg : '#A0A0A0';
                        var hatClass = b.blockType === 'h' ? styles.itemHat : '';
                        var endClass = b.blockType === 'e' ? styles.itemEnd : '';
                        var cClass = b.blockType === 'c' ? styles.itemC : '';
                        return (
                            <div
                                key={b.opcode}
                                className={[styles.flyoutItem, hatClass, endClass, cClass].join(' ')}
                                style={{borderLeftColor: bgColor}}
                                onClick={function () { handleBlockClick(b.opcode); }}
                                title={b.label}
                            >
                                <div className={styles.itemLabel}>{b.label}</div>
                                {(b.inputs && b.inputs.length > 0) && (
                                    <div className={styles.itemParams}>
                                        {b.inputs.map(function (inp) {
                                            if (inp === 'SUBSTACK' || inp === 'SUBSTACK2') return null;
                                            return <span key={inp} className={styles.itemParam}>{inp}</span>;
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

SchemaFlyout.propTypes = {
    palette: PropTypes.arrayOf(PropTypes.object),
    selectedCategory: PropTypes.string,
    onSelectCategory: PropTypes.func,
    onAddBlock: PropTypes.func
};

SchemaFlyout.defaultProps = {
    palette: []
};

export default SchemaFlyout;
