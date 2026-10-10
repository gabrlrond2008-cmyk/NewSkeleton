import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import AiTabComponent from '../components/ai-tab/ai-tab.jsx';
import AiService from '../lib/ai-service.js';
import {parse as parseDescriptor} from '../lib/ai-block-descriptor.js';
import {blocksToXML, chainToXML} from '../lib/ai-block-to-xml.js';
import {readWorkspace, readWorkspaceScripts, signatureFromContainer} from '../lib/ai-workspace-reader.js';
import {autoCorrect} from '../lib/ai-block-autocorrect.js';
import {verifyBlocks} from '../lib/ai-block-verifier.js';
import {validate} from '../lib/ai-block-validator.js';
import {planChanges} from '../lib/ai-block-reconciler.js';
import {diffChain, boundedSubset} from '../lib/ai-block-diff.js';
import {resolveEdits} from '../lib/ai-edit-resolver.js';
import {getDetailedBlockInfo, getCompactPromptLines} from '../lib/ai-block-library';
import {TrainingEngine, extractOpcodes, categorizeOpcodes, descriptorToStructure, compressExamples} from '../lib/ai-training-engine';
import {getSharedMessages, setSharedMessages, clearSharedMessages, consumePendingRestore} from '../lib/ai-shared-state';
import {AiImageService} from '../lib/ai-image-service';
import {AiAudioService} from '../lib/ai-audio-service';
import {addAsCostume, addAsBackdrop} from '../lib/sprite-from-image';
import {assembleBlocksInOrder, fadeOutChains, flyInBlocks, fadeOutBlocks} from '../lib/ai-block-animator';
import {isGameSchema} from '../lib/ai-game-schema';
import {developFullGameProject} from '../lib/ai-agent-orchestrator';
import {lintAndNormalizeDescriptor} from '../lib/ai-block-linter';

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
    editingApplied: {
        id: 'gui.aiTab.editingApplied',
        defaultMessage: 'Edited the blocks: added {added}, modified {changed}, removed {removed}.',
        description: 'Success message when the AI edits existing blocks in place'
    },
    blocksSkipped: {
        id: 'gui.aiTab.blocksSkipped',
        defaultMessage: '{count} block(s) skipped: {details}',
        description: 'Warning when some blocks were skipped'
    },
    blockCreationFailed: {
        id: 'gui.aiTab.blockCreationFailed',
        defaultMessage: 'Could not create the blocks: {details}',
        description: 'Error when block structure is invalid and auto-fix could not repair it'
    },
    blocksReverted: {
        id: 'gui.aiTab.blocksReverted',
        defaultMessage: 'Reverted the blocks to before this message.',
        description: 'Success message when blocks are reverted to a snapshot'
    },
    creatingBlocks: {
        id: 'gui.aiTab.creatingBlocks',
        defaultMessage: 'Creating blocks...',
        description: 'Status message while creating blocks'
    },
    developingGame: {
        id: 'gui.aiTab.developingGameStatus',
        defaultMessage: 'Developing project with AI Game Director...',
        description: 'Status message while developing full project'
    },
    mentorAnalysis: {
        id: 'gui.aiTab.mentorAnalysis',
        defaultMessage: '🧠 **Mentor Analysis:** {msg}',
        description: 'Mentor analysis header in chat'
    },
    mentorError: {
        id: 'gui.aiTab.mentorError',
        defaultMessage: '🧠 **Quick Analysis:** {msg}',
        description: 'Mentor error header in chat'
    },
    couldNotAnalyze: {
        id: 'gui.aiTab.couldNotAnalyze',
        defaultMessage: 'Could not analyze.',
        description: 'Fallback when mentor returns empty'
    },
    streamCancelled: {
        id: 'gui.aiTab.streamCancelled',
        defaultMessage: 'Generation stopped.',
        description: 'System message when the user stops streaming'
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
    addingImage: {
        id: 'gui.aiTab.addingImage',
        defaultMessage: 'Adding...',
        description: 'Add image button text while adding'
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
    noImageProvider: {
        id: 'gui.aiTab.noImageProvider',
        defaultMessage: 'Image generation is not configured. Set up a provider in Settings > AI > Image Generation.',
        description: 'System message when no image provider is configured'
    },
    imageReady: {
        id: 'gui.aiTab.imageReady',
        defaultMessage: 'Image generated. Add it as a sprite or backdrop.',
        description: 'Success message when image is generated'
    },
    imageAddedSuccess: {
        id: 'gui.aiTab.imageAddedSuccess',
        defaultMessage: '{target} added successfully!',
        description: 'Success message when image is added'
    },
    imageAddFailed: {
        id: 'gui.aiTab.imageAddFailed',
        defaultMessage: 'Failed to add: {msg}',
        description: 'Error message when adding image fails'
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
    audioReady: {
        id: 'gui.aiTab.audioReady',
        defaultMessage: 'Audio generated.',
        description: 'Success message when audio is generated'
    },
    audioError: {
        id: 'gui.aiTab.audioError',
        defaultMessage: 'Audio generation failed: {msg}',
        description: 'Error when audio generation fails'
    },
    soundAddedSuccess: {
        id: 'gui.aiTab.soundAddedSuccess',
        defaultMessage: 'Sound added to project!',
        description: 'Success message when sound is added'
    },
    soundAddFailed: {
        id: 'gui.aiTab.soundAddFailed',
        defaultMessage: 'Failed to add sound: {msg}',
        description: 'Error message when adding sound fails'
    }
});

var LS_PROVIDER = 'ai_provider';
var LS_API_KEY = function (p) { return p + '_api_key'; };
var LS_MODEL = function (p) { return p + '_model'; };
var LS_TRAINING = 'ai_training_data';
var LS_SESSION = 'ai_session';

function formatStreamingDisplayText(raw) {
    if (!raw) return '';
    var text = String(raw);

    // 1. If text starts with '{' or '```json' or has JSON markers:
    var isJsonLike = /^\s*\{/.test(text) || /^\s*```(?:json)?\s*\{/i.test(text);

    // Check for conversational text before a code block
    if (!isJsonLike) {
        var codeBlockStart = text.search(/```(?:json)?|\n\s*\{/i);
        if (codeBlockStart > 0) {
            var preText = text.substring(0, codeBlockStart).trim();
            if (preText.length > 5) {
                var expMatch = text.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)/);
                if (expMatch && expMatch[1]) {
                    var unescapedExp = expMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .trim();
                    if (unescapedExp && unescapedExp !== preText) {
                        return preText + '\n\n' + unescapedExp;
                    }
                }
                return preText;
            }
        }
    }

    // 2. If it is JSON or contains JSON fields:
    if (isJsonLike || /"explanation"\s*:|"gameTitle"\s*:|"scripts"\s*:|"sprites"\s*:/.test(text)) {
        // Stream the explanation field in real time
        var expMatch2 = text.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)/);
        if (expMatch2 && expMatch2[1]) {
            var unescaped = expMatch2[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
                .replace(/\\t/g, '\t');
            if (unescaped.trim().length > 0) {
                return unescaped;
            }
        }

        // If explanation hasn't appeared yet, check for gameTitle
        var titleMatch = text.match(/"gameTitle"\s*:\s*"((?:[^"\\]|\\.)*)/);
        if (titleMatch && titleMatch[1]) {
            var title = titleMatch[1].replace(/\\"/g, '"').trim();
            if (title) {
                return '🎮 Diseñando proyecto "' + title + '"...';
            }
        }

        if (/"sprites"\s*:|"stage"\s*:/.test(text)) {
            return '🎮 Diseñando estructura y personajes del juego...';
        }
        if (/"scripts"\s*:|"opcode"\s*:|"blocks"\s*:/.test(text)) {
            return '⚡ Programando bloques y lógica de Scratch...';
        }

        return '🤖 Diseñando proyecto y preparando bloques...';
    }

    // 3. Normal text stream: clean trailing @bloques
    return text.replace(/@bloques[\s\S]*$/, '');
}

function stripBlockDescriptor(text) {
    if (!text) return '';
    var trimmed = String(text).trim();

    // 1. Check if there is intro conversational text before a code block
    var preCode = '';
    var codeBlockStart = trimmed.search(/```(?:json)?|\n\s*\{/i);
    if (codeBlockStart > 0) {
        preCode = trimmed.substring(0, codeBlockStart).trim();
    }

    // 2. Try JSON.parse on full text or extracted JSON block
    var jsonObj = null;
    try {
        jsonObj = JSON.parse(trimmed);
    } catch (e) {
        var jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                jsonObj = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e2) {}
        }
    }

    if (jsonObj && typeof jsonObj === 'object') {
        if (jsonObj.explanation && typeof jsonObj.explanation === 'string' && jsonObj.explanation.trim()) {
            return jsonObj.explanation.trim();
        }
        if (preCode && preCode.length > 5) {
            return preCode;
        }
        if (jsonObj.gameTitle) {
            return '🎮 Proyecto "' + jsonObj.gameTitle + '" preparado. Haz clic en "Crear" para aplicarlo.';
        }
        if (jsonObj.scripts || jsonObj.edits) {
            return '✨ Bloques de código preparados. Haz clic en el botón inferior para aplicarlos al proyecto.';
        }
        if (jsonObj.imageGenerate || jsonObj.audioGenerate || jsonObj.sfxGenerate) {
            return '🎨 Recursos multimedia preparados para tu proyecto.';
        }
    }

    if (preCode && preCode.length > 5) {
        return preCode;
    }

    // 3. Fallback: if raw text looks like JSON, NEVER return raw JSON code
    if (/^\s*\{/.test(trimmed) || /"scripts"\s*:|"gameTitle"\s*:|"opcode"\s*:|"explanation"\s*:/.test(trimmed)) {
        var expMatch = trimmed.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (expMatch && expMatch[1]) {
            return expMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
        }
        var titleMatch = trimmed.match(/"gameTitle"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (titleMatch && titleMatch[1]) {
            return '🎮 Proyecto "' + titleMatch[1].replace(/\\"/g, '"').trim() + '" preparado. Puedes aplicarlo con el botón de abajo.';
        }
        return '✨ He preparado la programación para este proyecto.';
    }

    // 4. Clean any residual markdown blocks or tags
    return trimmed.replace(/@bloques[\s\S]*$/, '').replace(/```(?:json)?[\s\S]*?```/gi, '').trim();
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
    var [creatingIndex, setCreatingIndex] = useState(null);
    var [createStatus, setCreateStatus] = useState(null);
    var [instructing, setInstructing] = useState(false);
    var [trainingData, setTrainingData] = useState(null);
    var [generatingIndex, setGeneratingIndex] = useState(null);
    var [addingIndex, setAddingIndex] = useState(null);
    var [addingTarget, setAddingTarget] = useState(null);
    var [verifyingImageIndex, setVerifyingImageIndex] = useState(null);
    var [generatingAudioIndex, setGeneratingAudioIndex] = useState(null);
    var [generatingSfxIndex, setGeneratingSfxIndex] = useState(null);
    var [generatingMusicIndex, setGeneratingMusicIndex] = useState(null);
    var streamControllerRef = useRef(null);
    var streamAssIdxRef = useRef(null);
    var serviceRef = useRef(null);
    var imageServiceRef = useRef(null);
    var audioServiceRef = useRef(null);
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

    var getImageService = useCallback(function () {
        if (imageServiceRef.current) return imageServiceRef.current;
        var imgSvc = new AiImageService();
        if (typeof window !== 'undefined') {
            var provider = localStorage.getItem('ai_image_provider') || 'pollinations';
            var apiKey = localStorage.getItem('ai_image_api_key_' + provider) ||
                localStorage.getItem('ai_image_api_key') || '';
            var model = localStorage.getItem('ai_image_model') || 'flux';
            imgSvc.setProvider(provider);
            imgSvc.setApiKey(apiKey);
            imgSvc.setModel(model);
        }
        imageServiceRef.current = imgSvc;
        return imgSvc;
    }, []);

    var getAudioService = useCallback(function () {
        if (audioServiceRef.current) return audioServiceRef.current;
        var audSvc = new AiAudioService();
        if (typeof window !== 'undefined') {
            var voice = localStorage.getItem('ai_audio_voice') || 'en-US-JennyNeural';
            audSvc.setVoice(voice);
        }
        audioServiceRef.current = audSvc;
        return audSvc;
    }, []);

    var getPrecedingUserMsg = useCallback(function (msgIndex) {
        for (var i = msgIndex - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                return messages[i].content;
            }
        }
        return null;
    }, [messages]);

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

    // Clear conversation when a new project is loaded (skip initial mount).
    // A pending restore (loading a .flynt with a saved chat) suppresses the clear.
    useEffect(function () {
        if (props.projectKey > 0 && prevProjectKeyRef.current !== null && !consumePendingRestore()) {
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

    // Listen for shared state changes from other split instances / .flynt restore
    useEffect(function () {
        function rebuildSession(msgs) {
            var s = [];
            for (var i = 0; i < msgs.length; i++) {
                var m = msgs[i];
                if (m.role === 'user' && m.content) {
                    s.push({u: m.content.substring(0, 120)});
                } else if (m.role === 'assistant' && (m.displayContent || m.content)) {
                    var last = s[s.length - 1];
                    if (last && last.a === undefined) {
                        last.a = (m.displayContent || m.content).substring(0, 120);
                    }
                }
            }
            return s.slice(-10);
        }
        function handleSync(event) {
            var shared = getSharedMessages();
            var isRestore = !!(event && event.detail && event.detail.restore);
            if (!isRestore) {
                // A regular sync means the restore window is over — drop any stale flag.
                consumePendingRestore();
            }
            if (isRestore) {
                sessionRef.current = rebuildSession(shared);
            }
            setMessages(function (prev) {
                if (isRestore || shared.length > prev.length) {
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

    // If an AI-added sound is deleted from the project, bring back its "Add" button
    useEffect(function () {
        if (!props.vm) return undefined;
        function handleTargetsUpdate() {
            setMessages(function (prev) {
                var changed = false;
                var copy = prev.slice();
                for (var i = 0; i < copy.length; i++) {
                    var msg = copy[i];
                    if (msg.soundAdded && msg.addedSound && msg.addedSound.md5) {
                        var target = props.vm.runtime.getTargetById(msg.addedSound.targetId);
                        var stillThere = target && target.sprite && target.sprite.sounds &&
                            target.sprite.sounds.some(function (s) { return s.md5 === msg.addedSound.md5; });
                        if (!stillThere) {
                            copy[i] = Object.assign({}, msg, {
                                soundAdded: false,
                                addedSound: null,
                                addStatus: null
                            });
                            changed = true;
                        }
                    }
                }
                return changed ? copy : prev;
            });
        }
        props.vm.on('targetsUpdate', handleTargetsUpdate);
        return function () { props.vm.removeListener('targetsUpdate', handleTargetsUpdate); };
    }, [props.vm]);

    var handleStopStreaming = useCallback(function () {
        if (streamControllerRef.current) {
            try { streamControllerRef.current.abort(); } catch (e) {}
        }
    }, []);

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
        // The recipe of the blocks the assistant proposed last time: it lets a
        // follow-up edit locate exactly what was created without re-deriving it.
        var prevRecipe = '';
        for (var pmi = messages.length - 1; pmi >= 0; pmi--) {
            if (messages[pmi] && messages[pmi].role === 'assistant' && messages[pmi].recipe) {
                prevRecipe = messages[pmi].recipe;
                break;
            }
        }
        var enhancedText = modeTag + '\n' +
            (prevRecipe ? '=== RECETA GENERADA ANTES (los bloques que se propusieron/cambiaron la última vez; usá sus líneas como target en "edits") ===\n' + prevRecipe + '\n---\n' : '') +
            (workspaceContext ? workspaceContext + '\n---\n' : '') + detailInfo + text;
        var assIdx = msgIdx + 1;
        var controller = new AbortController();
        streamControllerRef.current = controller;
        streamAssIdxRef.current = assIdx;

        setMessages(function (prev) {
            return prev.concat([{
                role: 'assistant',
                content: '',
                displayContent: '',
                id: assIdx,
                typing: true,
                streaming: true,
                hasBlocks: false,
                hasImageGenerate: false,
                hasAudioGenerate: false,
                hasSfxGenerate: false,
                hasMusicGenerate: false
            }]);
        });

        var accumulated = '';
        var onDelta = function (chunk) {
            accumulated += chunk;
            var display = formatStreamingDisplayText(accumulated);
            setMessages(function (prev) {
                if (assIdx >= prev.length) return prev;
                var copy = prev.slice();
                copy[assIdx] = Object.assign({}, copy[assIdx], {
                    content: accumulated,
                    displayContent: display,
                    typing: true,
                    streaming: true
                });
                return copy;
            });
        };

        var finalize = function (cleanResponse) {
            // Distinguish "edit existing blocks" from "literal creation" so the
            // action button can say "Aplicar cambios" instead of "Crear". A
            // response is an edit when it re-emits existing scripts to modify
            // them (clearExisting), when it targets a specific script to change
            // or extend (deleteScripts pointing at an existing top opcode), or
            // when its top opcodes already exist on the canvas.
            var intent = 'create';
            try {
                var intentParsed = JSON.parse(cleanResponse);
                if (intentParsed && (intentParsed.clearExisting || intentParsed.clearAll ||
                    (intentParsed.edits && intentParsed.edits.length > 0) ||
                    (intentParsed.deleteScripts && intentParsed.deleteScripts.length > 0))) {
                    intent = 'edit';
                }
            } catch (e) {
                var intentJm = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (intentJm) {
                    try {
                        var intentP2 = JSON.parse(intentJm[1]);
                        if (intentP2 && (intentP2.clearExisting || intentP2.clearAll ||
                            (intentP2.edits && intentP2.edits.length > 0) ||
                            (intentP2.deleteScripts && intentP2.deleteScripts.length > 0))) {
                            intent = 'edit';
                        }
                    } catch (e2) {}
                }
            }
            if (intent !== 'edit' && props.vm && props.vm.editingTarget) {
                try {
                    var existingScripts = readWorkspaceScripts(props.vm) || [];
                    if (existingScripts.length > 0) {
                        var existingOpcodes = {};
                        for (var ei2 = 0; ei2 < existingScripts.length; ei2++) {
                            var es = existingScripts[ei2];
                            if (es && es.topOpcode) existingOpcodes[es.topOpcode] = true;
                        }
                        var parsedIntent = null;
                        try { parsedIntent = parseDescriptor(cleanResponse); } catch (e3) {}
                        if (parsedIntent && parsedIntent.topBlocks) {
                            for (var tbJ = 0; tbJ < parsedIntent.topBlocks.length; tbJ++) {
                                var tbJb = parsedIntent.blockMap[parsedIntent.topBlocks[tbJ].id];
                                if (tbJb && tbJb.opcode && existingOpcodes[tbJb.opcode]) {
                                    intent = 'edit';
                                    break;
                                }
                            }
                        }
                    }
                } catch (e4) {}
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

            var imgGen = null;
            var audioGen = null;
            var sfxGen = null;
            var musicGen = null;
            var hasScripts = false;
            var hasGameDevelop = false;

            try {
                var parsed = JSON.parse(cleanResponse);
                if (parsed.imageGenerate) {
                    imgGen = Array.isArray(parsed.imageGenerate) ? (parsed.imageGenerate[0] || null) : parsed.imageGenerate;
                }
                if (parsed.audioGenerate) audioGen = parsed.audioGenerate;
                if (parsed.sfxGenerate) sfxGen = parsed.sfxGenerate;
                if (parsed.musicGenerate) musicGen = parsed.musicGenerate;
                if (parsed.scripts && parsed.scripts.length > 0) hasScripts = true;
                if (parsed.edits && parsed.edits.length > 0) hasScripts = true;
                if (isGameSchema(parsed)) hasGameDevelop = true;
            } catch (e) {
                var jm = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (jm) {
                    try {
                        var p2 = JSON.parse(jm[1]);
                        if (p2.imageGenerate) {
                            imgGen = Array.isArray(p2.imageGenerate) ? (p2.imageGenerate[0] || null) : p2.imageGenerate;
                        }
                        if (p2.audioGenerate) audioGen = p2.audioGenerate;
                        if (p2.sfxGenerate) sfxGen = p2.sfxGenerate;
                        if (p2.musicGenerate) musicGen = p2.musicGenerate;
                        if (p2.scripts && p2.scripts.length > 0) hasScripts = true;
                        if (p2.edits && p2.edits.length > 0) hasScripts = true;
                        if (isGameSchema(p2)) hasGameDevelop = true;
                    } catch (e2) {}
                }
            }
            // Also check for scratchblocks text syntax (@reemplazar, etc.)
            if (!hasScripts) {
                var descMatch = cleanResponse.match(/@(reemplazar|agregar|bloques)/i);
                if (descMatch) hasScripts = true;
            }

            // Internal recipe: the canonical WORKSPACE ACTUAL text of the blocks
            // this message proposes/edits. Kept on the message (not shown in the
            // chat) so a follow-up edit can be located precisely against it.
            var recipe = '';
            if (hasScripts) {
                try {
                    var recipeParsed = parseDescriptor(cleanResponse);
                    if (recipeParsed && recipeParsed.topBlocks && recipeParsed.topBlocks.length > 0) {
                        var recipeLines = [];
                        for (var rt = 0; rt < recipeParsed.topBlocks.length; rt++) {
                            var rs = signatureFromContainer({_blocks: recipeParsed.blockMap}, recipeParsed.topBlocks[rt].id);
                            if (rs) recipeLines.push(rs);
                        }
                        recipe = recipeLines.join('\n');
                    }
                } catch (e) {}
            }

            setMessages(function (prev) {
                if (assIdx >= prev.length) return prev;
                var copy = prev.slice();
                copy[assIdx] = Object.assign({}, copy[assIdx], {
                    role: 'assistant',
                    content: cleanResponse,
                    displayContent: displayText,
                    typing: false,
                    streaming: false,
                    hasBlocks: !mentorMode && hasScripts,
                    hasGameDevelop: !mentorMode && hasGameDevelop,
                    intent: intent,
                    recipe: recipe,
                    hasImageGenerate: !!imgGen,
                    imageGenerate: imgGen,
                    imageState: imgGen ? 'pending' : null,
                    imageData: null,
                    imagePrompt: imgGen ? imgGen.prompt : null,
                    imageTarget: imgGen ? (imgGen.target || 'sprite') : null,
                    hasAudioGenerate: !!audioGen,
                    audioGenerate: audioGen,
                    hasSfxGenerate: !!sfxGen,
                    sfxGenerate: sfxGen,
                    hasMusicGenerate: !!musicGen,
                    musicGenerate: musicGen
                });
                return copy;
            });
        };

        var askPromise = service.askStream(enhancedText, sessionSum, mentorMode, onDelta, controller.signal);
        askPromise.then(function (response) {
            var cleanResponse = (response || '').trim();
            if (!cleanResponse) {
                setMessages(function (prev) {
                    var copy = prev.slice();
                    if (assIdx < copy.length) {
                        copy[assIdx] = Object.assign({}, copy[assIdx], {typing: false, streaming: false});
                    }
                    return copy.concat([{
                        role: 'system',
                        content: intl.formatMessage(systemMessages.emptyResponse)
                    }]);
                });
                setSending(false);
                return;
            }
            finalize(cleanResponse);
            setSending(false);
        }).catch(function (err) {
            var cancelled = err && err.name === 'AbortError';
            if (cancelled) {
                setMessages(function (prev) {
                    if (assIdx >= prev.length) return prev;
                    var copy = prev.slice();
                    var currentMsg = copy[assIdx] || {};
                    var display = stripBlockDescriptor(accumulated) || currentMsg.displayContent || 'Operación cancelada.';
                    copy[assIdx] = Object.assign({}, currentMsg, {
                        content: accumulated || currentMsg.content,
                        displayContent: display,
                        typing: false,
                        streaming: false
                    });
                    return copy.concat([{
                        role: 'system',
                        content: intl.formatMessage(systemMessages.streamCancelled)
                    }]);
                });
            } else {
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
                    var copy = prev.slice();
                    if (assIdx < copy.length && copy[assIdx] && copy[assIdx].streaming) {
                        copy[assIdx] = Object.assign({}, copy[assIdx], {typing: false, streaming: false});
                    }
                    return copy.concat([{
                        role: 'system',
                        content: intl.formatMessage(systemMessages.errorPrefix, {msg: errorMsg})
                    }]);
                });
            }
            setSending(false);
        }).then(function () {
            if (streamAssIdxRef.current === assIdx) {
                streamControllerRef.current = null;
                streamAssIdxRef.current = null;
            }
        });
    }, [getService, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
                parseErrors: [],
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
                    blockCheck.parseErrors = corrected.errors || [];
                    var workspace = (typeof window !== 'undefined' && window.Blockly) ?
                        window.Blockly.getMainWorkspace() : null;
                    if (workspace && typeof workspace.getAllBlocks === 'function') {
                        var vResult = verifyBlocks(corrected, workspace, intl);
                        blockCheck.created = vResult.ok;
                        blockCheck.creationIssues = vResult.issues || [];
                        blockCheck.actualCount = vResult.actualCount || 0;
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
                    intent: copy[msgIndex].intent || assistantMsg.intent,
                    hasBlocks: copy[msgIndex].hasBlocks,
                    recipe: copy[msgIndex].recipe || assistantMsg.recipe,
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
                    intent: assistantMsg.intent,
                    hasBlocks: assistantMsg.hasBlocks,
                    recipe: assistantMsg.recipe,
                    blockCheck: blockCheck
                };
                return copy;
            });
            setVerifyingIndex(null);
        });
    }, [getService, messages, verifyingIndex, getPrecedingUserMsg, props.vm]);

    function tryCreateChain(blockId, blockMap, Blockly, workspace, errors, vm) {
        try {
            var chainXml = chainToXML(blockId, {blockMap: blockMap, topBlocks: [blockMap[blockId]]}, vm);
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

    function doCreate(assistantContent, intl, msgIndex) {
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

        var contentToParse = assistantContent;
        if (jsonObj && !jsonObj.scripts && (jsonObj.sprites || jsonObj.stage)) {
            var targetScripts = null;
            var isStage = props.vm && props.vm.editingTarget && props.vm.editingTarget.isStage;
            var targetName = props.vm && props.vm.editingTarget ?
                (props.vm.editingTarget.getName ? props.vm.editingTarget.getName() : (props.vm.editingTarget.sprite && props.vm.editingTarget.sprite.name)) : null;

            if (isStage && jsonObj.stage && Array.isArray(jsonObj.stage.scripts)) {
                targetScripts = jsonObj.stage.scripts;
            } else if (Array.isArray(jsonObj.sprites) && jsonObj.sprites.length > 0) {
                if (targetName) {
                    var match = jsonObj.sprites.find(function (s) {
                        return s.name && s.name.toLowerCase() === targetName.toLowerCase();
                    });
                    if (match && Array.isArray(match.scripts)) {
                        targetScripts = match.scripts;
                    }
                }
                if (!targetScripts && Array.isArray(jsonObj.sprites[0].scripts)) {
                    targetScripts = jsonObj.sprites[0].scripts;
                }
            }
            if (targetScripts && targetScripts.length > 0) {
                contentToParse = JSON.stringify({ scripts: targetScripts });
            }
        }

        // Explicit edit intents. `clearExisting` only says the model re-emits the
        // scripts it edits (in-place reconciliation); it NEVER means "wipe what is
        // not listed". Deletion is explicit: deleteScripts (top opcodes to remove)
        // or clearAll (the user asked to start from scratch).
        var deleteScripts = (jsonObj && jsonObj.deleteScripts) || [];
        if (!Array.isArray(deleteScripts)) deleteScripts = [];
        var clearAll = !!(jsonObj && jsonObj.clearAll);

        // Shared apply helpers: reconnect a removed block (keep its neighbours
        // attached) and insert a bounded run of new blocks into a socket.
        function spliceRemoveBlock(block) {
            var nextB = null;
            try { nextB = typeof block.getNextBlock === 'function' ? block.getNextBlock() : null; } catch (e) {}
            var conn = null;
            try { conn = block.previousConnection ? block.previousConnection.targetConnection : null; } catch (e) {}
            if (conn && nextB) {
                try { conn.connect(nextB.previousConnection); } catch (e) {}
            }
        }

        function buildInsert(op, blockMap, Blockly, workspace) {
            var runIds = op.runIds;
            if (!runIds || !runIds.length) return null;
            var subset = boundedSubset({_blocks: blockMap}, runIds);
            var topId = runIds[0];
            if (!subset._blocks[topId]) return null;
            var xml = blocksToXML({blockMap: subset._blocks, topBlocks: [{id: topId}]}, props.vm);
            if (!xml) return null;
            var dom = Blockly.Xml.textToDom(xml);
            var blockNode = null;
            for (var i = 0; i < dom.childNodes.length; i++) {
                var el = dom.childNodes[i];
                if (el && el.nodeType === 1 && (el.tagName === 'block' || el.tagName === 'shadow')) {
                    blockNode = el;
                    break;
                }
            }
            if (!blockNode) return null;
            var createdBlock = null;
            if (Blockly.Xml && typeof Blockly.Xml.domToBlock === 'function') {
                createdBlock = Blockly.Xml.domToBlock(blockNode, workspace);
            } else {
                var wrapXml = Blockly.Xml.textToDom('<xml></xml>');
                wrapXml.appendChild(blockNode);
                var newIds = Blockly.Xml.domToWorkspace(wrapXml, workspace);
                if (newIds && newIds.length) {
                    createdBlock = workspace.getBlockById(newIds[0]);
                }
            }
            if (!createdBlock) return null;

            // Capture the descendants BEFORE connecting: on a fresh unattached
            // chain this is exactly the new blocks, so flyInBlocks never
            // re-animates old blocks that Blockly re-chains during connect.
            var out = [];
            if (typeof createdBlock.getDescendants === 'function') {
                var allB = createdBlock.getDescendants(false);
                for (var d = 0; d < allB.length; d++) {
                    if (allB[d] && !(typeof allB[d].isShadow === 'function' && allB[d].isShadow())) {
                        out.push(allB[d].id);
                    }
                }
            } else {
                out.push(createdBlock.id);
            }

            var anchor = op.atBlock ? workspace.getBlockById(op.atBlock) : null;
            if (!anchor) return null;
            var conn = null;
            if (op.atSlot === 'next') {
                conn = anchor.nextConnection || null;
            } else if (anchor.getInput && typeof anchor.getInput === 'function') {
                var inp = anchor.getInput(op.atSlot);
                conn = inp ? inp.connection : null;
            }
            if (!conn) return null;
            var endConn = createdBlock.outputConnection || createdBlock.previousConnection;
            if (!endConn) return null;
            var priorTarget = null;
            try { priorTarget = conn.targetBlock ? conn.targetBlock() : null; } catch (e) {}
            conn.connect(endConn);
            // On `next` / statement sockets Blockly.connect already splices the
            // displaced stack below the inserted chain's tail. Manually re-splicing
            // it again there would create a `next` loop (getDescendants → max stack
            // exceeded), so only reconnect for value sockets.
            if (priorTarget && priorTarget !== createdBlock && !op.stacked && op.atSlot !== 'next') {
                var tail = createdBlock;
                var guard = 0;
                var seen = {};
                seen[createdBlock.id] = true;
                while (tail.getNextBlock && tail.getNextBlock() && guard < 200) {
                    var nb = tail.getNextBlock();
                    if (nb.id && seen[nb.id]) break;
                    if (nb.id) seen[nb.id] = true;
                    tail = nb;
                    guard++;
                }
                if (tail.nextConnection) {
                    try { tail.nextConnection.connect(priorTarget.previousConnection); } catch (e) {}
                }
            }
            return {ids: out, conn: conn, priorTarget: priorTarget};
        }

        // Walk every `next` chain in the workspace and break any cycle found.
        // A single circular `next` link makes Blockly getDescendants recurse
        // forever, so we never leave one behind.
        function repairNextCycles(workspace) {
            if (!workspace || typeof workspace.getAllBlocks !== 'function') return 0;
            var all = [];
            try { all = workspace.getAllBlocks(); } catch (e) { return 0; }
            var broken = 0;
            for (var i = 0; i < all.length; i++) {
                var b = all[i];
                if (!b || typeof b.getNextBlock !== 'function') continue;
                var seen = {};
                var cur = b;
                var guard = 0;
                while (cur && typeof cur.getNextBlock === 'function' && guard < 1000) {
                    var cid = cur.id;
                    if (cid == null) break;
                    if (seen[cid]) {
                        if (cur.nextConnection) {
                            try { cur.nextConnection.disconnect(); } catch (e) {}
                        }
                        broken++;
                        console.warn('[AI Blocks] Bucle next detectado y cortado en ' + b.id);
                        break;
                    }
                    seen[cid] = true;
                    cur = cur.getNextBlock();
                    guard++;
                }
            }
            return broken;
        }

        // Apply a resolved op set as ONE transaction: create every insert /
        // replace first (recording rollback info), then remove. If any create
        // fails, the displaced sockets are restored and only the freshly created
        // blocks are disposed — existing blocks are never left half-deleted.
        function applyOpSet(workspace, ops, blockMap, Blockly) {
            if (!workspace || !ops || !ops.length) return {insertedIds: [], removedIds: []};
            var insertedIds = [];
            var removedIds = [];
            var appliedCreates = [];
            try {
                for (var a = 0; a < ops.length; a++) {
                    var o = ops[a];
                    if (o.kind === 'remove' || o.kind === 'mutate') continue;
                    var made = buildInsert(o, blockMap, Blockly, workspace);
                    if (!made || !made.ids || made.ids.length === 0) {
                        throw new Error('no se pudo insertar en el socket "' + o.atSlot + '"');
                    }
                    for (var mi = 0; mi < made.ids.length; mi++) insertedIds.push(made.ids[mi]);
                    appliedCreates.push({conn: made.conn, priorTarget: made.priorTarget, ids: made.ids});
                }
                for (var b = 0; b < ops.length; b++) {
                    var ob = ops[b];
                    if (ob.kind === 'replace') {
                        var oldB = workspace.getBlockById(ob.oldId);
                        if (oldB && !(oldB.isDisposed && oldB.isDisposed())) {
                            removedIds.push(ob.oldId);
                            spliceRemoveBlock(oldB);
                        }
                    } else if (ob.kind === 'remove') {
                        var blk = workspace.getBlockById(ob.oldId);
                        if (!blk || (blk.isDisposed && blk.isDisposed())) continue;
                        removedIds.push(ob.oldId);
                        spliceRemoveBlock(blk);
                    }
                }
            } catch (e) {
                console.warn('[AI Blocks] Aplicación falló, se restaura el estado:', e.message);
                for (var r = appliedCreates.length - 1; r >= 0; r--) {
                    var ac = appliedCreates[r];
                    try {
                        if (ac.conn && ac.priorTarget) {
                            var reconnect = ac.priorTarget.outputConnection || ac.priorTarget.previousConnection;
                            if (reconnect) ac.conn.connect(reconnect);
                        }
                    } catch (e2) {}
                    for (var rd = 0; rd < ac.ids.length; rd++) {
                        try {
                            var orphan = workspace.getBlockById(ac.ids[rd]);
                            if (orphan && !(orphan.isDisposed && orphan.isDisposed()) && orphan.dispose) {
                                orphan.dispose(false);
                            }
                        } catch (e3) {}
                    }
                }
                return null;
            }
            return {insertedIds: insertedIds, removedIds: removedIds};
        }

        // After an in-place edit the raw connection ops do not re-render the
        // affected chains, so their children keep a stale layout (blocks look
        // pushed aside) until a tab switch forces a reflow. Rendering each
        // affected chain here gives the fly-in animation fresh positions.
        function reRenderAffectedChains(workspace, ids) {
            if (!workspace || !ids || !ids.length) return;
            var seen = {};
            for (var i = 0; i < ids.length; i++) {
                var b = workspace.getBlockById ? workspace.getBlockById(ids[i]) : null;
                if (!b) continue;
                var guard = 0;
                while (typeof b.getParent === 'function' && guard < 200) {
                    var par = null;
                    try { par = b.getParent(); } catch (e) { par = null; }
                    if (!par) break;
                    b = par;
                    guard++;
                }
                if (!b || b.id == null || seen[b.id]) continue;
                seen[b.id] = true;
                try {
                    if (typeof b.render === 'function') b.render(true);
                } catch (e) {}
            }
        }

        // Resolve a variable-ish field value (name or id) to a variable id the
        // FieldVariable can consume. Returns null when no such variable exists
        // (the replace path would then auto-create it via the XML variables).
        function resolveVarId(workspace, mappedName, value, Blockly) {
            if (value === null || value === undefined || String(value).trim() === '') return null;
            var type = '';
            if (mappedName === 'LIST') type = Blockly.LIST_VARIABLE_TYPE;
            else if (mappedName === 'BROADCAST_OPTION') type = Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE;
            var v = null;
            try { v = workspace.getVariable(String(value), type); } catch (e) { v = null; }
            if (!v) {
                try { v = workspace.getVariableById(String(value)); } catch (e) { v = null; }
            }
            return v ? v.getId() : null;
        }

        // Mutate an existing Blockly block IN PLACE to match a parsed descriptor
        // block: fields + shadow fields only (the resolver guarantees the same
        // opcode and skeleton). Any mismatch (unknown variable, missing
        // field/shadow, wrong child opcode) throws so the caller can fall back
        // to replace instead of corrupting the block.
        function mutateBlock(live, desc, workspace, blockMap, Blockly) {
            var liveFields = desc.fields || {};
            for (var fname in liveFields) {
                if (!Object.prototype.hasOwnProperty.call(liveFields, fname)) continue;
                var mappedName = fname === 'CHOICE' ? 'BROADCAST_OPTION' : fname;
                var value = liveFields[fname].value;
                if (value === null || value === undefined) continue;
                if (mappedName === 'VARIABLE' || mappedName === 'LIST' || mappedName === 'BROADCAST_OPTION') {
                    var resolved = resolveVarId(workspace, mappedName, value, Blockly);
                    if (resolved === null) throw new Error('variable "' + value + '" no existe');
                    value = resolved;
                }
                var liveField = (live.getField && live.getField(mappedName)) || null;
                if (!liveField) throw new Error('bloque sin campo "' + mappedName + '"');
                live.setFieldValue(mappedName, value);
            }
            var inputs = desc.inputs || {};
            for (var iname in inputs) {
                if (!Object.prototype.hasOwnProperty.call(inputs, iname)) continue;
                var din = inputs[iname];
                var liveInput = (live.getInput && live.getInput(iname)) || null;
                if (!liveInput || !liveInput.connection) throw new Error('bloque sin input "' + iname + '"');
                var target = liveInput.connection.targetBlock();
                if (!target) throw new Error('input "' + iname + '" vacío');
                if (din.block) {
                    var dChild = blockMap[din.block];
                    if (!dChild) throw new Error('descriptor sin hijo en "' + iname + '"');
                    if (!target.isShadow || target.isShadow()) throw new Error('input "' + iname + '" sin hijo real');
                    if (dChild.opcode !== target.opcode) throw new Error('opcode hijo distinto en "' + iname + '"');
                    mutateBlock(target, dChild, workspace, blockMap, Blockly);
                } else if (din.shadow) {
                    var dShadow = blockMap[din.shadow];
                    if (!dShadow) throw new Error('descriptor sin sombra en "' + iname + '"');
                    if (!target.isShadow || !target.isShadow()) throw new Error('input "' + iname + '" sin sombra');
                    mutateBlock(target, dShadow, workspace, blockMap, Blockly);
                }
            }
        }

        // Apply `mutate` ops: scalar field/shadow updates IN PLACE on existing
        // blocks (same opcode + skeleton). setFieldValue fires a BlockChange per
        // field, which the VM blockListener (blocks.jsx) already syncs back to
        // _blocks — no delete, no insert, no animation. Ops that cannot be
        // applied this way are returned as replacements for the structural pass.
        function applyMutations(workspace, ops, blockMap, Blockly) {
            var mutatedIds = [];
            var failedOps = [];
            if (!workspace || !ops || !ops.length) return {mutatedIds: mutatedIds, failedOps: failedOps};
            for (var i = 0; i < ops.length; i++) {
                var o = ops[i];
                var live = workspace.getBlockById(o.oldId);
                var desc = blockMap[o.newId];
                if (!live || !desc) {
                    failedOps.push(o);
                    continue;
                }
                try {
                    mutateBlock(live, desc, workspace, blockMap, Blockly);
                    mutatedIds.push(o.oldId);
                } catch (e) {
                    console.warn('[AI Blocks] Mutación no aplicable en ' + o.oldId + ' (' + e.message + ') → se reemplaza');
                    failedOps.push(o);
                }
            }
            return {mutatedIds: mutatedIds, failedOps: failedOps};
        }

        // Explicit edit contract: resolve quitar/poner/cambiar against the live
        // workspace and apply ONLY those ops. Nothing else is ever deleted.
        function applyEdits(edits) {
            var Blockly = window.Blockly;
            var workspace = Blockly && Blockly.getMainWorkspace();
            if (!Blockly || !workspace || !props.vm || !props.vm.editingTarget) {
                setCreatingIndex(null);
                return;
            }
            repairNextCycles(workspace);
            var existing = [];
            try { existing = readWorkspaceScripts(props.vm) || []; } catch (e) { existing = []; }
            var resolved = resolveEdits(edits, existing, props.vm.editingTarget.blocks);

            // Snapshot BEFORE editing so the revert button always restores the
            // exact previous state, without leftovers of the new blocks.
            var snapshotXml = '';
            try { snapshotXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)); } catch (e) {}

            var unresolved = (resolved.unresolved || []).slice();
            var counts = resolved.counts || {inserted: 0, removed: 0, changed: 0};

            // Scalar `change` edits (same opcode + skeleton) are mutated IN
            // PLACE first: the existing block keeps its subtree, only
            // field/shadow values change. Structural ops (insert / replace /
            // remove) run after; any mutation that cannot be applied in place
            // is downgraded to a replace so the block is still edited.
            var mutateOps = [];
            var structuralOps = [];
            for (var mo = 0; mo < resolved.ops.length; mo++) {
                if (resolved.ops[mo].kind === 'mutate') mutateOps.push(resolved.ops[mo]);
                else structuralOps.push(resolved.ops[mo]);
            }
            var mutation = applyMutations(workspace, mutateOps, resolved.blockMap, Blockly);
            for (var fo = 0; fo < mutation.failedOps.length; fo++) {
                structuralOps.push(Object.assign({}, mutation.failedOps[fo], {kind: 'replace'}));
            }

            var applied = {insertedIds: [], removedIds: []};
            if (structuralOps.length > 0) {
                applied = applyOpSet(workspace, structuralOps, resolved.blockMap, Blockly);
            }
            if (!applied) {
                counts = {inserted: 0, removed: 0, changed: 0};
                unresolved.push('No se pudo aplicar una edición; los bloques existentes se dejaron intactos');
            }
            var insertedIds = applied ? applied.insertedIds : [];
            var removedIds = applied ? applied.removedIds : [];

            // Re-render the chains touched by the edit so the fly-in animation
            // captures fresh layout instead of stale offsets (children that look
            // pushed aside until a tab switch forces a reflow).
            reRenderAffectedChains(workspace, insertedIds.concat(removedIds).concat(mutation.mutatedIds));
            repairNextCycles(workspace);

            var statusMsg;
            if (counts.inserted > 0 || counts.changed > 0 || counts.removed > 0) {
                statusMsg = intl.formatMessage(systemMessages.editingApplied, {
                    added: counts.inserted,
                    changed: counts.changed,
                    removed: counts.removed
                });
                if (unresolved.length > 0) {
                    statusMsg += ' — No se aplicaron: ' + unresolved.join('; ');
                }
            } else {
                statusMsg = unresolved.length > 0 ?
                    'No se pudo aplicar: ' + unresolved.join('; ') :
                    'No hubo cambios.';
            }

            setCreateStatus({type: unresolved.length > 0 ? 'warning' : 'success', mode: 'create', message: statusMsg});
            setMessages(function (prev) {
                var copy = prev.slice();
                if (typeof msgIndex === 'number' && copy[msgIndex]) {
                    copy[msgIndex] = Object.assign({}, copy[msgIndex], {snapshotXml: snapshotXml, reverted: false});
                }
                return copy;
            });

            var tasks = [];
            if (insertedIds.length > 0) tasks.push(flyInBlocks(workspace, insertedIds));
            if (removedIds.length > 0) tasks.push(fadeOutBlocks(workspace, removedIds));
            if (tasks.length > 0) {
                Promise.all(tasks)
                    .catch(function (e) { console.warn('[AI Blocks] Animación:', e.message); })
                    .then(function () { setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000); });
            } else {
                setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
            }
        }

        // When the model answered with explicit edits, apply them directly and
        // skip the whole-script reconciliation path entirely.
        if (jsonObj && Array.isArray(jsonObj.edits) && jsonObj.edits.length > 0) {
            applyEdits(jsonObj.edits);
            return;
        }

        function buildBlockData(content) {
            var p = parseDescriptor(content);
            if (!p) return null;
            p = autoCorrect(p);
            var v = validate(p, intl);
            return {
                parsed: p,
                validation: v,
                parseErrors: (p && p.errors) || [],
                changes: (p && p.changes) || []
            };
        }

        function countNonShadow(blockMap) {
            var count = 0;
            for (var id in blockMap) {
                if (!blockMap[id].shadow) count++;
            }
            return count;
        }

        var current = buildBlockData(contentToParse);
        // A response that ONLY deletes scripts (deleteScripts / clearAll, no
        // "scripts" array) legitimately carries an empty block map: it must still
        // reconcile so the requested removals actually run.
        var pureDeletion = deleteScripts.length > 0 || clearAll;
        if (!current || !current.parsed.blockMap || Object.keys(current.parsed.blockMap).length === 0) {
            if (!pureDeletion) {
                setCreateStatus({type: 'error', mode: 'create', message: intl.formatMessage(systemMessages.noBlocksFound)});
                setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
                return;
            }
        }

        var nonShadow = current && current.parsed.blockMap ? countNonShadow(current.parsed.blockMap) : 0;
        console.log('[AI Blocks] ' + (replace ? 'REPLACE' : 'APPEND') + ' ' + nonShadow + ' bloques, ' +
            (current ? current.parsed.topBlocks.length : 0) + ' cadenas');
        if (nonShadow === 0 && !pureDeletion) { setCreatingIndex(null); return; }

        var reconcileParsed = current && current.parsed ? current.parsed : {blockMap: {}, topBlocks: []};

        function finalizeLoading(parsed, parseErrors) {
            var loadNonShadow = countNonShadow(parsed.blockMap);
            try {
                var Blockly = window.Blockly;
                var workspace = Blockly && Blockly.getMainWorkspace();
                if (!Blockly || !workspace) { setCreatingIndex(null); return; }
                repairNextCycles(workspace);

                // Snapshot the current workspace so this message can be reverted later.
                var snapshotXml = '';
                try {
                    snapshotXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
                } catch (e) {}

                // Reconcile: the AI EDITS what already exists instead of wiping the
                // whole workspace. Scripts that did not change stay in place; only
                // additions, changes and removals touch the canvas.
                var existing = [];
                try { existing = readWorkspaceScripts(props.vm) || []; } catch (_e) { existing = []; }
                var plan = null;
                try {
                    plan = planChanges(parsed, existing, {
                        clearExisting: replace,
                        deleteScripts: deleteScripts,
                        clearAll: clearAll
                    });
                } catch (planError) {
                    console.warn('[AI Blocks] Reconciliación falló, se agregan las cadenas:', planError.message);
                    plan = {
                        keep: [],
                        replace: [],
                        remove: [],
                        add: parsed.topBlocks.map(function (t) { return {newId: t.id}; })
                    };
                }

                // Changed scripts are merged IN PLACE (block-level diff: only the
                // affected blocks are inserted / replaced / removed, the rest of the
                // chain stays frozen). If the diff cannot be applied safely the chain
                // is LEFT UNTOUCHED and reported — never wiped and re-created.
                var inPlaceInserts = [];
                var inPlaceRemoves = [];
                var inPlaceMutates = [];
                var skippedChains = [];
                var recreateOld = [];
                var recreateNew = [];

                function applyInPlace(rp) {
                    var oldTarget = (props.vm && props.vm.editingTarget) ? props.vm.editingTarget.blocks : null;
                    if (!oldTarget) return null;
                    var res = null;
                    try {
                        res = diffChain(oldTarget, rp.oldId, {_blocks: parsed.blockMap}, rp.newId);
                    } catch (e) {
                        console.warn('[AI Blocks] diffChain lanzó error para', rp.oldId, ':', e.message);
                        res = null;
                    }
                    if (!res || res.status !== 'ok') {
                        console.warn('[AI Blocks] diffChain no aplicable:', (res && res.status) || 'error',
                            'oldId=', rp.oldId, 'hat=', rp.topOpcode, '→ se deja intacto');
                        return null;
                    }
                    var ops = res.ops || [];
                    if (ops.length === 0) return {noop: true, insertedIds: [], removedIds: [], mutatedIds: []};

                    // Scalar value changes (same opcode + skeleton) are applied IN
                    // PLACE with setFieldValue (applyMutations); structural ops
                    // (insert / replace / remove) run as one transaction via
                    // applyOpSet. A mutation that cannot be applied in place is
                    // downgraded to a replace, so the change is still made.
                    var mutateOps = [];
                    var structuralOps = [];
                    for (var mo2 = 0; mo2 < ops.length; mo2++) {
                        if (ops[mo2].kind === 'mutate') mutateOps.push(ops[mo2]);
                        else structuralOps.push(ops[mo2]);
                    }
                    var mutation = applyMutations(workspace, mutateOps, parsed.blockMap, Blockly);
                    for (var fo2 = 0; fo2 < mutation.failedOps.length; fo2++) {
                        structuralOps.push(Object.assign({}, mutation.failedOps[fo2], {kind: 'replace'}));
                    }
                    var applied = {insertedIds: [], removedIds: []};
                    if (structuralOps.length > 0) {
                        applied = applyOpSet(workspace, structuralOps, parsed.blockMap, Blockly);
                    }
                    if (!applied) {
                        console.warn('[AI Blocks] Merge in-place falló para la cadena', rp.oldId,
                            '(se deja intacta): se restauró el estado previo');
                        return null;
                    }
                    return {
                        noop: false,
                        insertedIds: applied.insertedIds,
                        removedIds: applied.removedIds,
                        mutatedIds: mutation.mutatedIds
                    };
                }

                // Changed scripts are merged IN PLACE. A chain whose diff cannot be
                // applied safely is re-created faithful to its target form whenever
                // the assistant asked for a REPLACE (the whole script changes), or
                // otherwise LEFT UNTOUCHED and reported.
                var fadeIds = [];
                for (var rpi = 0; rpi < plan.replace.length; rpi++) {
                    (function (rp) {
                        var ip = applyInPlace(rp);
                        if (ip && !ip.noop) {
                            for (var ix = 0; ix < ip.insertedIds.length; ix++) inPlaceInserts.push(ip.insertedIds[ix]);
                            for (var rx = 0; rx < ip.removedIds.length; rx++) inPlaceRemoves.push(ip.removedIds[rx]);
                            for (var mx = 0; mx < ip.mutatedIds.length; mx++) inPlaceMutates.push(ip.mutatedIds[mx]);
                            return;
                        }
                        if (ip && ip.noop) return;
                        // Recreate in place: carry the original script's position
                        // over to the new chain so it lands where the old one stood.
                        var oldBlock = null;
                        var newTop = parsed.blockMap[rp.newId];
                        try {
                            var oldTarget = (props.vm && props.vm.editingTarget) ? props.vm.editingTarget.blocks : null;
                            oldBlock = oldTarget ? oldTarget.getBlock(rp.oldId) : null;
                            if (oldBlock) {
                                var oldPos = (typeof oldBlock.xy === 'function') ? oldBlock.xy() :
                                    oldBlock.getRelativeToSurfaceXY();
                                if (oldPos && newTop) {
                                    newTop.x = oldPos.x;
                                    newTop.y = oldPos.y;
                                }
                            }
                        } catch (e) {}
                        if (newTop) {
                            recreateOld.push(rp.oldId);
                            recreateNew.push(newTop);
                        } else {
                            skippedChains.push(rp.topOpcode || rp.oldId);
                        }
                    })(plan.replace[rpi]);
                }
                for (var frm = 0; frm < plan.remove.length; frm++) {
                    fadeIds.push(plan.remove[frm].oldId);
                }
                for (var rco = 0; rco < recreateOld.length; rco++) {
                    fadeIds.push(recreateOld[rco]);
                }

                function finish(result) {
                    var chainErrors = result.errors || [];
                    // Benign auto-init warnings (variable auto-initialized) are
                    // informational, not failures: blocks were created fine.
                    function isAutoInitWarning(msg) {
                        return /^Variable ".*"(se asignó con valor vacío|usada sin asignarle valor)/.test(String(msg || ''));
                    }
                    var parseWarnings = [];
                    var hardParseErrors = [];
                    for (var pw = 0; pw < parseErrors.length; pw++) {
                        if (isAutoInitWarning(parseErrors[pw])) parseWarnings.push(parseErrors[pw]);
                        else hardParseErrors.push(parseErrors[pw]);
                    }
                    try {
                        var verification = verifyBlocks(parsed, workspace, intl);
                        if (verification.ok && chainErrors.length === 0 && hardParseErrors.length === 0) {
                            var statusMsg = '';
                            if (result.added > 0 || result.removed > 0 || result.changed > 0) {
                                statusMsg = intl.formatMessage(systemMessages.editingApplied, {
                                    added: result.added,
                                    changed: result.changed,
                                    removed: result.removed
                                });
                            } else if (replace) {
                                statusMsg = intl.formatMessage(systemMessages.blocksReplaced, {count: loadNonShadow});
                            } else {
                                statusMsg = intl.formatMessage(systemMessages.blocksAdded, {count: loadNonShadow});
                            }
                            if (parseWarnings.length > 0) {
                                statusMsg += ' — Nota: ' + parseWarnings.join('; ');
                            }
                            if (result.skipped && result.skipped.length > 0) {
                                statusMsg += ' — No se pudo editar en sitio (se dejó intacto): ' + result.skipped.join(', ');
                                setCreateStatus({type: 'warning', mode: 'create', message: statusMsg});
                            } else {
                                setCreateStatus({type: 'success', mode: 'create', message: statusMsg});
                            }
                            if (snapshotXml) {
                                setMessages(function (prev2) {
                                    var copy = prev2.slice();
                                    copy[creatingIndex] = Object.assign({}, copy[creatingIndex], {
                                        snapshotXml: snapshotXml,
                                        reverted: false
                                    });
                                    return copy;
                                });
                            }
                        } else {
                            var issueMsgs = [];
                            if (verification.issues && verification.issues.length > 0) {
                                issueMsgs = issueMsgs.concat(verification.issues);
                            }
                            for (var ei = 0; ei < chainErrors.length; ei++) {
                                issueMsgs.push(intl.formatMessage(systemMessages.errorPrefix, {msg: chainErrors[ei]}));
                            }
                            for (var pei = 0; pei < hardParseErrors.length; pei++) {
                                issueMsgs.push(hardParseErrors[pei]);
                            }
                            console.warn('[AI Blocks] Problemas:', issueMsgs);
                            setCreateStatus({
                                type: 'warning',
                                mode: 'create',
                                message: intl.formatMessage(systemMessages.blocksSkipped, {count: issueMsgs.length, details: issueMsgs.join('; ')})
                            });
                        }
                    } catch (e) {
                        console.error('[AI Blocks] Error en verificacion:', e);
                        setCreateStatus({type: 'error', mode: 'create', message: 'Error: ' + (e.message || 'desconocido')});
                    }
                    setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
                }

                function placeAndCreate() {
                    // Free slot below the lowest remaining script.
                    var baseY = 40;
                    try {
                        var allB = workspace.getAllBlocks();
                        var ys = [];
                        for (var ai = 0; allB && ai < allB.length; ai++) {
                            var bb = allB[ai];
                            if (!bb || (typeof bb.getParent === 'function' && bb.getParent())) continue;
                            if (typeof bb.getRelativeToSurfaceXY === 'function') {
                                var pp = bb.getRelativeToSurfaceXY();
                                if (pp) ys.push(pp.y + 40);
                            }
                        }
                        if (ys.length > 0) baseY = Math.max.apply(null, ys);
                    } catch (e) { baseY = 40; }

                    var addIndex = 0;
                    var toPlace = [];
                    for (var aI = 0; aI < plan.add.length; aI++) {
                        var addB = parsed.blockMap[plan.add[aI].newId];
                        if (!addB) continue;
                        addB.x = 30;
                        addB.y = baseY + addIndex * 90;
                        addIndex++;
                        toPlace.push(addB);
                    }
                    for (var rcI = 0; rcI < recreateNew.length; rcI++) {
                        toPlace.push(recreateNew[rcI]);
                    }

                    var createdIds = [];
                    var errs = [];
                    if (toPlace.length > 0) {
                        try {
                            var subsetXml = blocksToXML({blockMap: parsed.blockMap, topBlocks: toPlace}, props.vm);
                            var subsetDom = Blockly.Xml.textToDom(subsetXml);
                            Blockly.Xml.domToWorkspace(subsetDom, workspace);
                            console.log('[AI Blocks] Batch parcial (reconciliación) OK');
                            for (var oi = 0; oi < toPlace.length; oi++) createdIds.push(toPlace[oi].id);
                        } catch (batchError) {
                            console.warn('[AI Blocks] Batch parcial falló, por cadena:', batchError.message);
                            for (var cj = 0; cj < toPlace.length; cj++) {
                                if (tryCreateChain(toPlace[cj].id, parsed.blockMap, Blockly, workspace, errs, props.vm)) {
                                    createdIds.push(toPlace[cj].id);
                                }
                            }
                        }
                    }

                    return {
                        added: plan.add.length,
                        removed: plan.remove.length + inPlaceRemoves.length,
                        changed: plan.replace.length - skippedChains.length,
                        errors: errs,
                        createdIds: createdIds,
                        skipped: skippedChains
                    };
                }

                function runAnimations(result) {
                    reRenderAffectedChains(workspace, inPlaceInserts.concat(inPlaceRemoves).concat(inPlaceMutates));
                    var tasks = [];
                    if (inPlaceInserts.length > 0) {
                        tasks.push(flyInBlocks(workspace, inPlaceInserts));
                    }
                    if (inPlaceRemoves.length > 0) {
                        tasks.push(fadeOutBlocks(workspace, inPlaceRemoves));
                    }
                    if (result.createdIds && result.createdIds.length > 0) {
                        tasks.push(assembleBlocksInOrder(workspace, result.createdIds));
                    }
                    if (tasks.length > 0) {
                        Promise.all(tasks)
                            .catch(function (e) { console.warn('[AI Blocks] Animación:', e.message); })
                            .then(function () { finish(result); });
                    } else {
                        finish(result);
                    }
                }

                if (fadeIds.length > 0) {
                    fadeOutChains(workspace, fadeIds).then(function () {
                        try {
                            runAnimations(placeAndCreate());
                        } catch (e) {
                            console.error('[AI Blocks] Error al reconciliar:', e);
                            setCreateStatus({type: 'error', mode: 'create', message: 'Error: ' + (e.message || 'desconocido')});
                            setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
                        }
                    });
                } else {
                    try {
                        runAnimations(placeAndCreate());
                    } catch (e) {
                        console.error('[AI Blocks] Error al reconciliar:', e);
                        setCreateStatus({type: 'error', mode: 'create', message: 'Error: ' + (e.message || 'desconocido')});
                        setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
                    }
                }
            } catch (e) {
                console.error('[AI Blocks] Error fatal:', e);
                setCreateStatus({
                    type: 'error',
                    mode: 'create',
                    message: 'Error: ' + (e.message || 'desconocido')
                });
                setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 5000);
            }
        }

        function failWithErrors(details) {
            console.warn('[AI Blocks] No se cargaron bloques:', details);
            setCreateStatus({
                type: 'error',
                mode: 'create',
                message: intl.formatMessage(systemMessages.blockCreationFailed, {details: details.join('; ')})
            });
            setTimeout(function () { setCreateStatus(null); setCreatingIndex(null); }, 8000);
        }

        function attemptFix(content, data, attemptNum) {
            var service = getService();
            if (!service || attemptNum >= 2) {
                var hardErrors = [];
                if (data.validation && data.validation.errors) hardErrors = hardErrors.concat(data.validation.errors);
                if (data.parseErrors) hardErrors = hardErrors.concat(data.parseErrors);
                failWithErrors(hardErrors.length ? hardErrors : ['No se pudo corregir la estructura de los bloques']);
                return;
            }
            service.fixBlocks(content, data.parseErrors, data.changes, data.validation.errors)
                .then(function (fixedJson) {
                    if (typeof msgIndex === 'number') {
                        setMessages(function (prev) {
                            var copy = prev.slice();
                            if (copy[msgIndex]) {
                                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                                    content: fixedJson,
                                    displayContent: stripBlockDescriptor(fixedJson) || fixedJson
                                });
                            }
                            return copy;
                        });
                    }
                    var next = buildBlockData(fixedJson);
                    if (!next || !next.parsed.blockMap || Object.keys(next.parsed.blockMap).length === 0) {
                        failWithErrors(['El JSON corregido no contiene bloques válidos']);
                        return;
                    }
                    if (next.validation.errors.length > 0) {
                        console.warn('[AI Blocks] El intento de corrección ' + (attemptNum + 1) + ' aún tiene errores:', next.validation.errors);
                        attemptFix(fixedJson, next, attemptNum + 1);
                        return;
                    }
                    finalizeLoading(next.parsed, next.parseErrors);
                })
                .catch(function (err) {
                    console.warn('[AI Blocks] fixBlocks falló:', err);
                    attemptFix(content, data, attemptNum + 1);
                });
        }

        if (current && current.validation.errors.length > 0) {
            // Estructura inválida: no cargar nada; intentar auto-corregir (máx. 2 veces)
            console.warn('[AI Blocks] Errores de validación, intentando auto-corrección:', current.validation.errors);
            attemptFix(contentToParse, current, 0);
            return;
        }

        finalizeLoading(reconcileParsed, current ? current.parseErrors : []);
    }

    var handleCreateBlocks = useCallback(function (msgIndex) {
        if (typeof window !== 'undefined' && localStorage.getItem('ai_mentor_mode') === 'true') return;
        if (!props.vm || !props.vm.editingTarget || creatingIndex !== null) return;

        var assistantMsg = messages[msgIndex];
        if (!assistantMsg || assistantMsg.role !== 'assistant') return;
        if (!assistantMsg.content) return;

        setCreatingIndex(msgIndex);
        setCreateStatus({type: 'loading', mode: 'create', message: intl.formatMessage(systemMessages.creatingBlocks)});
        setTimeout(function () {
            doCreate(assistantMsg.content, intl, msgIndex);
        }, 0);
    }, [props.vm, messages, creatingIndex, intl]);

    var handleDevelop = useCallback(function (msgIndex) {
        if (typeof window !== 'undefined' && localStorage.getItem('ai_mentor_mode') === 'true') return;
        if (!props.vm || creatingIndex !== null) return;

        var assistantMsg = messages[msgIndex];
        if (!assistantMsg || assistantMsg.role !== 'assistant') return;
        if (!assistantMsg.content) return;

        var service = getService();

        setCreatingIndex(msgIndex);
        setCreateStatus({type: 'loading', mode: 'develop', message: intl.formatMessage(systemMessages.developingGame)});

        developFullGameProject(
            assistantMsg.content,
            service,
            props.vm,
            {
                imageService: getImageService(),
                audioService: getAudioService()
            },
            function (progress) {
                setCreateStatus({
                    type: 'loading',
                    mode: 'develop',
                    message: progress.details || ('[' + progress.percent + '%] ' + (progress.agent || '')),
                    libraryOptions: progress.libraryOptions || null,
                    librarySelection: progress.librarySelection || null
                });
            }
        ).then(function (res) {
            setCreateStatus({
                type: 'success',
                mode: 'develop',
                message: '¡Juego ' + (res && res.gameTitle ? ('"' + res.gameTitle + '" ') : '') + 'desarrollado con éxito!'
            });
            setTimeout(function () {
                setCreateStatus(null);
                setCreatingIndex(null);
            }, 5000);
        }).catch(function (err) {
            console.error('[AI MultiAgent] Error al desarrollar el juego:', err);
            setCreateStatus({
                type: 'error',
                mode: 'develop',
                message: 'Error en desarrollo: ' + (err.message || 'desconocido')
            });
            setTimeout(function () {
                setCreateStatus(null);
                setCreatingIndex(null);
            }, 6000);
        });
    }, [props.vm, messages, creatingIndex, intl, getService, getImageService, getAudioService]);

    var handleRevertBlocks = useCallback(function (msgIndex) {
        if (!props.vm || !props.vm.editingTarget) return;
        var msg = messages[msgIndex];
        if (!msg || !msg.snapshotXml || msg.reverted) return;
        var Blockly = window.Blockly;
        var workspace = Blockly && Blockly.getMainWorkspace();
        if (!Blockly || !workspace) return;
        try {
            workspace.clear();
            var dom = Blockly.Xml.textToDom(msg.snapshotXml);
            Blockly.Xml.domToWorkspace(dom, workspace);
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {reverted: true});
                return copy;
            });
            setCreateStatus({type: 'success', message: intl.formatMessage(systemMessages.blocksReverted)});
            setTimeout(function () { setCreateStatus(null); }, 4000);
        } catch (e) {
            console.error('[AI Blocks] Revert error:', e);
            setCreateStatus({type: 'error', message: 'Error: ' + (e.message || 'desconocido')});
            setTimeout(function () { setCreateStatus(null); }, 4000);
        }
    }, [props.vm, messages]);

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
            props.onActivateTab('code');
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

    var parseImageGenerate = useCallback(function (content) {
        if (!content) return null;
        try {
            var j = JSON.parse(content);
            if (j && j.imageGenerate) return j.imageGenerate;
        } catch (e) {
            var m = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (m) {
                try {
                    var j2 = JSON.parse(m[1]);
                    if (j2 && j2.imageGenerate) return j2.imageGenerate;
                } catch (e2) {}
            }
        }
        return null;
    }, []);

    var handleGenerateImage = useCallback(function (msgIndex) {
        if (generatingIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || msg.role !== 'assistant') return;

        var imgGen = parseImageGenerate(msg.content);
        if (!imgGen) return;

        var imgSvc = getImageService();
        if (!imgSvc) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    imageState: 'error',
                    imageError: intl.formatMessage(systemMessages.noImageProvider)
                });
                return copy;
            });
            return;
        }

        setGeneratingIndex(msgIndex);
        var promptToUse = imgGen.prompt;

        imgSvc.generate(promptToUse).then(function (result) {
            var dataURL = result.dataURL;
            var target = imgGen.target || 'sprite';

            var chain = Promise.resolve(dataURL);
            if (target === 'sprite') {
                chain = imgSvc.removeBackground(dataURL).then(function (cleanedURL) {
                    return cleanedURL;
                }).catch(function () {
                    return dataURL;
                });
            }

            return chain.then(function (finalURL) {
                setMessages(function (prev) {
                    var copy = prev.slice();
                    copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                        imageState: 'generated',
                        imageData: {
                            dataURL: finalURL,
                            mimeType: result.mimeType || 'image/png',
                            provider: result.provider
                        },
                        imagePrompt: promptToUse,
                        imageTarget: target
                    });
                    return copy;
                });
                setGeneratingIndex(null);
            });
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    imageState: 'error',
                    imageError: err.message
                });
                return copy;
            });
            setGeneratingIndex(null);
        });
    }, [messages, generatingIndex, getImageService, parseImageGenerate, intl]);

    var handleGenerateAudio = useCallback(function (msgIndex) {
        if (generatingAudioIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || msg.role !== 'assistant') return;

        var audSvc = getAudioService();
        // Use AI-suggested text if available (from audioGenerate), otherwise use display content
        var textToSpeak = '';
        if (msg.audioGenerate && msg.audioGenerate.text) {
            textToSpeak = msg.audioGenerate.text;
        } else {
            textToSpeak = msg.displayContent || msg.content;
            // Strip markdown and limit length for free tier (1000 chars)
            textToSpeak = textToSpeak.replace(/[*_#`\[\]()>|~]/g, '');
        }
        var plainText = textToSpeak.substring(0, 900);

        setGeneratingAudioIndex(msgIndex);

        audSvc.generate(plainText).then(function (result) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    audioState: 'generated',
                    audioData: {
                        audioUrl: result.audioUrl,
                        blob: result.blob,
                        format: result.format,
                        name: (msg.audioGenerate && msg.audioGenerate.text ? msg.audioGenerate.text : plainText).substring(0, 40)
                    }
                });
                return copy;
            });
            setGeneratingAudioIndex(null);
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    audioState: 'error',
                    audioError: err.message || 'Audio generation failed'
                });
                return copy;
            });
            setGeneratingAudioIndex(null);
        });
    }, [messages, generatingAudioIndex, getAudioService]);

    var handleGenerateSfx = useCallback(function (msgIndex) {
        if (generatingSfxIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || msg.role !== 'assistant') return;

        var audSvc = getAudioService();
        var prompt = '';
        if (msg.sfxGenerate && msg.sfxGenerate.prompt) {
            prompt = msg.sfxGenerate.prompt;
        } else {
            prompt = msg.displayContent || msg.content;
        }

        setGeneratingSfxIndex(msgIndex);

        audSvc.generateSfx(prompt).then(function (result) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    sfxState: 'generated',
                    sfxData: {
                        audioUrl: result.audioUrl,
                        blob: result.blob,
                        format: result.format,
                        name: prompt.substring(0, 40)
                    }
                });
                return copy;
            });
            setGeneratingSfxIndex(null);
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    sfxState: 'error',
                    sfxError: err.message || 'Sound effect generation failed'
                });
                return copy;
            });
            setGeneratingSfxIndex(null);
        });
    }, [messages, generatingSfxIndex, getAudioService]);

    var handleGenerateMusic = useCallback(function (msgIndex) {
        if (generatingMusicIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || msg.role !== 'assistant') return;

        var audSvc = getAudioService();
        var prompt = '';
        if (msg.musicGenerate && msg.musicGenerate.prompt) {
            prompt = msg.musicGenerate.prompt;
        } else {
            prompt = msg.displayContent || msg.content;
        }

        setGeneratingMusicIndex(msgIndex);

        audSvc.generateMusic(prompt).then(function (result) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    musicState: 'generated',
                    musicData: {
                        audioUrl: result.audioUrl,
                        blob: result.blob,
                        format: result.format,
                        name: prompt.substring(0, 40)
                    }
                });
                return copy;
            });
            setGeneratingMusicIndex(null);
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    musicState: 'error',
                    musicError: err.message || 'Music generation failed'
                });
                return copy;
            });
            setGeneratingMusicIndex(null);
        });
    }, [messages, generatingMusicIndex, getAudioService]);

    var handleVerifyImage = useCallback(function (msgIndex) {
        if (verifyingImageIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || msg.role !== 'assistant') return;

        var userMsg = getPrecedingUserMsg(msgIndex);
        if (!userMsg) return;

        var imgGen = parseImageGenerate(msg.content);
        if (!imgGen) return;

        var originalPrompt = imgGen.prompt;
        var service = getService();
        if (!service) return;

        setVerifyingImageIndex(msgIndex);

        var verifyPrompt = [
            'Evaluá si la imagen generada para un proyecto Scratch es correcta para lo que pidió el usuario.',
            '',
            'Pregunta del usuario: ' + userMsg,
            'Prompt usado para generar la imagen: ' + originalPrompt,
            'Target: ' + (msg.imageTarget || imgGen.target || 'sprite'),
            '',
            'Si la imagen NO coincide con lo que el usuario pidió (estilo incorrecto, elementos incorrectos, colores incorrectos, etc.),',
            'proponé un PROMPT_CORREGIDO que describa exactamente lo que el usuario necesita.',
            'Considerá el contexto del proyecto Scratch: colores vivos, estilo cartoon, apropiado para niños.',
            '',
            'RESULTADO: CORRECTO o INCORRECTO',
            'EXPLICACIÓN: (breve explicación de por qué es correcta o incorrecta)',
            'PROMPT_CORREGIDO: (solo si es INCORRECTO, escribí acá el nuevo prompt detallado en español)'
        ].join('\n');

        service._call([
            {role: 'system', content: 'Evaluás si las imágenes generadas para Scratch son adecuadas.'},
            {role: 'user', content: verifyPrompt}
        ], 1024).then(function (raw) {
            var result = 'CORRECTO';
            var explanation = '';
            var correctedPrompt = '';
            var lines = (raw || '').split('\n');
            for (var li = 0; li < lines.length; li++) {
                var l = lines[li];
                if (l.indexOf('RESULTADO:') === 0) {
                    result = l.substring(10).trim().toUpperCase();
                } else if (l.indexOf('EXPLICACIÓN:') === 0) {
                    explanation = l.substring(12).trim();
                } else if (l.indexOf('PROMPT_CORREGIDO:') === 0) {
                    correctedPrompt = lines.slice(li + 1).join('\n').trim();
                    break;
                }
            }

            setMessages(function (prev) {
                var copy = prev.slice();
                var updated = Object.assign({}, copy[msgIndex]);
                if (result !== 'CORRECTO' && correctedPrompt) {
                    updated.imagePrompt = correctedPrompt;
                    updated.imageState = 'generating';
                    updated.imageData = null;
                }
                updated.imageVerification = {
                    result: result,
                    explanation: explanation || (result === 'CORRECTO' ? 'La imagen es correcta.' : 'El prompt necesita ajustes.'),
                    correctedPrompt: correctedPrompt
                };
                copy[msgIndex] = updated;
                return copy;
            });
            setVerifyingImageIndex(null);
        }).catch(function () {
            setVerifyingImageIndex(null);
        });
    }, [messages, verifyingImageIndex, getPrecedingUserMsg, parseImageGenerate, getService]);

    var handleAddImage = useCallback(function (msgIndex, target) {
        if (addingIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg || !msg.imageData || !msg.imageData.dataURL) return;
        if (!props.vm) return;

        setAddingIndex(msgIndex);
        setAddingTarget(target);

        var addFn = target === 'backdrop' ? addAsBackdrop : addAsCostume;
        addFn(msg.imageData.dataURL, props.vm).then(function (result) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    addStatus: {
                        type: 'success',
                        message: intl.formatMessage(systemMessages.imageAddedSuccess, {
                            target: target === 'backdrop' ? 'Fondo' : 'Sprite'
                        })
                    }
                });
                return copy;
            });
            setAddingIndex(null);
            setAddingTarget(null);
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    addStatus: {
                        type: 'error',
                        message: intl.formatMessage(systemMessages.imageAddFailed, {msg: err.message})
                    }
                });
                return copy;
            });
            setAddingIndex(null);
            setAddingTarget(null);
        });
    }, [messages, addingIndex, props.vm, intl]);

    var handleAddSound = useCallback(function (msgIndex, type) {
        if (addingIndex !== null) return;
        var msg = messages[msgIndex];
        if (!msg) return;
        var data = type === 'sfx' ? msg.sfxData : (type === 'music' ? msg.musicData : msg.audioData);
        if (!data || !data.blob) return;
        if (!props.vm || !props.vm.runtime || !props.vm.runtime.storage) return;

        setAddingIndex(msgIndex);
        setAddingTarget('sound');

        var storage = props.vm.runtime.storage;
        var dataFormat = data.format === 'mp3' ? storage.DataFormat.MP3 : storage.DataFormat.WAV;
        var soundName = data.name || ('Sonido ' + (msgIndex + 1));

        data.blob.arrayBuffer().then(function (buffer) {
            var asset = storage.createAsset(
                storage.AssetType.Sound,
                dataFormat,
                new Uint8Array(buffer),
                null,
                true // generate md5
            );
            var vmSound = {
                name: soundName,
                dataFormat: dataFormat,
                asset: asset,
                md5: asset.assetId + '.' + dataFormat,
                assetId: asset.assetId
            };
            return props.vm.addSound(vmSound).then(function () {
                return {
                    md5: vmSound.md5,
                    targetId: props.vm.editingTarget ? props.vm.editingTarget.id : null
                };
            });
        }).then(function (addedInfo) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    soundAdded: true,
                    addedSound: addedInfo,
                    addStatus: {
                        type: 'success',
                        message: intl.formatMessage(systemMessages.soundAddedSuccess)
                    }
                });
                return copy;
            });
            setAddingIndex(null);
            setAddingTarget(null);
        }).catch(function (err) {
            setMessages(function (prev) {
                var copy = prev.slice();
                copy[msgIndex] = Object.assign({}, copy[msgIndex], {
                    addStatus: {
                        type: 'error',
                        message: intl.formatMessage(systemMessages.soundAddFailed, {msg: err.message})
                    }
                });
                return copy;
            });
            setAddingIndex(null);
            setAddingTarget(null);
        });
    }, [messages, addingIndex, props.vm, intl]);

    var trainingEnabled = typeof window !== 'undefined' ? localStorage.getItem('ai_training_enabled') !== 'false' : true;
    var mentorMode = typeof window !== 'undefined' ? localStorage.getItem('ai_mentor_mode') === 'true' : false;

    return (
        <AiTabComponent
            vm={props.vm}
            messages={messages}
            sending={sending}
            verifyingIndex={verifyingIndex}
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
            generatingIndex={generatingIndex}
            addingIndex={addingIndex}
            addingTarget={addingTarget}
            verifyingImageIndex={verifyingImageIndex}
            onGenerateImage={handleGenerateImage}
            onVerifyImage={handleVerifyImage}
            onAddImage={handleAddImage}
            onAddSound={handleAddSound}
            generatingAudioIndex={generatingAudioIndex}
            onGenerateAudio={handleGenerateAudio}
            generatingSfxIndex={generatingSfxIndex}
            onGenerateSfx={handleGenerateSfx}
            generatingMusicIndex={generatingMusicIndex}
            onGenerateMusic={handleGenerateMusic}
            onCreate={handleCreateBlocks}
            onDevelop={handleDevelop}
            onVerify={handleVerify}
            onRevert={handleRevertBlocks}
            onStop={handleStopStreaming}
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
