import {getKnowledge} from './ai-knowledge';
import {getCompactPromptLines, getDetailedBlockInfo} from './ai-block-library';
import {TrainingEngine, generateOptimizedPrompt} from './ai-training-engine';
import {isTauriRuntime} from './dialog-helper';
import {readSSE} from './sse';
import {buildUserContent} from './ai-multimodal';

var PROVIDER_CONFIG = {
    groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        format: 'openai'
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        format: 'openai'
    },
    nvidia: {
        url: 'https://integrate.api.nvidia.com/v1/chat/completions',
        format: 'openai'
    },
    sambanova: {
        url: 'https://api.sambanova.ai/v1/chat/completions',
        format: 'openai'
    },
    openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        format: 'openai'
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/',
        format: 'gemini'
    },
    opencodezen: {
        url: '/zen/v1/chat/completions',
        format: 'openai'
    }
};

function isTrainingEnabled() {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ai_training_enabled') !== 'false';
}

function buildTrainingPrompt(examples) {
    if (!examples || examples.length === 0) return '';
    if (!isTrainingEnabled()) return '';
    return generateOptimizedPrompt(examples);
}

function buildMentorSystemPrompt(sessionSummary, locale) {
    var knowledge = getKnowledge(locale);
    var lang = locale === 'es' ? 'español' : (locale === 'en' ? 'English' : (locale || 'español'));
    var lines = [
        'Eres un mentor de Scratch. Tu rol es ENSEÑAR y GUIAR al usuario, NO hacer el trabajo por él.',
        '',
        'REGLAS:',
        '1. NUNCA escribas código, bloques, JSON ni respuestas en formato estructurado.',
        '2. NUNCA incluyas @bloques ni descriptores de bloques en tu respuesta.',
        '3. Explicá los CONCEPTOS: qué hace cada bloque, cómo se combinan, la lógica detrás.',
        '4. Dá pistas y sugerencias, pero dejá que el usuario descubra cómo implementarlo.',
        '5. Si el usuario pide un proyecto completo, guialo paso a paso sin darle el código.',
        '6. La app está configurada en ' + lang + '. Respondé SIEMPRE en ' + lang + ', claro y didáctico.',
        '7. Usá analogías y ejemplos del mundo real para explicar conceptos.',
        '8. Si el usuario se equivoca, señalá el error y preguntale cómo lo solucionaría.',
        '',
        'BLOQUES DISPONIBLES (solo para tu referencia):',
    ];

    var blockRef = getCompactPromptLines();
    for (var bri = 0; bri < blockRef.length; bri++) {
        lines.push(blockRef[bri]);
    }

    lines.push('');
    lines.push('Áreas:');
    for (var fi = 0; fi < knowledge.features.length; fi++) {
        var feat = knowledge.features[fi];
        lines.push(feat.area + ': ' + feat.items.length + ' funcionalidades');
    }
    lines.push('Pestañas: ' + knowledge.tabs.map(function (t) { return t.label; }).join(', '));

    if (sessionSummary) {
        lines.push('');
        lines.push('Historial: ' + sessionSummary);
    }

    return lines.join('\n');
}

function buildAppSystemPrompt(trainingExamples, sessionSummary, locale) {
    var knowledge = getKnowledge(locale);
    var lang = locale === 'es' ? 'español' : (locale === 'en' ? 'English' : (locale || 'español'));
    var lines = [
        'Eres asistente Scratch GUI. PODÉS crear/editar bloques reales.',
        '',
        'REGLAS CRÍTICAS SOBRE "explanation":',
        '- El mensaje en "explanation" DEBE SER CORTO Y DIRECTO (1 a 3 líneas o viñetas concisas), explicando directamente los procesos que realiza el código.',
        '- NUNCA incluyas saludos largos, introducciones vacías ni rodeos en "explanation".',
        '',
        'REGLAS CRÍTICAS SOBRE CAMPOS OPCIONALES:',
        '- Los campos "imageGenerate", "audioGenerate", "sfxGenerate", "musicGenerate" y "scripts" son SOLO para cuando el usuario EXPLÍCITAMENTE pide crear o modificar ese tipo de contenido.',
        '- Si el usuario te saluda (ej: "hola", "buenos días"), da las gracias o hace una pregunta general/teórica (ej: "cómo hago X", "qué hace este bloque", "explicame Y"), DEBES responder SOLO con "explanation". NO incluyas "scripts", NO incluyas "clearExisting", y NUNCA generes calculadoras o scripts ficticios.',
        '- NO incluyas "imageGenerate" si el usuario solo describe un proyecto sin pedir explícitamente crear una imagen/sprite/fondo.',
        '- NO incluyas "scripts" si el usuario solo pregunta cómo hacer algo sin pedir expresamente que lo crees o modifiques en el lienzo.',
        '- NO incluyas "audioGenerate" ni "sfxGenerate" ni "musicGenerate" si el usuario no pidió expresamente audio, sonido o música.',
        '- Si el usuario pide bloques + imagen + audio a la vez, ahí SÍ podés incluir todos los campos relevantes juntos.',
        '',
        'EDICIÓN vs. CREACIÓN:',
        '- Si el usuario pide CREAR algo nuevo desde cero (no hay nada que editar de lo que pidió), generá "scripts" con las cadenas nuevas y poné "clearExisting": false.',
        '- Si el usuario pide MODIFICAR, AGREGAR o QUITAR algo de un script que YA EXISTE (aparece arriba en WORKSPACE ACTUAL): reemití en "scripts" el script COMPLETO (desde el hat hasta el último bloque) tal como debe quedar DESPUÉS del cambio, y poné "clearExisting": true.',
        '- Al reemitir para editar, copiá EXACTAMENTE lo que NO cambia (mismos opcodes, campos y valores) y cambiá SOLO lo que pidió el usuario. El sistema compara tu versión con la actual y aplica ÚNICAMENTE las diferencias en el lugar correcto: los bloques que no cambiaron quedan INTACTOS en su posición (no se borran ni se recrean).',
        '- NUNCA borres de tu respuesta scripts que el usuario no pidió eliminar: si un script no está en "scripts", queda como estaba.',
        '- Para ELIMINAR un script puntual: no lo incluyas en "scripts" con "clearExisting": true, o usá "deleteScripts": ["opcode_del_hat"] SOLO si el usuario lo pidió explícitamente.',
        '- Para AGREGAR un script nuevo sin tocar los existentes: usá "scripts" con la/s cadena/s nuevas y "clearExisting": false.',
        '',
        '',
        'EJEMPLO DE RESPUESTA A SALUDO O PREGUNTA INFORMATIVA:',
        '{',
        '  "explanation": "¡Hola! ¿En qué puedo ayudarte hoy en Scratch?"',
        '}',
        '',
        'EJEMPLO DE CREACIÓN DE BLOQUES (CORTO Y DIRECTO):',
        '{',
        '  "explanation": "Mueve el gato 10 pasos al hacer clic en la bandera verde.",',
        '  "clearExisting": false,',
        '  "scripts": [',
        '    {',
        '      "blocks": [',
        '        { "opcode": "event_whenflagclicked" },',
        '        { "opcode": "motion_movesteps", "inputs": { "STEPS": 10 } }',
        '      ]',
        '    }',
        '  ]',
        '}',
        '',
        'GENERACIÓN DE IMÁGENES:',
        '- Si el usuario te pide crear un sprite, personaje, objeto, fondo, escenario o cualquier elemento visual, DEBES incluir el campo "imageGenerate" en tu JSON.',
        '- El campo "target" debe ser "sprite" si es un personaje/objeto, o "backdrop" si es un fondo/escenario.',
        '- En "prompt" poné una descripción detallada en español: incluí colores, estilo (cartoon, dibujo, pixel art), fondo, y detalles relevantes para Scratch.',
        '- Si el usuario también pide bloques para el sprite, incluí AMBOS: "imageGenerate" y "scripts" en el mismo JSON.',
        '- Para fondos/backdrops: NO incluyas "fondo blanco" ni "fondo transparente" en el prompt, la imagen debe ocupar todo el escenario.',
        '- Para sprites: el prompt debe describir el personaje u objeto sobre fondo blanco/transparente, como un recorte de sprite.',
        '',
        'GENERACIÓN DE AUDIO (TTS, SFX, MÚSICA):',
        '- El sistema puede generar 3 tipos de audio. Elegí el que corresponda según lo que pida el usuario:',
        '',
        '  1. TTS (text-to-speech) — "audioGenerate":',
        '     - Usá este campo cuando el usuario pida LEER texto en voz alta, explicar un concepto oralmente,',
        '       o cuando diga "leé", "decí", "pronunciá", "hablá", "contá", "narrá".',
        '     - Usa FreeTTS.org (Azure Neural voices) via Rust backend. No necesita API key.',
        '     - Formato: { "audioGenerate": { "text": "texto limpio para leer (sin markdown, sin código, sin emojis)" } }',
        '',
        '  2. Efectos de sonido (SFX) — "sfxGenerate":',
        '     - Usá este campo cuando el usuario pida un SONIDO, EFECTO, RUIDO (ej: "sonido de gato", "efecto de explosión", "ruido de lluvia").',
        '     - Usa Freesound.org (sonidos reales CC0) via Rust backend. Requiere API key de freesound.org en Settings.',
        '     - Sin API key: usa síntesis procedural (offline).',
        '     - Formato: { "sfxGenerate": { "prompt": "descripción del sonido en inglés (ej: cat meowing, explosion sound, rain falling)" } }',
        '',
        '  3. Música / melodía — "musicGenerate":',
        '     - Usá este campo cuando el usuario pida MÚSICA, CANCIÓN, MELODÍA, BANDA SONORA, RITMO, INSTRUMENTAL.',
        '     - Usa Freesound.org via Rust backend si hay API key. Fallback a síntesis procedural.',
        '     - Formato: { "musicGenerate": { "prompt": "descripción del estilo musical en inglés" } }',
        '',
        '- Podés incluir audioGenerate, sfxGenerate y/o musicGenerate junto con "imageGenerate" y "scripts" en el mismo JSON.',
        '',
        'REGLAS IMPORTANTES DE SCRATCH:',
        '1. Los scripts DEBEN comenzar con un bloque "hat" (event_whenflagclicked, event_whenkeypressed, control_start_as_clone, etc.).',
        '2. Los bloques de control condicional usan SUBSTACK y SUBSTACK2 para sus ramas:',
        '   - control_if: CONDITION (booleano) y SUBSTACK (array de bloques para la rama "Sí").',
        '   - control_if_else: CONDITION (booleano), SUBSTACK (array para la rama "Sí") y SUBSTACK2 (array para la rama "No/Else").',
        '   - PARA "ELSE IF" ENCADENADOS: anidá el siguiente bloque control_if_else (o control_if) DENTRO del array SUBSTACK2 del bloque anterior.',
        '3. Las entradas (inputs) como STEPS, DURATION, X, Y, MESSAGE se pasan en el objeto inputs.',
        '4. Los campos de selección (fields) como VARIABLE, LIST, KEY_OPTION, COSTUME, SOUND_MENU, FRONT_BACK se pasan en el objeto fields.',
        '5. Los bloques reporteros (ej: data_variable, sensing_answer, operator_add) se anidan dentro de la propiedad del input correspondiente como un objeto con su propio opcode, inputs y fields.',
        '6. Si solo respondes una pregunta de chat sin bloques, responde con "scripts": [] y pon la respuesta en "explanation".',
        '7. Asegúrate de retornar un JSON válido.',
        '',
        'REGLAS CRÍTICAS DE COMPARADORES Y OPERADORES:',
        '- ADVERTENCIA GRAVE: NUNCA pongas un símbolo matemático suelto (*, /, +, -, <, >, =, x) como valor de un input, y mucho menos dentro de un comparador. Un símbolo no es un número ni un bloque: el sistema lo convierte en 0 y la comparación queda mal (ej: pasa a "x = 0").',
        '- Si necesitás operar dentro de una comparación, representá la operación COMPLETA con bloques anidados (operator_add, operator_subtract, operator_multiply, operator_divide), jamás con el símbolo.',
        '- En Scratch NO existen símbolos como +, -, *, /, <, >, =. Usá los bloques específicos: operator_add (suma), operator_subtract (resta), operator_multiply (multiplicación), operator_divide (división), operator_gt (>), operator_lt (<), operator_equals (=).',
        '- Las comparaciones (si x > y, repetir hasta x < 5, esperar hasta x = 10) se arman con los bloques booleanos operator_gt, operator_lt, operator_equals, operator_contains DENTRO de CONDITION (control_if, control_repeat_until, control_wait_until).',
        '- IMPORTANTE: los inputs OPERAND1 y OPERAND2 de operator_gt, operator_lt, operator_equals y operator_contains son de VALOR, no de booleano. Aceptan números, variables u otros reporters (sensing_answer, operator_add, operator_join, etc.).',
        '- Para comparar contra una variable: anidá un bloque "data_variable" con su campo "VARIABLE" (ej: { "opcode": "data_variable", "fields": { "VARIABLE": "puntos" } }).',
        '- EJEMPLO de "si respuesta = 0": control_if con CONDITION = { "opcode": "operator_equals", "inputs": { "OPERAND1": { "opcode": "sensing_answer" }, "OPERAND2": 0 } }.',
        '- EJEMPLO de "si puntos + 2 > 5": operator_gt con OPERAND1 = { "opcode": "operator_add", "inputs": { "NUM1": { "opcode": "data_variable", "fields": { "VARIABLE": "puntos" } }, "NUM2": 2 } }, OPERAND2 = 5.',
        '- Antes de generar un comparador, PLANIFICÁ qué valor real va en cada lado: un número, una variable (data_variable) u otra operación anidada. Si el valor no es ninguna de esas tres cosas, estás usando un símbolo mal — reformulalo.',
        '- Si un lado de la comparación quedaría vacío o sería solo un símbolo, simplificá: compará el dato directamente contra un número o una variable. Buscá SIEMPRE una solución con bloques, nunca con símbolos sueltos.',
        '- NUNCA escribas el nombre de una variable como texto plano dentro de un input de comparación; SIEMPRE usá un bloque data_variable anidado.',
        '- operator_and, operator_or, operator_not SOLO toman operandos booleanos (OPERAND1, OPERAND2 o OPERAND) — es decir, otros bloques booleanos, NUNCA variables ni números.',
        '- operator_join (unir), operator_letter_of (letra de), operator_length (longitud) trabajan con STRING (texto).',
        '- operator_mod (módulo/resto) y operator_round (redondear) toman un solo NUM.',
        '- operator_random toma FROM (desde) y TO (hasta) como números.',
        '- NUNCA pongas un símbolo (+, -, <, >, =) como valor de un input. Siempre usá el bloque opcode correspondiente con sus inputs.',
        '',
        'PRINCIPIO DE ORO: SIMPLICIDAD Y LÓGICA DIRECTA (KISS):',
        '- "Menos es más". En Scratch, un script limpio, simple y reactivo de 5 a 10 bloques funciona 100 veces mejor que 20 bloques con lógicas enrevesadas.',
        '- NUNCA inventes bucles raros, variables temporales innecesarias ni esperas artificiales.',
        '- NUNCA pongas "control_wait" dentro de un bucle de movimiento por teclado (sensing_keypressed). El movimiento del jugador debe ser instantáneo y fluido en cada frame.',
        '- NUNCA coloques bloques después de "control_stop" con opción "all" o "this script", ya que son bloques muertos que jamás se ejecutarán.',
        '',
        'COOPERACIÓN ENTRE SPRITES (INTERACCIÓN REAL EN EL JUEGO):',
        '- Los sprites NO son islas: deben interactuar y cooperar armónicamente entre sí.',
        '- NOMBRES DE SPRITES EXACTOS: en bloques como "sensing_touchingobject" (¿tocando [objeto]?) o "motion_pointtowards", consulta la sección "CONTEXTO DEL PROYECTO" en el workspace. USA SIEMPRE los nombres REALES de los otros sprites (ej: si el sprite se llama "Nave", usa { "TOUCHINGOBJECTMENU": "Nave" }, jamás "Player" ni "Sprite1").',
        '- VARIABLES GLOBALES COMPARTIDAS: si el juego tiene vidas o puntos, usa las variables globales definidas en el Escenario (ej: "puntuacion", "vidas"). Modifícalas con "data_changevariableby".',
        '- COLISIONES CON TIEMPO DE INVULNERABILIDAD: cuando un enemigo u obstáculo toca al jugador y resta vidas, SIEMPRE debe haber una separación o pausa de invulnerabilidad:',
        '  * Restar 1 vida -> reubicar el obstáculo a la parte superior (ir a x: azar, y: 160) O esperar 0.5 segundos.',
        '  * NUNCA restes vidas en un bucle continuo sin pausa, porque Scratch ejecuta a 30 FPS y el jugador perdería todas sus vidas en un instante.',
        '- COOPERACIÓN POR MENSAJES (BROADCASTS):',
        '  * El Escenario maneja el ciclo de vida: al hacer clic en bandera verde -> inicializa variables (puntos a 0, vidas a 3) -> envía mensaje "iniciar_juego".',
        '  * Cada sprite arranca su juego al recibir "iniciar_juego" (ubicarse en posición inicial, mostrarse y arrancar su bucle por siempre).',
        '  * Cuando el Escenario detecta vidas < 1 -> envía "game_over" y detiene todo.',
        '  * Cuando se alcanza la puntuación meta -> envía "victoria".',
        '',
        'LOS 4 PATRONES CANÓNICOS DE JUEGO EN SCRATCH:',
        '1. JUGADOR (Movimiento suave por flechas o WASD):',
        '   [al recibir "iniciar_juego"] -> ir a x: 0 y: -120 -> por siempre [',
        '     si <tecla flecha derecha presionada> cambiar x por 6;',
        '     si <tecla flecha izquierda presionada> cambiar x por -6;',
        '     si <tecla flecha arriba presionada> cambiar y por 6;',
        '     si <tecla flecha abajo presionada> cambiar y por -6;',
        '     rebotar si toca un borde',
        '   ]',
        '2. ENEMIGO / OBSTÁCULO (Lluvia o patrulla con colisión cooperativa):',
        '   [al recibir "iniciar_juego"] -> ir a x: (azar entre -200 y 200) y: 160 -> por siempre [',
        '     cambiar y por -4;',
        '     si <posición en y < -160> ir a x: (azar entre -200 y 200) y: 160;',
        '     si <¿tocando [NombreRealJugador]?> cambiar [vidas] por -1 y ir a x: (azar entre -200 y 200) y: 160 y esperar 0.4 seg',
        '   ]',
        '3. COLECCIONABLE / RECOLECTABLE (Moneda o Estrella):',
        '   [al recibir "iniciar_juego"] -> mostrar -> por siempre [',
        '     girar 3 grados;',
        '     si <¿tocando [NombreRealJugador]?> cambiar [puntuacion] por 10 y ir a x: (azar entre -190 y 190) y: (azar entre -120 y 120)',
        '   ]',
        '4. ESCENARIO (Árbitro global):',
        '   Script 1: [al hacer clic en bandera verde] -> fijar [puntuacion] a 0 -> fijar [vidas] a 3 -> enviar [iniciar_juego]',
        '   Script 2: [al recibir "iniciar_juego"] -> por siempre [ si <vidas < 1> enviar [game_over] y detener todos ]',
        '',
        'MENÚS Y PREGUNTAS (USAR SOLO SI EL USUARIO PIDE TRIVIA O PREGUNTAS):',
        '- Si el usuario pide un juego de preguntas/trivia, usa "sensing_askandwait" y compara "sensing_answer" con la respuesta correcta.',
        '',
        'DISEÑO DE PROYECTOS GRANDES Y BLOQUES PERSONALIZADOS (MIS BLOQUES / PROCEDIMIENTOS):',
        '- En proyectos grandes o complejos, podés definir funciones personalizadas ("Mis Bloques") para modularizar el código:',
        '  * DEFINIR BLOQUE: { "opcode": "procedures_definition", "proccode": "Saltar %n", "argumentnames": ["fuerza"], "warp": true, "inputs": { "SUBSTACK": [ { "opcode": "motion_changeyby", "inputs": { "DY": { "opcode": "argument_reporter_string_number", "fields": { "VALUE": "fuerza" } } } } ] } }',
        '  * LLAMAR BLOQUE: { "opcode": "procedures_call", "proccode": "Saltar %n", "inputs": { "input0": 10 } }',
        '- ESTRUCTURA MULTI-SCRIPT PARA PROYECTOS GRANDES: podés incluir múltiples scripts independientes en el array "scripts" (ej: un script para Inicialización, otro para Loop Principal, otro para Teclado, y otros para Funciones).',
        '',
        '=== BLOQUES DISPONIBLES ===',
        'Formato: opcode [tipo] | descripción | FIELD:campo=tipo | IN:input=tipo | ST:substack',
        'Tipos: hat, stack, c-block, reporter, boolean, end',
        'Tipos de input: num (número/valor), str (texto), bool (booleano), color, menu (desplegable)',
        '',
    ];

    // Inject compact block reference from library
    var blockRef = getCompactPromptLines();
    for (var bri = 0; bri < blockRef.length; bri++) {
        lines.push(blockRef[bri]);
    }

    lines.push('');
    lines.push('CÓMO EDITAR BLOQUES EXISTENTES:');
    lines.push('- El workspace actual está arriba (WORKSPACE ACTUAL).');
    lines.push('- Para MODIFICAR un script: reemití el JSON del script COMPLETO (hat incluido) con "clearExisting": true. Copiá tal cual lo que no cambia y variá solo lo que pediste. El sistema lo compara con el actual y aplica SOLO la diferencia (agrega bloques dentro de la estructura existente, cambia un valor en el lugar sin borrar el bloque, o borra lo que corresponda). NO borres en tu respuesta scripts que no te pidió eliminar: si un script no está en tu respuesta, queda intacto.');
    lines.push('- Para ELIMINAR un script: usá "deleteScripts": ["opcode_del_hat"] con los gatillos (hats) de los scripts a borrar, SOLO si el usuario pidió explícitamente borrar o quitar. Si lo pedís vos sin que el usuario lo pida, está MAL.');
    lines.push('- Para borrar TODO el workspace y empezar de cero (solo si el usuario pidió explícitamente "borrá todo", "empezá de cero", "clear all"): usá "clearAll": true.');
    lines.push('- Si un script no cambia, no hace falta incluirlo en tu respuesta.');
    lines.push('');

    lines.push('TIPS:');
    lines.push('- Todos los valores de variables o teclas se especifican en el objeto fields.');
    lines.push('- Los valores numéricos, lógicos o de texto se pasan en el objeto inputs.');
    lines.push('- Los bloques reporteros anidados se colocan como objetos con sus propiedades correspondientes.');
    lines.push('- Si dudás de un bloque, usá DETALLE:opcode y recibirás la info completa.');

    lines.push('Áreas:');
    for (var fi = 0; fi < knowledge.features.length; fi++) {
        var feat = knowledge.features[fi];
        lines.push(feat.area + ': ' + feat.items.length + ' funcionalidades');
    }
    lines.push('Pestañas: ' + knowledge.tabs.map(function (t) { return t.label; }).join(', '));
    lines.push('Menús: Archivo | Configuración | Modo | Acerca de | AI');
    lines.push('Proveedores: ' + Object.keys(knowledge.aiSettings.providers).join(', '));

    if (sessionSummary) {
        lines.push('');
        lines.push('Historial: ' + sessionSummary);
    }

    if (trainingExamples && trainingExamples.length > 0) {
        lines.push(buildTrainingPrompt(trainingExamples));
    }
    return lines.join('\n');
}

function buildVerifyPrompt(userMsg, assistantResponse, knowledge) {
    var lines = [
        'Evaluá si la respuesta del asistente sobre Scratch GUI es correcta.',
        'REGLAS:',
        '- La respuesta debe ser CONSISTENTE con el conocimiento provisto abajo.',
        '- Si la respuesta explica cómo hacer algo con bloques (calculadora, juego, etc.) y usa bloques que SÍ existen en Scratch, es CORRECTA.',
        '- El conocimiento describe los bloques disponibles; la respuesta puede combinarlos creativamente.',
        '- Si la respuesta dice algo FALSO sobre Scratch o usa bloques que no existen, es INCORRECTA.',
        '- No marques INCORRECTO solo porque el tema (calculadora, juego) no esté explícitamente en el conocimiento.',
        '- Usá este formato exacto:',
        'RESULTADO: CORRECTO o INCORRECTO',
        'EXPLICACIÓN: (breve explicación)',
        'CORREGIDO: (solo si es INCORRECTO, escribí acá la versión corregida)',
        '',
        '=== CONOCIMIENTO ===',
        knowledge,
        '',
        '=== PREGUNTA DEL USUARIO ===',
        userMsg,
        '',
        '=== RESPUESTA DEL ASISTENTE A EVALUAR ===',
        assistantResponse
    ];
    return lines.join('\n');
}

function readBodySafe(res) {
    return res.text().then(function (text) {
        if (!text || !text.trim()) {
            return {ok: false, body: null, parseError: 'respuesta vacía'};
        }
        try {
            return {ok: true, body: JSON.parse(text)};
        } catch (e) {
            var preview = text.substring(0, 200).replace(/\n/g, ' ').trim();
            return {ok: false, body: null, parseError: 'no es JSON: "' + preview + '"'};
        }
    });
}

function extractJson(text) {
    if (!text) return null;
    var cleaned = text.trim();

    // Strip reasoning <think>...</think> tags if present (e.g. DeepSeek-R1, QwQ)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Strip markdown code fences if present anywhere
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

    var start = cleaned.indexOf('{');
    var end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    cleaned = cleaned.substring(start, end + 1);

    // Attempt 1: Direct JSON parse
    try {
        JSON.parse(cleaned);
        return cleaned;
    } catch (e1) {
        // Attempt 2: Repair trailing commas before } or ]
        try {
            var repaired = cleaned.replace(/,(\s*[\}\]])/g, '$1');
            JSON.parse(repaired);
            return repaired;
        } catch (e2) {
            // Attempt 3: Strip control characters that break JSON parsing
            try {
                var stripped = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, function (ch) {
                    return (ch === '\n' || ch === '\r' || ch === '\t') ? ch : '';
                }).replace(/,(\s*[\}\]])/g, '$1');
                JSON.parse(stripped);
                return stripped;
            } catch (e3) {
                return null;
            }
        }
    }
}

function callOpenAI(providerUrl, apiKey, model, messages, maxTokens, retries, options) {
    if (!maxTokens) maxTokens = 4096;
    if (retries === undefined) retries = 3;
    var temp = (options && typeof options.temperature === 'number') ? options.temperature : 0.3;
    var delay = 1000;

    function attempt(remaining) {
        return fetch(providerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temp,
                max_tokens: maxTokens
            })
        }).then(function (res) {
            if (res.status === 429 && remaining > 0) {
                return new Promise(function (resolve) {
                    setTimeout(resolve, delay * (4 - remaining));
                }).then(function () {
                    return attempt(remaining - 1);
                });
            }

            // Read body as text first (safe against non-JSON responses)
            return readBodySafe(res).then(function (parsed) {
                if (!res.ok) {
                    // HTTP error
                    var msg;
                    if (!parsed.ok) {
                        // Body is not JSON (HTML error page, etc.)
                        msg = 'HTTP ' + res.status + ' (' + (parsed.parseError || 'error desconocido') + ')';
                    } else if (parsed.body && parsed.body.error) {
                        msg = parsed.body.error.message || parsed.body.error.code || JSON.stringify(parsed.body.error);
                    } else {
                        msg = 'HTTP ' + res.status;
                    }

                    if (res.status === 413) msg = 'El mensaje es demasiado grande para este proveedor (413). Probá con un modelo con más contexto.';
                    if (res.status === 401) msg = 'API Key inválida o sin permisos (401). Verificá tu clave en Settings > AI.';
                    if (res.status === 429) msg = 'Demasiadas solicitudes (429). Esperá unos segundos y volvé a intentar.';
                    if (res.status >= 500) msg = 'Error del servidor (' + res.status + '). Probá de nuevo más tarde.';
                    throw new Error(msg);
                }

                if (!parsed.ok) {
                    throw new Error('El servidor devolvió HTML o contenido inválido: ' + parsed.parseError);
                }

                // Success — extract content
                var data = parsed.body;
                var content = data.choices && data.choices[0] && data.choices[0].message ?
                    data.choices[0].message.content : null;

                if (content === null || content === undefined) {
                    throw new Error('La API devolvió una respuesta vacía. Probá con otro modelo o proveedor.');
                }

                var trimmed = content.trim();
                if (!trimmed) {
                    throw new Error('La API devolvió una respuesta vacía. Probá con otro modelo o proveedor.');
                }

                return trimmed;
            });
        });
    }

    return attempt(retries);
}

function callGemini(apiKey, model, messages, maxTokens, retries, options) {
    if (!maxTokens) maxTokens = 2048;
    if (retries === undefined) retries = 3;
    var temp = (options && typeof options.temperature === 'number') ? options.temperature : 0.3;

    function attempt(remaining) {
        var contents = messages.map(function (msg) {
            return {
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: msg.parts || [{text: msg.content}]
            };
        });

        return fetch(
            PROVIDER_CONFIG.gemini.url + model + ':generateContent?key=' + apiKey,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {temperature: temp, maxOutputTokens: maxTokens}
                })
            }
        ).then(function (res) {
            if (res.status === 429 && remaining > 0) {
                return new Promise(function (resolve) {
                    setTimeout(resolve, 1000 * (4 - remaining));
                }).then(function () {
                    return attempt(remaining - 1);
                });
            }

            return readBodySafe(res).then(function (parsed) {
                if (!res.ok) {
                    var msg;
                    if (!parsed.ok) {
                        msg = 'HTTP ' + res.status + ' (' + (parsed.parseError || 'error') + ')';
                    } else if (parsed.body && parsed.body.error) {
                        msg = parsed.body.error.message || 'HTTP ' + res.status;
                    } else {
                        msg = 'HTTP ' + res.status;
                    }
                    if (res.status === 401) msg = 'API Key inválida (401). Verificá tu clave de Gemini en Settings > AI.';
                    if (res.status === 429) msg = 'Demasiadas solicitudes (429). Esperá unos segundos.';
                    throw new Error(msg);
                }

                if (!parsed.ok) {
                    throw new Error('Gemini devolvió HTML o contenido inválido: ' + parsed.parseError);
                }

                var data = parsed.body;
                if (data.candidates && data.candidates[0] && data.candidates[0].content &&
                    data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                    var text = data.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('');
                    if (text.trim()) return text;
                }
                throw new Error('Gemini devolvió una respuesta vacía. Probá reformular la pregunta.');
            });
        });
    }

    return attempt(retries);
}

function callZenViaTauri(apiKey, model, messages, maxTokens, options) {
    var temp = (options && typeof options.temperature === 'number') ? options.temperature : 0.3;
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('zen_chat', {
            apiKey: apiKey,
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temp,
                max_tokens: maxTokens || 4096
            })
        });
    }).then(function (data) {
        var content = data && data.choices && data.choices[0] && data.choices[0].message ?
            data.choices[0].message.content : null;
        if (content === null || content === undefined || !String(content).trim()) {
            throw new Error('La API devolvió una respuesta vacía. Probá con otro modelo o proveedor.');
        }
        return String(content).trim();
    }).catch(function (err) {
        throw toError(err);
    });
}

function callOpenAIStream(providerUrl, apiKey, model, messages, maxTokens, onDelta, signal) {
    if (!maxTokens) maxTokens = 4096;
    return fetch(providerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3,
            max_tokens: maxTokens,
            stream: true
        }),
        signal: signal
    }).then(function (res) {
        if (res.status === 429) throw new Error('Demasiadas solicitudes (429). Esperá unos segundos y volvé a intentar.');
        if (res.status === 401) throw new Error('API Key inválida o sin permisos (401). Verificá tu clave en Settings > AI.');
        if (res.status === 413) throw new Error('El mensaje es demasiado grande para este proveedor (413).');
        if (!res.ok) {
            return res.text().then(function (t) {
                throw new Error('HTTP ' + res.status + ' ' + String(t).substring(0, 200));
            });
        }
        if (!res.body) throw new Error('Este navegador no soporta streaming.');
        return readSSE(res.body, function (obj) {
            return obj.choices && obj.choices[0] && obj.choices[0].delta && obj.choices[0].delta.content;
        }, onDelta, signal);
    }).then(function (full) {
        console.log('[AI] browser stream resolvio, len=' + ((full || '').length) + ' url=' + providerUrl);
        if (!full || !String(full).trim()) {
            throw new Error('El proveedor devolvió una transmisión vacía. Verificá que el modelo soporte streaming o cambiá de proveedor/modelo.');
        }
        return full;
    });
}

function callGeminiStream(apiKey, model, messages, maxTokens, onDelta, signal) {
    if (!maxTokens) maxTokens = 2048;
    var contents = messages.map(function (msg) {
        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: msg.parts || [{text: msg.content}]
        };
    });
    return fetch(
        PROVIDER_CONFIG.gemini.url + model + ':streamGenerateContent?alt=sse&key=' + apiKey,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: contents,
                generationConfig: {temperature: 0.3, maxOutputTokens: maxTokens}
            }),
            signal: signal
        }
    ).then(function (res) {
        if (res.status === 429) throw new Error('Demasiadas solicitudes (429). Esperá unos segundos.');
        if (res.status === 401) throw new Error('API Key inválida (401). Verificá tu clave de Gemini en Settings > AI.');
        if (!res.ok) {
            return res.text().then(function (t) {
                throw new Error('HTTP ' + res.status + ' ' + String(t).substring(0, 200));
            });
        }
        if (!res.body) throw new Error('Este navegador no soporta streaming.');
        return readSSE(res.body, function (obj) {
            var parts = obj.candidates && obj.candidates[0] && obj.candidates[0].content &&
                obj.candidates[0].content.parts;
            if (!parts) return null;
            return parts.map(function (p) { return p.text || ''; }).join('');
        }, onDelta, signal);
    });
}

function makeAbortError(message) {
    var msg = message || 'La transmisión fue cancelada.';
    if (typeof DOMException !== 'undefined') {
        return new DOMException(msg, 'AbortError');
    }
    var e = new Error(msg);
    e.name = 'AbortError';
    return e;
}

function toError(err) {
    if (err instanceof Error) return err;
    if (err === null || err === undefined) return new Error('Error desconocido');
    return new Error(String(err));
}

// Shared settlement for Tauri stream wrappers. Rust emits {done:true, cancelled:true}
// when the user cancels; a plain {done:true} means the stream finished naturally. A
// cancel that races with completion (late-cancel) must NOT discard the full response.
function settleTauriStream(cancelled, state, emptyErrorMessage) {
    if (state.error) throw new Error(state.error);
    if (state.done && !state.cancelled) {
        if (emptyErrorMessage && (!state.full || !String(state.full).trim())) {
            throw new Error(emptyErrorMessage);
        }
        return state.full;
    }
    if (cancelled || state.cancelled) throw makeAbortError();
    throw new Error('La transmisión terminó inesperadamente.');
}

function callZenStreamViaTauri(apiKey, model, messages, maxTokens, onDelta, signal) {
    var requestId = 'zen-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    return Promise.all([
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/core')
    ]).then(function (mods) {
        var eventApi = mods[0];
        var core = mods[1];
        var state = {error: null, done: false, full: '', cancelled: false};
        var unlisten = null;
        var cancelled = false;

        function handle(payload) {
            if (!payload || payload.requestId !== requestId) return;
            if (payload.error) {
                state.error = String(payload.error);
            } else if (typeof payload.delta === 'string' && payload.delta) {
                state.full += payload.delta;
                onDelta(payload.delta);
            } else if (payload.done) {
                state.done = true;
                if (payload.cancelled) state.cancelled = true;
            }
        }

        function onAbort() {
            if (cancelled) return;
            cancelled = true;
            core.invoke('zen_chat_cancel', {requestId: requestId}).catch(function () {});
        }
        if (signal) {
            if (signal.aborted) {
                onAbort();
            } else {
                signal.addEventListener('abort', onAbort);
            }
        }

        function cleanup() {
            if (signal) signal.removeEventListener('abort', onAbort);
            if (unlisten) { unlisten(); unlisten = null; }
        }

        return eventApi.listen('zen-chunk', function (e) { handle(e.payload); }).then(function (u) {
            unlisten = u;
            return core.invoke('zen_chat_stream', {
                requestId: requestId,
                apiKey: apiKey,
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.3,
                    max_tokens: maxTokens || 4096,
                    stream: true
                })
            });
        }).then(function () {
            cleanup();
            return settleTauriStream(cancelled, state, null);
        }).catch(function (err) {
            cleanup();
            throw toError(err);
        });
    });
}

function callOpenAIViaTauri(providerUrl, apiKey, model, messages, maxTokens, options) {
    var temp = (options && typeof options.temperature === 'number') ? options.temperature : 0.3;
    var body = JSON.stringify({
        model: model,
        messages: messages,
        temperature: temp,
        max_tokens: maxTokens || 4096
    });
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('ai_chat', {url: providerUrl, apiKey: apiKey, body: body});
    }).then(function (data) {
        var content = data && data.choices && data.choices[0] && data.choices[0].message ?
            data.choices[0].message.content : null;
        if (!content || !String(content).trim()) {
            throw new Error('La API devolvió una respuesta vacía. Probá con otro modelo o proveedor.');
        }
        return String(content).trim();
    }).catch(function (err) {
        throw toError(err);
    });
}

function callOpenAIStreamViaTauri(providerUrl, apiKey, model, messages, maxTokens, onDelta, signal) {
    var requestId = 'ai-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var body = JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: maxTokens || 8192,
        stream: true
    });
    return Promise.all([
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/core')
    ]).then(function (mods) {
        var eventApi = mods[0];
        var core = mods[1];
        var state = {error: null, done: false, full: '', cancelled: false};
        var unlisten = null;
        var cancelled = false;

        function handle(e) {
            var payload = e.payload;
            if (!payload || payload.requestId !== requestId) return;
            if (payload.error) {
                state.error = String(payload.error);
            } else if (typeof payload.delta === 'string' && payload.delta) {
                state.full += payload.delta;
                onDelta(payload.delta);
            } else if (payload.done) {
                state.done = true;
                if (payload.cancelled) state.cancelled = true;
            }
        }

        function onAbort() {
            if (cancelled) return;
            cancelled = true;
            core.invoke('ai_chat_cancel', {requestId: requestId}).catch(function () {});
        }
        if (signal) {
            if (signal.aborted) {
                onAbort();
            } else {
                signal.addEventListener('abort', onAbort);
            }
        }

        function cleanup() {
            if (signal) signal.removeEventListener('abort', onAbort);
            if (unlisten) { unlisten(); unlisten = null; }
        }

        return eventApi.listen('ai-chunk', handle).then(function (u) {
            unlisten = u;
            return core.invoke('ai_chat_stream', {
                requestId: requestId,
                url: providerUrl,
                apiKey: apiKey,
                body: body
            });
        }).then(function () {
            cleanup();
            return settleTauriStream(cancelled, state, 'El proveedor devolvió una transmisión vacía. Verificá que el modelo soporte streaming o cambiá de proveedor/modelo.');
        }).catch(function (err) {
            cleanup();
            if (state.error) throw toError(state.error);
            throw toError(err);
        });
    });
}

function buildGeminiBody(messages, maxTokens, options) {
    var temp = (options && typeof options.temperature === 'number') ? options.temperature : 0.3;
    var contents = messages.map(function (msg) {
        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: msg.parts || [{text: msg.content}]
        };
    });
    return JSON.stringify({
        contents: contents,
        generationConfig: {temperature: temp, maxOutputTokens: maxTokens || 2048}
    });
}

function callGeminiViaTauri(url, body) {
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('gemini_chat', {url: url, body: body});
    }).then(function (data) {
        var text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
            data.candidates[0].content.parts ? data.candidates[0].content.parts.map(function (p) {
                return p.text || '';
            }).join('') : '';
        if (!String(text).trim()) {
            throw new Error('Gemini devolvió una respuesta vacía. Probá reformular la pregunta.');
        }
        return String(text).trim();
    }).catch(function (err) {
        throw toError(err);
    });
}

function callGeminiStreamViaTauri(url, body, onDelta, signal) {
    var requestId = 'gemini-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    return Promise.all([
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/core')
    ]).then(function (mods) {
        var eventApi = mods[0];
        var core = mods[1];
        var state = {error: null, done: false, full: '', cancelled: false};
        var unlisten = null;
        var cancelled = false;

        function handle(e) {
            var payload = e.payload;
            if (!payload || payload.requestId !== requestId) return;
            if (payload.error) {
                state.error = String(payload.error);
            } else if (typeof payload.delta === 'string' && payload.delta) {
                state.full += payload.delta;
                onDelta(payload.delta);
            } else if (payload.done) {
                state.done = true;
                if (payload.cancelled) state.cancelled = true;
            }
        }

        function onAbort() {
            if (cancelled) return;
            cancelled = true;
            core.invoke('ai_chat_cancel', {requestId: requestId}).catch(function () {});
        }
        if (signal) {
            if (signal.aborted) {
                onAbort();
            } else {
                signal.addEventListener('abort', onAbort);
            }
        }

        function cleanup() {
            if (signal) signal.removeEventListener('abort', onAbort);
            if (unlisten) { unlisten(); unlisten = null; }
        }

        return eventApi.listen('gemini-chunk', handle).then(function (u) {
            unlisten = u;
            return core.invoke('gemini_chat_stream', {
                requestId: requestId,
                url: url,
                body: body
            });
        }).then(function () {
            cleanup();
            return settleTauriStream(cancelled, state, 'Gemini devolvió una transmisión vacía. Verificá el modelo y tu clave.');
        }).catch(function (err) {
            cleanup();
            if (state.error) throw toError(state.error);
            throw toError(err);
        });
    });
}

function AiService(provider, apiKey, model, trainingData, locale) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
    this.trainingData = trainingData || [];
    this.sessionSummary = '';
    this.locale = locale || 'es';
    this.systemPrompt = buildAppSystemPrompt(this.trainingData.length > 0 ? this.trainingData : null, '', this.locale);
}
AiService.prototype.setTrainingData = function (trainingData) {
    this.trainingData = trainingData || [];
    this.systemPrompt = buildAppSystemPrompt(this.trainingData.length > 0 ? this.trainingData : null, this.sessionSummary, this.locale);
};

AiService.prototype.setSessionSummary = function (summary) {
    this.sessionSummary = summary || '';
    this.systemPrompt = buildAppSystemPrompt(this.trainingData.length > 0 ? this.trainingData : null, this.sessionSummary, this.locale);
};

AiService.prototype._call = function (messages, maxTokens, options) {
    var config = PROVIDER_CONFIG[this.provider];
    if (!config) return Promise.reject(new Error('Proveedor no soportado'));
    if (this.provider === 'opencodezen' && !isTauriRuntime()) {
        return Promise.reject(new Error('OpenCode Zen solo funciona en la app de escritorio (Tauri). En navegador, usá un proveedor estándar (OpenAI, Groq, etc.).'));
    }
    if (config.format === 'openai') {
        if (this.provider === 'opencodezen' && isTauriRuntime()) {
            return callZenViaTauri(this.apiKey, this.model, messages, maxTokens, options);
        }
        if (isTauriRuntime() && this.provider !== 'gemini') {
            return callOpenAIViaTauri(config.url, this.apiKey, this.model, messages, maxTokens, options);
        }
        return callOpenAI(config.url, this.apiKey, this.model, messages, maxTokens, 3, options);
    }
    if (config.format === 'gemini') {
        if (isTauriRuntime()) {
            return callGeminiViaTauri(
                config.url + this.model + ':generateContent?key=' + this.apiKey,
                buildGeminiBody(messages, maxTokens, options)
            );
        }
        return callGemini(this.apiKey, this.model, messages, maxTokens, 3, options);
    }
    return Promise.reject(new Error('Formato no soportado'));
};

function isGreetingOrGeneralQuery(userMsg) {
    if (!userMsg) return false;
    var text = typeof userMsg === 'string' ? userMsg : (userMsg.content || '');
    if (!text || typeof text !== 'string') return false;
    var trimmed = text.trim().toLowerCase();
    var greetings = ['hola', 'hola!', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hi', 'hello', 'gracias', 'gracias!', 'quien sos', 'ayuda', 'ayuda!'];
    if (greetings.indexOf(trimmed) !== -1) return true;
    if (trimmed.length <= 15 && (trimmed.indexOf('hola') === 0 || trimmed.indexOf('que tal') === 0 || trimmed.indexOf('buenas') === 0)) return true;
    return false;
}

AiService.prototype.ask = function (userMessage, sessionSummary, mentorMode, attachments) {
    var prompt;
    if (mentorMode) {
        prompt = buildMentorSystemPrompt(sessionSummary || '', this.locale);
    } else {
        prompt = this.systemPrompt;
        if (sessionSummary) {
            prompt = buildAppSystemPrompt(this.trainingData.length > 0 ? this.trainingData : null, sessionSummary, this.locale);
        }
    }
    var config = PROVIDER_CONFIG[this.provider];
    var format = config ? config.format : 'openai';
    var effectiveMsg = userMessage;
    if (!mentorMode && isGreetingOrGeneralQuery(userMessage)) {
        effectiveMsg = (typeof userMessage === 'string' ? userMessage : '') +
            ' [NOTA DE INTENCIÓN: El usuario ha enviado un saludo o mensaje directo. Respondé ÚNICAMENTE con el campo "explanation" en JSON. NO generes bloques, NO incluyas "scripts" ni "clearExisting", y NUNCA generes una calculadora ni scripts no solicitados.]';
    }
    var uc = buildUserContent(format, effectiveMsg, attachments);
    var userMsg = uc.parts ? {role: 'user', parts: uc.parts} : {role: 'user', content: uc.content};
    return this._call([
        {role: 'system', content: prompt},
        userMsg
    ], 8192);
};

AiService.prototype.askStream = function (userMessage, sessionSummary, mentorMode, onDelta, signal, attachments) {
    var prompt;
    if (mentorMode) {
        prompt = buildMentorSystemPrompt(sessionSummary || '', this.locale);
    } else {
        prompt = this.systemPrompt;
        if (sessionSummary) {
            prompt = buildAppSystemPrompt(this.trainingData.length > 0 ? this.trainingData : null, sessionSummary, this.locale);
        }
    }
    var config = PROVIDER_CONFIG[this.provider];
    if (!config) return Promise.reject(new Error('Proveedor no soportado'));
    if (this.provider === 'opencodezen' && !isTauriRuntime()) {
        return Promise.reject(new Error('OpenCode Zen solo funciona en la app de escritorio (Tauri). En navegador, usá un proveedor estándar (OpenAI, Groq, etc.).'));
    }
    var format = config.format;
    var effectiveMsg = userMessage;
    if (!mentorMode && isGreetingOrGeneralQuery(userMessage)) {
        effectiveMsg = (typeof userMessage === 'string' ? userMessage : '') +
            ' [NOTA DE INTENCIÓN: El usuario ha enviado un saludo o mensaje directo. Respondé ÚNICAMENTE con el campo "explanation" en JSON. NO generes bloques, NO incluyas "scripts" ni "clearExisting", y NUNCA generes una calculadora ni scripts no solicitados.]';
    }
    var uc = buildUserContent(format, effectiveMsg, attachments);
    var userMsg = uc.parts ? {role: 'user', parts: uc.parts} : {role: 'user', content: uc.content};
    var messages = [
        {role: 'system', content: prompt},
        userMsg
    ];
    console.log('[AI] askStream provider=' + this.provider + ' model=' + this.model + ' tauri=' + isTauriRuntime() + ' url=' + config.url);
    if (config.format === 'gemini') {
        if (isTauriRuntime()) {
            return callGeminiStreamViaTauri(
                config.url + this.model + ':streamGenerateContent?alt=sse&key=' + this.apiKey,
                buildGeminiBody(messages, 2048),
                onDelta, signal
            );
        }
        return callGeminiStream(this.apiKey, this.model, messages, 2048, onDelta, signal);
    }
    if (this.provider === 'opencodezen' && isTauriRuntime()) {
        return callZenStreamViaTauri(this.apiKey, this.model, messages, 8192, onDelta, signal);
    }
    if (isTauriRuntime() && this.provider !== 'gemini') {
        return callOpenAIStreamViaTauri(config.url, this.apiKey, this.model, messages, 8192, onDelta, signal);
    }
    return callOpenAIStream(config.url, this.apiKey, this.model, messages, 8192, onDelta, signal);
};



AiService.prototype._parseVerification = function (raw) {
    var result = 'CORRECTO';
    var explanation = '';
    var corrected = '';
    var lines = raw.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (l.indexOf('RESULTADO:') === 0) {
            result = l.substring(10).trim().toUpperCase();
        } else if (l.indexOf('EXPLICACIÓN:') === 0) {
            explanation = l.substring(12).trim();
        } else if (l.indexOf('CORREGIDO:') === 0) {
            corrected = lines.slice(i + 1).join('\n').trim();
            break;
        }
    }

    return {
        result: result,
        explanation: explanation || (result === 'CORRECTO' ? 'La respuesta es correcta.' : 'Se encontraron errores.'),
        corrected: corrected
    };
};

AiService.prototype.fixBlocks = function (rawJson, parseErrors, changes, validationErrors) {
    var self = this;

    var problemLines = [];
    if (parseErrors && parseErrors.length) {
        problemLines.push('- Errores del parseo (corregilos en el JSON):');
        for (var i = 0; i < parseErrors.length; i++) problemLines.push('  * ' + parseErrors[i]);
    }
    if (validationErrors && validationErrors.length) {
        problemLines.push('- Errores de estructura/validación:');
        for (var j = 0; j < validationErrors.length; j++) problemLines.push('  * ' + validationErrors[j]);
    }
    if (changes && changes.length) {
        problemLines.push('- Correcciones ya aplicadas automáticamente (no las rompas):');
        for (var k = 0; k < changes.length; k++) problemLines.push('  * ' + changes[k]);
    }

    var prompt = [
        'El JSON de bloques que generaste tiene problemas. Corregilo y devolvé el JSON COMPLETO y corregido, sin texto alrededor, sin @bloques, sin markdown.',
        '',
        'PROBLEMAS:',
        (problemLines.length ? problemLines.join('\n') : '- Problema no especificado; revisá la estructura del JSON.'),
        '',
        'REGLAS:',
        '- No cambies la lógica del programa ni los ids. Corregí solo lo señalado.',
        '- Un input "CONDITION" (control_if/until/while) solo admite reporters booleanos (operator_equals, operator_gt, operator_lt, operator_and, operator_or, operator_not, sensing_keypressed...). NUNCA un literal ni un valor numérico.',
        '- "tiempo"/"tiempo transcurrido"/"timer" → sensing_timer; "respuesta"/"answer" → sensing_answer (precede sensing_askandwait con el texto de la pregunta).',
        '- Las variables usadas deben asignarse con data_setvariableto ANTES de leerse.',
        '- Solo usá opcodes de la lista provista; reemplazá bloques inexistentes por alternativas reales.',
        '- Respondé SOLO con el JSON.',
        '',
        '=== OPCODES VÁLIDOS ===',
        self.systemPrompt.substring(self.systemPrompt.lastIndexOf('=== BLOQUES DISPONIBLES ===')),
        '',
        '=== JSON A CORREGIR ===',
        rawJson
    ].join('\n');

    return self._call([
        {role: 'system', content: 'Corregís JSON de bloques de Scratch respetando los opcodes válidos y devolvés el JSON completo corregido.'},
        {role: 'user', content: prompt}
    ], 4096).then(function (raw) {
        var json = extractJson(raw);
        if (!json) {
            throw new Error('No se pudo extraer el JSON corregido de la respuesta.');
        }
        return json;
    });
};

AiService.prototype.verify = function (userMsg, assistantResponse) {
    var self = this;
    var systemPrompt = self.systemPrompt;

    return self._call([
        {role: 'system', content: 'Verificás respuestas basándote exclusivamente en el conocimiento provisto. No usés información externa.'},
        {role: 'user', content: buildVerifyPrompt(userMsg, assistantResponse, systemPrompt)}
    ], 2048).then(function (raw) {
        var v = self._parseVerification(raw);

        if (v.result !== 'CORRECTO' && v.corrected) {
            // Re-verify the corrected version
            return self._call([
                {role: 'system', content: 'Verificás respuestas basándote exclusivamente en el conocimiento provisto. No usés información externa.'},
                {role: 'user', content: buildVerifyPrompt(userMsg, v.corrected, systemPrompt)}
            ], 2048).then(function (raw2) {
                var v2 = self._parseVerification(raw2);
                return {
                    result: v2.result,
                    explanation: v2.explanation,
                    corrected: v.corrected,
                    finalCorrected: v2.result === 'CORRECTO' ? v.corrected : assistantResponse
                };
            });
        }

        return {
            result: v.result,
            explanation: v.explanation,
            corrected: '',
            finalCorrected: ''
        };
    });
};

export default AiService;
