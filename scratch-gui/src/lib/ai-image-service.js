var IMAGE_PROVIDERS = {
    'gemini': {
        name: 'Gemini 2.5 Flash Image',
        needsKey: true,
        keyLabel: 'Google AI Studio API Key',
        keyLink: 'https://aistudio.google.com/apikey',
        model: 'gemini-2.5-flash-image',
        description: 'Requiere API key. Modelo oficial de Google para generar imágenes.'
    },
    'pollinations': {
        name: 'Pollinations.ai',
        needsKey: false,
        keyLabel: 'API Key (opcional — de enter.pollinations.ai)',
        keyLink: 'https://enter.pollinations.ai',
        model: 'flux',
        models: ['flux', 'zimage', 'nanobanana', 'nanobanana-2', 'seedream5', 'gptimage', 'kontext'],
        description: 'Sin key: usa image.pollinations.ai (flux). Con key: usa gen.pollinations.ai con modelo seleccionable.'
    }
};

function dataURLToBlob(dataURL) {
    var parts = dataURL.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var raw = atob(parts[1]);
    var rawLen = raw.length;
    var u8arr = new Uint8Array(rawLen);
    for (var i = 0; i < rawLen; i++) {
        u8arr[i] = raw.charCodeAt(i);
    }
    return new Blob([u8arr], {type: mime});
}

function blobToDataURL(blob) {
    return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onloadend = function () { resolve(reader.result); };
        reader.readAsDataURL(blob);
    });
}

function generateWithGemini(prompt, apiKey, model) {
    var url = 'https://generativelanguage.googleapis.com/v1/models/' +
        (model || 'gemini-2.5-flash-image') + ':generateContent?key=' + apiKey;

    return fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: 'Genera una imagen para un proyecto Scratch. ' +
                        'La imagen debe tener fondo blanco o transparente, ' +
                        'estilo cartoon/simple, apropiada para un juego infantil. ' +
                        'Prompt: ' + prompt
                }]
            }],
            generationConfig: {
                temperature: 0.4,
                responseModalities: ['TEXT', 'IMAGE']
            }
        })
    }).then(function (res) {
        if (!res.ok) {
            return res.text().then(function (errText) {
                var msg;
                try {
                    var err = JSON.parse(errText);
                    msg = err.error && (err.error.message || err.error.code);
                } catch (e) {
                    msg = errText.substring(0, 200);
                }
                throw new Error(msg || 'Gemini error HTTP ' + res.status);
            });
        }
        return res.json();
    }).then(function (data) {
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('Gemini no devolvió candidatos');
        }
        var parts = data.candidates[0].content.parts;
        var imagePart = null;
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].inlineData && parts[i].inlineData.mimeType &&
                parts[i].inlineData.mimeType.indexOf('image') === 0) {
                imagePart = parts[i].inlineData;
                break;
            }
        }
        if (!imagePart) {
            throw new Error('Gemini no devolvió una imagen');
        }
        return {
            dataURL: 'data:' + imagePart.mimeType + ';base64,' + imagePart.data,
            mimeType: imagePart.mimeType,
            provider: 'gemini'
        };
    });
}

function bytesToDataURL(bytes, mimeType) {
    var binary = '';
    var len = bytes.length;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return 'data:' + mimeType + ';base64,' + btoa(binary);
}

function generateWithPollinations(prompt, model, apiKey) {
    var encodedPrompt = encodeURIComponent(prompt);
    var freeUrl = 'https://image.pollinations.ai/prompt/' + encodedPrompt +
        '?width=512&height=512&model=flux&nologo=true';

    var primaryUrl;
    if (apiKey) {
        primaryUrl = 'https://gen.pollinations.ai/image/' + encodedPrompt +
            '?width=1024&height=1024&model=' + (model || 'flux') + '&seed=-1&nologo=true&key=' +
            encodeURIComponent(apiKey);
    } else {
        primaryUrl = freeUrl;
    }

    function loadImageViaTauri(url) {
        return import('@tauri-apps/api/core').then(function (core) {
            return core.invoke('fetch_image', { url: url });
        }).then(function (bytes) {
            return bytesToDataURL(bytes, 'image/png');
        });
    }

    function loadImageViaElement(url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            var timeoutId = setTimeout(function () {
                img.src = '';
                reject(new Error('Timeout'));
            }, 30000);
            img.onload = function () {
                clearTimeout(timeoutId);
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = function () {
                clearTimeout(timeoutId);
                reject(new Error('Error al cargar la imagen'));
            };
            img.src = url;
        });
    }

    function tryLoad(url) {
        // Try Tauri backend first, fall back to Image element
        return loadImageViaTauri(url).catch(function () {
            return loadImageViaElement(url);
        });
    }

    if (primaryUrl === freeUrl) {
        return tryLoad(freeUrl).then(function (dataURL) {
            return { dataURL: dataURL, mimeType: 'image/png', provider: 'pollinations' };
        });
    }

    // Try key endpoint, fall back to free
    return tryLoad(primaryUrl).catch(function () {
        return tryLoad(freeUrl);
    }).then(function (dataURL) {
        return { dataURL: dataURL, mimeType: 'image/png', provider: 'pollinations' };
    });
}

function removeBackgroundBuiltIn(dataURL) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            var w = canvas.width;
            var h = canvas.height;

            var bgR = 255, bgG = 255, bgB = 255;
            var threshold = 40;
            var samples = [];
            var step = 4;

            for (var sx = 0; sx < w; sx += step) {
                var idx0 = (0 * w + sx) * 4;
                samples.push({r: data[idx0], g: data[idx0 + 1], b: data[idx0 + 2]});
                var idx1 = ((h - 1) * w + sx) * 4;
                samples.push({r: data[idx1], g: data[idx1 + 1], b: data[idx1 + 2]});
            }
            for (var sy = 0; sy < h; sy += step) {
                var idx2 = (sy * w + 0) * 4;
                samples.push({r: data[idx2], g: data[idx2 + 1], b: data[idx2 + 2]});
                var idx3 = (sy * w + (w - 1)) * 4;
                samples.push({r: data[idx3], g: data[idx3 + 1], b: data[idx3 + 2]});
            }

            if (samples.length > 0) {
                var sumR = 0, sumG = 0, sumB = 0;
                for (var si = 0; si < samples.length; si++) {
                    sumR += samples[si].r;
                    sumG += samples[si].g;
                    sumB += samples[si].b;
                }
                bgR = Math.round(sumR / samples.length);
                bgG = Math.round(sumG / samples.length);
                bgB = Math.round(sumB / samples.length);
            }

            var isMostlyWhite = bgR > 200 && bgG > 200 && bgB > 200;
            if (isMostlyWhite) {
                threshold = 60;
            }

            function matchBg(pi) {
                return Math.abs(data[pi] - bgR) < threshold &&
                       Math.abs(data[pi + 1] - bgG) < threshold &&
                       Math.abs(data[pi + 2] - bgB) < threshold;
            }

            var visited = new Uint8Array(w * h);
            var queue = [];
            var qHead = 0;

            function enqueue(x, y) {
                if (x < 0 || x >= w || y < 0 || y >= h) return;
                var idx = y * w + x;
                if (visited[idx]) return;
                var pi = idx * 4;
                if (matchBg(pi)) {
                    visited[idx] = 1;
                    queue.push(idx);
                }
            }

            for (var x = 0; x < w; x++) {
                enqueue(x, 0);
                enqueue(x, h - 1);
            }
            for (var y = 1; y < h - 1; y++) {
                enqueue(0, y);
                enqueue(w - 1, y);
            }

            var dx = [-1, 1, 0, 0];
            var dy = [0, 0, -1, 1];

            while (qHead < queue.length) {
                var idx = queue[qHead++];
                var cx = idx % w;
                var cy = (idx / w) | 0;
                for (var d = 0; d < 4; d++) {
                    enqueue(cx + dx[d], cy + dy[d]);
                }
            }

            for (var i = 0; i < visited.length; i++) {
                if (visited[i]) {
                    data[i * 4 + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function () { reject(new Error('No se pudo cargar la imagen')); };
        img.src = dataURL;
    });
}

function AiImageService() {
    this.provider = 'pollinations';
    this.apiKey = '';
}

AiImageService.prototype.getProvider = function () {
    return this.provider;
};

AiImageService.prototype.setProvider = function (provider) {
    if (IMAGE_PROVIDERS[provider]) {
        this.provider = provider;
    }
};

AiImageService.prototype.setApiKey = function (key) {
    this.apiKey = key;
};

AiImageService.prototype.setModel = function (model) {
    this.model = model;
};

AiImageService.prototype.getModel = function () {
    return this.model;
};

AiImageService.prototype.getProviders = function () {
    return IMAGE_PROVIDERS;
};

AiImageService.prototype.generate = function (prompt) {
    var provider = IMAGE_PROVIDERS[this.provider];
    if (!provider) {
        return Promise.reject(new Error('Proveedor de imagen no configurado'));
    }

    if (provider.needsKey && !this.apiKey) {
        return Promise.reject(new Error(
            'Se necesita API key para ' + provider.name + '. ' +
            'Configurá una key en Settings > AI > Generación de imágenes.'
        ));
    }

    if (this.provider === 'gemini') {
        return generateWithGemini(prompt, this.apiKey, provider.model);
    }
    if (this.provider === 'pollinations') {
        return generateWithPollinations(prompt, this.model || provider.model, this.apiKey);
    }
    return Promise.reject(new Error('Proveedor no soportado: ' + this.provider));
};

AiImageService.prototype.removeBackground = function (dataURL) {
    return removeBackgroundBuiltIn(dataURL);
};

export {
    AiImageService,
    IMAGE_PROVIDERS
};
export default AiImageService;
