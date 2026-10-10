// Multimodal helpers: turn chat text + file attachments (images, video, audio)
// into the exact payload shape each provider family expects. OpenAI-compatible
// chat endpoints take a `content` ARRAY (text + image_url + input_audio) while
// Gemini takes a `parts` array with `inline_data` blocks. Everything else in
// the request pipeline is shared, so only this shape differs.

/**
 * Strip a `data:` URL down to raw base64 (Gemini wants just the payload).
 * @param {string} dataUrl
 * @return {string}
 */
function base64Data(dataUrl) {
    if (typeof dataUrl !== 'string') return '';
    var idx = dataUrl.indexOf(',');
    if (idx === -1) return dataUrl;
    return dataUrl.substring(idx + 1);
}

/**
 * Construct the user content for a chat message, honoring attachments.
 * @param {string} format 'openai' | 'gemini'
 * @param {string} text the plain-text user message
 * @param {?Array<{kind:string, mimeType:string, dataURL:string, name?:string}>} attachments
 * @return {{content:(string|Array), parts:(Array|null)}}
 *     `content` is a string when there are no attachments, or an OpenAI-style
 *     part array when there are. `parts` is the Gemini-style part array only
 *     for gemini format, else null.
 */
function buildUserContent(format, text, attachments) {
    if (!attachments || attachments.length === 0) return {content: text || '', parts: null};

    if (format === 'gemini') {
        var parts = [{text: text || ''}];
        for (var i = 0; i < attachments.length; i++) {
            var ag = attachments[i];
            if (!ag || !ag.dataURL) continue;
            parts.push({
                inline_data: {
                    mime_type: ag.mimeType || 'image/png',
                    data: base64Data(ag.dataURL)
                }
            });
        }
        return {content: text || '', parts: parts};
    }

    var content = [];
    if (text) content.push({type: 'text', text: text});
    for (var j = 0; j < attachments.length; j++) {
        var at = attachments[j];
        if (!at || !at.dataURL) continue;
        if (at.kind === 'audio') {
            content.push({
                type: 'input_audio',
                input_audio: {
                    data: base64Data(at.dataURL),
                    format: (at.mimeType || 'audio/wav').split('/')[1] || 'wav'
                }
            });
        } else {
            content.push({
                type: 'image_url',
                image_url: {url: at.dataURL}
            });
        }
    }
    return {content: content.length > 0 ? content : '', parts: null};
}

export {buildUserContent, base64Data};