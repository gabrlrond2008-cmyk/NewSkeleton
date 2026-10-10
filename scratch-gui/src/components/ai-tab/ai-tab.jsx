import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {markdownToHtml} from '../../lib/markdown.js';
import {BLOCKS} from '../../lib/ai-block-library';
import {buildMermaidFromContent} from '../../lib/flowchart/mermaid-builder';
import Flowchart from '../flowchart/flowchart.jsx';
import styles from './ai-tab.css';

var messages = defineMessages({
    emptyTitle: {
        id: 'gui.aiTab.emptyTitle',
        defaultMessage: 'Ask me about the app',
        description: 'AI tab empty state title'
    },
    emptyHint: {
        id: 'gui.aiTab.emptyHint',
        defaultMessage: 'E.g.: What components does it have? How does the block editor work? What is split mode?',
        description: 'AI tab empty state hint'
    },
    inputPlaceholder: {
        id: 'gui.aiTab.inputPlaceholder',
        defaultMessage: 'Type your question... (use @ for blocks)',
        description: 'AI chat input placeholder'
    },
    instruct: {
        id: 'gui.aiTab.instruct',
        defaultMessage: 'Instruct',
        description: 'Instruct button text'
    },
    instructing: {
        id: 'gui.aiTab.instructing',
        defaultMessage: 'Analyzing...',
        description: 'Instruct button text while analyzing'
    },
    instructTitle: {
        id: 'gui.aiTab.instructTitle',
        defaultMessage: 'Analyze blocks and guide the student',
        description: 'Instruct button tooltip'
    },
    train: {
        id: 'gui.aiTab.train',
        defaultMessage: 'Train',
        description: 'Train button text'
    },
    trainTitle: {
        id: 'gui.aiTab.trainTitle',
        defaultMessage: 'Save as training example',
        description: 'Train button tooltip'
    },
    generateImage: {
        id: 'gui.aiTab.generateImage',
        defaultMessage: 'Generate',
        description: 'Generate image button text'
    },
    generatingImage: {
        id: 'gui.aiTab.generatingImage',
        defaultMessage: 'Generating...',
        description: 'Generate image button text while generating'
    },
    generateTitle: {
        id: 'gui.aiTab.generateTitle',
        defaultMessage: 'Generate the suggested image',
        description: 'Generate image button tooltip'
    },
    addImage: {
        id: 'gui.aiTab.addImage',
        defaultMessage: 'Add',
        description: 'Add image button text'
    },
    addAsSprite: {
        id: 'gui.aiTab.addAsSprite',
        defaultMessage: 'As Sprite',
        description: 'Add image as sprite option'
    },
    addAsBackdrop: {
        id: 'gui.aiTab.addAsBackdrop',
        defaultMessage: 'As Backdrop',
        description: 'Add image as backdrop option'
    },
    verifyImage: {
        id: 'gui.aiTab.verifyImage',
        defaultMessage: 'Verify',
        description: 'Verify image button text'
    },
    verifyingImage: {
        id: 'gui.aiTab.verifyingImage',
        defaultMessage: 'Verifying...',
        description: 'Verify image button text while verifying'
    },
    generateAudio: {
        id: 'gui.aiTab.generateAudio',
        defaultMessage: 'Audio',
        description: 'Generate audio button text'
    },
    generatingAudio: {
        id: 'gui.aiTab.generatingAudio',
        defaultMessage: 'Generating...',
        description: 'Generate audio button text while generating'
    },
    generateSfx: {
        id: 'gui.aiTab.generateSfx',
        defaultMessage: 'Sound',
        description: 'Generate sound effect button text'
    },
    generatingSfx: {
        id: 'gui.aiTab.generatingSfx',
        defaultMessage: 'Generating...',
        description: 'Generate sound effect button text while generating'
    },
    generateMusic: {
        id: 'gui.aiTab.generateMusic',
        defaultMessage: 'Music',
        description: 'Generate music button text'
    },
    generatingMusic: {
        id: 'gui.aiTab.generatingMusic',
        defaultMessage: 'Generating...',
        description: 'Generate music button text while generating'
    },
    addSound: {
        id: 'gui.aiTab.addSound',
        defaultMessage: 'Add to project',
        description: 'Add generated sound to project button text'
    },
    addingSound: {
        id: 'gui.aiTab.addingSound',
        defaultMessage: 'Adding...',
        description: 'Add generated sound button text while adding'
    },
    analyzingDots: {
        id: 'gui.aiTab.analyzingDots',
        defaultMessage: 'Analyzing',
        description: 'Loading text while AI is responding'
    },
    blocksDetected: {
        id: 'gui.aiTab.blocksDetected',
        defaultMessage: '{count} block(s) detected',
        description: 'Block check summary showing count'
    },
    blocksInEditor: {
        id: 'gui.aiTab.blocksInEditor',
        defaultMessage: '{count} block(s) in editor',
        description: 'Block check info showing count in editor'
    },
    blocksNotCreated: {
        id: 'gui.aiTab.blocksNotCreated',
        defaultMessage: 'Blocks not created yet (use "Create")',
        description: 'Warning when blocks are valid but not yet created'
    },
    createBlocks: {
        id: 'gui.aiTab.createBlocks',
        defaultMessage: 'Create',
        description: 'Create blocks button text'
    },
    applyChanges: {
        id: 'gui.aiTab.applyChanges',
        defaultMessage: 'Apply',
        description: 'Apply changes (edit) button text'
    },
    applyChangesTitle: {
        id: 'gui.aiTab.applyChangesTitle',
        defaultMessage: 'Apply the requested changes to the existing blocks in the editor',
        description: 'Apply changes button tooltip'
    },
    creating: {
        id: 'gui.aiTab.creating',
        defaultMessage: 'Creating...',
        description: 'Create blocks button text while creating'
    },
    createBlocksTitle: {
        id: 'gui.aiTab.createBlocksTitle',
        defaultMessage: 'Create the suggested blocks in the editor',
        description: 'Create blocks button tooltip'
    },
    revertBlocks: {
        id: 'gui.aiTab.revertBlocks',
        defaultMessage: 'Revert',
        description: 'Revert blocks button text'
    },
    revertBlocksTitle: {
        id: 'gui.aiTab.revertBlocksTitle',
        defaultMessage: 'Restore the workspace to how it was before this message',
        description: 'Revert blocks button tooltip'
    },
    verify: {
        id: 'gui.aiTab.verify',
        defaultMessage: 'Verify',
        description: 'Verify blocks button text'
    },
    verifying: {
        id: 'gui.aiTab.verifying',
        defaultMessage: 'Verifying...',
        description: 'Verify blocks button text while verifying'
    },
    verifyTitle: {
        id: 'gui.aiTab.verifyTitle',
        defaultMessage: 'Check blocks and correct if needed',
        description: 'Verify blocks button tooltip'
    },
    flowchart: {
        id: 'gui.aiTab.flowchart',
        defaultMessage: 'Flowchart',
        description: 'Show flowchart button text'
    },
    hideFlowchart: {
        id: 'gui.aiTab.hideFlowchart',
        defaultMessage: 'Hide flowchart',
        description: 'Hide flowchart button text'
    },
    stop: {
        id: 'gui.aiTab.stop',
        defaultMessage: 'Stop',
        description: 'Stop streaming button text'
    },
    stopTitle: {
        id: 'gui.aiTab.stopTitle',
        defaultMessage: 'Stop generating the response',
        description: 'Stop streaming button tooltip'
    },
    developGame: {
        id: 'gui.aiTab.developGame',
        defaultMessage: 'Develop',
        description: 'Develop full game or project button text'
    },
    developingGame: {
        id: 'gui.aiTab.developingGame',
        defaultMessage: 'Developing...',
        description: 'Develop button text while creating the full game'
    },
    developGameTitle: {
        id: 'gui.aiTab.developGameTitle',
        defaultMessage: 'Develop full project with sprites, logic, backdrops, and audio',
        description: 'Develop button tooltip'
    }
});

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
    var {intl, messages: msgs, sending, creatingIndex, createStatus, trainingEnabled,
        mentorMode, instructing, vm, onSend, onTrain, onInstruct,
        generatingIndex, addingIndex, addingTarget, verifyingIndex, verifyingImageIndex, onGenerateImage, onVerifyImage, onAddImage,
        generatingAudioIndex, onGenerateAudio, generatingSfxIndex, onGenerateSfx, generatingMusicIndex, onGenerateMusic,
        onAddSound,
        onCreate, onDevelop, onVerify, onRevert, onStop} = props;
    var [input, setInput] = useState('');
    var [suggestions, setSuggestions] = useState([]);
    var [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
    var [showSuggestions, setShowSuggestions] = useState(false);
    var [showAddMenu, setShowAddMenu] = useState(null);
    var [flowOpen, setFlowOpen] = useState({});
    var [activeArtistTargetKey, setActiveArtistTargetKey] = useState(null);
    var [artistSelectedMap, setArtistSelectedMap] = useState({});
var inputRef = useRef(null);
var listRef = useRef(null);
var nearBottomRef = useRef(true);
var debounceRef = useRef(null);
var addMenuRef = useRef(null);
var flowCacheRef = useRef({});

    useEffect(function () {
        function handleClickOutside(e) {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
                setShowAddMenu(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return function () { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

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
    }, [msgs]);

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

    var getContent = useCallback(function (msg) {
        var raw = msg.displayContent || msg.content || '';
        if (/^\s*\{/.test(raw) || /"scripts"\s*:|"gameTitle"\s*:|"opcode"\s*:/.test(raw)) {
            var expMatch = raw.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)/);
            if (expMatch && expMatch[1]) {
                return expMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
            }
            var titleMatch = raw.match(/"gameTitle"\s*:\s*"((?:[^"\\]|\\.)*)/);
            if (titleMatch && titleMatch[1]) {
                return '🎮 Proyecto "' + titleMatch[1].replace(/\\"/g, '"').trim() + '" preparado.';
            }
            return '✨ He preparado los bloques de programación para el proyecto.';
        }
        return raw;
    }, []);

    var logAudioMeta = useCallback(function (label) {
        return function (e) {
            var a = e.currentTarget;
            console.log('[Audio ' + label + '] metadata: duration=' + a.duration,
                'muted=' + a.muted, 'volume=' + a.volume, 'paused=' + a.paused,
                'readyState=' + a.readyState, 'src=' + String(a.src).substring(0, 40));
        };
    }, []);

    var logAudioError = useCallback(function (label) {
        return function (e) {
            var err = e.currentTarget.error;
            console.error('[Audio ' + label + '] error:', err && err.code, err && err.message, err && err.mediaError);
        };
    }, []);

    var isTypingActive = function (msg) {
        return !!msg.typing;
    };

    var isTypingDone = function (msg) {
        return !msg.typing;
    };

    return (
        <div className={styles.container}>
            <div ref={listRef} onScroll={handleScroll} className={styles.messageList}>
                {msgs.length === 0 && (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <div className={styles.emptyText}>
                            {intl.formatMessage(messages.emptyTitle)}<br/>
                            <span className={styles.emptyHint}>
                                {intl.formatMessage(messages.emptyHint)}
                            </span>
                        </div>
                    </div>
                )}
                {msgs.map(function (msg, i) {
                    var isUser = msg.role === 'user';
                    var isSystem = msg.role === 'system';
                    var isAssistant = msg.role === 'assistant';
                    var hasVerification = isAssistant && msg.verification;
                    var hasBlockCheck = isAssistant && msg.blockCheck;
                    var typing = isTypingActive(msg);
                    var typedDone = isTypingDone(msg);

                    var hasImgGenerate = isAssistant && msg.hasImageGenerate;
                    var imgPending = hasImgGenerate && msg.imageState === 'pending';
                    var imgGenerated = hasImgGenerate && msg.imageState === 'generated' && msg.imageData;
                    var imgError = hasImgGenerate && msg.imageState === 'error';
                    var isImgGenerating = generatingIndex === i;
                    var isImgVerifying = verifyingImageIndex === i;
                    var isAdding = addingIndex === i;
                    var hasAudio = msg.audioState === 'generated' && msg.audioData;
                    var hasAudioGenerate = isAssistant && msg.hasAudioGenerate;
                    var hasSfx = msg.sfxState === 'generated' && msg.sfxData;
                    var hasSfxGenerate = isAssistant && msg.hasSfxGenerate;
                    var hasMusic = msg.musicState === 'generated' && msg.musicData;
                    var hasMusicGenerate = isAssistant && msg.hasMusicGenerate;

                    var content = getContent(msg);

                    var flowCode = null;
                    if (isAssistant && msg.hasBlocks && msg.content) {
                        var flowKey = 'f' + i + ':' + msg.content;
                        if (!flowCacheRef.current[flowKey]) {
                            flowCacheRef.current[flowKey] = buildMermaidFromContent(msg.content, intl.locale);
                        }
                        flowCode = flowCacheRef.current[flowKey];
                    }

                    return (
                        <div key={i}>
                            <div
                                className={
                                    styles.message +
                                    (isUser ? ' ' + styles.userMsg : '') +
                                    (isSystem ? ' ' + styles.systemMsg : '') +
                                    (!isUser && !isSystem ? ' ' + styles.assistantMsg : '') +
                                    (hasVerification ? ' ' + styles.verified : '')
                                }
                            >
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
                            {isAssistant && msg.streaming && (
                                <div className={styles.msgActions}>
                                    <button
                                        className={styles.actionBtn + ' ' + styles.stopBtn}
                                        onClick={function () { onStop(); }}
                                        title={intl.formatMessage(messages.stopTitle)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="6" y="6" width="12" height="12" rx="1"/>
                                        </svg>
                                        {intl.formatMessage(messages.stop)}
                                    </button>
                                </div>
                            )}
                            {imgGenerated && (
                                <div className={styles.imagePreviewWrap}>
                                    <img
                                        className={styles.imagePreview}
                                        src={msg.imageData.dataURL}
                                        alt="Generated"
                                    />
                                </div>
                            )}
                            {isAssistant && !hasVerification && typedDone && (
                                <div className={styles.msgActions}>
                                    {mentorMode && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.createBtn + (instructing ? ' ' + styles.creating : '')}
                                            onClick={function () { onInstruct(i); }}
                                            disabled={instructing || sending}
                                            title={intl.formatMessage(messages.instructTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>
                                            </svg>
                                            {instructing ? intl.formatMessage(messages.instructing) : intl.formatMessage(messages.instruct)}
                                        </button>
                                    )}
                                    {imgPending && !isImgGenerating && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.generateBtn}
                                            onClick={function () { onGenerateImage(i); }}
                                            disabled={sending}
                                            title={intl.formatMessage(messages.generateImage)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                                <path d="M21 15l-5-5L5 21"/>
                                            </svg>
                                            {intl.formatMessage(messages.generateImage)}
                                        </button>
                                    )}
                                    {hasImgGenerate && imgError && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.generateBtn}
                                            onClick={function () { onGenerateImage(i); }}
                                            disabled={sending}
                                            title="Reintentar"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            {intl.formatMessage(messages.generateImage)}
                                        </button>
                                    )}
                                    {imgGenerated && !msg.imageVerification && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.verifyBtn + (isImgVerifying ? ' ' + styles.verifying : '')}
                                            onClick={function () { onVerifyImage(i); }}
                                            disabled={isImgVerifying || sending}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M9 12l2 2 4-4"/>
                                                <circle cx="12" cy="12" r="10"/>
                                            </svg>
                                            {isImgVerifying ? intl.formatMessage(messages.verifyingImage) : intl.formatMessage(messages.verifyImage)}
                                        </button>
                                    )}
                                    {imgGenerated && (
                                        <div className={styles.addMenuWrap} ref={addMenuRef}>
                                            <button
                                                className={styles.actionBtn + ' ' + styles.addBtn}
                                                onClick={function () { setShowAddMenu(showAddMenu === i ? null : i); }}
                                                disabled={isAdding || sending}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M12 4v16M4 12h16"/>
                                                </svg>
                                                {isAdding ? intl.formatMessage(messages.generatingImage) : intl.formatMessage(messages.addImage)}
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft: 2}}>
                                                    <path d="M7 10l5 5 5-5z"/>
                                                </svg>
                                            </button>
                                            {showAddMenu === i && (
                                                <div className={styles.addDropdown}>
                                                    <button
                                                        className={styles.addDropdownItem}
                                                        onClick={function () { setShowAddMenu(null); onAddImage(i, 'sprite'); }}
                                                        disabled={isAdding}
                                                    >
                                                        {intl.formatMessage(messages.addAsSprite)}
                                                    </button>
                                                    <button
                                                        className={styles.addDropdownItem}
                                                        onClick={function () { setShowAddMenu(null); onAddImage(i, 'backdrop'); }}
                                                        disabled={isAdding}
                                                    >
                                                        {intl.formatMessage(messages.addAsBackdrop)}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {hasAudioGenerate && !msg.audioData && msg.audioState !== 'error' && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.audioBtn + (generatingAudioIndex === i ? ' ' + styles.generatingAudioBtn : '')}
                                            onClick={function () { onGenerateAudio(i); }}
                                            disabled={generatingAudioIndex === i || sending}
                                            title={msg.hasAudioGenerate ? 'Play suggested audio' : 'Read message aloud'}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                                                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                                                <line x1="12" y1="19" x2="12" y2="23"/>
                                                <line x1="8" y1="23" x2="16" y2="23"/>
                                            </svg>
                                            {generatingAudioIndex === i ? intl.formatMessage(messages.generatingAudio) : intl.formatMessage(messages.generateAudio)}
                                        </button>
                                    )}
                                    {hasSfxGenerate && !msg.sfxData && msg.sfxState !== 'error' && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.sfxBtn + (generatingSfxIndex === i ? ' ' + styles.generatingSfxBtn : '')}
                                            onClick={function () { onGenerateSfx(i); }}
                                            disabled={generatingSfxIndex === i || sending}
                                            title="Generate suggested sound effect"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                                            </svg>
                                            {generatingSfxIndex === i ? intl.formatMessage(messages.generatingSfx) : intl.formatMessage(messages.generateSfx)}
                                        </button>
                                    )}
                                    {hasMusicGenerate && !msg.musicData && msg.musicState !== 'error' && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.musicBtn + (generatingMusicIndex === i ? ' ' + styles.generatingMusicBtn : '')}
                                            onClick={function () { onGenerateMusic(i); }}
                                            disabled={generatingMusicIndex === i || sending}
                                            title="Generate suggested music"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M9 18V5l12-2v13"/>
                                                <circle cx="6" cy="18" r="3"/>
                                                <circle cx="18" cy="16" r="3"/>
                                            </svg>
                                            {generatingMusicIndex === i ? intl.formatMessage(messages.generatingMusic) : intl.formatMessage(messages.generateMusic)}
                                        </button>
                                    )}
                                    {msg.hasBlocks && creatingIndex !== i && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.createBtn}
                                            onClick={function () { onCreate(i); }}
                                            disabled={sending}
                                            title={intl.formatMessage(msg.intent === 'edit' ? messages.applyChangesTitle : messages.createBlocksTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="16,3 21,3 21,8"/>
                                                <line x1="4" y1="20" x2="21" y2="3"/>
                                                <polyline points="21,16 21,21 16,21"/>
                                                <line x1="15" y1="15" x2="21" y2="21"/>
                                                <line x1="4" y1="4" x2="9" y2="9"/>
                                            </svg>
                                            {intl.formatMessage(msg.intent === 'edit' ? messages.applyChanges : messages.createBlocks)}
                                        </button>
                                    )}
                                    {(msg.hasGameDevelop || msg.hasBlocks) && creatingIndex !== i && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.developBtn}
                                            onClick={function () { onDevelop(i); }}
                                            disabled={sending}
                                            title={intl.formatMessage(messages.developGameTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                <polyline points="2 17 12 22 22 17" />
                                                <polyline points="2 12 12 17 22 12" />
                                            </svg>
                                            {intl.formatMessage(messages.developGame)}
                                        </button>
                                    )}
                                    {msg.snapshotXml && !msg.reverted && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.revertBtn}
                                            onClick={function () { onRevert(i); }}
                                            disabled={sending}
                                            title={intl.formatMessage(messages.revertBlocksTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M3 7v6h6"/>
                                                <path d="M21 17a9 9 0 00-15-6.7L3 13"/>
                                            </svg>
                                            {intl.formatMessage(messages.revertBlocks)}
                                        </button>
                                    )}
                                    {flowCode && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.flowBtn + (flowOpen[i] ? ' ' + styles.flowBtnActive : '')}
                                            onClick={function () { setFlowOpen(function (prev) { var next = Object.assign({}, prev); if (next[i]) delete next[i]; else next[i] = true; return next; }); }}
                                            title={intl.formatMessage(messages.flowchart)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="3" y="3" width="6" height="6" rx="1"/>
                                                <rect x="15" y="15" width="6" height="6" rx="1"/>
                                                <rect x="15" y="3" width="6" height="6" rx="1"/>
                                                <path d="M9 6h6M6 9v6M15 9v6M18 15v3"/>
                                            </svg>
                                            {flowOpen[i] ? intl.formatMessage(messages.hideFlowchart) : intl.formatMessage(messages.flowchart)}
                                        </button>
                                    )}
                                    {!mentorMode && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.verifyBtn + (verifyingIndex === i ? ' ' + styles.verifying : '')}
                                            onClick={function () { onVerify(i); }}
                                            disabled={verifyingIndex === i || sending}
                                            title={intl.formatMessage(messages.verifyTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M9 12l2 2 4-4"/>
                                                <circle cx="12" cy="12" r="10"/>
                                            </svg>
                                            {verifyingIndex === i ? intl.formatMessage(messages.verifying) : intl.formatMessage(messages.verify)}
                                        </button>
                                    )}
                                    {msg.audioData && (
                                        <audio
                                            className={styles.audioPlayer}
                                            controls
                                            preload="none"
                                            src={msg.audioData.audioUrl}
                                            onLoadedMetadata={logAudioMeta('TTS')}
                                            onError={logAudioError('TTS')}
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                    {msg.sfxData && (
                                        <audio
                                            className={styles.audioPlayer + ' ' + styles.sfxPlayer}
                                            controls
                                            preload="none"
                                            src={msg.sfxData.audioUrl}
                                            onLoadedMetadata={logAudioMeta('SFX')}
                                            onError={logAudioError('SFX')}
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                    {msg.musicData && (
                                        <audio
                                            className={styles.audioPlayer + ' ' + styles.musicPlayer}
                                            controls
                                            preload="none"
                                            src={msg.musicData.audioUrl}
                                            onLoadedMetadata={logAudioMeta('MUSIC')}
                                            onError={logAudioError('MUSIC')}
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                    {trainingEnabled !== false && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.trainBtn}
                                            onClick={function () { onTrain(i); }}
                                            disabled={sending}
                                            title={intl.formatMessage(messages.trainTitle)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                                                <polyline points="17,21 17,13 7,13 7,21"/>
                                                <polyline points="7,3 7,8 15,8"/>
                                            </svg>
                                            {intl.formatMessage(messages.train)}
                                        </button>
                                    )}
                                    {msg.audioData && !msg.soundAdded && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.verifyBtn + ' ' + styles.addSoundBtn + (addingIndex === i && addingTarget === 'sound' ? ' ' + styles.generating : '')}
                                            onClick={function () { onAddSound(i, 'audio'); }}
                                            disabled={addingIndex !== null || sending}
                                            title={intl.formatMessage(messages.addSound)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 4v16M4 12h16"/>
                                            </svg>
                                            {addingIndex === i && addingTarget === 'sound' ? intl.formatMessage(messages.addingSound) : intl.formatMessage(messages.addSound)}
                                        </button>
                                    )}
                                    {msg.sfxData && !msg.soundAdded && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.verifyBtn + ' ' + styles.addSoundBtn + (addingIndex === i && addingTarget === 'sound' ? ' ' + styles.generating : '')}
                                            onClick={function () { onAddSound(i, 'sfx'); }}
                                            disabled={addingIndex !== null || sending}
                                            title={intl.formatMessage(messages.addSound)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 4v16M4 12h16"/>
                                            </svg>
                                            {addingIndex === i && addingTarget === 'sound' ? intl.formatMessage(messages.addingSound) : intl.formatMessage(messages.addSound)}
                                        </button>
                                    )}
                                    {msg.musicData && !msg.soundAdded && (
                                        <button
                                            className={styles.actionBtn + ' ' + styles.verifyBtn + ' ' + styles.addSoundBtn + (addingIndex === i && addingTarget === 'sound' ? ' ' + styles.generating : '')}
                                            onClick={function () { onAddSound(i, 'music'); }}
                                            disabled={addingIndex !== null || sending}
                                            title={intl.formatMessage(messages.addSound)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 4v16M4 12h16"/>
                                            </svg>
                                            {addingIndex === i && addingTarget === 'sound' ? intl.formatMessage(messages.addingSound) : intl.formatMessage(messages.addSound)}
                                        </button>
                                    )}
                                </div>
                            )}
                            {flowOpen[i] && flowCode && (
                                <div className={styles.flowPanel}>
                                    <Flowchart code={flowCode} />
                                </div>
                            )}
                            {imgError && (
                                <div className={styles.createStatus + ' ' + styles.createError}>
                                    <span className={styles.createStatusIcon}>{'\u26A0'}</span>
                                    <span>{msg.imageError || 'Error generating image'}</span>
                                </div>
                            )}
                            {msg.audioState === 'error' && (
                                <div className={styles.createStatus + ' ' + styles.createError}>
                                    <span className={styles.createStatusIcon}>{'\u26A0'}</span>
                                    <span>{msg.audioError || 'Error generating audio'}</span>
                                </div>
                            )}
                            {msg.sfxState === 'error' && (
                                <div className={styles.createStatus + ' ' + styles.createError}>
                                    <span className={styles.createStatusIcon}>{'\u26A0'}</span>
                                    <span>{msg.sfxError || 'Error generating sound effect'}</span>
                                </div>
                            )}
                            {msg.musicState === 'error' && (
                                <div className={styles.createStatus + ' ' + styles.createError}>
                                    <span className={styles.createStatusIcon}>{'\u26A0'}</span>
                                    <span>{msg.musicError || 'Error generating music'}</span>
                                </div>
                            )}
                            {isAssistant && (creatingIndex === i || (creatingIndex === null && i === messages.length - 1)) && createStatus && (
                                <div>
                                    {createStatus.mode === 'develop' && createStatus.type === 'loading' && (
                                                <div className={styles.agentStepper}>
                                                    <div className={styles.agentBadge + ' ' + (createStatus.message.indexOf('Director') !== -1 ? styles.agentActive : (createStatus.message.indexOf('Artista') !== -1 || createStatus.message.indexOf('Programador') !== -1 || createStatus.message.indexOf('Supervisor') !== -1 || createStatus.message.indexOf('Motor') !== -1 ? styles.agentDone : ''))}>
                                                        <span className={styles.agentIcon}>🎮</span>
                                                        <span className={styles.agentName}>Director</span>
                                                    </div>
                                                    <div className={styles.agentBadge + ' ' + (createStatus.message.indexOf('Artista') !== -1 ? styles.agentActive : (createStatus.message.indexOf('Programador') !== -1 || createStatus.message.indexOf('Supervisor') !== -1 || createStatus.message.indexOf('Motor') !== -1 ? styles.agentDone : ''))}>
                                                        <span className={styles.agentIcon}>🎨</span>
                                                        <span className={styles.agentName}>Artista</span>
                                                    </div>
                                                    <div className={styles.agentBadge + ' ' + (createStatus.message.indexOf('Músico') !== -1 || createStatus.message.indexOf('sonoro') !== -1 ? styles.agentActive : (createStatus.message.indexOf('Programador') !== -1 || createStatus.message.indexOf('Supervisor') !== -1 || createStatus.message.indexOf('Motor') !== -1 ? styles.agentDone : ''))}>
                                                        <span className={styles.agentIcon}>🎵</span>
                                                        <span className={styles.agentName}>Músico</span>
                                                    </div>
                                                    <div className={styles.agentBadge + ' ' + (createStatus.message.indexOf('Programador') !== -1 ? styles.agentActive : (createStatus.message.indexOf('Supervisor') !== -1 || createStatus.message.indexOf('Motor') !== -1 ? styles.agentDone : ''))}>
                                                        <span className={styles.agentIcon}>⚡</span>
                                                        <span className={styles.agentName}>Lógica</span>
                                                    </div>
                                                    <div className={styles.agentBadge + ' ' + (createStatus.message.indexOf('Supervisor') !== -1 || createStatus.message.indexOf('Observador') !== -1 || createStatus.message.indexOf('Motor') !== -1 ? styles.agentActive : '')}>
                                                        <span className={styles.agentIcon}>🔍</span>
                                                        <span className={styles.agentName}>Observador</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={
                                                styles.createStatus +
                                                (createStatus.type === 'success' ? ' ' + styles.createSuccess : '') +
                                                (createStatus.type === 'error' ? ' ' + styles.createError : '') +
                                                (createStatus.type === 'loading' ? ' ' + styles.createLoading : '')
                                            }>
                                                <span className={styles.createStatusIcon}>
                                                    {createStatus.type === 'success' ? '\u2713' : createStatus.type === 'error' ? '\u26A0' : '\u23F3'}
                                                </span>
                                                <span>{createStatus.message}</span>
                                    </div>

                                    {createStatus.librarySelection && Array.isArray(createStatus.librarySelection.targets) && (
                                        <div className={styles.artistOptionsContainer}>
                                            <div className={styles.artistOptionsHeader}>
                                                <span>🎨 Selecciona apariencia visual:</span>
                                                {createStatus.librarySelection.countdown != null && (
                                                    <span className={styles.artistCountdown}>
                                                        ⏱️ Auto-continuar en {createStatus.librarySelection.countdown}s
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.artistTabsRow}>
                                                {createStatus.librarySelection.targets.map(function (tgt) {
                                                    var activeKey = activeArtistTargetKey || createStatus.librarySelection.targets[0].key;
                                                    var isActive = activeKey === tgt.key;
                                                    return (
                                                        <button
                                                            key={tgt.key}
                                                            type="button"
                                                            className={styles.artistTabBtn + (isActive ? ' ' + styles.artistTabBtnActive : '')}
                                                            onClick={function () {
                                                                setActiveArtistTargetKey(tgt.key);
                                                            }}
                                                        >
                                                            {tgt.type === 'backdrop' ? '🌅 ' : '👾 '}
                                                            {tgt.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {(() => {
                                                var activeKey = activeArtistTargetKey || (createStatus.librarySelection.targets[0] && createStatus.librarySelection.targets[0].key);
                                                var activeTarget = createStatus.librarySelection.targets.find(function (t) { return t.key === activeKey; }) || createStatus.librarySelection.targets[0];
                                                if (!activeTarget || !Array.isArray(activeTarget.options)) return null;

                                                return (
                                                    <div className={styles.artistCardsGrid}>
                                                        {activeTarget.options.map(function (opt, optIdx) {
                                                            var isSelected = (artistSelectedMap[activeTarget.key] || activeTarget.selectedId) === opt.id;
                                                            return (
                                                                <div
                                                                    key={opt.id || optIdx}
                                                                    className={styles.artistCard + (isSelected ? ' ' + styles.artistCardSelected : '')}
                                                                    onClick={function () {
                                                                        setArtistSelectedMap(function (prev) {
                                                                            var next = Object.assign({}, prev);
                                                                            next[activeTarget.key] = opt.id;
                                                                            return next;
                                                                        });
                                                                        if (createStatus.librarySelection.onSelectCandidate) {
                                                                            createStatus.librarySelection.onSelectCandidate(activeTarget.key, opt);
                                                                        }
                                                                    }}
                                                                >
                                                                    {opt.thumbnail ? (
                                                                        <img
                                                                            className={styles.artistCardThumb}
                                                                            src={opt.thumbnail}
                                                                            alt={opt.name}
                                                                            onError={function (e) {
                                                                                e.currentTarget.style.display = 'none';
                                                                                var parent = e.currentTarget.parentNode;
                                                                                if (parent) {
                                                                                    var fb = parent.querySelector('.' + styles.artistCardThumbFallback);
                                                                                    if (fb) fb.style.display = 'flex';
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <div
                                                                        className={styles.artistCardThumbFallback}
                                                                        style={{display: opt.thumbnail ? 'none' : 'flex'}}
                                                                    >
                                                                        {activeTarget.type === 'backdrop' ? '🌅' : '🎭'}
                                                                    </div>
                                                                    <span className={styles.artistCardName}>{opt.name}</span>
                                                                    {isSelected && (
                                                                        <span className={styles.artistSelectedBadge}>✓ Elegido</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            <div className={styles.artistFooterRow}>
                                                <button
                                                    type="button"
                                                    className={styles.artistConfirmBtn}
                                                    onClick={function () {
                                                        console.log('[AI Tab] Botón Confirmar Selección clickeado por el usuario');
                                                        if (createStatus.librarySelection && createStatus.librarySelection.onConfirm) {
                                                            createStatus.librarySelection.onConfirm();
                                                        }
                                                    }}
                                                >
                                                    ✓ Continuar con esta selección
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {createStatus.libraryOptions && !createStatus.librarySelection && Array.isArray(createStatus.libraryOptions.items) && (
                                        <div className={styles.artistOptionsContainer}>
                                            <div className={styles.artistOptionsHeader}>
                                                <span>🎨 Elige para "{createStatus.libraryOptions.targetName}":</span>
                                                {createStatus.libraryOptions.onSelect && (
                                                    <span style={{fontSize: '0.65rem', opacity: 0.8}}>Selecciona 1 de las 3 opciones</span>
                                                )}
                                            </div>
                                            <div className={styles.artistCardsGrid}>
                                                {createStatus.libraryOptions.items.map(function (opt, optIdx) {
                                                    var isSelected = createStatus.libraryOptions.selectedId === opt.id;
                                                    return (
                                                        <div
                                                            key={opt.id || optIdx}
                                                            className={styles.artistCard + (isSelected ? ' ' + styles.artistCardSelected : '')}
                                                            onClick={function () {
                                                                if (createStatus.libraryOptions.onSelect) {
                                                                    createStatus.libraryOptions.onSelect(opt);
                                                                }
                                                            }}
                                                        >
                                                            {opt.thumbnail ? (
                                                                <img
                                                                    className={styles.artistCardThumb}
                                                                    src={opt.thumbnail}
                                                                    alt={opt.name}
                                                                />
                                                            ) : (
                                                                <div className={styles.artistCardThumbFallback}>
                                                                    🎭
                                                                </div>
                                                            )}
                                                            <span className={styles.artistCardName}>{opt.name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {msg.imageVerification && (
                                <div className={styles.verificationPanel}>
                                    <div className={styles.verifIcon}>
                                        {msg.imageVerification.result === 'CORRECTO' ? '\u2713' : '\u26A0'}
                                    </div>
                                    <div className={styles.verifContent}>
                                        <div className={styles.verifResult}>
                                            {msg.imageVerification.result}
                                        </div>
                                        <div className={styles.verifExplanation}>
                                            {msg.imageVerification.explanation}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {msg.addStatus && (
                                <div className={
                                    styles.createStatus +
                                    (msg.addStatus.type === 'success' ? ' ' + styles.createSuccess : ' ' + styles.createError)
                                }>
                                    <span className={styles.createStatusIcon}>
                                        {msg.addStatus.type === 'success' ? '\u2713' : '\u26A0'}
                                    </span>
                                    <span>{msg.addStatus.message}</span>
                                </div>
                            )}
                            {hasVerification && (
                                <div className={styles.verificationPanel}>
                                    <div className={styles.verifIcon}>
                                        {msg.verification.result === 'CORRECTO' ? '\u2713' : '\u26A0'}
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
                                        {msg.blockCheck.valid && msg.blockCheck.created ? '\u{1F4E6}\u2713' : '\u{1F4E6}\u26A0'}
                                    </div>
                                    <div className={styles.blockCheckContent}>
                                        <div className={styles.blockCheckSummary}>
                                            {intl.formatMessage(messages.blocksDetected, {count: msg.blockCheck.intendedCount})}
                                        </div>
                                        {!msg.blockCheck.valid && msg.blockCheck.validationErrors.length > 0 && (
                                            <div className={styles.blockCheckError}>
                                                {msg.blockCheck.validationErrors.join('; ')}
                                            </div>
                                        )}
                                        {msg.blockCheck.parseErrors && msg.blockCheck.parseErrors.length > 0 && (
                                            <div className={styles.blockCheckWarn}>
                                                {msg.blockCheck.parseErrors.join('; ')}
                                            </div>
                                        )}
                                        {msg.blockCheck.created === false && msg.blockCheck.creationIssues.length > 0 && (
                                            <div className={styles.blockCheckError}>
                                                {msg.blockCheck.creationIssues.join('; ')}
                                            </div>
                                        )}
                                        {msg.blockCheck.valid && msg.blockCheck.created && (
                                            <div className={styles.blockCheckOKText}>
                                                {intl.formatMessage(messages.blocksInEditor, {count: msg.blockCheck.actualCount})}
                                            </div>
                                        )}
                                        {!msg.blockCheck.created && msg.blockCheck.valid && (
                                            <div className={styles.blockCheckWarn}>
                                                {intl.formatMessage(messages.blocksNotCreated)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
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
                    placeholder={intl.formatMessage(messages.inputPlaceholder)}
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
    intl: intlShape,
    messages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string,
        content: PropTypes.string,
        hasBlocks: PropTypes.bool,
        hasGameDevelop: PropTypes.bool,
        id: PropTypes.number,
        typing: PropTypes.bool,
        hasImageGenerate: PropTypes.bool,
        imageGenerate: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
        hasAudioGenerate: PropTypes.bool,
        audioGenerate: PropTypes.shape({
            text: PropTypes.string
        }),
        hasSfxGenerate: PropTypes.bool,
        sfxGenerate: PropTypes.shape({
            prompt: PropTypes.string,
            duration: PropTypes.number
        }),
        hasMusicGenerate: PropTypes.bool,
        musicGenerate: PropTypes.shape({
            prompt: PropTypes.string,
            duration: PropTypes.number
        }),
        imageState: PropTypes.string,
        imageData: PropTypes.shape({
            dataURL: PropTypes.string,
            mimeType: PropTypes.string,
            provider: PropTypes.string
        }),
        imagePrompt: PropTypes.string,
        imageTarget: PropTypes.string,
        imageError: PropTypes.string,
        imageVerification: PropTypes.shape({
            result: PropTypes.string,
            explanation: PropTypes.string,
            correctedPrompt: PropTypes.string
        }),
        addStatus: PropTypes.shape({
            type: PropTypes.string,
            message: PropTypes.string
        }),
        verification: PropTypes.shape({
            result: PropTypes.string,
            explanation: PropTypes.string,
            corrected: PropTypes.string
        }),
        blockCheck: PropTypes.shape({
            found: PropTypes.bool,
            valid: PropTypes.bool,
            validationErrors: PropTypes.array,
            parseErrors: PropTypes.array,
            created: PropTypes.bool,
            creationIssues: PropTypes.array,
            intendedCount: PropTypes.number,
            actualCount: PropTypes.number
        }),
        audioState: PropTypes.string,
        audioData: PropTypes.shape({
            audioUrl: PropTypes.string,
            format: PropTypes.string,
            name: PropTypes.string
        }),
        audioError: PropTypes.string,
        sfxState: PropTypes.string,
        sfxData: PropTypes.shape({
            audioUrl: PropTypes.string,
            format: PropTypes.string,
            name: PropTypes.string
        }),
        sfxError: PropTypes.string,
        musicState: PropTypes.string,
        musicData: PropTypes.shape({
            audioUrl: PropTypes.string,
            format: PropTypes.string,
            name: PropTypes.string
        }),
        musicError: PropTypes.string,
        soundAdded: PropTypes.bool,
        addedSound: PropTypes.shape({
            md5: PropTypes.string,
            targetId: PropTypes.string
        })
    })),
    sending: PropTypes.bool,
    creatingIndex: PropTypes.number,
    createStatus: PropTypes.shape({
        type: PropTypes.string,
        message: PropTypes.string,
        libraryOptions: PropTypes.object,
        librarySelection: PropTypes.object
    }),
    trainingData: PropTypes.array,
    trainingEnabled: PropTypes.bool,
    mentorMode: PropTypes.bool,
    instructing: PropTypes.bool,
    generatingIndex: PropTypes.number,
    addingIndex: PropTypes.number,
    addingTarget: PropTypes.string,
    verifyingImageIndex: PropTypes.number,
    generatingAudioIndex: PropTypes.number,
    generatingSfxIndex: PropTypes.number,
    generatingMusicIndex: PropTypes.number,
    onSend: PropTypes.func,
    onInstruct: PropTypes.func,
    onVerifyImage: PropTypes.func,
    onAddImage: PropTypes.func,
    onGenerateImage: PropTypes.func,
    onGenerateAudio: PropTypes.func,
    onGenerateSfx: PropTypes.func,
    onGenerateMusic: PropTypes.func,
    onAddSound: PropTypes.func,
    onTrain: PropTypes.func,
    onCreate: PropTypes.func,
    onDevelop: PropTypes.func,
    onVerify: PropTypes.func,
    onRevert: PropTypes.func,
    onStop: PropTypes.func,
    vm: PropTypes.object
};

export default injectIntl(AiTabComponent);