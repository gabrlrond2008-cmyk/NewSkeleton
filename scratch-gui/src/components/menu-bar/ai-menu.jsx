import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {aiMenuOpen, openAiMenu} from '../../reducers/menus.js';
import AiSelect from './ai-select.jsx';
import {AUDIO_VOICES} from '../../lib/ai-audio-service.js';
import {isTauriRuntime} from '../../lib/dialog-helper';
import {loadAiSettings, saveAiSettings} from '../../lib/ai-settings.js';

import styles from './settings-menu.css';
import menuBarStyles from './menu-bar.css';
import dropdownCaret from './dropdown-caret.svg';
import aiIcon from './icon--ai.svg';

var menuMessages = defineMessages({
    menuLabel: {
        id: 'gui.aiMenu.menuLabel',
        defaultMessage: 'AI',
        description: 'AI menu item label in menu bar'
    },
    providerLabel: {
        id: 'gui.aiMenu.providerLabel',
        defaultMessage: 'Provider',
        description: 'Provider label in AI settings'
    },
    apiKeyLabel: {
        id: 'gui.aiMenu.apiKeyLabel',
        defaultMessage: 'API Key',
        description: 'API Key label in AI settings'
    },
    modelLabel: {
        id: 'gui.aiMenu.modelLabel',
        defaultMessage: 'Model',
        description: 'Model label in AI settings'
    },
    loadingModels: {
        id: 'gui.aiMenu.loadingModels',
        defaultMessage: 'Loading models...',
        description: 'Loading models text'
    },
    selectModelPlaceholder: {
        id: 'gui.aiMenu.selectModelPlaceholder',
        defaultMessage: 'Select model...',
        description: 'Model select placeholder'
    },
    trainingLabel: {
        id: 'gui.aiMenu.trainingLabel',
        defaultMessage: 'Training',
        description: 'Training toggle label'
    },
    trainingOn: {
        id: 'gui.aiMenu.trainingOn',
        defaultMessage: 'Training enabled',
        description: 'Training toggle title when on'
    },
    trainingOff: {
        id: 'gui.aiMenu.trainingOff',
        defaultMessage: 'Training disabled',
        description: 'Training toggle title when off'
    },
    mentorLabel: {
        id: 'gui.aiMenu.mentorLabel',
        defaultMessage: 'Mentor Mode',
        description: 'Mentor mode toggle label'
    },
    mentorOn: {
        id: 'gui.aiMenu.mentorOn',
        defaultMessage: 'Mentor mode enabled',
        description: 'Mentor mode toggle title when on'
    },
    mentorOff: {
        id: 'gui.aiMenu.mentorOff',
        defaultMessage: 'Mentor mode disabled',
        description: 'Mentor mode toggle title when off'
    },
    paidSeparator: {
        id: 'gui.aiMenu.paidSeparator',
        defaultMessage: '───────── Paid ─────────',
        description: 'Separator between free and paid models'
    },
    imgSection: {
        id: 'gui.aiMenu.imgSection',
        defaultMessage: '--- Image Generation ---',
        description: 'Section separator for image generation settings'
    },
    imgProviderLabel: {
        id: 'gui.aiMenu.imgProviderLabel',
        defaultMessage: 'Image Provider',
        description: 'Image provider label in AI settings'
    },
    imgApiKeyLabel: {
        id: 'gui.aiMenu.imgApiKeyLabel',
        defaultMessage: 'API Key',
        description: 'Image API Key label in AI settings'
    },
    getKeyLink: {
        id: 'gui.aiMenu.getKeyLink',
        defaultMessage: 'Get key',
        description: 'Link to get API key'
    },
    audioSection: {
        id: 'gui.aiMenu.audioSection',
        defaultMessage: '--- Audio Generation ---',
        description: 'Section separator for audio generation settings'
    },
    audioVoiceLabel: {
        id: 'gui.aiMenu.audioVoiceLabel',
        defaultMessage: 'TTS Voice',
        description: 'Text-to-speech voice label in AI settings'
    },
    audioSfxNote: {
        id: 'gui.aiMenu.audioSfxNote',
        defaultMessage: 'TTS uses FreeTTS.org (Azure Neural). SFX and music use Freesound.org (real CC0 sounds) with API key. Procedural fallback if offline or no key.',
        description: 'Note about audio providers'
    },
    sfxSection: {
        id: 'gui.aiMenu.sfxSection',
        defaultMessage: '--- Sound Effects ---',
        description: 'Section separator for sound effects settings'
    },
    sfxProviderLabel: {
        id: 'gui.aiMenu.sfxProviderLabel',
        defaultMessage: 'SFX Provider',
        description: 'Sound effects provider label'
    },
    sfxApiKeyLabel: {
        id: 'gui.aiMenu.sfxApiKeyLabel',
        defaultMessage: 'Freesound API Key',
        description: 'Freesound API key label'
    },
    sfxApiKeyLink: {
        id: 'gui.aiMenu.sfxApiKeyLink',
        defaultMessage: 'Get key',
        description: 'Link to get Freesound API key'
    }
});

var PROVIDER_META = {
    groq: {label: 'Groq', gratis: true, apiModels: 'https://api.groq.com/openai/v1/models', keyLink: 'https://console.groq.com/keys'},
    sambanova: {label: 'SambaNova Cloud', gratis: true, apiModels: 'https://api.sambanova.ai/v1/models', keyLink: 'https://cloud.sambanova.ai/'},
    nvidia: {label: 'NVIDIA NIM', gratis: true, apiModels: 'https://integrate.api.nvidia.com/v1/models', keyLink: 'https://build.nvidia.com/'},
    openai: {label: 'OpenAI', gratis: false, apiModels: 'https://api.openai.com/v1/models', keyLink: 'https://platform.openai.com/api-keys'},
    gemini: {label: 'Gemini', gratis: true, apiModels: 'https://generativelanguage.googleapis.com/v1beta/models', keyLink: 'https://aistudio.google.com/apikey'},
    openrouter: {label: 'OpenRouter', gratis: false, apiModels: 'https://openrouter.ai/api/v1/models', keyLink: 'https://openrouter.ai/keys'},
    opencodezen: {label: 'OpenCode Zen', gratis: false, apiModels: '/zen/v1/models', keyLink: null}
};

var FALLBACK_MODELS = {
    groq: [
        {id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B'},
        {id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B'},
        {id: 'qwen-2.5-coder-32b', label: 'Qwen 2.5 Coder 32B'},
        {id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B'}
    ],
    sambanova: [
        {id: 'Meta-Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B'},
        {id: 'DeepSeek-R1-Distill-Llama-70B', label: 'DeepSeek R1 70B'},
        {id: 'DeepSeek-R1', label: 'DeepSeek R1'},
        {id: 'Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B'},
        {id: 'Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B'},
        {id: 'Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B'},
        {id: 'Meta-Llama-3.1-405B-Instruct', label: 'Llama 3.1 405B'},
        {id: 'Llama-3.2-11B-Vision-Instruct', label: 'Llama 3.2 11B Vision'}
    ],
    nvidia: [
        {id: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B'},
        {id: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1'},
        {id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B'},
        {id: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B'},
        {id: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B'},
        {id: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B'},
        {id: 'mistralai/mixtral-8x22b-instruct-v0.1', label: 'Mixtral 8x22B'}
    ],
    openai: [
        {id: 'gpt-4o-mini', label: 'GPT-4o Mini'},
        {id: 'gpt-4o', label: 'GPT-4o'},
        {id: 'o3-mini', label: 'o3 Mini'}
    ],
    gemini: [
        {id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash'},
        {id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro'},
        {id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
        {id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite'}
    ],
    openrouter: [
        {id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini'},
        {id: 'openai/gpt-4o', label: 'GPT-4o'},
        {id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet'},
        {id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash'},
        {id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B'},
        {id: 'deepseek/deepseek-r1', label: 'DeepSeek R1'}
    ],
    opencodezen: [
        {id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash'},
        {id: 'gpt-5.4-mini', label: 'GPT 5.4 Mini'},
        {id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6'},
        {id: 'gemini-3-flash', label: 'Gemini 3 Flash'},
        {id: 'deepseek-v4-flash-free', label: 'DeepSeek V4 Flash Free'},
        {id: 'big-pickle', label: 'Big Pickle'}
    ]
};

var POLLINATION_MODELS = ['flux', 'zimage', 'nanobanana', 'nanobanana-2', 'seedream5', 'gptimage', 'kontext'];

var IMAGE_PROVIDER_META = {
    'gemini': {label: 'Gemini 2.5 Flash Image', needsKey: true, keyLink: 'https://aistudio.google.com/apikey', description: 'Modelo oficial de Google para generar imágenes. Requiere API key de Google AI Studio.'},
    'pollinations': {label: 'Pollinations.ai', needsKey: false, keyLink: 'https://enter.pollinations.ai', description: 'Sin key: image.pollinations.ai (flux). Con key: gen.pollinations.ai con modelo seleccionable.', models: POLLINATION_MODELS}
};

var LS_PROVIDER = 'ai_provider';
var LS_API_KEY = function (p) { return p + '_api_key'; };
var LS_MODEL = function (p) { return p + '_model'; };
var LS_TRAINING_ENABLED = 'ai_training_enabled';
var LS_MENTOR_MODE = 'ai_mentor_mode';
var LS_IMAGE_PROVIDER = 'ai_image_provider';
var LS_IMAGE_API_KEY = 'ai_image_api_key';
var LS_IMAGE_MODEL = 'ai_image_model';
var LS_AUDIO_VOICE = 'ai_audio_voice';

var SFX_PROVIDER_META = {
    freesound: {label: 'Freesound.org', needsKey: true, keyLink: 'https://freesound.org/apiv2/apply', description: 'Busca efectos de sonido reales CC0 por texto. Requiere API key gratuita de freesound.org.'},
    procedural: {label: 'Procedural (offline)', needsKey: false, keyLink: null, description: 'Síntesis procedural en el navegador. No necesita API key, funciona offline.'}
};
var LS_SFX_PROVIDER = 'ai_sfx_provider';
var LS_SFX_API_KEY = 'ai_sfx_api_key';

function openExternalLink(url) {
    if (!url) return;
    import('@tauri-apps/api/core').then(function (core) {
        core.invoke('open_url', { url: url }).catch(function () {
            window.open(url, '_blank');
        });
    }).catch(function () {
        try {
            window.open(url, '_blank');
        } catch (e) {
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });
}

var toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0'
};

var toggleLabelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
};

var toggleSwitchStyle = function(on) {
    return {
        position: 'relative',
        width: 36,
        height: 20,
        background: on ? '#4caf50' : 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        border: 'none',
        outline: 'none',
        padding: 0
    };
};

var toggleKnobStyle = function(on) {
    return {
        position: 'absolute',
        top: 2,
        left: on ? 18 : 2,
        width: 16,
        height: 16,
        background: '#fff',
        borderRadius: '50%',
        transition: 'left 0.2s',
        pointerEvents: 'none'
    };
};

var labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#fff',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

var inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 4,
    fontSize: '0.8rem',
    outline: 'none',
    background: '#002859',
    color: '#fff',
    fontFamily: 'monospace'
};

function classifyModels(rawModels, providerId) {
    var gratis = [];
    var pago = [];
    if (!rawModels || rawModels.length === 0) return {gratis: [], pago: []};

    for (var i = 0; i < rawModels.length; i++) {
        var m = rawModels[i];
        var id = m.id || m;
        if (typeof id !== 'string') continue;

        // Clean Gemini model names (e.g. "models/gemini-2.5-flash" -> "gemini-2.5-flash")
        if (providerId === 'gemini') {
            if (id.indexOf('models/') === 0) {
                id = id.substring(7);
            }
            // Filter out non-chat models (embeddings, text-bison, etc.)
            if (id.indexOf('gemini-') !== 0) continue;
        }

        var label = id;
        if (m.displayName) label = m.displayName;
        else if (m.name && typeof m.name === 'string') label = m.name;

        // Determine if free
        var isFree = false;
        if (providerId === 'groq' || providerId === 'nvidia' || providerId === 'sambanova') {
            isFree = true;
        } else if (providerId === 'openrouter') {
            if (m.pricing) {
                isFree = parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0;
            }
        } else if (providerId === 'gemini') {
            isFree = id.indexOf('flash') !== -1 || id.indexOf('lite') !== -1;
        } else if (providerId === 'opencodezen') {
            if (m.pricing) {
                isFree = parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0;
            } else if (typeof m === 'object' && m.id) {
                isFree = m.id.indexOf('free') !== -1;
            }
        }

        var entry = {id: id, label: label, gratis: isFree};
        if (isFree) {
            gratis.push(entry);
        } else {
            pago.push(entry);
        }
    }

    return {gratis: gratis, pago: pago};
}

function fetchProviderModels(providerId, apiKey) {
    var meta = PROVIDER_META[providerId];
    if (!meta || !meta.apiModels) {
        return Promise.resolve(null);
    }

    var targetUrl = meta.apiModels;
    if (providerId === 'gemini' && apiKey) {
        targetUrl = meta.apiModels + '?key=' + apiKey;
    }

    if (providerId === 'opencodezen' && isTauriRuntime()) {
        return import('@tauri-apps/api/core')
            .then(function (core) {
                return core.invoke('zen_models', {apiKey: apiKey || ''});
            })
            .then(function (data) {
                var list = data && (data.models || data.data || data);
                return list || [];
            })
            .catch(function () {
                return null;
            });
    }

    if (isTauriRuntime()) {
        return import('@tauri-apps/api/core')
            .then(function (core) {
                return core.invoke('fetch_provider_models', {url: targetUrl, apiKey: apiKey || ''});
            })
            .then(function (data) {
                var list = data && (data.models || data.data || data);
                return list || [];
            })
            .catch(function () {
                return null;
            });
    }

    var headers = {'Content-Type': 'application/json'};
    if (apiKey && providerId !== 'gemini') {
        headers['Authorization'] = 'Bearer ' + apiKey;
    }

    return fetch(targetUrl, {headers: headers})
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (data) {
            var list = data ? (data.models || data.data || data) : null;
            return list;
        })
        .catch(function () {
            return null;
        });
}

class AiMenu extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'setRef',
            'handleMouseOver',
            'handleProviderChange',
            'handleKeyChange',
            'handleModelChange',
            'handleTrainingToggle',
            'handleMentorToggle',
            'handleImageProviderChange',
            'handleImageKeyChange',
            'handleImageModelChange',
            'handleAudioVoiceChange',
            'handleSfxProviderChange',
            'handleSfxKeyChange',
            'loadModels'
        ]);
        var savedProvider = typeof window !== 'undefined' ? localStorage.getItem(LS_PROVIDER) || 'groq' : 'groq';
        this.state = {
            provider: savedProvider,
            apiKey: typeof window !== 'undefined' ? localStorage.getItem(LS_API_KEY(savedProvider)) || '' : '',
            model: typeof window !== 'undefined' ? localStorage.getItem(LS_MODEL(savedProvider)) || '' : '',
            models: [],
            loading: false,
            trainingEnabled: typeof window !== 'undefined' ? localStorage.getItem(LS_TRAINING_ENABLED) !== 'false' : true,
            mentorMode: typeof window !== 'undefined' ? localStorage.getItem(LS_MENTOR_MODE) === 'true' : false,
            imageProvider: typeof window !== 'undefined' ? localStorage.getItem(LS_IMAGE_PROVIDER) || 'pollinations' : 'pollinations',
            imageApiKey: typeof window !== 'undefined' ? (function () {
                var p = localStorage.getItem(LS_IMAGE_PROVIDER) || 'pollinations';
                // Try per-provider key first, then fall back to shared key
                return localStorage.getItem('ai_image_api_key_' + p) || localStorage.getItem(LS_IMAGE_API_KEY) || '';
            })() : '',
            imageModel: typeof window !== 'undefined' ? localStorage.getItem(LS_IMAGE_MODEL) || 'flux' : 'flux',
            audioVoice: typeof window !== 'undefined' ? localStorage.getItem(LS_AUDIO_VOICE) || 'en-US-JennyNeural' : 'en-US-JennyNeural',
            sfxProvider: typeof window !== 'undefined' ? localStorage.getItem(LS_SFX_PROVIDER) || 'procedural' : 'procedural',
            sfxApiKey: typeof window !== 'undefined' ? localStorage.getItem(LS_SFX_API_KEY) || '' : ''
        };
    }

    componentDidMount () {
        this.loadModels();
        loadAiSettings(function (err) {
            if (!err) {
                var provider = localStorage.getItem(LS_PROVIDER) || 'groq';
                var imgProvider = localStorage.getItem(LS_IMAGE_PROVIDER) || 'pollinations';
                this.setState({
                    provider: provider,
                    apiKey: localStorage.getItem(LS_API_KEY(provider)) || '',
                    model: localStorage.getItem(LS_MODEL(provider)) || '',
                    imageProvider: imgProvider,
                    imageApiKey: localStorage.getItem('ai_image_api_key_' + imgProvider) || localStorage.getItem(LS_IMAGE_API_KEY) || '',
                    imageModel: localStorage.getItem(LS_IMAGE_MODEL) || 'flux',
                    audioVoice: localStorage.getItem(LS_AUDIO_VOICE) || 'en-US-JennyNeural',
                    sfxProvider: localStorage.getItem(LS_SFX_PROVIDER) || 'procedural',
                    sfxApiKey: localStorage.getItem(LS_SFX_API_KEY) || ''
                });
            }
        }.bind(this));
    }

    componentDidUpdate (prevProps) {
        if (!prevProps.menuOpen && this.props.menuOpen && this.selectedRef) {
            this.selectedRef.scrollIntoView({block: 'center'});
        }
    }

    setRef (component) {
        this.selectedRef = component;
    }

    handleMouseOver () {
        if (!this.props.menuOpen && this.selectedRef) {
            this.selectedRef.scrollIntoView({block: 'center'});
        }
    }

    loadModels () {
        var providerId = this.state.provider;
        var apiKey = this.state.apiKey;

        this.setState({loading: true});

        fetchProviderModels(providerId, apiKey).then(function (raw) {
            if (raw && raw.length > 0) {
                var classified = classifyModels(raw, providerId);
                var ordered = [];
                for (var g = 0; g < classified.gratis.length; g++) {
                    ordered.push(classified.gratis[g]);
                }
                if (classified.gratis.length > 0 && classified.pago.length > 0) {
                    ordered.push({id: '---', label: '---PAID_SEPARATOR---'});
                }
                for (var p = 0; p < classified.pago.length; p++) {
                    ordered.push(classified.pago[p]);
                }
                var selectedModel = this.state.model;
                if (!selectedModel && ordered.length > 0) {
                    var firstValid = ordered[0].id !== '---' ? ordered[0].id : (ordered[1] ? ordered[1].id : '');
                    selectedModel = firstValid;
                    localStorage.setItem(LS_MODEL(providerId), firstValid);
                }
                this.setState({models: ordered, model: selectedModel, loading: false});
            } else {
                // Fallback
                var fbs = FALLBACK_MODELS[providerId] || [];
                var selectedModel = this.state.model;
                if (!selectedModel && fbs.length > 0) {
                    selectedModel = fbs[0].id;
                    localStorage.setItem(LS_MODEL(providerId), selectedModel);
                }
                this.setState({models: fbs, model: selectedModel, loading: false});
            }
        }.bind(this));
    }

    handleProviderChange (newProvider) {
        this.setState({
            provider: newProvider,
            apiKey: localStorage.getItem(LS_API_KEY(newProvider)) || '',
            model: localStorage.getItem(LS_MODEL(newProvider)) || ''
        }, function () {
            this.loadModels();
        });
        localStorage.setItem(LS_PROVIDER, newProvider);
        saveAiSettings();
    }

    handleKeyChange (e) {
        var key = e.target.value;
        this.setState({apiKey: key}, function () {
            this.loadModels();
        });
        localStorage.setItem(LS_API_KEY(this.state.provider), key);
        saveAiSettings();
    }

    handleModelChange (newModel) {
        this.setState({model: newModel});
        localStorage.setItem(LS_MODEL(this.state.provider), newModel);
        saveAiSettings();
    }

    handleTrainingToggle () {
        var newVal = !this.state.trainingEnabled;
        this.setState({trainingEnabled: newVal});
        localStorage.setItem(LS_TRAINING_ENABLED, newVal);
        saveAiSettings();
    }

    handleMentorToggle () {
        var newVal = !this.state.mentorMode;
        this.setState({mentorMode: newVal});
        localStorage.setItem(LS_MENTOR_MODE, newVal);
        saveAiSettings();
        try { window.dispatchEvent(new CustomEvent('aimentormodechange')); } catch (e) {}
    }

    handleImageProviderChange (newProvider) {
        // Save current key under old provider name
        var oldProvider = this.state.imageProvider;
        var oldKey = this.state.imageApiKey;
        if (oldKey) {
            localStorage.setItem('ai_image_api_key_' + oldProvider, oldKey);
        }
        // Load key for new provider
        var newKey = localStorage.getItem('ai_image_api_key_' + newProvider) || '';
        this.setState({imageProvider: newProvider, imageApiKey: newKey});
        localStorage.setItem(LS_IMAGE_PROVIDER, newProvider);
        saveAiSettings();
    }

    handleImageKeyChange (e) {
        var key = e.target.value;
        this.setState({imageApiKey: key});
        // Save under current provider name
        localStorage.setItem('ai_image_api_key_' + this.state.imageProvider, key);
        // Also keep backward compat
        localStorage.setItem(LS_IMAGE_API_KEY, key);
        saveAiSettings();
    }

    handleImageModelChange (newModel) {
        this.setState({imageModel: newModel});
        localStorage.setItem(LS_IMAGE_MODEL, newModel);
        saveAiSettings();
    }

    handleAudioVoiceChange (newVoice) {
        this.setState({audioVoice: newVoice});
        localStorage.setItem(LS_AUDIO_VOICE, newVoice);
        saveAiSettings();
    }

    handleSfxProviderChange (newProvider) {
        var oldKey = this.state.sfxApiKey;
        if (oldKey) {
            localStorage.setItem(LS_SFX_API_KEY, oldKey);
        }
        this.setState({sfxProvider: newProvider});
        localStorage.setItem(LS_SFX_PROVIDER, newProvider);
        saveAiSettings();
    }

    handleSfxKeyChange (e) {
        var key = e.target.value;
        this.setState({sfxApiKey: key});
        localStorage.setItem(LS_SFX_API_KEY, key);
        saveAiSettings();
    }

    render () {
        var models = this.state.models;
        var providerOptions = Object.keys(PROVIDER_META).map(function (id) {
            return {value: id, label: PROVIDER_META[id].label};
        });
        var modelOptions = [];
        for (var mi = 0; mi < models.length; mi++) {
            var m = models[mi];
            if (m.id === '---') {
                modelOptions.push({value: '---', label: this.props.intl.formatMessage(menuMessages.paidSeparator), disabled: true});
            } else {
                var mLabel = m.label;
                modelOptions.push({value: m.id, label: mLabel});
            }
        }

        return (
            <MenuItem
                expanded={this.props.menuOpen}
                onClick={this.props.onRequestOpen}
            >
                <div
                    className={styles.option}
                    onMouseOver={this.handleMouseOver}
                >
                    <img className={styles.icon} src={aiIcon} />
                    <span className={styles.submenuLabel}>{this.props.intl.formatMessage(menuMessages.menuLabel)}</span>
                    <img className={styles.expandCaret} src={dropdownCaret} />
                </div>
                <Submenu place={this.props.isRtl ? 'left' : 'right'}>
                    <div style={{padding: '8px 12px', minWidth: 260, maxHeight: 420, overflowY: 'auto'}}>
                        <div style={{marginBottom: 8}}>
                            <label style={labelStyle}>{this.props.intl.formatMessage(menuMessages.providerLabel)}</label>
                            <AiSelect
                                value={this.state.provider}
                                options={providerOptions}
                                onChange={this.handleProviderChange}
                            />
                        </div>
                        <div style={{marginBottom: 8}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                                <label style={Object.assign({}, labelStyle, {marginBottom: 0})}>
                                    {this.props.intl.formatMessage(menuMessages.apiKeyLabel)}
                                </label>
                                {PROVIDER_META[this.state.provider] && PROVIDER_META[this.state.provider].keyLink && (
                                    <span
                                        title={PROVIDER_META[this.state.provider].keyLink}
                                        style={{display: 'inline-flex', alignItems: 'center', cursor: 'pointer'}}
                                        onClick={function (e) { e.stopPropagation(); openExternalLink(PROVIDER_META[this.state.provider].keyLink); }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="16" x2="12" y2="12"/>
                                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={this.state.apiKey}
                                onChange={this.handleKeyChange}
                                placeholder={
                                    this.state.provider === 'groq' ? 'gsk_...' :
                                    this.state.provider === 'sambanova' ? 'sn-...' :
                                    this.state.provider === 'nvidia' ? 'nvapi-...' :
                                    this.state.provider === 'gemini' ? 'AIza...' :
                                    this.state.provider === 'openrouter' ? 'sk-or-...' :
                                    this.state.provider === 'opencodezen' ? 'oc_...' : 'sk-...'
                                }
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>{this.props.intl.formatMessage(menuMessages.modelLabel)}</label>
                            {this.state.loading ? (
                                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', padding: '6px 0'}}>
                                    {this.props.intl.formatMessage(menuMessages.loadingModels)}
                                </div>
                            ) : (
                                <AiSelect
                                    value={this.state.model}
                                    options={modelOptions}
                                    onChange={this.handleModelChange}
                                    placeholder={this.props.intl.formatMessage(menuMessages.selectModelPlaceholder)}
                                />
                            )}
                        </div>
                        <div style={toggleStyle}>
                            <span style={toggleLabelStyle}>{this.props.intl.formatMessage(menuMessages.trainingLabel)}</span>
                            <button
                                style={toggleSwitchStyle(this.state.trainingEnabled)}
                                onClick={this.handleTrainingToggle}
                                type="button"
                                title={this.props.intl.formatMessage(this.state.trainingEnabled ? menuMessages.trainingOn : menuMessages.trainingOff)}
                            >
                                <div style={toggleKnobStyle(this.state.trainingEnabled)} />
                            </button>
                        </div>
                        <div style={Object.assign({}, toggleStyle, {marginTop: 4})}>
                            <span style={Object.assign({}, toggleLabelStyle, {fontSize: '0.68rem'})}>
                                {this.props.intl.formatMessage(menuMessages.mentorLabel)}
                            </span>
                            <button
                                style={toggleSwitchStyle(this.state.mentorMode)}
                                onClick={this.handleMentorToggle}
                                type="button"
                                title={this.props.intl.formatMessage(this.state.mentorMode ? menuMessages.mentorOn : menuMessages.mentorOff)}
                            >
                                <div style={toggleKnobStyle(this.state.mentorMode)} />
                            </button>
                        </div>
                        <div style={{borderTop: '1px solid rgba(255,255,255,0.15)', margin: '6px 0', paddingTop: 6}}>
                            <div style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6}}>
                                {this.props.intl.formatMessage(menuMessages.imgSection)}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <label style={labelStyle}>{this.props.intl.formatMessage(menuMessages.imgProviderLabel)}</label>
                                <AiSelect
                                    value={this.state.imageProvider}
                                    options={Object.keys(IMAGE_PROVIDER_META).map(function (id) {
                                        return {value: id, label: IMAGE_PROVIDER_META[id].label};
                                    })}
                                    onChange={this.handleImageProviderChange}
                                />
                            </div>
                            {function () {
                                var meta = IMAGE_PROVIDER_META[this.state.imageProvider];
                                if (!meta) return null;
                                return (
                                    <div>
                                        <div style={{marginBottom: 8}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                                                <label style={Object.assign({}, labelStyle, {marginBottom: 0})}>
                                                    {this.props.intl.formatMessage(menuMessages.imgApiKeyLabel)}
                                                </label>
                                                {meta.keyLink && (
                                                    <span
                                                        title={meta.keyLink}
                                                        style={{display: 'inline-flex', alignItems: 'center', cursor: 'pointer'}}
                                                        onClick={function (e) { e.stopPropagation(); openExternalLink(meta.keyLink); }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"/>
                                                            <line x1="12" y1="16" x2="12" y2="12"/>
                                                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={this.state.imageApiKey}
                                                onChange={this.handleImageKeyChange}
                                                placeholder={meta.needsKey ? 'AIza...' : 'sk_... (opcional, de enter.pollinations.ai)'}
                                                style={inputStyle}
                                            />
                                            <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2}}>
                                                {meta.needsKey ? 'Requerida — obtenela en aistudio.google.com/apikey' : 'Opcional — si no se ingresa key, usa image.pollinations.ai gratis'}
                                            </div>
                                        </div>
                                        {meta.models && meta.models.length > 0 && (
                                            <div style={{marginBottom: 8}}>
                                                <label style={labelStyle}>Modelo</label>
                                                <AiSelect
                                                    value={this.state.imageModel}
                                                    options={meta.models.map(function (m) {
                                                        return {value: m, label: m};
                                                    })}
                                                    onChange={this.handleImageModelChange}
                                                />
                                                <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2}}>
                                                    Solo se usa si hay key configurada. Sin key siempre usa flux.
                                                </div>
                                            </div>
                                        )}
                                        <div style={{marginBottom: 8, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', padding: '4px 0'}}>
                                            {meta.description}
                                        </div>
                                    </div>
                                );
                            }.call(this)}
                        </div>
                        <div style={{borderTop: '1px solid rgba(255,255,255,0.15)', margin: '6px 0', paddingTop: 6}}>
                            <div style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6}}>
                                {this.props.intl.formatMessage(menuMessages.audioSection)}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <label style={labelStyle}>{this.props.intl.formatMessage(menuMessages.audioVoiceLabel)}</label>
                                <AiSelect
                                    value={this.state.audioVoice}
                                    options={AUDIO_VOICES.map(function (v) {
                                        return {value: v.id, label: v.label};
                                    })}
                                    onChange={this.handleAudioVoiceChange}
                                />
                                <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2}}>
                                    Sin API key — usa FreeTTS.org (Azure Neural)
                                </div>
                            </div>
                            <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4}}>
                                {this.props.intl.formatMessage(menuMessages.audioSfxNote)}
                            </div>
                        </div>
                        <div style={{borderTop: '1px solid rgba(255,255,255,0.15)', margin: '6px 0', paddingTop: 6}}>
                            <div style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6}}>
                                {this.props.intl.formatMessage(menuMessages.sfxSection)}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <label style={labelStyle}>{this.props.intl.formatMessage(menuMessages.sfxProviderLabel)}</label>
                                <AiSelect
                                    value={this.state.sfxProvider}
                                    options={Object.keys(SFX_PROVIDER_META).map(function (id) {
                                        return {value: id, label: SFX_PROVIDER_META[id].label};
                                    })}
                                    onChange={this.handleSfxProviderChange}
                                />
                            </div>
                            {function () {
                                var meta = SFX_PROVIDER_META[this.state.sfxProvider];
                                if (!meta) return null;
                                return (
                                    <div>
                                        {meta.needsKey && (
                                            <div style={{marginBottom: 8}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                                                    <label style={Object.assign({}, labelStyle, {marginBottom: 0})}>
                                                        {this.props.intl.formatMessage(menuMessages.sfxApiKeyLabel)}
                                                    </label>
                                                    {meta.keyLink && (
                                                        <span
                                                            title={meta.keyLink}
                                                            style={{display: 'inline-flex', alignItems: 'center', cursor: 'pointer'}}
                                                            onClick={function (e) { e.stopPropagation(); openExternalLink(meta.keyLink); }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <line x1="12" y1="16" x2="12" y2="12"/>
                                                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={this.state.sfxApiKey}
                                                    onChange={this.handleSfxKeyChange}
                                                    placeholder="Freesound API key"
                                                    style={inputStyle}
                                                />
                                                <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.6}}>
                                                    <div>1. Crea cuenta gratis en <span style={{color:'#4fc3f7', cursor:'pointer', textDecoration:'underline'}} onClick={function(e){e.stopPropagation();openExternalLink('https://freesound.org');}}>freesound.org</span></div>
                                                    <div>2. Ve a <span style={{color:'#4fc3f7', cursor:'pointer', textDecoration:'underline'}} onClick={function(e){e.stopPropagation();openExternalLink('https://freesound.org/apiv2/apply');}}>apiv2/apply</span></div>
                                                    <div>3. Nombre: <i>cualquiera</i> (ej: "Mi Proyecto")</div>
                                                    <div>4. Descripción: <i>corta</i> (ej: "App educativa")</div>
                                                    <div>5. Website: pon <span style={{color:'#4fc3f7'}}>https://example.com</span></div>
                                                    <div>6. Callback URL: <b style={{color:'#81c784'}}>déjalo VACÍO</b></div>
                                                    <div>7. Copia el token que aparece → pégalo aquí arriba</div>
                                                </div>
                                            </div>
                                        )}
                                        <div style={{marginBottom: 8, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', padding: '4px 0'}}>
                                            {meta.description}
                                        </div>
                                    </div>
                                );
                            }.call(this)}
                        </div>
                    </div>
                </Submenu>
            </MenuItem>
        );
    }
}

AiMenu.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpen: PropTypes.func
};

var mapStateToProps = function (state) {
    return {
        isRtl: state.locales.isRtl,
        menuOpen: aiMenuOpen(state)
    };
};

var mapDispatchToProps = function (dispatch, ownProps) {
    return {
        onRequestOpen: function () { dispatch(openAiMenu()); }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(AiMenu));
