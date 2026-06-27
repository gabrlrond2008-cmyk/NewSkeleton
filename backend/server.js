import express from 'express';
import cors from 'cors';
import {PROVIDERS} from './lib/providers.js';
import {buildPrompt} from './lib/prompt-builder.js';
import {validateXML} from './lib/xml-validator.js';

var app = express();
var PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({limit: '5mb'}));

// ── Providers list ──
app.get('/api/providers', function (req, res) {
    var result = {};
    for (var id in PROVIDERS) {
        if (PROVIDERS.hasOwnProperty(id)) {
            var p = PROVIDERS[id];
            result[id] = {
                name: p.name,
                defaultModel: p.defaultModel,
                models: p.models
            };
        }
    }
    res.json(result);
});

// ── Chat endpoint ──
app.post('/api/chat', async function (req, res) {
    var _a = req.body, providerId = _a.provider, model = _a.model,
        apiKey = _a.apiKey, message = _a.message,
        history = _a.history || [], context = _a.context || {};

    // Validate required fields
    if (!providerId || !apiKey || !message) {
        return res.status(400).json({type: 'chat', message: 'Faltan campos requeridos (provider, apiKey, message)'});
    }

    var provider = PROVIDERS[providerId];
    if (!provider) {
        return res.status(400).json({type: 'chat', message: 'Proveedor "' + providerId + '" no soportado'});
    }

    var currentModel = model || provider.defaultModel;

    // Build messages array from history + current message
    var msgs = [];
    var recentHistory = history.slice(-6);
    for (var i = 0; i < recentHistory.length; i++) {
        var h = recentHistory[i];
        msgs.push({role: h.role === 'ai' ? 'assistant' : 'user', content: h.text || ''});
    }
    msgs.push({role: 'user', content: message});

    // Build system prompt with context
    var systemPrompt = buildPrompt({context: context});

    // Detect if user is asking for blocks
    var isBlockRequest = detectBlockIntent(message);

    try {
        var response = await callWithRetry(provider, {
            apiKey: apiKey,
            model: currentModel,
            messages: msgs,
            systemPrompt: systemPrompt
        }, 0);

        // If the response is blocks, validate and optionally retry once
        if (response.type === 'blocks' && response.xml) {
            var validation = validateXML(response.xml);
            if (!validation.valid) {
                // Retry once with explicit instruction to fix
                if (isBlockRequest) {
                    var fixMsg = 'El XML que generaste es inválido: ' + validation.warnings.join(', ') +
                        '. Generá SOLO XML válido de scratch-blocks. Asegurate de que comience con <xml> y termine con </xml>.';
                    msgs.push({role: 'assistant', content: JSON.stringify(response)});
                    msgs.push({role: 'user', content: fixMsg});
                    try {
                        var retryResponse = await callWithRetry(provider, {
                            apiKey: apiKey,
                            model: currentModel,
                            messages: msgs,
                            systemPrompt: systemPrompt
                        }, 0);
                        if (retryResponse.type === 'blocks' && retryResponse.xml) {
                            var retryValidation = validateXML(retryResponse.xml);
                            if (retryValidation.valid) {
                                retryResponse.warnings = validation.warnings;
                                return res.json(retryResponse);
                            }
                            response.warnings = validation.warnings.concat(retryValidation.warnings);
                            response.warnings.push('El XML del reintento también es inválido — se usará el original');
                        }
                    } catch (e) {
                        response.warnings = validation.warnings;
                        response.warnings.push('Error al reintentar: ' + e.message);
                    }
                } else {
                    response.warnings = validation.warnings;
                }
            }
            return res.json(response);
        }

        return res.json(response);

    } catch (err) {
        // Handle 402 for OpenRouter: suggest retry with openrouter/free
        if (providerId === 'openrouter' && err.message === 'SALDO_INSUFICIENTE') {
            if (currentModel !== 'openrouter/free') {
                try {
                    var fallbackResponse = await callWithRetry(provider, {
                        apiKey: apiKey,
                        model: 'openrouter/free',
                        messages: msgs,
                        systemPrompt: systemPrompt
                    }, 0);
                    return res.json(fallbackResponse);
                } catch (fallbackErr) {
                    return res.json({type: 'chat', message: '❌ Todos los modelos de OpenRouter requieren saldo. Cambiá a Groq — es 100% gratis.'});
                }
            }
            return res.json({type: 'chat', message: '❌ Todos los modelos de OpenRouter requieren saldo. Cambiá a Groq — es 100% gratis.'});
        }
        return res.json({type: 'chat', message: '❌ ' + err.message});
    }
});

// ── Retry logic for rate limits ──
async function callWithRetry(provider, opts, attempt) {
    var MAX_RETRIES = 3;
    try {
        return await provider.send(opts);
    } catch (err) {
        if (err.message && err.message.indexOf('RATE_LIMIT') !== -1 && attempt < MAX_RETRIES) {
            var delay = Math.pow(2, attempt + 1) * 1000;
            await new Promise(function (resolve) { setTimeout(resolve, delay); });
            return callWithRetry(provider, opts, attempt + 1);
        }
        throw err;
    }
}

// ── Block intent detection ──
function detectBlockIntent(msg) {
    var keywords = [
        'haz', 'crea', 'genera', 'escribe', 'hacé', 'armá', 'poné',
        'bloque', 'bloques', 'código', 'codigo', 'script', 'scripts',
        'juego', 'movimient', 'program', 'logica', 'funcion',
        'dispar', 'salt', 'corr', 'gravedad', 'puntuacion', 'puntuación',
        'variable', 'lista', 'broadcast', 'mensaje', 'clon', 'sprite',
        'cambia', 'modifica', 'reemplaza', 'agrega', 'añade', 'edita',
        'que haga', 'que se mueva', 'quiero que'
    ];
    var lower = msg.toLowerCase();
    for (var i = 0; i < keywords.length; i++) {
        if (lower.indexOf(keywords[i]) !== -1) return true;
    }
    return false;
}

app.listen(PORT, function () {
    console.log('Scratch AI Backend corriendo en puerto ' + PORT);
});
