import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {markdownToHtml} from '../../lib/markdown.js';
import styles from './ai-tab.css';

function hasBlockDescriptor(text) {
    if (!text) return false;
    return text.indexOf('@bloques') !== -1;
}

var AiTabComponent = function (props) {
    var {messages, sending, verifyingIndex, typingData, creatingIndex, createStatus, trainingEnabled,
        onSend, onVerify, onCreateBlocks, onTrain, onTrainingFileLoad} = props;
    var [input, setInput] = useState('');
    var inputRef = useRef(null);
    var listRef = useRef(null);
    var nearBottomRef = useRef(true);

    useEffect(function () {
        if (listRef.current) {
            var el = listRef.current;
            var isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (isNearBottom) {
                el.scrollTop = el.scrollHeight;
            }
        }
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
    }, [input, sending, onSend]);

    var handleKeyDown = useCallback(function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

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

    var trainFileRef = useRef(null);

    var handleTrainFileClick = useCallback(function () {
        if (trainFileRef.current) trainFileRef.current.click();
    }, []);

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
                                    {hasBlockDescriptor(msg.content) && (
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
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    placeholder="Escribí tu pregunta..."
                    value={input}
                    onChange={function (e) { setInput(e.target.value); }}
                    onKeyDown={handleKeyDown}
                />
                {trainingEnabled !== false && (
                    <button
                        className={styles.trainFileBtn}
                        onClick={handleTrainFileClick}
                        title="Cargar archivo de entrenamiento"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </button>
                )}
                <input
                    ref={trainFileRef}
                    type="file"
                    accept=".json,.flynt"
                    style={{display: 'none'}}
                    onChange={function (e) {
                        if (e.target.files && e.target.files[0]) {
                            onTrainingFileLoad(e.target.files[0]);
                        }
                        e.target.value = '';
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
    onSend: PropTypes.func,
    onVerify: PropTypes.func,
    onCreateBlocks: PropTypes.func,
    onTrain: PropTypes.func,
    onTrainingFileLoad: PropTypes.func,
    vm: PropTypes.object
};

export default AiTabComponent;
