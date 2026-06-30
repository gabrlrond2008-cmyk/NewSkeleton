import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {markdownToHtml} from '../../lib/markdown.js';
import {BLOCKS} from '../../lib/ai-block-library';
import styles from './ai-tab.css';

var CAT_COLORS = {
    motion: '#4C97FF',
    looks: '#9966FF',
    sound: '#CF63CF',
    control: '#FFAB19',
    event: '#FFD500',
    sensing: '#5CB1D6',
    operator: '#59C059',
    data: '#FF8C1A',
    pen: '#0DA57A',
    music: '#CF63CF'
};

function findTrigger(val) {
    for (var ti = val.length - 1; ti >= 0; ti--) {
        var ch = val[ti];
        if (ch === '@' && (ti === 0 || val[ti - 1] === ' ')) {
            return ti;
        }
    }
    return -1;
}

function getWorkspaceBlocks(vm) {
    if (!vm || !vm.editingTarget || !vm.editingTarget.blocks) return [];
    var blocksMap = vm.editingTarget.blocks._blocks;
    if (!blocksMap) return [];
    var ids = Object.keys(blocksMap);
    ids.sort(function (a, b) {
        var ay = blocksMap[a].y || 0;
        var by = blocksMap[b].y || 0;
        if (ay !== by) return ay - by;
        return (blocksMap[a].x || 0) - (blocksMap[b].x || 0);
    });
    var seen = {};
    var results = [];
    for (var i = 0; i < ids.length; i++) {
        var op = blocksMap[ids[i]].opcode;
        if (!op || seen[op]) continue;
        seen[op] = true;
        var info = BLOCKS[op];
        if (info && info.c !== 'internal') {
            results.push({opcode: op, desc: info.d, type: info.t, cat: info.c});
        }
    }
    return results;
}

var AiTabComponent = function (props) {
    var {messages, sending, verifyingIndex, typingData, creatingIndex, createStatus, trainingEnabled,
        mentorMode, instructing, vm, onSend, onVerify, onCreateBlocks, onTrain, onInstruct} = props;
    var [input, setInput] = useState('');
    var [suggestions, setSuggestions] = useState([]);
    var [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
    var [showSuggestions, setShowSuggestions] = useState(false);
    var inputRef = useRef(null);
    var listRef = useRef(null);
    var nearBottomRef = useRef(true);
    var debounceRef = useRef(null);

    useEffect(function () {
        if (listRef.current) {
            var el = listRef.current;
            var isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (isNearBottom) {
                el.scrollTop = el.scrollHeight;
            }
        }
        return function () {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [messages, typingData]);

    var handleScroll = useCallback(function () {
        if (listRef.current) {
            var el = listRef.current;
            nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }
    }, []);

    var handleSend = useCallback(function () {
        var text = input.trim();
        if (!text || sending) return;
        onSend(text);
        setInput('');
        setShowSuggestions(false);
        setSuggestions([]);
    }, [input, sending, onSend]);

    var insertSuggestion = useCallback(function (suggestion) {
        var val = input;
        var triggerIdx = findTrigger(val);
        if (triggerIdx === -1) return;
        var newVal = val.substring(0, triggerIdx) + suggestion.desc + ' ';
        setInput(newVal);
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIdx(-1);
        if (inputRef.current) inputRef.current.focus();
    }, [input]);

    var handleInputChange = useCallback(function (e) {
        var val = e.target.value;
        setInput(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        var triggerIdx = findTrigger(val);

        if (triggerIdx === -1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        var afterTrigger = val.substring(triggerIdx + 1);
        var queryMatch = afterTrigger.match(/^(\S*)/);
        var q = queryMatch ? queryMatch[1].toLowerCase() : '';

        if (q.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(function () {
            var results = [];
            var wsBlocks = getWorkspaceBlocks(vm);
            for (var i = 0; i < wsBlocks.length; i++) {
                var b = wsBlocks[i];
                if (b.opcode.toLowerCase().indexOf(q) !== -1 || b.desc.toLowerCase().indexOf(q) !== -1) {
                    results.push(b);
                }
            }
            if (results.length === 0) {
                for (var op in BLOCKS) {
                    if (!Object.prototype.hasOwnProperty.call(BLOCKS, op)) continue;
                    if (BLOCKS[op].c === 'internal') continue;
                    if (op.toLowerCase().indexOf(q) !== -1 || BLOCKS[op].d.toLowerCase().indexOf(q) !== -1) {
                        results.push({opcode: op, desc: BLOCKS[op].d, type: BLOCKS[op].t, cat: BLOCKS[op].c});
                    }
                }
                results.sort(function (a, b) {
                    var aStarts = a.desc.toLowerCase().indexOf(q) === 0 ? 0 : 1;
                    var bStarts = b.desc.toLowerCase().indexOf(q) === 0 ? 0 : 1;
                    if (aStarts !== bStarts) return aStarts - bStarts;
                    return a.desc.length - b.desc.length;
                });
            }
            setSuggestions(results.slice(0, 8));
            setShowSuggestions(results.length > 0);
            setSelectedSuggestionIdx(-1);
        }, 80);
    }, [vm]);

    var handleKeyDown = useCallback(function (e) {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIdx(function (prev) {
                    return prev < suggestions.length - 1 ? prev + 1 : 0;
                });
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIdx(function (prev) {
                    return prev > 0 ? prev - 1 : suggestions.length - 1;
                });
                return;
            }
            if (e.key === 'Enter' && selectedSuggestionIdx >= 0) {
                e.preventDefault();
                insertSuggestion(suggestions[selectedSuggestionIdx]);
                return;
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                setSuggestions([]);
                setSelectedSuggestionIdx(-1);
                return;
            }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend, showSuggestions, suggestions, selectedSuggestionIdx, insertSuggestion]);

    var getContent = useCallback(function (msg, i) {
        if (msg.role === 'assistant' && typingData && typingData.msgIndex === i) {
            return typingData.text;
        }
        return msg.displayContent || msg.content;
    }, [typingData]);

    var isTypingActive = useCallback(function (msg, i) {
        return msg.typing && typingData && typingData.msgIndex === i && typingData.text.length < typingData.full.length;
    }, [typingData]);

    var isTypingDone = useCallback(function (msg, i) {
        return !msg.typing || (typingData && typingData.msgIndex === i && typingData.text.length >= typingData.full.length);
    }, [typingData]);

    return (
        <div className={styles.container}>
            <div ref={listRef} onScroll={handleScroll} className={styles.messageList}>
                {messages.length === 0 && (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <div className={styles.emptyText}>
                            Preguntame sobre la aplicación<br/>
                            <span className={styles.emptyHint}>
                                Ej: ¿Qué componentes tiene? ¿Cómo funciona el editor de bloques? ¿Qué es el split mode?
                            </span>
                        </div>
                    </div>
                )}
                {messages.map(function (msg, i) {
                    var isUser = msg.role === 'user';
                    var isSystem = msg.role === 'system';
                    var isAssistant = msg.role === 'assistant';
                    var hasVerification = isAssistant && msg.verification;
                    var hasBlockCheck = isAssistant && msg.blockCheck;
                    var isVerifying = verifyingIndex === i;
                    var typing = isTypingActive(msg, i);
                    var typedDone = isTypingDone(msg, i);

                    var content = getContent(msg, i);

                    return (
                        <div key={i}>
                            <div
                                className={
                                    styles.message +
                                    (isUser ? ' ' + styles.userMsg : '') +
                                    (isSystem ? ' ' + styles.systemMsg : '') +
                                    (hasVerification ? ' ' + styles.verified : '')
                                }
                            >
                                <div className={styles.avatar}>
                                    {isUser ? '👤' : isSystem ? '⚙' : '🤖'}
                                </div>
                                <div className={styles.bubble}>
                                    {typing ? (
                                        <div className={styles.content}>
                                            <span className={styles.typingText}>{content}</span>
                                            <span className={styles.cursor}></span>
                                        </div>
                                    ) : (
                                        <div className={styles.content} dangerouslySetInnerHTML={{__html: markdownToHtml(content)}} />
                                    )}
                                </div>
                            </div>
                            {isAssistant && !hasVerification && typedDone && (
                                <div className={styles.msgActions}>
                                    <button
                                        className={styles.verifyBtn + (isVerifying ? ' ' + styles.verifying : '')}
                                        onClick={function () { onVerify(i); }}
                                        disabled={isVerifying || sending}
                                        title="Verificar respuesta"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M9 12l2 2 4-4"/>
                                            <circle cx="12" cy="12" r="10"/>
                                        </svg>
                                        {isVerifying ? 'Verificando...' : 'Verificar'}
                                    </button>
                                    {mentorMode && (
                                        <button
                                            className={styles.createBtn + (instructing ? ' ' + styles.creating : '')}
                                            onClick={function () { onInstruct(i); }}
                                            disabled={instructing || sending}
                                            title="Analizar bloques y guiar al estudiante"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>
                                            </svg>
                                            {instructing ? 'Analizando...' : 'Instruir'}
                                        </button>
                                    )}
                                    {!mentorMode && msg.hasBlocks && (
                                        <button
                                            className={styles.createBtn + (creatingIndex === i ? ' ' + styles.creating : '')}
                                            onClick={function () { onCreateBlocks(i); }}
                                            disabled={creatingIndex !== null || sending}
                                            title="Crear bloques en el editor"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 4v16M4 12h16"/>
                                            </svg>
                                            {creatingIndex === i ? 'Creando...' : 'Crear'}
                                        </button>
                                    )}
                                    {trainingEnabled !== false && (
                                        <button
                                            className={styles.trainBtn}
                                            onClick={function () { onTrain(i); }}
                                            disabled={sending}
                                            title="Guardar como ejemplo de entrenamiento"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                                                <polyline points="17,21 17,13 7,13 7,21"/>
                                                <polyline points="7,3 7,8 15,8"/>
                                            </svg>
                                            Entrenar
                                        </button>
                                    )}
                                </div>
                            )}
                            {isAssistant && creatingIndex === i && createStatus && (
                                <div className={
                                    styles.createStatus +
                                    (createStatus.type === 'success' ? ' ' + styles.createSuccess : '') +
                                    (createStatus.type === 'error' ? ' ' + styles.createError : '') +
                                    (createStatus.type === 'loading' ? ' ' + styles.createLoading : '')
                                }>
                                    <span className={styles.createStatusIcon}>
                                        {createStatus.type === 'success' ? '✓' : createStatus.type === 'error' ? '⚠' : '⏳'}
                                    </span>
                                    <span>{createStatus.message}</span>
                                </div>
                            )}
                            {hasVerification && (
                                <div className={styles.verificationPanel}>
                                    <div className={styles.verifIcon}>
                                        {msg.verification.result === 'CORRECTO' ? '✓' : '⚠'}
                                    </div>
                                    <div className={styles.verifContent}>
                                        <div className={styles.verifResult}>
                                            {msg.verification.result}
                                        </div>
                                        <div className={styles.verifExplanation}>
                                            {msg.verification.explanation}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {hasBlockCheck && msg.blockCheck.found && (
                                <div className={styles.blockCheckPanel + ' ' + (msg.blockCheck.valid && msg.blockCheck.created ? styles.blockCheckOK : styles.blockCheckIssues)}>
                                    <div className={styles.blockCheckIcon}>
                                        {msg.blockCheck.valid && msg.blockCheck.created ? '📦✓' : '📦⚠'}
                                    </div>
                                    <div className={styles.blockCheckContent}>
                                        <div className={styles.blockCheckSummary}>
                                            {msg.blockCheck.intendedCount} bloque(s) detectados
                                        </div>
                                        {!msg.blockCheck.valid && msg.blockCheck.validationErrors.length > 0 && (
                                            <div className={styles.blockCheckError}>
                                                {msg.blockCheck.validationErrors.join('; ')}
                                            </div>
                                        )}
                                        {msg.blockCheck.created === false && msg.blockCheck.creationIssues.length > 0 && (
                                            <div className={styles.blockCheckError}>
                                                {msg.blockCheck.creationIssues.join('; ')}
                                            </div>
                                        )}
                                        {msg.blockCheck.valid && msg.blockCheck.created && (
                                            <div className={styles.blockCheckOKText}>
                                                {msg.blockCheck.actualCount} bloque(s) en el editor
                                            </div>
                                        )}
                                        {!msg.blockCheck.created && msg.blockCheck.valid && (
                                            <div className={styles.blockCheckWarn}>
                                                Bloques no creados aún (usá "Crear")
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {sending && (
                    <div className={styles.message + ' ' + styles.assistantMsg}>
                        <div className={styles.avatar}>🤖</div>
                        <div className={styles.bubble}>
                            <span className={styles.typing}>Analizando</span>
                            <span className={styles.dot1}>.</span>
                            <span className={styles.dot2}>.</span>
                            <span className={styles.dot3}>.</span>
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.inputBar}>
                {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestionDropdown}>
                        {suggestions.map(function (s, i) {
                            var catColor = CAT_COLORS[s.cat] || '#999';
                            return (
                                <div
                                    key={s.opcode}
                                    className={
                                        styles.suggestionItem +
                                        (i === selectedSuggestionIdx ? ' ' + styles.suggestionSelected : '')
                                    }
                                    onMouseDown={function (e) { e.preventDefault(); insertSuggestion(s); }}
                                    onMouseEnter={function () { setSelectedSuggestionIdx(i); }}
                                >
                                    <span className={styles.suggestionCat} style={{backgroundColor: catColor}}>
                                        <span className={styles.suggestionBubble}></span>
                                        {s.cat}
                                    </span>
                                    <span className={styles.suggestionDesc}>{s.desc}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    placeholder="Escribí tu pregunta... (usá @ para bloques)"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={function () {
                        setTimeout(function () {
                            setShowSuggestions(false);
                            setSuggestions([]);
                        }, 150);
                    }}
                />
                <button
                    className={styles.sendButton + (sending ? ' ' + styles.sending : '')}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 1l14 7L1 15l3-7-3-7z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

AiTabComponent.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string,
        content: PropTypes.string,
        hasBlocks: PropTypes.bool,
        id: PropTypes.number,
        typing: PropTypes.bool,
        verification: PropTypes.shape({
            result: PropTypes.string,
            explanation: PropTypes.string,
            corrected: PropTypes.string
        }),
        blockCheck: PropTypes.shape({
            found: PropTypes.bool,
            valid: PropTypes.bool,
            validationErrors: PropTypes.array,
            created: PropTypes.bool,
            creationIssues: PropTypes.array,
            intendedCount: PropTypes.number,
            actualCount: PropTypes.number
        })
    })),
    sending: PropTypes.bool,
    verifyingIndex: PropTypes.number,
    typingData: PropTypes.shape({
        msgIndex: PropTypes.number,
        text: PropTypes.string,
        full: PropTypes.string
    }),
    creatingIndex: PropTypes.number,
    createStatus: PropTypes.shape({
        type: PropTypes.string,
        message: PropTypes.string
    }),
    trainingData: PropTypes.array,
    trainingEnabled: PropTypes.bool,
    mentorMode: PropTypes.bool,
    instructing: PropTypes.bool,
    onSend: PropTypes.func,
    onInstruct: PropTypes.func,
    onVerify: PropTypes.func,
    onCreateBlocks: PropTypes.func,
    onTrain: PropTypes.func,
    vm: PropTypes.object
};

export default AiTabComponent;
