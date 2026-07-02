import React, {useCallback, useEffect, useRef, useState} from 'react';
import styles from './schema-card.css';

function getBlockInfo(opcode) {
    try {
        var lib = require('../../lib/ai-block-library.js');
        var info = lib.getBlockInfo && lib.getBlockInfo(opcode);
        if (info) return info;
        return lib.BLOCKS && lib.BLOCKS[opcode] || null;
    } catch (e) {
        return null;
    }
}

function renderLabel(data) {
    var label = data.label || data.opcode || '?';
    var params = data.params || {};
    var info = getBlockInfo(data.opcode);
    var inputs = (info && info.i) || [];
    var fields = (info && info.f) || [];

    var text = label;
    var allKeys = inputs.concat(fields);
    for (var idx = 0; idx < allKeys.length; idx++) {
        var pName = allKeys[idx];
        if (pName === 'SUBSTACK' || pName === 'SUBSTACK2' || pName === 'CONDITION') continue;
        var p = params[pName];
        if (p && p.value !== undefined && p.value !== '') {
            text = text.replace(new RegExp(pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), p.value);
        }
    }
    if (allKeys.some(function (k) { return k !== 'SUBSTACK' && k !== 'SUBSTACK2' && k !== 'CONDITION'; })) {
        var first = allKeys[0];
        if (first && first !== 'SUBSTACK' && first !== 'SUBSTACK2' && first !== 'CONDITION') {
            var p = params[first];
            if (p && p.value !== undefined && p.value !== '' && text.indexOf(p.value) === -1) {
                text = text.replace(/\bN\b/, p.value);
            }
        }
    }
    return text;
}

var SchemaCard = function (props) {
    var data = props.data;
    var nodeId = props.id;
    var onParamChange = props.onParamChange;
    var onHandlePointerDown = props.onHandlePointerDown;
    var onMeasure = props.onMeasure;
    var connectingHandle = props.connectingHandle;

    var ref = useRef(null);

    var color = data.color || {bg: '#4C97FF', fg: '#fff'};
    var blockType = data.blockType || 's';
    var selected = props.selected;
    var isHat = blockType === 'h';
    var isEnd = blockType === 'e';
    var isCBlock = blockType === 'c';
    var isForever = data.opcode === 'control_forever';
    var substacks = data.st || [];
    var hasSiHandle = isCBlock && substacks.indexOf('SUBSTACK') !== -1;
    var hasNoHandle = isCBlock && substacks.indexOf('SUBSTACK2') !== -1;
    var params = data.params || {};

    var label = renderLabel(data);

    useEffect(function () {
        if (ref.current && onMeasure) {
            var rect = ref.current.getBoundingClientRect();
            onMeasure(nodeId, rect.width, rect.height);
        }
    }, [label]);

    var handlePointerDown = useCallback(function (e) {
        if (e.button !== 0) return;
        if (props.onPointerDown) props.onPointerDown(e, nodeId);
    }, [props.onPointerDown, nodeId]);

    var handleHandleDown = useCallback(function (e, handleType) {
        e.stopPropagation();
        e.preventDefault();
        if (onHandlePointerDown) {
            onHandlePointerDown(e, nodeId, handleType);
        }
    }, [onHandlePointerDown, nodeId]);

    var handleInputChange = useCallback(function (key, value) {
        if (onParamChange) onParamChange(nodeId, key, value);
    }, [onParamChange, nodeId]);

    var hasTop = !isHat;
    var hasBottom = !isEnd && !isForever;
    var paramKeys = Object.keys(params).filter(function (k) {
        return k !== 'SUBSTACK' && k !== 'SUBSTACK2' && k !== 'CONDITION';
    });

    function isConnecting(handleType) {
        if (!connectingHandle) return false;
        return (
            (connectingHandle.sourceNodeId === nodeId && connectingHandle.sourceHandle === handleType) ||
            (connectingHandle.targetNodeId === nodeId && connectingHandle.targetHandle === handleType)
        );
    }

    var wrapperClass = [
        styles.block,
        selected ? styles.selected : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClass} style={{backgroundColor: color.bg, color: color.fg}}
            ref={ref}
            onPointerDown={handlePointerDown}
        >
            {hasTop && (
                <div className={[
                    styles.handle, styles.handleEntry,
                    isConnecting('top') ? styles.handleConnecting : ''
                ].join(' ')}
                    data-handle="top" data-node-id={nodeId}
                    onPointerDown={function (e) { handleHandleDown(e, 'top'); }}
                />
            )}

            <span className={styles.label}>
                {label}
            </span>
            {isHat && <span className={styles.badge}>inicio</span>}
            {isEnd && <span className={styles.badge}>fin</span>}

            {hasSiHandle && (
                <>
                    <span className={styles.branchDiv} />
                    <span className={styles.branchLabel}>Sí</span>
                </>
            )}
            {hasNoHandle && (
                <>
                    <span className={styles.branchDiv} />
                    <span className={styles.branchLabel}>No</span>
                </>
            )}

            {paramKeys.length > 0 && (
                <div style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    marginLeft: '6px', flexShrink: 0
                }}>
                    {paramKeys.map(function (key) {
                        var p = params[key];
                        if (!p) return null;
                        var numericFields = ['STEPS', 'DEGREES', 'DX', 'DY', 'X', 'Y', 'SECS',
                            'DIRECTION', 'CHANGE', 'SIZE', 'VALUE', 'NUM', 'VOLUME', 'DURATION',
                            'TIMES', 'FROM', 'TO', 'OPERAND1', 'OPERAND2', 'STRING1', 'STRING2',
                            'LETTER', 'STRING', 'NUM1', 'NUM2', 'CHANGE'];
                        var inputType = numericFields.indexOf(key) !== -1 ? 'number' : 'text';
                        return (
                            <input key={key}
                                type={inputType}
                                value={p.value || ''}
                                placeholder={key}
                                onPointerDown={function (e) { e.stopPropagation(); }}
                                onChange={function (e) { handleInputChange(key, e.target.value); }}
                                style={{
                                    width: '48px',
                                    color: '#333',
                                    fontWeight: 600,
                                    fontSize: '0.68rem',
                                    background: 'rgba(255,255,255,0.80)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    fontFamily: "'Courier New', monospace",
                                    outline: 'none'
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {hasBottom && (
                <div className={[
                    styles.handle, styles.handleExit,
                    isConnecting('bottom') ? styles.handleConnecting : ''
                ].join(' ')}
                    data-handle="bottom" data-node-id={nodeId}
                    onPointerDown={function (e) { handleHandleDown(e, 'bottom'); }}
                />
            )}

            {hasSiHandle && (
                <div className={[
                    styles.handle, styles.handleYes,
                    isConnecting('yes') ? styles.handleConnecting : ''
                ].join(' ')}
                    data-handle="yes" data-node-id={nodeId}
                    onPointerDown={function (e) { handleHandleDown(e, 'yes'); }}
                />
            )}
            {hasNoHandle && (
                <div className={[
                    styles.handle, styles.handleNo,
                    isConnecting('no') ? styles.handleConnecting : ''
                ].join(' ')}
                    data-handle="no" data-node-id={nodeId}
                    onPointerDown={function (e) { handleHandleDown(e, 'no'); }}
                />
            )}
        </div>
    );
};

export default SchemaCard;
