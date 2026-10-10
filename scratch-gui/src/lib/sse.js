/*
 * Minimal SSE (text/event-stream) reader over a fetch ReadableStream.
 * Calls extract(parsedJson) to obtain each content delta and onDelta(text)
 * for each piece. Resolves with the accumulated full text.
 */
function readSSE(body, extract, onDelta) {
    var reader = body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    var full = '';

    function processLine(line) {
        line = line.replace(/\r$/, '');
        if (line.indexOf('data:') !== 0) return false;
        var data = line.substring(5).trim();
        if (data === '[DONE]') return true;
        try {
            var delta = extract(JSON.parse(data));
            if (typeof delta === 'string' && delta) {
                full += delta;
                onDelta(delta);
            }
        } catch (e) {}
        return false;
    }

    function pump() {
        return reader.read().then(function (res) {
            if (res.done) {
                if (buffer) processLine(buffer);
                return full;
            }
            buffer += decoder.decode(res.value, {stream: true});
            var lines = buffer.split('\n');
            buffer = lines.pop();
            for (var i = 0; i < lines.length; i++) {
                if (processLine(lines[i])) return full;
            }
            return pump();
        });
    }
    return pump();
}

export {readSSE};
