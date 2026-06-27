import AI_KNOWLEDGE from './ai-knowledge';

function uid() {
    var soup = '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var id = [];
    for (var i = 0; i < 20; i++) {
        id.push(soup.charAt(Math.random() * soup.length));
    }
    return id.join('');
}

function findAllBlocks(blocksData) {
    var result = {};
    for (var cat in blocksData) {
        if (Object.prototype.hasOwnProperty.call(blocksData, cat)) {
            for (var i = 0; i < blocksData[cat].length; i++) {
                result[blocksData[cat][i].opcode] = blocksData[cat][i];
            }
        }
    }
    return result;
}

var BLOCK_INDEX = findAllBlocks(AI_KNOWLEDGE.blocks);

function isValidOpcode(opcode) {
    return opcode in BLOCK_INDEX;
}

function getBlockMeta(opcode) {
    return BLOCK_INDEX[opcode] || null;
}

function extractScratchblocksText(responseText) {
    var match = responseText.match(/<scratchblocks>([\s\S]*?)<\/scratchblocks>/i);
    if (!match) return null;
    return match[1].trim();
}

function parseXML(xmlText) {
    try {
        var parser = new DOMParser();
        var doc = parser.parseFromString('<scratchblocks>' + xmlText + '</scratchblocks>', 'text/xml');
        var parseError = doc.querySelector('parsererror');
        if (parseError) return null;
        return doc.documentElement;
    } catch (e) {
        return null;
    }
}

function parseField(fieldEl) {
    var name = fieldEl.getAttribute('name');
    var value = '';
    if (fieldEl.firstChild && fieldEl.firstChild.nodeType === 3) {
        value = fieldEl.firstChild.nodeValue;
    }
    return {name: name, value: value};
}

function parseInput(inputEl, blockMap, parentId) {
    var inputName = inputEl.getAttribute('name');
    var shadowEl = null;
    var blockEl = null;

    for (var ci = 0; ci < inputEl.children.length; ci++) {
        var child = inputEl.children[ci];
        var tag = child.tagName ? child.tagName.toLowerCase() : '';
        if (tag === 'shadow') shadowEl = child;
        if (tag === 'block') blockEl = child;
    }

    var shadowId = null;
    var blockId = null;

    if (shadowEl) {
        shadowId = processBlockNode(shadowEl, blockMap, parentId, true);
    }
    if (blockEl) {
        blockId = processBlockNode(blockEl, blockMap, parentId, false);
    }

    return {
        name: inputName,
        block: blockId,
        shadow: shadowId || blockId
    };
}

function processBlockNode(blockEl, blockMap, parentId, isShadow) {
    var type = blockEl.getAttribute('type') || blockEl.getAttribute('opcode');
    if (!type) return null;

    if (!isShadow && !isValidOpcode(type)) return null;

    var id = uid();
    var meta = isShadow ? null : getBlockMeta(type);

    var fields = {};
    var inputs = {};
    var nextId = null;
    var mutation = null;

    for (var ci = 0; ci < blockEl.children.length; ci++) {
        var child = blockEl.children[ci];
        if (!child.tagName) continue;
        var tag = child.tagName.toLowerCase();

        if (tag === 'field') {
            var field = parseField(child);
            fields[field.name] = {name: field.name, value: field.value};
        } else if (tag === 'value' || tag === 'statement') {
            var input = parseInput(child, blockMap, id);
            inputs[input.name] = {name: input.name, block: input.block, shadow: input.shadow};
        } else if (tag === 'next') {
            for (var ni = 0; ni < child.children.length; ni++) {
                var nextChild = child.children[ni];
                if (!nextChild.tagName) continue;
                var nextTag = nextChild.tagName.toLowerCase();
                if (nextTag === 'block' || nextTag === 'shadow') {
                    nextId = processBlockNode(nextChild, blockMap, id, nextTag === 'shadow');
                }
            }
        } else if (tag === 'mutation') {
            mutation = {};
            for (var ai = 0; ai < child.attributes.length; ai++) {
                var attr = child.attributes[ai];
                mutation[attr.name] = attr.value;
            }
        }
    }

    var x = blockEl.getAttribute('x');
    var y = blockEl.getAttribute('y');

    var block = {
        id: id,
        opcode: type,
        fields: fields,
        inputs: inputs,
        next: nextId,
        parent: parentId,
        topLevel: !parentId,
        shadow: isShadow,
        mutation: mutation
    };

    if (!isShadow) {
        if (x) block.x = parseFloat(x);
        if (y) block.y = parseFloat(y);
    }

    blockMap[id] = block;

    // Validate against knowledge base
    if (!isShadow && meta) {
        for (var fi = 0; fi < (meta.inputs || []).length; fi++) {
            var expectedInput = meta.inputs[fi];
            if (expectedInput.type === 'value' && !inputs[expectedInput.name]) {
                // Input missing, create default shadow
                var shadowId = uid();
                var defaultShadow = createDefaultShadow(shadowId, expectedInput.shadow || 'math_number', id);
                blockMap[shadowId] = defaultShadow;
                inputs[expectedInput.name] = {
                    name: expectedInput.name,
                    block: null,
                    shadow: shadowId
                };
            }
        }
    }

    return id;
}

function createDefaultShadow(id, shadowType, parentId) {
    var fields = {};
    if (shadowType === 'math_number') {
        fields.NUM = {name: 'NUM', value: '0'};
    } else if (shadowType === 'text') {
        fields.TEXT = {name: 'TEXT', value: ''};
    }

    return {
        id: id,
        opcode: shadowType,
        fields: fields,
        inputs: {},
        next: null,
        parent: parentId,
        topLevel: false,
        shadow: true,
        mutation: null
    };
}

function assignPositions(topBlocks) {
    var startX = 30;
    var startY = 30;
    var ySpacing = 60;

    for (var i = 0; i < topBlocks.length; i++) {
        var topBlock = topBlocks[i];
        if (!topBlock) continue;

        var hasExplicitPosition = topBlock.x !== undefined && topBlock.y !== undefined;
        if (hasExplicitPosition) continue;

        topBlock.x = startX;
        topBlock.y = startY + i * ySpacing;
    }
}

function parse(responseText) {
    var xmlText = extractScratchblocksText(responseText);
    if (!xmlText) return null;

    var root = parseXML(xmlText);
    if (!root) return null;

    var blockMap = {};

    for (var ci = 0; ci < root.children.length; ci++) {
        var child = root.children[ci];
        if (!child.tagName) continue;
        var tag = child.tagName.toLowerCase();
        if (tag === 'block' || tag === 'shadow') {
            processBlockNode(child, blockMap, null, tag === 'shadow');
        }
    }

    var topBlocks = [];
    for (var id in blockMap) {
        if (Object.prototype.hasOwnProperty.call(blockMap, id)) {
            var b = blockMap[id];
            if (b.topLevel && !b.shadow) {
                topBlocks.push(b);
            }
        }
    }

    assignPositions(topBlocks);

    return {
        blockMap: blockMap,
        topBlocks: topBlocks
    };
}

var BLOCK_KEYWORDS = [
    'haz', 'hace', 'hagan', 'haced', 'hacer',
    'crea', 'crear', 'creame', 'creame un', 'crea un', 'crear un',
    'programa', 'programar', 'programame',
    'bloque', 'bloques',
    'script', 'scripts',
    'código', 'codigo',
    'mueve', 'mover', 'movimiento',
    'dibuja', 'dibujar',
    'repite', 'repetir',
    'pon', 'coloca', 'colocar',
    'añade', 'agrega', 'agregar', 'añadir', 'agregar',
    'gira', 'girar',
    'cambia', 'cambiar',
    'desliza', 'deslizar',
    'envía', 'enviar',
    'mostrar', 'ocultar',
    'make', 'create', 'build', 'write',
    'move', 'draw', 'repeat',
    'say', 'show', 'hide',
    'turn', 'glide', 'change',
    'add', 'remove', 'delete',
    'calculadora', 'calc', 'cuenta', 'contar',
    'juego', 'jugar', 'game',
    'animación', 'animacion', 'historia',
    'rebot', 'bounce', 'rebote',
    'carrera', 'race', 'competencia',
    'laberinto', 'maze',
    'pelota', 'ball',
    'nave', 'ship', 'space',
    'piso', 'platform', 'plataforma',
    'dispar', 'shoot', 'bullet'
];

var BLOCK_PATTERNS = [
    /haz (que|un|una|lo|me)/i,
    /crea (un|una|me)/i,
    /necesito (un|que|ayuda)/i,
    /quiero (que|un|una|hacer|aprender)/i,
    /puedes (hacer|crear|poner|colocar|programar)/i,
    /hace (que|un|una)/i,
    /programa (que|para|un|una)/i,
    /bloque (que|para|de|con)/i,
    /clon(ar|es)/i,
    /sonido|música|musica|tocar|reproducir|nota/i,
    /preguntar|responder|respuesta/i,
    /variable|contador|puntaje|score|puntos/i,
    /lista|listas/i,
    /timer|cronómetro|cronometro|tiempo|segundo/i,
    /tecla|presionar|presiona|teclado/i,
    /sensor|sensar|detectar|tocando|touching/i,
    /calculadora|calc|cuenta|suma|resta|multiplica|divide|operacion/i,
    /juego|jugar|game|jugador/i,
    /animacion|animación|historia|cuento/i,
    /pelota|bola|rebot|bounce|rebote/i,
    /nave|space|espacio|dispar|shoot|bala/i,
    /laberinto|maze|plataforma|platform|piso|saltar|jump/i,
    /dibujar|pintar|lapiz|lápiz|pen/i,
    /movimient|mover|caminar|andar/i,
    // English patterns
    /make (a|the|it|sprite|cat|game|calc)/i,
    /create (a|the|script|block|game|program)/i,
    /program (to|that|the|a)/i,
    /write (a|the|code|script)/i,
    /build (a|the)/i,
    /how (to|can|do|would)/i
];

function isBlockRequest(text) {
    if (!text) return false;

    var lower = text.toLowerCase();

    // Check patterns first (more specific)
    for (var pi = 0; pi < BLOCK_PATTERNS.length; pi++) {
        if (BLOCK_PATTERNS[pi].test(text)) return true;
    }

    // Check individual keywords
    var words = lower.split(/[\s,.;!?]+/);
    for (var wi = 0; wi < words.length; wi++) {
        for (var ki = 0; ki < BLOCK_KEYWORDS.length; ki++) {
            if (words[wi] === BLOCK_KEYWORDS[ki]) return true;
        }
    }

    return false;
}

export {
    parse,
    extractScratchblocksText,
    isValidOpcode,
    getBlockMeta,
    BLOCK_INDEX,
    isBlockRequest
};
