import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import AiTabComponent from '../components/ai-tab/ai-tab.jsx';
import AiService from '../lib/ai-service.js';
import {parse as parseDescriptor} from '../lib/ai-block-descriptor.js';
import {blocksToXML, chainToXML} from '../lib/ai-block-to-xml.js';
import {readWorkspace} from '../lib/ai-workspace-reader.js';
import {autoCorrect} from '../lib/ai-block-autocorrect.js';
import {verifyBlocks} from '../lib/ai-block-verifier.js';
import {validate} from '../lib/ai-block-validator.js';
import {getDetailedBlockInfo} from '../lib/ai-block-library';
import {TrainingEngine, extractOpcodes, categorizeOpcodes, descriptorToStructure, compressExamples} from '../lib/ai-training-engine';
import {getSharedMessages, setSharedMessages, clearSharedMessages} from '../lib/ai-shared-state';

var systemMessages = defineMessages({
    noProvider: {
        id: 'gui.aiTab.noProvider',
        defaultMessage: 'Configure an AI provider and API key in the AI menu on the top bar.',
        description: 'System message when no AI provider is configured'
    },
    emptyResponse: {
        id: 'gui.aiTab.emptyResponse',
        defaultMessage: 'The AI returned an empty response. Try rephrasing your question or change provider/model in Settings > AI.',
        description: 'System message when AI returns empty response'
    },
    blocksReady: {
        id: 'gui.aiTab.blocksReady',
        defaultMessage: 'Ready. The blocks are ready to create.',
        description: 'Fallback display text when blocks descriptor is empty'
    },
    error413: {
        id: 'gui.aiTab.error413',
        defaultMessage: 'The message is too large for this provider. Try Groq (large model) or OpenCode Zen.',
        description: 'Error when message is too large (413)'
    },
    error429: {
        id: 'gui.aiTab.error429',
        defaultMessage: 'Too many requests. Wait a few seconds and try again.',
        description: 'Error when rate limited (429)'
    },
    error401: {
        id: 'gui.aiTab.error401',
        defaultMessage: 'Invalid API Key. Check your key in Settings > AI.',
        description: 'Error when API key is invalid (401)'
    },
    errorFetch: {
        id: 'gui.aiTab.errorFetch',
        defaultMessage: 'Connection error. Check your internet or the provider URL.',
        description: 'Error when network/fetch fails'
    },
    errorPrefix: {
        id: 'gui.aiTab.errorPrefix',
        defaultMessage: 'Error: {msg}',
        description: 'Error message prefix'
    },
    unknownError: {
        id: 'gui.aiTab.unknownError',
        defaultMessage: 'Unknown error',
        description: 'Unknown error fallback'
    },
    noBlocksFound: {
        id: 'gui.aiTab.noBlocksFound',
        defaultMessage: 'No blocks found in the response. Try rephrasing your question.',
        description: 'Error when no blocks found in AI response'
    },
    blocksReplaced: {
        id: 'gui.aiTab.blocksReplaced',
        defaultMessage: 'Replaced {count} blocks.',
        description: 'Success message when blocks are replaced'
    },
    blocksAdded: {
        id: 'gui.aiTab.blocksAdded',
        defaultMessage: 'Added {count} blocks.',
        description: 'Success message when blocks are added'
    },
    blocksSkipped: {
        id: 'gui.aiTab.blocksSkipped',
        defaultMessage: '{count} block(s) skipped: {details}',
        description: 'Warning when some blocks were skipped'
    },
    creatingBlocks: {
        id: 'gui.aiTab.creatingBlocks',
        defaultMessage: 'Creating blocks...',
        description: 'Status message while creating blocks'
    },
    mentorAnalysis: {
        id: 'gui.aiTab.mentorAnalysis',
        defaultMessage: '🧠 **Mentor Analysis:**\n{msg}',
        description: 'Mentor analysis header in chat'
    },
    mentorError: {
        id: 'gui.aiTab.mentorError',
        defaultMessage: '🧠 **Quick Analysis:**\n{msg}',
        description: 'Mentor error header in chat'
    },
    couldNotAnalyze: {
        id: 'gui.aiTab.couldNotAnalyze',
        defaultMessage: 'Could not analyze.',
        description: 'Fallback when mentor returns empty'
    }
});

var LS_PROVIDER = 'ai_provider';
var LS_API_KEY = function (p) { return p + '_api_key'; };
var LS_MODEL = function (p) { return p + '_model'; };
var LS_TRAINING = 'ai_training_data';
var LS_SESSION = 'ai_session';

function getTypingSpeed(len) {
    if (len > 1000) return 3;
    if (len > 400) return 5;
    return 8;
}

function stripBlockDescriptor(text) {
    if (!text) return text;
    try {
        var jsonObj = JSON.parse(text);
        if (jsonObj && jsonObj.explanation !== undefined) {
            return jsonObj.explanation;
        }
    } catch (e) {
        var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                var jsonObj = JSON.parse(jsonMatch[1]);
                if (jsonObj && jsonObj.explanation !== undefined) {
                    return jsonObj.explanation;
                }
            } catch (e2) {}
        }
    }
    return text.replace(/@bloques[\s\S]*$/, '').trim();
}

function compressSession(entries) {
    if (!entries || entries.length === 0) return '';
    var parts = [];
    for (var i = Math.max(0, entries.length - 5); i < entries.length; i++) {
        var e = entries[i];
        var u = (e.u || '').substring(0, 60);
        var a = (e.a || '').substring(0, 60);
        parts.push('P' + (i + 1) + ': "' + u + '" → "' + a + '"');
    }
    return parts.join(' | ');
}

var AiTab = function (props) {
    var intl = props.intl;
    var [messages, setMessages] = useState([]);
    var [sending, setSending] = useState(false);
    var [verifyingIndex, setVerifyingIndex] = useState(null);
    var [typingData, setTypingData] = useState(null);
    var [creatingIndex, setCreatingIndex] = useState(null);
    var [createStatus, setCreateStatus] = useState(null);
    var [instructing, setInstructing] = useState(false);
    var [trainingData, setTrainingData] = useState(null);
    var typingTimerRef = useRef(null);
    var typingMsgRef = useRef(null);
    var serviceRef = useRef(null);
    var sessionRef = useRef([]);
    var trainEngineRef = useRef(null);
    var prevProjectKeyRef = useRef(null);

    if (!trainEngineRef.current) {
        trainEngineRef.current = new TrainingEngine();
    }

    var loadTrainingFromStorage = useCallback(function () {
        try {
            var stored = localStorage.getItem(LS_TRAINING);
            if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed && parsed.entries && parsed.entries.length > 0) {
                    if (trainEngineRef.current) {
                        trainEngineRef.current.loadFromStorage(parsed.entries);
                    }
                    return parsed.entries;
                }
            }
        } catch (e) {}
        return null;
    }, []);

    var getService = useCallback(function () {
        if (typeof window === 'undefined') return null;
        var provider = localStorage.getItem(LS_PROVIDER) || 'groq';
        var apiKey = localStorage.getItem(LS_API_KEY(provider));
        var model = localStorage.getItem(LS_MODEL(provider));
        var trainingOn = localStorage.getItem('ai_training_enabled') !== 'false';

        if (!apiKey) return null;
        if (!model) return null;

        var td = trainingOn ? (trainingData || loadTrainingFromStorage()) : null;

        if (!serviceRef.current ||
            serviceRef.current.provider !== provider ||
            serviceRef.current.apiKey !== apiKey ||
            serviceRef.current.model !== model ||
            serviceRef.current.locale !== intl.locale) {
            serviceRef.current = new AiService(provider, apiKey, model, td, intl.locale);
        } else if (td && td.length > 0) {
            serviceRef.current.setTrainingData(td);
        }
        return serviceRef.current;
    }, [trainingData, loadTrainingFromStorage]);

    var getPrecedingUserMsg = useCallback(function (msgIndex) {
        for (var i = msgIndex - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                return messages[i].content;
            }
        }
        return null;
    }, [messages]);

    var stopTyping = useCallback(function () {
        if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
        }
        typingMsgRef.current = null;
    }, []);

    var startTyping = useCallback(function (msgIndex, fullText) {
        stopTyping();
        typingMsgRef.current = msgIndex;
        setTypingData({msgIndex: msgIndex, text: fullText.substring(0, 1), full: fullText});

        var pos = 1;
        typingTimerRef.current = setInterval(function () {
            pos++;
            if (pos > fullText.length || typingMsgRef.current !== msgIndex) {
                clearInterval(typingTimerRef.current);
                typingTimerRef.current = null;
                if (typingMsgRef.current === msgIndex) {
                    setTypingData({msgIndex: msgIndex, text: fullText, full: fullText});
                }
                return;
            }
            setTypingData({msgIndex: msgIndex, text: fullText.substring(0, pos), full: fullText});
        }, getTypingSpeed(fullText.length));
    }, [stopTyping]);

    useEffect(function () {
        var td = loadTrainingFromStorage();
        if (td) {
            setTrainingData(td);
        }
        try {
            var stored = localStorage.getItem(LS_SESSION);
            if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed && Array.isArray(parsed)) {
                    sessionRef.current = parsed;
                }
            }
        } catch (e) {}
        // Restore messages from shared state (syncs across split instances)
        var prev = getSharedMessages();
        if (prev.length > 0) {
            setMessages(prev.slice());
        }
    }, [loadTrainingFromStorage]);

    // Clear conversation when a new project is loaded (skip initial mount)
    useEffect(function () {
        if (props.projectKey > 0 && prevProjectKeyRef.current !== null) {
            setMessages([]);
            clearSharedMessages();
        }
        prevProjectKeyRef.current = props.projectKey;
    }, [props.projectKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear session history when mentor mode changes — prevents stale
    // mentor-style history from leaking into normal-mode system prompts.
    useEffect(function () {
        function handleModeChange() {
            sessionRef.current = [];
            try { localStorage.removeItem(LS_SESSION); } catch (e) {}
        }
        window.addEventListener('aimentormodechange', handleModeChange);
        return function () { window.removeEventListener('aimentormodechange', handleModeChange); };
    }, []);

    // Sync messages to shared state (keeps split instances in sync)
    useEffect(function () {
        if (messages.length > 0) {
            setSharedMessages(messages);
        }
    }, [messages]);

    // Listen for shared state changes from other split instances
    useEffect(function () {
        function handleSync() {
            var shared = getSharedMessages();
            setMessages(function (prev) {
                if (shared.length > prev.length) {
                    return shared.slice();
                }
                return prev;
            });
        }
        window.addEventListener('aisharedmessagechange', handleSync);
        return function () { window.removeEventListener('aisharedmessagechange', handleSync); };
    }, []);

    // Auto-explain: detect pending explain from right-click context menu
    useEffect(function () {
        if (props.pendingExplain) {
            var data = props.pendingExplain;
            var isEn = intl.locale && intl.locale.indexOf('en') === 0;
            var explainText = isEn ?
                'Analyze this project and explain what it is about, what each script does, and how they work together:\n\n' + data :
                'Analizá este proyecto y explicá de qué trata, qué hace cada script y cómo funcionan en conjunto:\n\n' + data;
            if (props.onClearExplain) {
                props.onClearExplain();
            }
            queueMicrotask(function () {
                handleSend(explainText);
            });
        }
    }, [props.pendingExplain]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(function () {
        if (props.reanalyzeTick > 0) {
            handleInstruct();
        }
    }, [props.reanalyzeTick]); // eslint-disable-line react-hooks/exhaustive-deps

    var handleSend = useCallback(function (text) {
        var service = getService();
        if (!service) {
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'system',
                    content: intl.formatMessage(systemMessages.noProvider)
                }]);
            });
            return;
        }

        var userMsg = {role: 'user', content: text};
        var msgIdx = messages.length;
        setMessages(function (prev) { return prev.concat([userMsg]); });
        setSending(true);
        stopTyping();

        var sessionSum = compressSession(sessionRef.current);
        // Inject current workspace state for AI context
        var workspaceContext = '';
        try {
            workspaceContext = readWorkspace(props.vm);
        } catch (_e) {}
        // Handle DETALLE:opcode — expand to full block info
        var detailMatch = text.match(/DETALLE:(\w+)/);
        var detailInfo = '';
        if (detailMatch) {
            var detailResult = getDetailedBlockInfo(detailMatch[1]);
            if (detailResult) {
                detailInfo = '\n=== INFO DETALLADA: ' + detailMatch[1] + ' ===\n' + detailResult + '\n';
            }
        }
        var mentorMode = typeof window !== 'undefined' ? localStorage.getItem('ai_mentor_mode') === 'true' : false;
        var modeTag = mentorMode ? '[MODO MENTOR]' : '[MODO NORMAL]';
        var enhancedText = modeTag + '\n' + (workspaceContext ? workspaceContext + '\n---\n' : '') + detailInfo + text;
        var askPromise = service.ask(enhancedText, sessionSum, mentorMode);
        askPromise.then(function (response) {
            var assIdx = msgIdx + 1;
            var cleanResponse = (response || '').trim();
            if (!cleanResponse) {
                setMessages(function (prev) {
                    return prev.concat([{
                        role: 'system',
                        content: intl.formatMessage(systemMessages.emptyResponse)
                    }]);
                });
                setSending(false);
                return;
            }
            var displayText = stripBlockDescriptor(cleanResponse);
            if (!displayText) {
                displayText = intl.formatMessage(systemMessages.blocksReady);
            }

            sessionRef.current.push({u: text, a: displayText.substring(0, 120)});
            if (sessionRef.current.length > 10) {
                sessionRef.current = sessionRef.current.slice(-10);
            }
            try {
                localStorage.setItem(LS_SESSION, JSON.stringify(sessionRef.current));
            } catch (e) {}

            setMessages(function (prev) {
                return prev.concat([{
                    role: 'assistant',
                    content: cleanResponse,
                    displayContent: displayText,
                    id: assIdx,
                    typing: true,
                    hasBlocks: !mentorMode
                }]);
            });
            setSending(false);
            startTyping(assIdx, displayText);

            // Auto-create blocks (normal mode only, sync with typing)
            if (!mentorMode && props.vm && props.vm.editingTarget) {
                setCreatingIndex(assIdx);
setCreateStatus({type: 'loading', message: intl.formatMessage(systemMessages.creatingBlocks)});
                setTimeout(function () { doCreate(cleanResponse, intl); }, 0);
            }
        }).catch(function (err) {
            var unknownError = intl.formatMessage(systemMessages.unknownError);
            var errorMsg = err.message || unknownError;
            if (errorMsg.indexOf('413') !== -1) {
                errorMsg = intl.formatMessage(systemMessages.error413);
            } else if (errorMsg.indexOf('429') !== -1) {
                errorMsg = intl.formatMessage(systemMessages.error429);
            } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
                errorMsg = intl.formatMessage(systemMessages.error401);
            } else if (errorMsg.indexOf('fetch') !== -1 || errorMsg.indexOf('NetworkError') !== -1) {
                errorMsg = intl.formatMessage(systemMessages.errorFetch);
            }
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'system',
                    content: intl.formatMessage(systemMessages.errorPrefix, {msg: errorMsg})
                }]);
            });
            setSending(false);
        });
    }, [getService, messages.length, startTyping, stopTyping]); // eslint-disable-line react-hooks/exhaustive-deps

    var handleVerify = useCallback(function (msgIndex) {
        var service = getService();
        if (!service || verifyingIndex !== null) return;

        var assistantMsg = messages[msgIndex];
        if (assistantMsg.role !== 'assistant') return;

        var userMsg = getPrecedingUserMsg(msgIndex);
        if (!userMsg) return;

        setVerifyingIndex(msgIndex);

        function runBlockCheck(content) {
            var blockCheck = {
                found: false,
                valid: true,
                validationErrors: [],
                created: false,
                creationIssues: [],
                intendedCount: 0,
                actualCount: 0
            };
            try {
                var parsed = parseDescriptor(content);
                if (parsed && parsed.blockMap && Object.keys(parsed.blockMap).length > 0) {
                    blockCheck.found = true;
                    for (var id in parsed.blockMap) {
                        if (!parsed.blockMap[id].shadow) blockCheck.intendedCount++;
                    }
                    var corrected = autoCorrect(parsed);
                    var validationResult = validate(corrected, intl);
                    blockCheck.valid = validationResult.valid;
                    blockCheck.validationErrors = validationResult.errors || [];
                    if (props.vm && props.vm.editingTarget) {
                        var vResult = verifyBlocks(corrected, props.vm, intl);
                        blockCheck.created = vResult.ok;
                        blockCheck.creationIssues = vResult.issues || [];
                        var ab = props.vm.editingTarget.blocks;
                        if (ab && ab._blocks) {
                            for (var aid in ab._blocks) {
                                if (!ab._blocks[aid].shadow) blockCheck.actualCount++;
                            }
                        }
                    }
                }
            } catch (e) {
                blockCheck.validationErrors = ['Error al analizar bloques: ' + e.message];
            }
            return blockCheck;
        }

        service.verify(userMsg, assistantMsg.content).then(function (verification) {
            var blockCheck = runBlockCheck(verification.finalCorrected || assistantMsg.content);
            setMessages(function (prev) {
                var copy = prev.slice();
                var newContent = verification.finalCorrected || assistantMsg.content;
                copy[msgIndex] = {
                    role: 'assistant',
                    content: newContent,
                    displayContent: stripBlockDescriptor(newContent) || newContent,
                    id: copy[msgIndex].id,
                    verification: verification,
                    blockCheck: blockCheck
                };
                return copy;
            });
            setVerifyingIndex(null);
        }).catch(function () {
            var blockCheck = runBlockCheck(assistantMsg.content);
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = {
                    role: 'assistant',
                    content: assistantMsg.content,
                    displayContent: stripBlockDescriptor(assistantMsg.content) || assistantMsg.content,
                    id: copy[msgIndex].id,
                    blockCheck: blockCheck
                };
                return copy;
            });
            setVerifyingIndex(null);
        });
    }, [getService, messages, verifyingIndex, getPrecedingUserMsg, props.vm]);

    function tryCreateChain(blockId, blockMap, Blockly, workspace, errors, vm) {
        try {
            var chainXml = chainToXML(blockId, {blockMap: blockMap, topBlocks: [blockId]}, vm);
            if (!chainXml || chainXml === '<xml></xml>') return true;
            var dom = Blockly.Xml.textToDom(chainXml);
            Blockly.Xml.domToWorkspace(dom, workspace);
            return true;
        } catch (e) {
            console.warn('[AI Blocks] Chain falló:', e.message);
            errors.push(e.message);
            return false;
        }
    }

    function doCreate(assistantContent, intl) {
        console.log('[AI Blocks] doCreate');
        var replace = false;
        var jsonObj = null;
        try {
            jsonObj = JSON.parse(assistantContent);
            replace = !!jsonObj.clearExisting;
        } catch (e) {
            var jsonMatch = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    jsonObj = JSON.parse(jsonMatch[1]);
                    replace = !!jsonObj.clearExisting;
                } catch (e2) {}
            }
        }
        if (!jsonObj) {
            replace = assistantContent.indexOf('@reemplazar') !== -1;
        }

        var parsed = parseDescriptor(assistantContent);
        if (!parsed) {
            setCreateStatus({type: 'error', message: intl.formatMessage(systemMessages.noBlocksFound)});
            setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
            return;
        }

        parsed = autoCorrect(parsed);
        var blockMap = parsed.blockMap;
        var topBlocks = parsed.topBlocks;
        var nonShadow = 0;
        for (var _id in blockMap) {
            if (!blockMap[_id].shadow) nonShadow++;
        }
        console.log('[AI Blocks] ' + (replace ? 'REPLACE' : 'APPEND') + ' ' + nonShadow + ' bloques, ' + topBlocks.length + ' cadenas');
        if (nonShadow === 0) { setCreatingIndex(null); return; }

        try {
            var Blockly = window.Blockly;
            var workspace = Blockly && Blockly.getMainWorkspace();
            if (!Blockly || !workspace) { setCreatingIndex(null); return; }

            if (replace) {
                workspace.clear();
                console.log('[AI Blocks] Workspace cleared');
            }

            // Try full batch first
            var fullXml = blocksToXML(parsed, props.vm);
            var fullSuccess = false;
            var chainErrors = [];

            try {
                var fullDom = Blockly.Xml.textToDom(fullXml);
                Blockly.Xml.domToWorkspace(fullDom, workspace);
                console.log('[AI Blocks] Batch domToWorkspace OK');
                fullSuccess = true;
            } catch (batchError) {
                console.warn('[AI Blocks] Batch falló, por cadena:', batchError.message);
                // Fallback: try each chain individually
                for (var ci = 0; ci < topBlocks.length; ci++) {
                    tryCreateChain(topBlocks[ci].id, blockMap, Blockly, workspace, chainErrors, props.vm);
                }
            }

            // Verify: read back and compare
            var verification = verifyBlocks(parsed, props.vm, intl);
            if (verification.ok && chainErrors.length === 0) {
                setCreateStatus({
                    type: 'success',
                    message: intl.formatMessage(replace ? systemMessages.blocksReplaced : systemMessages.blocksAdded, {count: nonShadow})
                });
            } else {
                var issueMsgs = [];
                if (verification.issues && verification.issues.length > 0) {
                    issueMsgs = issueMsgs.concat(verification.issues);
                }
                for (var ei = 0; ei < chainErrors.length; ei++) {
                    issueMsgs.push(intl.formatMessage(systemMessages.errorPrefix, {msg: chainErrors[ei]}));
                }
                console.warn('[AI Blocks] Problemas:', issueMsgs);
                setCreateStatus({
                    type: 'warning',
                    message: intl.formatMessage(systemMessages.blocksSkipped, {count: issueMsgs.length, details: issueMsgs.join('; ')})
                });
            }
        } catch (e) {
            console.error('[AI Blocks] Error fatal:', e);
            setCreateStatus({
                type: 'error',
                message: 'Error: ' + (e.message || 'desconocido')
            });
        }
        setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
    }

    var handleCreateBlocks = useCallback(function (msgIndex) {
        if (typeof window !== 'undefined' && localStorage.getItem('ai_mentor_mode') === 'true') return;
        if (!props.vm || !props.vm.editingTarget || creatingIndex !== null) return;

        var assistantMsg = messages[msgIndex];
        if (assistantMsg.role !== 'assistant') return;
        if (!assistantMsg.content) return;

        setCreatingIndex(msgIndex);
        setCreateStatus({type: 'loading', message: intl.formatMessage(systemMessages.creatingBlocks)});
        setTimeout(function () { doCreate(assistantMsg.content, intl); }, 0);
    }, [props.vm, messages, creatingIndex]);

    var handleInstruct = useCallback(function (msgIndex) {
        if (instructing) return;
        setInstructing(true);

        var service = getService();
        if (!service) { setInstructing(false); return; }

        // If no msgIndex, find latest assistant message
        if (msgIndex === undefined) {
            for (var mi = messages.length - 1; mi >= 0; mi--) {
                if (messages[mi].role === 'assistant') {
                    msgIndex = mi;
                    break;
                }
            }
        }

        var assistantMsg = messages[msgIndex];
        if (!assistantMsg) { setInstructing(false); return; }

        // Show analyzing state in code tab
        if (props.onMentorGuidance) {
            props.onMentorGuidance('');
        }
        if (props.onActivateTab) {
            props.onActivateTab(0);
        }

        var workspaceText = '';
        try { workspaceText = readWorkspace(props.vm); } catch (e) {}

        var isEn = intl.locale && intl.locale.indexOf('en') === 0;
        var promptText = isEn ?
            'This is the guide you gave the student:\n' +
            (assistantMsg.content || '') +
            '\n\nStudent\'s current blocks (Scratch code):\n' +
            (workspaceText || '(no blocks)') +
            '\n\nAnalyze:\n' +
            '- Is the project on the right track?\n' +
            '- If the student followed another strategy, validate and congratulate them.\n' +
            '- Detect if they are using **literal numbers** in operators (e.g.: `1 + 2`, `< 50`, `* 3`) where they should use **variables**. Clearly differentiate between a fixed literal number (ok for constant values) and one that should be a variable.\n' +
            '- What\'s missing or could be improved? Is it complete?\n' +
            'Answer in 4-5 sentences max. Use **bold** and other Markdown formatting if helpful. Respond ONLY in English.' :
            'Esta es la guía que le diste al estudiante:\n' +
            (assistantMsg.content || '') +
            '\n\nBloques actuales del estudiante (código Scratch):\n' +
            (workspaceText || '(sin bloques)') +
            '\n\nAnalizá:\n' +
            '- ¿El proyecto va por buen camino?\n' +
            '- Si el estudiante siguió otra estrategia, validala y felicitalo.\n' +
            '- Detectá si está usando **números literales directos** en operadores (ej: `1 + 2`, `< 50`, `* 3`) donde debería usar **variables**. Diferenciá bien entre un número literal fijo (ok para valores constantes) y uno que debería ser variable.\n' +
            '- ¿Qué falta o qué mejorar? ¿Está completo?\n' +
            'Respondé en 4-5 oraciones como máximo. Usá **negrita** y demás formato Markdown si ayuda. Respondé SOLO en español.';

        service.ask(promptText, '').then(function (response) {
            setInstructing(false);
            var clean = stripBlockDescriptor(response || '') || intl.formatMessage(systemMessages.couldNotAnalyze);
            if (props.onMentorGuidance) {
                props.onMentorGuidance(clean);
            }
            // Save analysis to chat history
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'assistant',
                    content: intl.formatMessage(systemMessages.mentorAnalysis, {msg: clean})
                }]);
            });
        }).catch(function (err) {
            setInstructing(false);
            var unknownError = intl.formatMessage(systemMessages.unknownError);
            var errMsg = intl.formatMessage(systemMessages.errorPrefix, {msg: err.message || unknownError});
            if (props.onMentorGuidance) {
                props.onMentorGuidance(errMsg);
            }
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'assistant',
                    content: intl.formatMessage(systemMessages.mentorError, {msg: errMsg})
                }]);
            });
        });
    }, [getService, instructing, props.vm, props.onMentorGuidance, props.onActivateTab, messages]); // eslint-disable-line react-hooks/exhaustive-deps

    var isTrainingEnabled = useCallback(function () {
        try {
            return localStorage.getItem('ai_training_enabled') !== 'false';
        } catch (e) {
            return true;
        }
    }, []);

    var handleTrain = useCallback(function (msgIndex) {
        if (!isTrainingEnabled()) return;

        var assistantMsg = messages[msgIndex];
        if (assistantMsg.role !== 'assistant') return;

        var userMsg = getPrecedingUserMsg(msgIndex);
        if (!userMsg) return;

        var descriptor = null;
        var descMatch = assistantMsg.content.match(/@bloques[\s\S]*?(?=\n\S|\n*$)/);
        if (descMatch) {
            descriptor = descMatch[0].trim();
        }

        if (trainEngineRef.current) {
            trainEngineRef.current.addExample(userMsg, descriptor, false);
        }

        var allData = {version: 1, entries: []};
        var stored = null;
        try {
            stored = localStorage.getItem(LS_TRAINING);
            if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed && parsed.entries) {
                    allData.entries = parsed.entries;
                }
            }
        } catch (e) {}

        allData.entries.push({
            user: userMsg,
            desc: descriptor || '(sin estructura @bloques)',
            date: new Date().toISOString()
        });

        var compressed = compressExamples(allData.entries, 15);
        var saveData = {version: 1, entries: compressed};

        try {
            localStorage.setItem(LS_TRAINING, JSON.stringify(saveData));
        } catch (e) {}

        setTrainingData(compressed);

        var flynt = trainEngineRef.current ? trainEngineRef.current.exportFlynt() : null;
        var outData = flynt || saveData;
        var ext = flynt ? 'flynt' : 'json';

        var blob = new Blob([JSON.stringify(outData, null, 2)], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'entrenamiento-ia-scratch.' + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [messages, getPrecedingUserMsg, isTrainingEnabled]);

    var trainingEnabled = typeof window !== 'undefined' ? localStorage.getItem('ai_training_enabled') !== 'false' : true;
    var mentorMode = typeof window !== 'undefined' ? localStorage.getItem('ai_mentor_mode') === 'true' : false;

    return (
        <AiTabComponent
            vm={props.vm}
            messages={messages}
            sending={sending}
            verifyingIndex={verifyingIndex}
            typingData={typingData}
            creatingIndex={creatingIndex}
            createStatus={createStatus}
            trainingData={trainingData}
            trainingEnabled={trainingEnabled}
            mentorMode={mentorMode}
            instructing={instructing}
            onSend={handleSend}
            onVerify={handleVerify}
            onCreateBlocks={handleCreateBlocks}
            onTrain={handleTrain}
            onInstruct={handleInstruct}
        />
    );
};

AiTab.propTypes = {
    intl: intlShape,
    vm: PropTypes.instanceOf(VM).isRequired,
    pendingExplain: PropTypes.string,
    projectKey: PropTypes.number,
    onClearExplain: PropTypes.func,
    onMentorGuidance: PropTypes.func,
    onActivateTab: PropTypes.func,
    reanalyzeTick: PropTypes.number
};

export default injectIntl(AiTab);
