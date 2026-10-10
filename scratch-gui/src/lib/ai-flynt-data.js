function dataURLToArrayBuffer(dataURL) {
    var idx = dataURL.indexOf('base64,');
    if (idx === -1) return null;
    try {
        var b64 = dataURL.substring(idx + 7);
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) {
            bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        return null;
    }
}

function arrayBufferToDataURL(bytes, mime) {
    var b64 = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
        b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return 'data:' + mime + ';base64,' + btoa(b64);
}

function audioExtension(format) {
    return format === 'mp3' ? 'mp3' : 'wav';
}

function audioMime(format) {
    return format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
}

/**
 * Convert live chat messages into {conversation, media} for the .flynt bundle.
 * Media blobs/base64 are extracted to separate files under ia/sounds|audio|image.
 * @param {Array} messages The live conversation from ai-shared-state.
 * @return {Promise<{conversation: Array, media: Array}>}
 */
export function serializeConversation(messages) {
    var conversation = [];
    var media = [];
    var mediaPromises = [];
    if (!messages || messages.length === 0) {
        return Promise.resolve({conversation: conversation, media: media});
    }
    for (var idx = 0; idx < messages.length; idx++) {
        var msg = messages[idx];
        var out = {
            role: msg.role
        };
        if (msg.content) out.content = msg.content;
        if (msg.displayContent) out.displayContent = msg.displayContent;
        if (msg.id !== undefined) out.id = msg.id;
        if (msg.hasImageGenerate) out.imageGenerate = msg.imageGenerate;
        if (msg.hasAudioGenerate) out.audioGenerate = msg.audioGenerate;
        if (msg.hasSfxGenerate) out.sfxGenerate = msg.sfxGenerate;
        if (msg.hasMusicGenerate) out.musicGenerate = msg.musicGenerate;
        if (msg.imageState) out.imageState = msg.imageState;
        if (msg.imagePrompt) out.imagePrompt = msg.imagePrompt;
        if (msg.imageTarget) out.imageTarget = msg.imageTarget;
        if (msg.snapshotXml) out.snapshotXml = msg.snapshotXml;
        if (msg.reverted) out.reverted = true;

        if (msg.imageData && msg.imageData.dataURL) {
            var imgBytes = dataURLToArrayBuffer(msg.imageData.dataURL);
            if (imgBytes) {
                var imgPath = 'ia/image/m' + idx + '.png';
                out.imageData = {
                    mimeType: msg.imageData.mimeType || 'image/png',
                    provider: msg.imageData.provider
                };
                out.imageRef = imgPath;
                media.push({path: imgPath, data: imgBytes});
            }
        }
        if (msg.audioData && msg.audioData.blob) {
            out.audioState = 'generated';
            out.audioData = {format: msg.audioData.format, name: msg.audioData.name};
            var audioPath = 'ia/audio/m' + idx + '.' + audioExtension(msg.audioData.format);
            out.audioRef = audioPath;
            (function (blob, p) {
                mediaPromises.push(blob.arrayBuffer().then(function (buf) {
                    media.push({path: p, data: new Uint8Array(buf)});
                }));
            })(msg.audioData.blob, audioPath);
        }
        if (msg.sfxData && msg.sfxData.blob) {
            out.sfxState = 'generated';
            out.sfxData = {format: msg.sfxData.format, name: msg.sfxData.name};
            var sfxPath = 'ia/sounds/m' + idx + '_sfx.' + audioExtension(msg.sfxData.format);
            out.sfxRef = sfxPath;
            (function (blob, p) {
                mediaPromises.push(blob.arrayBuffer().then(function (buf) {
                    media.push({path: p, data: new Uint8Array(buf)});
                }));
            })(msg.sfxData.blob, sfxPath);
        }
        if (msg.musicData && msg.musicData.blob) {
            out.musicState = 'generated';
            out.musicData = {format: msg.musicData.format, name: msg.musicData.name};
            var musicPath = 'ia/sounds/m' + idx + '_music.' + audioExtension(msg.musicData.format);
            out.musicRef = musicPath;
            (function (blob, p) {
                mediaPromises.push(blob.arrayBuffer().then(function (buf) {
                    media.push({path: p, data: new Uint8Array(buf)});
                }));
            })(msg.musicData.blob, musicPath);
        }
        conversation.push(out);
    }
    return Promise.all(mediaPromises).then(function () {
        return {conversation: conversation, media: media};
    });
}

function makeAudioData(arrayBuffer, meta) {
    var format = (meta && meta.format) || 'wav';
    var blob = new Blob([arrayBuffer], {type: audioMime(format)});
    return {
        audioUrl: URL.createObjectURL(blob),
        blob: blob,
        format: format,
        name: (meta && meta.name) || 'Audio'
    };
}

/**
 * Rebuild live chat messages from a restored .flynt conversation + media map.
 * @param {Array} conversation Messages serialized in ia/conversa.json.
 * @param {Object} media Map of media path -> ArrayBuffer.
 * @return {Object|null} {messages, session} ready for ai-shared-state.
 */
export function deserializeConversation(conversation, media) {
    if (!conversation || !Array.isArray(conversation)) return null;
    var messages = [];
    var session = [];
    for (var i = 0; i < conversation.length; i++) {
        var m = conversation[i];
        var out = {
            role: m.role,
            content: m.content,
            displayContent: m.displayContent || m.content,
            id: m.id !== undefined ? m.id : i,
            typing: false
        };
        if (m.snapshotXml) out.snapshotXml = m.snapshotXml;
        if (m.reverted) out.reverted = true;
        if (m.imageGenerate) {
            out.hasImageGenerate = true;
            out.imageGenerate = m.imageGenerate;
            out.imagePrompt = m.imagePrompt;
            out.imageTarget = m.imageTarget;
            out.imageState = m.imageRef ? 'generated' : (m.imageState || 'pending');
            if (m.imageRef && media[m.imageRef]) {
                var mime = (m.imageData && m.imageData.mimeType) || 'image/png';
                out.imageData = {
                    dataURL: arrayBufferToDataURL(new Uint8Array(media[m.imageRef]), mime),
                    mimeType: mime,
                    provider: (m.imageData && m.imageData.provider) || 'restored'
                };
            }
        }
        if (m.audioGenerate) {
            out.hasAudioGenerate = true;
            out.audioGenerate = m.audioGenerate;
        }
        if (m.sfxGenerate) {
            out.hasSfxGenerate = true;
            out.sfxGenerate = m.sfxGenerate;
        }
        if (m.musicGenerate) {
            out.hasMusicGenerate = true;
            out.musicGenerate = m.musicGenerate;
        }
        if (m.audioRef && media[m.audioRef]) {
            out.audioState = 'generated';
            out.audioData = makeAudioData(media[m.audioRef], m.audioData);
        }
        if (m.sfxRef && media[m.sfxRef]) {
            out.sfxState = 'generated';
            out.sfxData = makeAudioData(media[m.sfxRef], m.sfxData);
        }
        if (m.musicRef && media[m.musicRef]) {
            out.musicState = 'generated';
            out.musicData = makeAudioData(media[m.musicRef], m.musicData);
        }
        if (m.role === 'user' && m.content) {
            session.push({u: m.content.substring(0, 120)});
        } else if (m.role === 'assistant' && (m.displayContent || m.content)) {
            var last = session[session.length - 1];
            if (last && last.a === undefined) {
                last.a = (m.displayContent || m.content).substring(0, 120);
            }
        }
        messages.push(out);
    }
    return {messages: messages, session: session.slice(-10)};
}
