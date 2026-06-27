function validateXML(xmlStr) {
    var warnings = [];

    if (!xmlStr || typeof xmlStr !== 'string') {
        return {valid: false, warnings: ['XML vacío o inválido']};
    }

    var trimmed = xmlStr.trim();

    if (!trimmed.startsWith('<xml>') || !trimmed.endsWith('</xml>')) {
        return {valid: false, warnings: ['El XML debe comenzar con <xml> y terminar con </xml>']};
    }

    var openCount = (trimmed.match(/<block[>\s]/g) || []).length;
    var closeCount = (trimmed.match(/<\/block>/g) || []).length;

    if (openCount === 0) {
        return {valid: false, warnings: ['No hay bloques en el XML']};
    }

    var hasHat = /block type="event_when/.test(trimmed) || /block type="control_start_as_clone/.test(trimmed);
    if (!hasHat) {
        warnings.push('No se detectó bloque hat — los scripts podrían no ejecutarse');
    }

    return {valid: true, warnings: warnings};
}

export {validateXML};
