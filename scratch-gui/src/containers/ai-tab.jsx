import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
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
    var [messages, setMessages] = useState([]);
    var [sending, setSending] = useState(false);
    var [verifyingIndex, setVerifyingIndex] = useState(null);
    var [typingData, setTypingData] = useState(null);
    var [creatingIndex, setCreatingIndex] = useState(null);
    var [createStatus, setCreateStatus] = useState(null);
    var [trainingData, setTrainingData] = useState(null);
    var typingTimerRef = useRef(null);
    var typingMsgRef = useRef(null);
    var serviceRef = useRef(null);
    var sessionRef = useRef([]);
    var trainEngineRef = useRef(null);

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
            serviceRef.current.model !== model) {
            serviceRef.current = new AiService(provider, apiKey, model, td);
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
    }, [loadTrainingFromStorage]);

    var handleSend = useCallback(function (text) {
        var service = getService();
        if (!service) {
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'system',
                    content: 'Configurá un proveedor de IA y API key en el menú AI de la barra superior.'
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
        var enhancedText = (workspaceContext ? workspaceContext + '\n---\n' : '') + detailInfo + text;
        service.ask(enhancedText, sessionSum).then(function (response) {
            var assIdx = msgIdx + 1;
            var cleanResponse = (response || '').trim();
            if (!cleanResponse) {
                setMessages(function (prev) {
                    return prev.concat([{
                        role: 'system',
                        content: 'La IA devolvió una respuesta vacía. Probá reformular la pregunta o cambiá de proveedor/modelo en Settings > AI.'
                    }]);
                });
                setSending(false);
                return;
            }
            var displayText = stripBlockDescriptor(cleanResponse);
            if (!displayText) {
                displayText = 'Listo. Los bloques están listos para crear.';
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
                    typing: true
                }]);
            });
            setSending(false);
            startTyping(assIdx, displayText);

            // Auto-create blocks from @bloques (sync with typing)
            if (props.vm && props.vm.editingTarget) {
                setCreatingIndex(assIdx);
                setCreateStatus({type: 'loading', message: 'Creando bloques...'});
                setTimeout(function () { doCreate(cleanResponse); }, 0);
            }
        }).catch(function (err) {
            var errorMsg = err.message || 'Error desconocido';
            if (errorMsg.indexOf('413') !== -1) {
                errorMsg = 'El mensaje es muy grande para este proveedor. Probá con Groq (modelo grande) u OpenCode Zen.';
            } else if (errorMsg.indexOf('429') !== -1) {
                errorMsg = 'Demasiadas solicitudes. Esperá unos segundos y volvé a intentar.';
            } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
                errorMsg = 'API Key inválida. Revisá tu clave en Settings > AI.';
            } else if (errorMsg.indexOf('fetch') !== -1 || errorMsg.indexOf('NetworkError') !== -1) {
                errorMsg = 'Error de conexión. Verificá tu internet o la URL del proveedor.';
            }
            setMessages(function (prev) {
                return prev.concat([{
                    role: 'system',
                    content: 'Error: ' + errorMsg
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
                    var validationResult = validate(corrected);
                    blockCheck.valid = validationResult.valid;
                    blockCheck.validationErrors = validationResult.errors || [];
                    if (props.vm && props.vm.editingTarget) {
                        var vResult = verifyBlocks(corrected, props.vm);
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

    function doCreate(assistantContent) {
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
        if (!parsed) { setCreatingIndex(null); return; }

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
            var verification = verifyBlocks(parsed, props.vm);
            if (verification.ok && chainErrors.length === 0) {
                setCreateStatus({
                    type: 'success',
                    message: (replace ? 'Reemplazados' : 'Agregados') + ' ' + nonShadow + ' bloques.'
                });
            } else {
                var issueMsgs = [];
                if (verification.issues && verification.issues.length > 0) {
                    issueMsgs = issueMsgs.concat(verification.issues);
                }
                for (var ei = 0; ei < chainErrors.length; ei++) {
                    issueMsgs.push('Error: ' + chainErrors[ei]);
                }
                console.warn('[AI Blocks] Problemas:', issueMsgs);
                setCreateStatus({
                    type: 'warning',
                    message: issueMsgs.length + ' bloque(s) omitidos: ' + issueMsgs.join('; ')
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
        if (!props.vm || !props.vm.editingTarget || creatingIndex !== null) return;

        var assistantMsg = messages[msgIndex];
        if (assistantMsg.role !== 'assistant') return;
        if (!assistantMsg.content) return;

        setCreatingIndex(msgIndex);
        setCreateStatus({type: 'loading', message: 'Creando bloques...'});
        setTimeout(function () { doCreate(assistantMsg.content); }, 0);
    }, [props.vm, messages, creatingIndex]);

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

    var handleTrainingFileLoad = useCallback(function (file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);
                if (data && data.format === 'flynt') {
                    if (trainEngineRef.current) {
                        trainEngineRef.current.importFlynt(data);
                    }
                    var entries = data.entries || [];
                    setTrainingData(entries);
                    localStorage.setItem(LS_TRAINING, JSON.stringify({version: 1, entries: entries}));
                    if (serviceRef.current) {
                        serviceRef.current.setTrainingData(entries);
                    }
                } else if (data && data.entries && Array.isArray(data.entries)) {
                    if (trainEngineRef.current) {
                        trainEngineRef.current.loadFromStorage(data.entries);
                    }
                    setTrainingData(data.entries);
                    localStorage.setItem(LS_TRAINING, JSON.stringify(data));
                    if (serviceRef.current) {
                        serviceRef.current.setTrainingData(data.entries);
                    }
                }
            } catch (err) {}
        };
        reader.readAsText(file);
    }, []);

    var trainingEnabled = typeof window !== 'undefined' ? localStorage.getItem('ai_training_enabled') !== 'false' : true;

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
            onSend={handleSend}
            onVerify={handleVerify}
            onCreateBlocks={handleCreateBlocks}
            onTrain={handleTrain}
            onTrainingFileLoad={handleTrainingFileLoad}
        />
    );
};

AiTab.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default AiTab;
