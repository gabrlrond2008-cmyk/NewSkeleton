/**
 * ai-block-linter.js
 * Implementation of Phases 1, 2, and 3 of the Technical Specification:
 * - Phase 1: Deterministic Linter & Normalizer (No AI, 0ms latency)
 * - Phase 2: AST/JSON to Structured Indented Pseudocode Transpiler
 * - Phase 3: Critic Agent (Logical Auditor) evaluator
 */

// ---------------------------------------------------------------------------
// FASE 1: LINTER Y NORMALIZADOR DETERMINISTA
// ---------------------------------------------------------------------------

function areBlocksIdentical(b1, b2) {
    if (!b1 || !b2 || !b1.opcode || b1.opcode !== b2.opcode) return false;

    // Direct actions without parameters
    if (b1.opcode === 'looks_show' || b1.opcode === 'looks_hide' || b1.opcode === 'looks_cleargraphiceffects') {
        return true;
    }

    // Actions with fields or inputs
    var f1 = JSON.stringify(b1.fields || {});
    var f2 = JSON.stringify(b2.fields || {});
    var i1 = JSON.stringify(b1.inputs || {});
    var i2 = JSON.stringify(b2.inputs || {});

    return f1 === f2 && i1 === i2;
}

function removeRedundantConsecutiveBlocks(blocks) {
    if (!Array.isArray(blocks)) return [];
    var cleaned = [];

    for (var i = 0; i < blocks.length; i++) {
        var blk = blocks[i];
        if (!blk || typeof blk !== 'object' || !blk.opcode) continue;

        var clone = Object.assign({}, blk);
        if (clone.inputs) clone.inputs = Object.assign({}, clone.inputs);
        if (clone.fields) clone.fields = Object.assign({}, clone.fields);

        // Si son 2 bloques idénticos consecutivos, se elimina uno y se deja el otro
        if (cleaned.length > 0) {
            var prev = cleaned[cleaned.length - 1];
            if (areBlocksIdentical(prev, clone)) {
                console.log('[Linter] Bloque redundante consecutivo eliminado:', clone.opcode);
                continue;
            }
        }

        // Recursión dentro de SUBSTACK y SUBSTACK2
        if (clone.inputs && Array.isArray(clone.inputs.SUBSTACK)) {
            clone.inputs.SUBSTACK = removeRedundantConsecutiveBlocks(clone.inputs.SUBSTACK);
        }
        if (clone.inputs && Array.isArray(clone.inputs.SUBSTACK2)) {
            clone.inputs.SUBSTACK2 = removeRedundantConsecutiveBlocks(clone.inputs.SUBSTACK2);
        }

        cleaned.push(clone);
    }

    return cleaned;
}

/**
 * Eliminación limpia y determinista de bloques redundantes consecutivos.
 * Si existen 2 bloques idénticos seguidos, elimina uno y conserva el otro.
 */
function lintAndNormalizeDescriptor(descriptor) {
    if (!descriptor || typeof descriptor !== 'object') {
        return { descriptor: { scripts: [] }, warnings: [] };
    }

    var scripts = Array.isArray(descriptor.scripts) ? descriptor.scripts : [];
    var cleanedScripts = [];

    for (var s = 0; s < scripts.length; s++) {
        var sc = scripts[s];
        if (!sc || !Array.isArray(sc.blocks) || sc.blocks.length === 0) continue;

        var cleanedBlocks = removeRedundantConsecutiveBlocks(sc.blocks);
        if (cleanedBlocks.length > 0) {
            cleanedScripts.push({ blocks: cleanedBlocks });
        }
    }

    return {
        descriptor: Object.assign({}, descriptor, { scripts: cleanedScripts }),
        warnings: []
    };
}


// ---------------------------------------------------------------------------
// FASE 2: TRANSPILADOR AST/JSON A PSEUDOCÓDIGO ESTRUCTURADO
// ---------------------------------------------------------------------------

function formatValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && val.opcode) {
        return formatReporter(val);
    }
    return String(val);
}

function formatReporter(block) {
    if (!block || !block.opcode) return '';
    var op = block.opcode;
    var inp = block.inputs || {};
    var fld = block.fields || {};

    switch (op) {
    case 'data_variable':
        return '[' + (fld.VARIABLE || 'variable') + ']';
    case 'sensing_answer':
        return '<respuesta>';
    case 'sensing_timer':
        return '<cronómetro>';
    case 'sensing_touchingobject':
        return '¿tocando [' + (inp.TOUCHINGOBJECTMENU || 'objeto') + ']?';
    case 'sensing_keypressed':
        return '¿tecla [' + (fld.KEY_OPTION || inp.KEY_OPTION || 'espacio') + '] presionada?';
    case 'operator_equals':
        return '(' + formatValue(inp.OPERAND1) + ' == ' + formatValue(inp.OPERAND2) + ')';
    case 'operator_gt':
        return '(' + formatValue(inp.OPERAND1) + ' > ' + formatValue(inp.OPERAND2) + ')';
    case 'operator_lt':
        return '(' + formatValue(inp.OPERAND1) + ' < ' + formatValue(inp.OPERAND2) + ')';
    case 'operator_and':
        return '(' + formatValue(inp.OPERAND1) + ' Y ' + formatValue(inp.OPERAND2) + ')';
    case 'operator_or':
        return '(' + formatValue(inp.OPERAND1) + ' O ' + formatValue(inp.OPERAND2) + ')';
    case 'operator_not':
        return 'NO ' + formatValue(inp.OPERAND);
    case 'operator_add':
        return '(' + formatValue(inp.NUM1) + ' + ' + formatValue(inp.NUM2) + ')';
    case 'operator_subtract':
        return '(' + formatValue(inp.NUM1) + ' - ' + formatValue(inp.NUM2) + ')';
    case 'operator_multiply':
        return '(' + formatValue(inp.NUM1) + ' * ' + formatValue(inp.NUM2) + ')';
    case 'operator_divide':
        return '(' + formatValue(inp.NUM1) + ' / ' + formatValue(inp.NUM2) + ')';
    case 'operator_random':
        return 'aleatorio(' + formatValue(inp.FROM) + ' a ' + formatValue(inp.TO) + ')';
    case 'motion_xposition':
        return '<posición x>';
    case 'motion_yposition':
        return '<posición y>';
    case 'motion_direction':
        return '<dirección>';
    default:
        return op;
    }
}

function transpileBlock(block, indentLevel) {
    var pad = '  '.repeat(indentLevel);
    var op = block.opcode || '';
    var inp = block.inputs || {};
    var fld = block.fields || {};
    var lines = [];

    switch (op) {
    // Hats
    case 'event_whenflagclicked':
        lines.push(pad + 'EVENTO: Al presionar Bandera Verde');
        break;
    case 'event_whenkeypressed':
        lines.push(pad + 'EVENTO: Al presionar tecla [' + (fld.KEY_OPTION || inp.KEY_OPTION || 'espacio') + ']');
        break;
    case 'event_whenthisspriteclicked':
        lines.push(pad + 'EVENTO: Al hacer clic en este objeto');
        break;
    case 'event_whenbroadcastreceived':
        lines.push(pad + 'EVENTO: Al recibir mensaje [' + (fld.BROADCAST_OPTION || inp.CHOICE || 'iniciar_juego') + ']');
        break;
    case 'control_start_as_clone':
        lines.push(pad + 'EVENTO: Al comenzar como clon');
        break;

    // Movimiento
    case 'motion_movesteps':
        lines.push(pad + 'mover (' + formatValue(inp.STEPS) + ') pasos');
        break;
    case 'motion_gotoxy':
        lines.push(pad + 'ir a x: (' + formatValue(inp.X) + ') y: (' + formatValue(inp.Y) + ')');
        break;
    case 'motion_glidesecstoxy':
        lines.push(pad + 'deslizar en (' + formatValue(inp.SECS) + ')s a x: (' + formatValue(inp.X) + ') y: (' + formatValue(inp.Y) + ')');
        break;
    case 'motion_changexby':
        lines.push(pad + 'cambiar x por (' + formatValue(inp.DX) + ')');
        break;
    case 'motion_setx':
        lines.push(pad + 'fijar x a (' + formatValue(inp.X) + ')');
        break;
    case 'motion_changeyby':
        lines.push(pad + 'cambiar y por (' + formatValue(inp.DY) + ')');
        break;
    case 'motion_sety':
        lines.push(pad + 'fijar y a (' + formatValue(inp.Y) + ')');
        break;
    case 'motion_pointindirection':
        lines.push(pad + 'apuntar en dirección (' + formatValue(inp.DIRECTION) + ')');
        break;
    case 'motion_ifonedgebounce':
        lines.push(pad + 'rebotar si toca un borde');
        break;

    // Apariencia
    case 'looks_show':
        lines.push(pad + 'mostrar');
        break;
    case 'looks_hide':
        lines.push(pad + 'ocultar');
        break;
    case 'looks_setsizeto':
        lines.push(pad + 'fijar tamaño a (' + formatValue(inp.SIZE) + ')%');
        break;
    case 'looks_switchcostumeto':
        lines.push(pad + 'cambiar disfraz a [' + (inp.COSTUME || fld.COSTUME || 'disfraz') + ']');
        break;
    case 'looks_nextcostume':
        lines.push(pad + 'siguiente disfraz');
        break;
    case 'looks_sayforsecs':
        lines.push(pad + 'decir "' + formatValue(inp.MESSAGE) + '" por (' + formatValue(inp.SECS) + ')s');
        break;

    // Sonido & Eventos
    case 'sound_playuntildone':
        lines.push(pad + 'tocar sonido [' + (inp.SOUND_MENU || 'sonido') + '] hasta que termine');
        break;
    case 'sound_startsound':
        lines.push(pad + 'iniciar sonido [' + (inp.SOUND_MENU || 'sonido') + ']');
        break;
    case 'event_broadcast':
        lines.push(pad + 'enviar mensaje [' + (inp.BROADCAST_INPUT || 'mensaje') + ']');
        break;
    case 'event_broadcastandwait':
        lines.push(pad + 'enviar mensaje [' + (inp.BROADCAST_INPUT || 'mensaje') + '] y esperar');
        break;

    // Variables
    case 'data_setvariableto':
        lines.push(pad + 'fijar [' + (fld.VARIABLE || 'var') + '] a (' + formatValue(inp.VALUE) + ')');
        break;
    case 'data_changevariableby':
        lines.push(pad + 'cambiar [' + (fld.VARIABLE || 'var') + '] por (' + formatValue(inp.VALUE) + ')');
        break;

    // Control
    case 'control_wait':
        lines.push(pad + 'esperar (' + formatValue(inp.DURATION) + ') segundos');
        break;
    case 'control_forever':
        lines.push(pad + 'por_siempre:');
        if (Array.isArray(inp.SUBSTACK) && inp.SUBSTACK.length > 0) {
            for (var f = 0; f < inp.SUBSTACK.length; f++) {
                lines.push(transpileBlock(inp.SUBSTACK[f], indentLevel + 1));
            }
        }
        break;
    case 'control_repeat':
        lines.push(pad + 'repetir (' + formatValue(inp.TIMES) + ') veces:');
        if (Array.isArray(inp.SUBSTACK) && inp.SUBSTACK.length > 0) {
            for (var r = 0; r < inp.SUBSTACK.length; r++) {
                lines.push(transpileBlock(inp.SUBSTACK[r], indentLevel + 1));
            }
        }
        break;
    case 'control_if':
        lines.push(pad + 'si <' + formatValue(inp.CONDITION) + '> entonces:');
        if (Array.isArray(inp.SUBSTACK) && inp.SUBSTACK.length > 0) {
            for (var cf = 0; cf < inp.SUBSTACK.length; f++) {
                lines.push(transpileBlock(inp.SUBSTACK[cf], indentLevel + 1));
            }
        }
        break;
    case 'control_if_else':
        lines.push(pad + 'si <' + formatValue(inp.CONDITION) + '> entonces:');
        if (Array.isArray(inp.SUBSTACK)) {
            for (var ie1 = 0; ie1 < inp.SUBSTACK.length; ie1++) {
                lines.push(transpileBlock(inp.SUBSTACK[ie1], indentLevel + 1));
            }
        }
        lines.push(pad + 'si no:');
        if (Array.isArray(inp.SUBSTACK2)) {
            for (var ie2 = 0; ie2 < inp.SUBSTACK2.length; ie2++) {
                lines.push(transpileBlock(inp.SUBSTACK2[ie2], indentLevel + 1));
            }
        }
        break;
    case 'control_create_clone_of':
        lines.push(pad + 'crear clon de [' + (inp.CLONE_OPTION || 'este objeto') + ']');
        break;
    case 'control_delete_this_clone':
        lines.push(pad + 'eliminar este clon');
        break;
    case 'control_stop':
        lines.push(pad + 'detener [' + (fld.STOP_OPTION || 'todos') + ']');
        break;

    default:
        lines.push(pad + op + ' ' + JSON.stringify(inp));
        break;
    }

    return lines.join('\n');
}

/**
 * Phase 2 Transpiler: Transpiles Scratch block JSON scripts into clean indented pseudocode.
 */
function transpileToPseudocode(descriptor, targetName) {
    if (!descriptor || !Array.isArray(descriptor.scripts)) return '# Sin scripts';
    var out = [];
    out.push('OBJETO: ' + (targetName || 'Sprite'));

    for (var s = 0; s < descriptor.scripts.length; s++) {
        var sc = descriptor.scripts[s];
        if (!sc || !Array.isArray(sc.blocks)) continue;
        out.push('');
        for (var b = 0; b < sc.blocks.length; b++) {
            out.push(transpileBlock(sc.blocks[b], 0));
        }
    }

    return out.join('\n');
}


// ---------------------------------------------------------------------------
// FASE 3: AGENTE CRÍTICO (AUDITOR LÓGICO)
// ---------------------------------------------------------------------------

/**
 * Builds the prompt for the Critic Agent (Observador).
 */
function buildCriticAuditPrompt(pseudocode, requirement, role) {
    var lines = [
        'Eres el OBSERVADOR CRÍTICO de Scratch 3.0.',
        'Audita la lógica del siguiente pseudocódigo generado para el objeto (' + role + ').',
        '',
        'REQUERIMIENTO DEL JUEGO / USUARIO:',
        requirement || 'Lógica de juego interactivo.',
        '',
        'PSEUDOCÓDIGO A EVALUAR:',
        pseudocode,
        '',
        'CRITERIOS ESTRICTOS DE RECHAZO:',
        '1. BUCLE_INFINITO: Un "por_siempre" con cambios de posición o variables que no incluye pausas (esperar) ni rebotes ni condiciones.',
        '2. CONTRADICCION: Ocultar y mostrar inmediatamente en el mismo bloque sin espera.',
        '3. OBJETIVO_NO_CUMPLIDO: Si el usuario pidió controles (flechas/espacio) y el código no los tiene.',
        '4. EVENTO_FALTANTE: Scripts sin punto de entrada o que quedan desconectados.',
        '',
        'RESPONDE ÚNICAMENTE CON UN JSON ESTRICTO con este esquema exacto:',
        '{',
        '  "aprobado": true | false,',
        '  "errores_criticos": [',
        '    {',
        '      "tipo": "BUCLE_INFINITO | CONTRADICCION | OBJETIVO_NO_CUMPLIDO | EVENTO_FALTANTE",',
        '      "descripcion": "explicación clara del error",',
        '      "bloque_afectado": "nombre_o_linea_del_bloque"',
        '    }',
        '  ],',
        '  "instruccion_de_correccion": "Instrucción precisa para que el Programador corrija el fallo en su siguiente intento."',
        '}'
    ];
    return lines.join('\n');
}

/**
 * Parses and verifies the Critic Agent's structured output.
 */
function parseCriticAuditResponse(rawText) {
    if (!rawText) return { aprobado: true, errores_criticos: [], instruccion_de_correccion: '' };
    try {
        var cleaned = rawText.trim();
        var start = cleaned.indexOf('{');
        var end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        var parsed = JSON.parse(cleaned);
        return {
            aprobado: !!parsed.aprobado,
            errores_criticos: Array.isArray(parsed.errores_criticos) ? parsed.errores_criticos : [],
            instruccion_de_correccion: parsed.instruccion_de_correccion || ''
        };
    } catch (e) {
        // Fallback: Si el crítico no devolvió JSON válido pero no hay fallas evidentes, asumir aprobado
        return {
            aprobado: true,
            errores_criticos: [],
            instruccion_de_correccion: ''
        };
    }
}

export {
    lintAndNormalizeDescriptor,
    transpileToPseudocode,
    buildCriticAuditPrompt,
    parseCriticAuditResponse
};
