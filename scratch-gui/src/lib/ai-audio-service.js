var AUDIO_VOICES = [
    {id: 'nova', label: 'Nova — Bright, friendly (EN)', locale: 'en-US'},
    {id: 'alloy', label: 'Alloy — Neutral (EN)', locale: 'en-US'},
    {id: 'echo', label: 'Echo — Deep voice (EN)', locale: 'en-US'},
    {id: 'fable', label: 'Fable — UK English (EN)', locale: 'en-GB'},
    {id: 'onyx', label: 'Onyx — Warm, rich (EN)', locale: 'en-US'},
    {id: 'shimmer', label: 'Shimmer — Soft, melodic (EN)', locale: 'en-US'},
    {id: 'es-mx', label: 'Español — Latino (ES)', locale: 'es-MX'},
    {id: 'es-es', label: 'Español — España (ES)', locale: 'es-ES'}
];

var FREETTS_VOICE_MAP = {
    'nova': 'en-US-JennyNeural',
    'alloy': 'en-US-GuyNeural',
    'echo': 'en-GB-RyanNeural',
    'fable': 'en-GB-SoniaNeural',
    'onyx': 'en-US-DavisNeural',
    'shimmer': 'en-US-AriaNeural',
    'es-mx': 'es-MX-DaliaNeural',
    'es-es': 'es-ES-AlvaroNeural'
};

var WATERMARK_SECONDS = 3;

function trimWatermarkFromAudio(mp3Bytes) {
    return getSharedAudioContext().decodeAudioData(mp3Bytes.slice(0)).then(function (buffer) {
        var sr = buffer.sampleRate;
        var ch = buffer.numberOfChannels;
        var totalLen = buffer.length;
        var trimSamples = Math.floor(sr * WATERMARK_SECONDS);

        // If audio is too short (<= 4s), assume it's mostly watermark; still emit WAV
        // because raw MP3 playback is unreliable in the WebView.
        if (totalLen <= sr * 4) {
            var wavBlob = encodeWav(buffer);
            return {audioUrl: URL.createObjectURL(wavBlob), blob: wavBlob, format: 'wav'};
        }

        var newLen = totalLen - trimSamples;
        var offlineCtx = new OfflineAudioContext(ch, newLen, sr);
        var source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start(0, 0, newLen / sr);
        return offlineCtx.startRendering();
    }).then(function (trimmedBuffer) {
        var wavBlob = encodeWav(trimmedBuffer);
        return {audioUrl: URL.createObjectURL(wavBlob), blob: wavBlob, format: 'wav'};
    });
}

// Compute RMS (root mean square) amplitude of an AudioBuffer for diagnostics.
function computeRms(buffer) {
    var sum = 0;
    var ch = buffer.numberOfChannels;
    var len = buffer.length;
    for (var c = 0; c < ch; c++) {
        var data = buffer.getChannelData(c);
        for (var i = 0; i < len; i++) {
            sum += data[i] * data[i];
        }
    }
    return Math.sqrt(sum / (ch * len));
}

// Decode MP3 bytes to a WAV blob. WAV playback is proven to work in the WebView,
// unlike raw MP3 playback which decodes (progress advances) but outputs silence.
var sharedAudioCtx = null;

function getSharedAudioContext() {
    if (!sharedAudioCtx) {
        sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return sharedAudioCtx;
}

function decodeMp3ToWav(mp3Bytes) {
    return getSharedAudioContext().decodeAudioData(mp3Bytes.slice(0)).then(function (buffer) {
        var rms = computeRms(buffer);
        console.log('[SFX] Decodificado MP3 ->', buffer.numberOfChannels, 'ch,', buffer.sampleRate,
            'Hz,', buffer.duration.toFixed(2), 's, RMS:', rms.toFixed(4));
        var wavBlob = encodeWav(buffer);
        return {audioUrl: URL.createObjectURL(wavBlob), blob: wavBlob, format: 'wav'};
    });
}

function writeString(view, offset, str) {
    for (var i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function encodeWav(audioBuffer) {
    var numChannels = audioBuffer.numberOfChannels;
    var sampleRate = audioBuffer.sampleRate;
    var bitDepth = 16;
    var length = audioBuffer.length;
    var dataLength = length * numChannels * (bitDepth / 8);
    var headerLength = 44;
    var totalLength = headerLength + dataLength;

    var arrayBuffer = new ArrayBuffer(totalLength);
    var view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');

    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    var offset = 44;
    for (var i = 0; i < length; i++) {
        for (var ch = 0; ch < numChannels; ch++) {
            var sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], {type: 'audio/wav'});
}

function AiAudioService() {
    try {
        var saved = localStorage.getItem('ai_audio_voice');
        this.voice = saved || 'nova';
    } catch (e) {
        this.voice = 'nova';
    }
}

AiAudioService.prototype.setVoice = function (voiceId) {
    this.voice = voiceId;
    try { localStorage.setItem('ai_audio_voice', voiceId); } catch (e) {}
};

AiAudioService.prototype.getVoice = function () {
    return this.voice;
};

AiAudioService.prototype.getVoices = function () {
    return AUDIO_VOICES;
};

function freettsViaTauri(text, voice) {
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('generate_freetts_tts', { text: text, voice: voice });
    }).then(function (bytes) {
        return new Uint8Array(bytes);
    }).then(function (mp3Bytes) {
        return trimWatermarkFromAudio(mp3Bytes.buffer);
    });
}

// Normalize a prompt for sound search: lowercase, strip accents/punctuation.
function normalizePrompt(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Ordered list of [pattern, english-query]. Freesound's library is mostly
// English-tagged, so we expand Spanish/common prompts into English synonyms.
// Freesound already matches by tags/description (no exact name needed), so the
// first scored result becomes relevant instead of garbage.
var SFX_SYNONYM_RULES = [
    [/oceano|\bmar\b|marea|ola|playa|\bwave\b|\bocean\b|\bsea\b|beach|surf|coast/i, 'ocean wave water sea'],
    [/agua|lluvia|splash|llover|rio|river|rain|water|droplet|drip|shower|flow/i, 'water rain splash river'],
    [/explos|bomb|boom|blast|bang|cannon|dynamite|explosion/i, 'explosion boom blast cannon'],
    [/laser|dispar|pistol|bala|bullet|gun|shoot|shot|blaster|phaser|pew/i, 'laser pew blaster shoot gun'],
    [/moneda|coin|pickup|bling|score|reward|collect|gem|ding/i, 'coin pickup bling'],
    [/rebote|bounce|boing|spring|rubber|pelota|\bball\b|globo/i, 'bounce boing rubber ball'],
    [/whoosh|swoosh|swish|sweep|swipe|slide|glide/i, 'whoosh swoosh swish'],
    [/click|clic|boton|button|beep|tick|notif|tap|keypress|pop|ui/i, 'click button beep notification'],
    [/alarm|alarma|siren|sirena|warning|alert|danger|emergency/i, 'alarm siren warning'],
    [/paso|footstep|step|walk|walking|stomp|thud|run|correr|heavy/i, 'footsteps walking run'],
    [/magia|magic|spell|hechizo|power.?up|level.?up|upgrade|heal|buff|encanta/i, 'magic spell powerup'],
    [/trueno|thunder|lightning|storm|tormenta|earthquake|rumble|quake|rayo/i, 'thunder lightning storm'],
    [/viento|wind|gust|breeze|blow|aire/i, 'wind gust breeze'],
    [/fuego|fire|flame|llama|burn|ignite|blaze|crackle/i, 'fire flame crackle'],
    [/golpe|hit|punch|kick|hurt|damage|crash|smash|break|impacto|impact/i, 'hit punch impact crash'],
    [/coche|\bauto\b|\bcar\b|vehiculo|vehicle|motor|engine|racing|drive/i, 'car engine motor'],
    [/sci.?fi|scifi|robot|drone|hover|machin|mecanic|ciber|cyber|tech/i, 'robot sci-fi drone hover'],
    [/avion|airplane|\bplane\b|vuelo|volar|jet|fly|takeoff|landing/i, 'airplane jet fly'],
    [/espacio|space|rocket|cohete|\bnave\b|\bship\b|launch/i, 'space rocket launch'],
    [/gato|cat|meow|kitten|purr|miau/i, 'cat meow kitten'],
    [/perro|dog|bark|woof|puppy|ladrid/i, 'dog bark'],
    [/pajaro|bird|chirp|tweet|twitter|sing|canto|cantar|ave/i, 'bird chirp tweet'],
    [/campana|bell|ring|chime|doorbell|timbre/i, 'bell chime doorbell'],
    [/risa|laugh|giggle|risas/i, 'laugh giggle'],
    [/llanto|llorar|cry|sob|llor/i, 'cry sob'],
    [/musica|music|melody|melodia|song|cancion|triste|sad|feliz|happy|alegre|relax|calm/i, 'music melody song'],
    [/delfin|dolphin/i, 'dolphin']
];

var SFX_FILLER_WORDS = ['el','la','los','las','un','una','unos','unas','de','del','al','sonido','sonidos',
    'sound','sounds','of','the','a','an','for','with','quiero','necesito','por','favor','please','que',
    'se','me','generar','audio','efecto','efectos','y','e','para','en','como','necesitaria'];

function expandSfxQuery(prompt) {
    var normalized = normalizePrompt(prompt);
    for (var i = 0; i < SFX_SYNONYM_RULES.length; i++) {
        if (SFX_SYNONYM_RULES[i][0].test(normalized)) {
            var expanded = SFX_SYNONYM_RULES[i][1];
            console.log('[SFX] Query expandida:', JSON.stringify(normalized), '->', expanded);
            return expanded;
        }
    }
    var cleaned = normalized.split(/\s+/).filter(function (w) {
        return w && SFX_FILLER_WORDS.indexOf(w) === -1;
    }).join(' ');
    var result = cleaned || normalized;
    console.log('[SFX] Query sin expansión:', JSON.stringify(result));
    return result;
}

function freesoundViaTauri(prompt, apiKey) {
    var searchQuery = expandSfxQuery(prompt);
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('generate_sfx_freesound', { prompt: searchQuery, apiKey: apiKey });
    }).then(function (result) {
        if (!result || !result.length) {
            throw new Error('Freesound: respuesta vacía del servidor');
        }
        var arr = new Uint8Array(result);
        var firstBytes = arr.length > 3 ? Array.prototype.slice.call(arr, 0, 3) : [];
        console.log('[Freesound] Recibidos', arr.length, 'bytes, primeros:', firstBytes.join(','), 'hex:', firstBytes.map(function (b) {
            return b.toString(16).toUpperCase();
        }).join(' '));
        var isId3 = arr[0] === 0x49 && arr[1] === 0x44 && arr[2] === 0x33;
        var isMp3 = arr[0] === 0xFF && (arr[1] & 0xE0) === 0xE0;
        if (!isId3 && !isMp3) {
            throw new Error('Freesound: los datos no son MP3 (cabecera: ' +
                Array.prototype.slice.call(arr, 0, 4).map(function (b) { return b.toString(16); }).join(' ') + ')');
        }
        return decodeMp3ToWav(arr.buffer).catch(function (decodeErr) {
            console.warn('[Freesound] decodeAudioData falló, usando MP3 crudo:', decodeErr.message || decodeErr);
            var fallbackBlob = new Blob([arr], {type: 'audio/mpeg'});
            return {audioUrl: URL.createObjectURL(fallbackBlob), blob: fallbackBlob, format: 'mp3'};
        });
    }).catch(function (err) {
        var msg = (err && err.message) ? err.message : (err ? String(err) : 'Error desconocido');
        console.error('[Freesound] Error:', msg);
        throw new Error(msg);
    });
}

function audioFromBytes(bytes, mimeType) {
    var blob = new Blob([new Uint8Array(bytes)], {type: mimeType});
    var audioUrl = URL.createObjectURL(blob);
    return {audioUrl: audioUrl, blob: blob, format: mimeType.indexOf('mp3') !== -1 ? 'mp3' : 'wav'};
}

// Procedural audio synthesis — completely free, no API key, works offline.
// Generates sound effects using Web Audio API oscillators + noise + filters.

function classifyPrompt(text) {
    var lower = text.toLowerCase();
    if (/explos|boom|bang|blast|bomb|cannon|dynamite/i.test(lower)) return 'explosion';
    if (/laser|pew|blaster|shoot|gun|shot|bullet|phaser/i.test(lower)) return 'laser';
    if (/coin|pickup|ding|bling|score|reward|collect|gem/i.test(lower)) return 'coin';
    if (/bounce|boing|spring|rubber|ball/i.test(lower)) return 'bounce';
    if (/whoosh|swoosh|swish|sweep|swipe|slide|glide/i.test(lower)) return 'whoosh';
    if (/water|splash|bubble|drip|drop|liquid|wave|ocean|rain|river/i.test(lower)) return 'water';
    if (/click|beep|tick|notif|ui|button|tap|keypress|pop/i.test(lower)) return 'click';
    if (/alarm|siren|warning|alert|danger|emergency/i.test(lower)) return 'alarm';
    if (/footstep|step|walk|stomp|thud|run|heavy/i.test(lower)) return 'footstep';
    if (/magic|spell|power.?up|level.?up|upgrade|heal|buff/i.test(lower)) return 'magic';
    if (/thunder|lightning|storm|earthquake|rumble|quake/i.test(lower)) return 'thunder';
    if (/wind|gust|breeze|blow|air/i.test(lower)) return 'wind';
    if (/fire|burn|flame|ignite|blaze/i.test(lower)) return 'fire';
    if (/hit|punch|kick|hurt|damage|crash|smash|break/i.test(lower)) return 'hit';
    if (/sci.?fi|robot|drone|hover|engine|motor|machin/i.test(lower)) return 'scifi';
    if (/cat|meow|kitten|purr|miau/i.test(lower)) return 'cat';
    if (/dog|bark|woof|puppy/i.test(lower)) return 'dog';
    if (/bird|chirp|tweet|twitter|sing/i.test(lower)) return 'bird';
    if (/bell|ring|chime|doorbell/i.test(lower)) return 'bell';
    return 'generic';
}

function buildSfxBuffer(ctx, duration, type) {
    var sr = ctx.sampleRate;
    var len = Math.floor(sr * duration);
    var buffer = ctx.createBuffer(1, len, sr);
    var data = buffer.getChannelData(0);

    switch (type) {
    case 'explosion': {
        // White noise burst with exponential decay
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-5 * t / duration);
            data[i] = (Math.random() * 2 - 1) * env;
            // Add low frequency rumble
            data[i] += Math.sin(2 * Math.PI * 60 * t) * env * 0.4;
        }
        break;
    }
    case 'laser': {
        // Frequency sweep from high to low
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 2000 - 1900 * (t / duration);
            var env = Math.exp(-3 * t / duration);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env;
            // Add harmonics
            data[i] += Math.sin(2 * Math.PI * freq * 1.5 * t) * env * 0.3;
        }
        break;
    }
    case 'coin': {
        // Bright ascending tone with harmonics
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 800 + 800 * (t / duration);
            var env = Math.exp(-4 * t / duration);
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.6 +
                       Math.sin(2 * Math.PI * freq * 2 * t) * 0.3 +
                       Math.sin(2 * Math.PI * freq * 3 * t) * 0.15) * env;
        }
        break;
    }
    case 'bounce': {
        // Pitch bend down with bounce reflections
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 600 - 400 * (t / duration);
            var env = Math.exp(-5 * t / duration);
            // Add small bounces
            var bounce = Math.max(0, Math.sin(2 * Math.PI * 20 * t)) * env;
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.5 + bounce * 0.3) * env;
        }
        break;
    }
    case 'whoosh': {
        // Filtered noise sweep
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var noise = Math.random() * 2 - 1;
            // Simple low-pass approximation via moving average
            var freq = 200 + 1800 * (t / duration);
            var env = Math.sin(Math.PI * t / duration);
            data[i] = noise * env * 0.3;
            // Add sine sweep
            data[i] += Math.sin(2 * Math.PI * freq * t) * env * 0.2;
        }
        break;
    }
    case 'water': {
        // Bubbly noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-2 * t / duration) * 0.6;
            var bubbles = Math.sin(2 * Math.PI * 300 * t + Math.sin(2 * Math.PI * 12 * t) * 2);
            data[i] = (Math.random() * 2 - 1) * 0.3 + bubbles * 0.3;
            data[i] *= env;
        }
        break;
    }
    case 'click': {
        // Very short tick
        for (var i = 0; i < Math.min(len, Math.floor(sr * 0.08)); i++) {
            var t = i / sr;
            var env = Math.exp(-30 * t);
            data[i] = Math.sin(2 * Math.PI * 1000 * t) * env;
        }
        break;
    }
    case 'alarm': {
        // Alternating tones
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var which = Math.floor(t * 4) % 2;
            var freq = which === 0 ? 800 : 1000;
            data[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
        }
        break;
    }
    case 'footstep': {
        // Low thud
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-12 * t / duration);
            data[i] = (Math.random() * 2 - 1) * 0.3 + Math.sin(2 * Math.PI * 80 * t) * 0.5;
            data[i] *= env;
        }
        break;
    }
    case 'magic': {
        // Ascending chime with shimmer
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 400 + 600 * (t / duration);
            var env = Math.exp(-3 * t / duration);
            var shimmer = Math.sin(2 * Math.PI * (freq + Math.sin(2 * Math.PI * 8 * t) * 20) * t);
            data[i] = (shimmer * 0.4 +
                       Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2 +
                       Math.sin(2 * Math.PI * freq * 2 * t) * 0.1) * env;
        }
        break;
    }
    case 'thunder': {
        // Low rumble with noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-2 * t / duration);
            data[i] = (Math.random() * 2 - 1) * env * 0.5 +
                      Math.sin(2 * Math.PI * 50 * t) * env * 0.4 +
                      Math.sin(2 * Math.PI * 30 * t) * env * 0.3;
        }
        break;
    }
    case 'wind': {
        // Filtered noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.sin(Math.PI * t / duration);
            var mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t);
            data[i] = (Math.random() * 2 - 1) * env * 0.3 * mod;
        }
        break;
    }
    case 'fire': {
        // Crackling noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-1.5 * t / duration);
            var crackle = Math.random() * 2 - 1;
            // Sharp transients
            if (i % Math.floor(sr * 0.05) < 3) {
                crackle *= 2;
            }
            data[i] = crackle * env * 0.4 + Math.sin(2 * Math.PI * 200 * t) * env * 0.1;
        }
        break;
    }
    case 'hit': {
        // Impact noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-15 * t / duration);
            data[i] = (Math.random() * 2 - 1) * env * 0.6 +
                      Math.sin(2 * Math.PI * 150 * t) * env * 0.3;
        }
        break;
    }
    case 'scifi': {
        // Electronic hum with wobble
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 200 + 150 * Math.sin(2 * Math.PI * 3 * t);
            var env = Math.exp(-2 * t / duration);
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.3 +
                       Math.sin(2 * Math.PI * freq * 2 * t) * 0.15 +
                       Math.sin(2 * Math.PI * 800 * t) * 0.1) * env;
        }
        break;
    }
    case 'cat': {
        // Meow-like frequency sweep
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var freq = 400 + 200 * Math.sin(2 * Math.PI * 3 * t) - 100 * (t / duration);
            var env = Math.exp(-3 * t / duration);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5 +
                      Math.sin(2 * Math.PI * freq * 1.5 * t) * env * 0.15;
        }
        break;
    }
    case 'dog': {
        // Bark-like low tone burst
        var barkCount = Math.ceil(duration * 2);
        var barkDur = duration / barkCount;
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var barkIdx = Math.floor(t / barkDur);
            var localT = (t - barkIdx * barkDur) / barkDur;
            var env = localT < 0.3 ? Math.sin(Math.PI * localT / 0.3) : 0;
            data[i] = (Math.sin(2 * Math.PI * 200 * t) * 0.4 +
                       Math.sin(2 * Math.PI * 350 * t) * 0.2) * env;
        }
        break;
    }
    case 'bird': {
        // Chirps
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var chirpFreq = 1500 + 1000 * Math.sin(2 * Math.PI * 6 * t);
            var chirpEnv = Math.max(0, Math.sin(2 * Math.PI * 8 * t));
            data[i] = Math.sin(2 * Math.PI * chirpFreq * t) * chirpEnv * 0.3;
        }
        break;
    }
    case 'bell': {
        // Bell-like tone with harmonics
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-6 * t / duration);
            data[i] = (Math.sin(2 * Math.PI * 880 * t) * 0.6 +
                       Math.sin(2 * Math.PI * 1760 * t) * 0.3 +
                       Math.sin(2 * Math.PI * 2640 * t) * 0.15 +
                       Math.sin(2 * Math.PI * 3520 * t) * 0.07) * env;
        }
        break;
    }
    default: // generic — mixed tones + noise
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = Math.exp(-3 * t / duration);
            data[i] = (Math.sin(2 * Math.PI * 440 * t) * 0.3 +
                       Math.sin(2 * Math.PI * 880 * t) * 0.15 +
                       (Math.random() * 2 - 1) * 0.2) * env;
        }
    }

    return buffer;
}

function renderProceduralAudio(duration, type) {
    var sr = 44100;
    var offlineCtx = new OfflineAudioContext(1, Math.floor(sr * duration), sr);
    var buffer = buildSfxBuffer(offlineCtx, duration, type);
    var source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    return offlineCtx.startRendering().then(function (renderedBuffer) {
        var wavBlob = encodeWav(renderedBuffer);
        var audioUrl = URL.createObjectURL(wavBlob);
        return {audioUrl: audioUrl, blob: wavBlob, format: 'wav'};
    });
}

function getSfxApiKey() {
    try {
        return localStorage.getItem('ai_sfx_api_key') || '';
    } catch (e) {
        return '';
    }
}

function getSfxProvider() {
    try {
        return localStorage.getItem('ai_sfx_provider') || 'procedural';
    } catch (e) {
        return 'procedural';
    }
}

function shouldUseFreesound() {
    return getSfxProvider() === 'freesound' && getSfxApiKey().length > 0;
}

AiAudioService.prototype.generateSfx = function (prompt) {
    if (shouldUseFreesound()) {
        var apiKey = getSfxApiKey();
        console.log('[SFX] Usando Freesound con key:', apiKey.substring(0, 5) + '...');
        return freesoundViaTauri(prompt, apiKey);
    }
    console.log('[SFX] Usando procedural');
    return renderProceduralAudioFromPrompt(prompt);
};

AiAudioService.prototype.generateMusic = function (prompt) {
    if (shouldUseFreesound()) {
        var apiKey = getSfxApiKey();
        // Try Freesound.org via Rust backend, propagate error if fails
        return freesoundViaTauri(prompt, apiKey);
    }
    // Use procedural synthesis
    return renderProceduralMusic(prompt);
};

function renderProceduralAudioFromPrompt(prompt) {
    var type = classifyPrompt(prompt);
    var durationMap = {
        explosion: 1.5, laser: 0.5, coin: 0.35, bounce: 0.6, whoosh: 0.7,
        water: 1.0, click: 0.08, alarm: 1.5, footstep: 0.25, magic: 0.8,
        thunder: 2.0, wind: 1.5, fire: 1.2, hit: 0.2, scifi: 1.0,
        cat: 0.8, dog: 0.6, bird: 0.6, bell: 1.0, generic: 0.8
    };
    var duration = durationMap[type] || 0.8;
    return renderProceduralAudio(duration, type);
}

function renderProceduralMusic(prompt) {
    var lower = prompt.toLowerCase();
    var isFast = /fast|upbeat|happy|action|energetic|quick/i.test(lower);
    var isSlow = /slow|calm|ambient|relax|chill|peaceful|soft|gentle|quiet/i.test(lower);
    var isSad = /sad|melancholy|dark|ominous|creepy|scary|horror|tense/i.test(lower);
    var duration = isFast ? 3.0 : isSlow ? 4.0 : 3.0;

    var sr = 44100;
    var len = Math.floor(sr * duration);
    var offlineCtx = new OfflineAudioContext(1, len, sr);
    var buffer = offlineCtx.createBuffer(1, len, sr);
    var data = buffer.getChannelData(0);

    var bpm = isFast ? 140 : isSad ? 60 : 100;
    var beatDur = 60 / bpm;

    var notes = isSad ?
        [262, 311, 349, 311, 262, 233, 262, 196] :
        isFast ?
        [523, 659, 784, 659, 587, 659, 523, 440] :
        [262, 330, 392, 330, 294, 330, 262, 220];

    for (var i = 0; i < len; i++) {
        var t = i / sr;
        var noteIdx = Math.floor(t / beatDur) % notes.length;
        var noteT = t - noteIdx * beatDur;
        var noteFreq = notes[noteIdx];
        var noteEnv = Math.max(0, 1 - noteT / beatDur) * Math.exp(-2 * noteT / beatDur);
        var bassFreq = noteFreq / 2;
        data[i] = (Math.sin(2 * Math.PI * noteFreq * t) * 0.25 +
                   Math.sin(2 * Math.PI * noteFreq * 0.5 * t) * 0.15 +
                   Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.12) * noteEnv;
        if (noteT < 0.02) {
            data[i] += (Math.random() * 2 - 1) * 0.1 * (1 - noteT / 0.02);
        }
    }

    var wavBlob = encodeWav(buffer);
    var audioUrl = URL.createObjectURL(wavBlob);
    return Promise.resolve({audioUrl: audioUrl, blob: wavBlob, format: 'wav'});
}

AiAudioService.prototype.generate = function (text) {
    var voice = this.voice || 'nova';
    var freettsVoice = FREETTS_VOICE_MAP[voice] || 'en-US-JennyNeural';

    // Try FreeTTS.org via Rust backend (primary)
    return freettsViaTauri(text, freettsVoice).catch(function (err) {
        // Fallback: Web Speech API
        if (!window.speechSynthesis) {
            throw new Error('TTS no disponible. ' + err.message);
        }
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        var langMatch = AUDIO_VOICES.filter(function (v) { return v.id === voice; });
        utterance.lang = langMatch.length > 0 ? langMatch[0].locale : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        // Return a short silent WAV as placeholder for the UI
        var sr = 44100;
        var len = Math.floor(sr * 0.5);
        var ctx = new OfflineAudioContext(1, len, sr);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = 0;
        var silentBlob = encodeWav(buf);
        return {audioUrl: URL.createObjectURL(silentBlob), blob: silentBlob, format: 'wav'};
    });
};

export {
    AiAudioService,
    AUDIO_VOICES
};
export default AiAudioService;
