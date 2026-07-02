import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {smoothstepPath, loopbackPath} from '../../lib/blockly-edge-utils.js';
import {getPortPosition, computePorts} from '../../lib/schema-blocks/index.js';
import styles from './edge-overlay.css';

var PORT_COLORS = {
    input: '#4C97FF',
    output: '#FFAB19',
    branch: '#0FBD8C',
    branchNo: '#FF6680'
};

function getPortDisplayLabel(port) {
    if (port.type === 'branch') {
        if (port.label === 'SUBSTACK2') return '';
        var t = (port.block.type || '').toLowerCase();
        if (t.indexOf('if_else') !== -1 || t.indexOf('if') !== -1) return 'if';
        if (t.indexOf('repeat') !== -1 || t.indexOf('forever') !== -1 ||
            t.indexOf('until') !== -1 || t.indexOf('while') !== -1) return 'do';
        return 'do';
    }
    if (port.type === 'branchNo') return 'else';
    return '';
}

function getCanvasTransform(workspace) {
    try {
        var canvas = workspace.getCanvas();
        if (!canvas) return '';
        return canvas.getAttribute('transform') || '';
    } catch (e) {
        return '';
    }
}

function getEdgeLabelMidpoint(edge) {
    try {
        var sp = getPortPosition(edge.source, edge.sourceHandle);
        var tp = getPortPosition(edge.target, edge.targetHandle);
        return {
            x: (sp.x + tp.x) / 2,
            y: (sp.y + tp.y) / 2
        };
    } catch (e) {
        return {x: 0, y: 0};
    }
}

var EdgeOverlay = function (props) {
    var {workspace, Blockly, edges, onEdgeSelect, selectedEdgeId} = props;
    var [tick, setTick] = useState(0);
    var rafRef = useRef(null);
    var observerRef = useRef(null);
    var lastTickRef = useRef(0);

    useEffect(function () {
        if (!workspace) return;
        var running = true;

        var updater = function () {
            setTick(function (prev) { return prev + 1; });
        };

        workspace.addChangeListener(updater);

        try {
            var canvas = workspace.getCanvas();
            if (canvas) {
                if (observerRef.current) observerRef.current.disconnect();
                observerRef.current = new MutationObserver(updater);
                observerRef.current.observe(canvas, {attributes: true, attributeFilter: ['transform']});
            }
        } catch (e) {}

        function loop(time) {
            if (!running) return;
            if (time - lastTickRef.current > 30) {
                lastTickRef.current = time;
                setTick(function (prev) { return prev + 1; });
            }
            rafRef.current = requestAnimationFrame(loop);
        }
        rafRef.current = requestAnimationFrame(loop);

        return function () {
            running = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (observerRef.current) observerRef.current.disconnect();
            if (workspace) workspace.removeChangeListener(updater);
        };
    }, [workspace]);

    if (!workspace || !Blockly) {
        console.warn('[edge-overlay] no workspace or Blockly');
        return null;
    }

    var ports = computePorts(workspace, Blockly);
    var hasContent = (edges && edges.length > 0) || ports.length > 0;
    console.log('[edge-overlay] render tick=' + tick + ' edges=' + (edges ? edges.length : 0) + ' ports=' + ports.length + ' hasContent=' + hasContent);

    var canvasTransform = getCanvasTransform(workspace);

    return (
        <svg className={styles.overlay}>
            <circle cx="6" cy="6" r="5" fill="#0F0" opacity="0.6" />
            <defs>
                <marker id="eo-arrow" markerWidth="8" markerHeight="6"
                    refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" fill="#666" />
                </marker>
                <marker id="eo-arrow-sel" markerWidth="8" markerHeight="6"
                    refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" fill="#4C97FF" />
                </marker>
            </defs>
            {hasContent ? (
                <g transform={canvasTransform}>
                    {edges && edges.map(function (edge) {
                        try {
                            if (!edge.source || !edge.target) return null;
                            var sp = getPortPosition(edge.source, edge.sourceHandle);
                            var d;
                            if (edge.source === edge.target && edge.sourceHandle === 'bottom') {
                                d = loopbackPath(sp.x, sp.y, edge.source.width || 100);
                            } else {
                                var tp = getPortPosition(edge.target, edge.targetHandle);
                                d = smoothstepPath(sp.x, sp.y, tp.x, tp.y);
                            }
                        } catch (e) {
                            return null;
                        }
                        var isSel = edge.id === selectedEdgeId;
                        return (
                            <g key={edge.id}>
                                <path d={d} fill="none" stroke="transparent" strokeWidth="14"
                                    className={styles.hitArea}
                                    onClick={function (e) {
                                        e.stopPropagation();
                                        if (onEdgeSelect) onEdgeSelect(edge.id);
                                    }} />
                                <path d={d} fill="none"
                                    stroke={isSel ? '#4C97FF' : '#888'}
                                    strokeWidth={isSel ? 3 : 2}
                                    markerEnd={isSel ? 'url(#eo-arrow-sel)' : 'url(#eo-arrow)'}
                                    className={styles.edgePath} />
                                {edge.label && (function () {
                                    var mid = getEdgeLabelMidpoint(edge);
                                    return (
                                        <g>
                                            <rect x={mid.x - 14} y={mid.y - 9} width="28" height="18" rx="4"
                                                fill="rgba(255,255,255,0.85)" stroke="#ddd" strokeWidth="0.5" />
                                            <text x={mid.x} y={mid.y + 1}
                                                textAnchor="middle" dominantBaseline="central"
                                                fontSize="10" fontWeight="700" fill="#555">
                                                {edge.label}
                                            </text>
                                        </g>
                                    );
                                })()}
                            </g>
                        );
                    })}
                    {ports.map(function (port) {
                        try {
                            if (!port.block) return null;
                            var hp = getPortPosition(port.block, port.handle);
                            var label = getPortDisplayLabel(port);
                            var labelX = hp.x;
                            var labelY = hp.y;
                            if (port.handle === 'yes') {
                                labelX -= 8;
                            } else if (port.handle === 'no') {
                                labelX += 8;
                            } else if (port.handle === 'top') {
                                labelY -= 8;
                            } else if (port.handle === 'bottom') {
                                labelY += 8;
                            }
                            var portKey = port.block.id + '_' + port.handle;
                            var edgeForPort = (edges || []).find(function (e) {
                                return e.source === port.block && e.sourceHandle === port.handle;
                            });
                            return (
                                <g key={portKey}>
                                    <circle cx={hp.x} cy={hp.y} r={5}
                                        fill={PORT_COLORS[port.type] || '#888'}
                                        stroke="#fff" strokeWidth="2"
                                        className={styles.portNode}
                                        onClick={function (e) {
                                            e.stopPropagation();
                                            if (edgeForPort && onEdgeSelect) {
                                                onEdgeSelect(edgeForPort.id);
                                            }
                                        }} />
                                    {label ? (
                                        <text x={labelX} y={labelY}
                                            textAnchor="middle" dominantBaseline="central"
                                            fontSize="9" fontWeight="600" fill="#555"
                                            className={styles.portLabel}>
                                            {label}
                                        </text>
                                    ) : null}
                                </g>
                            );
                        } catch (e) {
                            return null;
                        }
                    })}
                </g>
            ) : null}
        </svg>
    );
};

EdgeOverlay.propTypes = {
    workspace: PropTypes.object,
    Blockly: PropTypes.object,
    edges: PropTypes.array,
    onEdgeSelect: PropTypes.func,
    selectedEdgeId: PropTypes.string
};

export default EdgeOverlay;
