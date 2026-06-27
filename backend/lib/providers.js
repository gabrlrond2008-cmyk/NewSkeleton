var PROVIDERS = {
    groq: {
        id: 'groq',
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        defaultModel: 'llama-3.3-70b-versatile',
        models: [
            {id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B ⭐', recommended: true,
                desc: 'Recomendado, buen equilibrio velocidad/calidad'},
            {id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (rápido)',
                desc: 'Más rápido, menor calidad'},
            {id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B',
                desc: 'Nuevo modelo eficiente'},
            {id: 'qwen-3-32b', name: 'Qwen 3 32B',
                desc: 'Buen razonamiento'},
        ],
        send: async function (opts) {
            var body = {
                model: opts.model,
                messages: [{role: 'system', content: opts.systemPrompt}].concat(opts.messages),
                temperature: 0.1,
                max_tokens: 8000,
                response_format: {type: 'json_object'}
            };
            var res = await fetch(PROVIDERS.groq.apiUrl, {
                method: 'POST',
                headers: {'Authorization': 'Bearer ' + opts.apiKey, 'Content-Type': 'application/json'},
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120000)
            });
            return parseLLMResponse(res);
        }
    },

    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        defaultModel: 'gemini-2.0-flash',
        models: [
            {id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash ⭐', recommended: true,
                desc: 'Rápido, 60 req/min gratis'},
            {id: 'gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash (preview)',
                desc: 'Versión preview de Gemini 2.5'},
        ],
        send: async function (opts) {
            var url = PROVIDERS.gemini.apiUrl + '/' + opts.model + ':generateContent';
            var geminiMessages = opts.messages.map(function (m) {
                return {role: m.role === 'assistant' ? 'model' : 'user', parts: [{text: m.content}]};
            });
            var body = {
                systemInstruction: {role: 'user', parts: [{text: opts.systemPrompt}]},
                contents: geminiMessages,
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8000,
                    response_mime_type: 'application/json'
                }
            };
            var res = await fetch(url, {
                method: 'POST',
                headers: {'x-goog-api-key': opts.apiKey, 'Content-Type': 'application/json'},
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(60000)
            });
            if (!res.ok) {
                var text = await tryReadText(res);
                if (res.status === 429 || res.status === 403) {
                    throw new Error('RATE_LIMIT:30');
                }
                throw new Error(text || 'Error Gemini ' + res.status);
            }
            var data = await res.json();
            var content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return parseJSON(content);
        }
    },

    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        defaultModel: 'openrouter/free',
        models: [
            {id: 'openrouter/free', name: 'Router Gratuito ⭐', recommended: true,
                desc: 'Auto-selecciona modelos gratis'},
            {id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (gratis)',
                desc: 'Gratuito de Google, 1M contexto'},
            {id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (gratis)',
                desc: 'Gratuito, 70B parámetros'},
            {id: 'openai/gpt-4o-mini', name: 'GPT-4o mini',
                desc: 'Económico, requiere saldo'},
            {id: 'openai/gpt-4o', name: 'GPT-4o',
                desc: 'Máxima calidad, mayor costo'},
        ],
        send: async function (opts) {
            var body = {
                model: opts.model,
                messages: [{role: 'system', content: opts.systemPrompt}].concat(opts.messages),
                temperature: 0.1,
                max_tokens: 8000,
                response_format: {type: 'json_object'}
            };
            var res = await fetch(PROVIDERS.openrouter.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + opts.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120000)
            });
            if (!res.ok) {
                var text = await tryReadText(res);
                if (res.status === 429) {
                    var retryAfter = parseInt(res.headers.get('Retry-After'), 10) || 30;
                    throw new Error('RATE_LIMIT:' + retryAfter);
                }
                if (res.status === 401) {
                    throw new Error('API key inválida');
                }
                if (res.status === 402) {
                    throw new Error('SALDO_INSUFICIENTE');
                }
                if (res.status === 404) {
                    throw new Error('MODELO_NO_EXISTE: "' + opts.model + '" no encontrado');
                }
                throw new Error('Error ' + res.status + ': ' + (text || ''));
            }
            return parseLLMResponse(res);
        }
    },

    openai: {
        id: 'openai',
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-4o-mini',
        models: [
            {id: 'gpt-4o-mini', name: 'GPT-4o mini ⭐', recommended: true,
                desc: 'Económico y rápido'},
            {id: 'gpt-4o', name: 'GPT-4o',
                desc: 'Mejor calidad, mayor costo'},
        ],
        send: async function (opts) {
            var body = {
                model: opts.model,
                messages: [{role: 'system', content: opts.systemPrompt}].concat(opts.messages),
                temperature: 0.1,
                max_tokens: 8000,
                response_format: {type: 'json_object'}
            };
            var res = await fetch(PROVIDERS.openai.apiUrl, {
                method: 'POST',
                headers: {'Authorization': 'Bearer ' + opts.apiKey, 'Content-Type': 'application/json'},
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120000)
            });
            return parseLLMResponse(res);
        }
    }
};

async function parseLLMResponse(res) {
    if (!res.ok) {
        var text = await tryReadText(res);
        if (res.status === 429) {
            var retryAfter = parseInt(res.headers.get('Retry-After'), 10) || 30;
            throw new Error('RATE_LIMIT:' + retryAfter);
        }
        if (res.status === 401) {
            throw new Error('API key inválida');
        }
        throw new Error('Error ' + res.status + ': ' + (text || ''));
    }
    var data = await res.json();
    var content = data.choices?.[0]?.message?.content?.trim() || '';
    return parseJSON(content);
}

async function tryReadText(res) {
    try { return await res.text(); } catch (e) { return ''; }
}

function parseJSON(content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        var match = content.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch (e2) {}
        }
        return {type: 'chat', message: content};
    }
}

export {PROVIDERS};
