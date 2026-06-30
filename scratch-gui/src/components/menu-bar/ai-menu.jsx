import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {aiMenuOpen, openAiMenu} from '../../reducers/menus.js';
import AiSelect from './ai-select.jsx';

import styles from './settings-menu.css';
import menuBarStyles from './menu-bar.css';
import dropdownCaret from './dropdown-caret.svg';
import aiIcon from './icon--ai.svg';

var PROVIDER_META = {
    groq: {label: 'Groq', gratis: true, apiModels: 'https://api.groq.com/openai/v1/models'},
    openai: {label: 'OpenAI', gratis: false, apiModels: 'https://api.openai.com/v1/models'},
    gemini: {label: 'Gemini', gratis: true, apiModels: null},
    openrouter: {label: 'OpenRouter', gratis: false, apiModels: 'https://openrouter.ai/api/v1/models'},
    opencodezen: {label: 'OpenCode Zen', gratis: false, apiModels: '/zen/v1/models'}
};

var FALLBACK_MODELS = {
    groq: [
        {id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B'},
        {id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B'},
        {id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B'}
    ],
    openai: [
        {id: 'gpt-4o-mini', label: 'GPT-4o Mini'},
        {id: 'gpt-4o', label: 'GPT-4o'},
        {id: 'gpt-4-turbo', label: 'GPT-4 Turbo'}
    ],
    gemini: [
        {id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
        {id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite'},
        {id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
        {id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro'}
    ],
    openrouter: [
        {id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini'},
        {id: 'openai/gpt-4o', label: 'GPT-4o'},
        {id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet'},
        {id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash'}
    ],
    opencodezen: [
        {id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash'},
        {id: 'gpt-5.4-mini', label: 'GPT 5.4 Mini'},
        {id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6'},
        {id: 'gemini-3-flash', label: 'Gemini 3 Flash'},
        {id: 'deepseek-v4-flash-free', label: 'DeepSeek V4 Flash Free (gratis)'},
        {id: 'big-pickle', label: 'Big Pickle (gratis)'}
    ]
};

var LS_PROVIDER = 'ai_provider';
var LS_API_KEY = function (p) { return p + '_api_key'; };
var LS_MODEL = function (p) { return p + '_model'; };
var LS_TRAINING_ENABLED = 'ai_training_enabled';
var LS_MENTOR_MODE = 'ai_mentor_mode';

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
        var label = id;

        // Use API-provided name if available
        if (m.name) label = m.name;

        // Determine if free
        var isFree = false;
        if (providerId === 'groq') {
            isFree = true;
        } else if (providerId === 'openrouter') {
            // OpenRouter API returns pricing: {prompt: "0", completion: "0"} for free models
            if (m.pricing) {
                isFree = parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0;
            }
        } else if (providerId === 'gemini') {
            // Gemini free tier models
            isFree = id.indexOf('flash') !== -1 || id.indexOf('lite') !== -1;
        } else if (providerId === 'opencodezen') {
            // Zen returns pricing info similar to OpenRouter
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

    var headers = {'Content-Type': 'application/json'};
    if (apiKey) {
        headers['Authorization'] = 'Bearer ' + apiKey;
    }

    return fetch(meta.apiModels, {headers: headers})
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (data) {
            // Different APIs return data in different formats
            var list = data.data || data;
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
            mentorMode: typeof window !== 'undefined' ? localStorage.getItem(LS_MENTOR_MODE) === 'true' : false
        };
    }

    componentDidMount () {
        this.loadModels();
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
                    ordered.push({id: '---', label: '───────── Pagos ─────────'});
                }
                for (var p = 0; p < classified.pago.length; p++) {
                    ordered.push(classified.pago[p]);
                }
                this.setState({models: ordered, loading: false});
            } else {
                // Fallback
                this.setState({models: FALLBACK_MODELS[providerId] || [], loading: false});
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
    }

    handleKeyChange (e) {
        var key = e.target.value;
        this.setState({apiKey: key}, function () {
            this.loadModels();
        });
        localStorage.setItem(LS_API_KEY(this.state.provider), key);
    }

    handleModelChange (newModel) {
        this.setState({model: newModel});
        localStorage.setItem(LS_MODEL(this.state.provider), newModel);
    }

    handleTrainingToggle () {
        var newVal = !this.state.trainingEnabled;
        this.setState({trainingEnabled: newVal});
        localStorage.setItem(LS_TRAINING_ENABLED, newVal);
    }

    handleMentorToggle () {
        var newVal = !this.state.mentorMode;
        this.setState({mentorMode: newVal});
        localStorage.setItem(LS_MENTOR_MODE, newVal);
        try { window.dispatchEvent(new CustomEvent('aimentormodechange')); } catch (e) {}
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
                modelOptions.push({value: '---', label: m.label, disabled: true});
            } else {
                var mLabel = m.label + (m.gratis ? ' (gratis)' : '');
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
                    <span className={styles.submenuLabel}>AI</span>
                    <img className={styles.expandCaret} src={dropdownCaret} />
                </div>
                <Submenu place={this.props.isRtl ? 'left' : 'right'}>
                    <div style={{padding: '8px 12px', minWidth: 220, maxHeight: 320, overflowY: 'auto'}}>
                        <div style={{marginBottom: 8}}>
                            <label style={labelStyle}>Proveedor</label>
                            <AiSelect
                                value={this.state.provider}
                                options={providerOptions}
                                onChange={this.handleProviderChange}
                            />
                        </div>
                        <div style={{marginBottom: 8}}>
                            <label style={labelStyle}>API Key</label>
                            <input
                                type="text"
                                value={this.state.apiKey}
                                onChange={this.handleKeyChange}
                                placeholder={
                                    this.state.provider === 'groq' ? 'gsk_...' :
                                    this.state.provider === 'gemini' ? 'AIza...' :
                                    this.state.provider === 'openrouter' ? 'sk-or-...' :
                                    this.state.provider === 'opencodezen' ? 'oc_...' : 'sk-...'
                                }
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Modelo</label>
                            {this.state.loading ? (
                                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', padding: '6px 0'}}>
                                    Cargando modelos...
                                </div>
                            ) : (
                                <AiSelect
                                    value={this.state.model}
                                    options={modelOptions}
                                    onChange={this.handleModelChange}
                                    placeholder="Seleccionar modelo..."
                                />
                            )}
                        </div>
                        <div style={toggleStyle}>
                            <span style={toggleLabelStyle}>Entrenamiento</span>
                            <button
                                style={toggleSwitchStyle(this.state.trainingEnabled)}
                                onClick={this.handleTrainingToggle}
                                type="button"
                                title={this.state.trainingEnabled ? 'Entrenamiento activado' : 'Entrenamiento desactivado'}
                            >
                                <div style={toggleKnobStyle(this.state.trainingEnabled)} />
                            </button>
                        </div>
                        <div style={Object.assign({}, toggleStyle, {marginTop: 4})}>
                            <span style={Object.assign({}, toggleLabelStyle, {fontSize: '0.68rem'})}>
                                Modo Mentor (beta)
                            </span>
                            <button
                                style={toggleSwitchStyle(this.state.mentorMode)}
                                onClick={this.handleMentorToggle}
                                type="button"
                                title={this.state.mentorMode ? 'Modo mentor activado' : 'Modo mentor desactivado'}
                            >
                                <div style={toggleKnobStyle(this.state.mentorMode)} />
                            </button>
                        </div>
                    </div>
                </Submenu>
            </MenuItem>
        );
    }
}

AiMenu.propTypes = {
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

export default connect(mapStateToProps, mapDispatchToProps)(AiMenu);
