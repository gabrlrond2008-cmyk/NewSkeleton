function extractOpcodes(descriptor) {
    if (!descriptor || descriptor === '(sin estructura @bloques)') return [];
    var opcodes = [];
    var lines = descriptor.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || line.charAt(0) === '#') continue;
        var match = line.match(/^>?(\w+)/);
        if (match) {
            var op = match[1];
            if (op.indexOf('_') > 0 && op !== 'template' && op !== 'params') {
                opcodes.push(op);
            }
        }
    }
    return opcodes;
}

var CAT_NAMES = {
    hat:'hat', c:'c-block', motion:'movimiento', looks:'apariencia',
    sound:'sonido', control:'control', sensing:'sensores',
    operators:'operadores', data:'datos', end:'end'
};

function categorizeOpcodes(opcodes) {
    var cats = {};
    for (var i = 0; i < opcodes.length; i++) {
        var op = opcodes[i];
        if (op.indexOf('event_when') === 0 || op === 'control_start_as_clone') cats.hat = (cats.hat || 0) + 1;
        if (op === 'control_repeat' || op === 'control_forever' || op === 'control_if' || op === 'control_if_else' || op === 'control_repeat_until') cats.c = (cats.c || 0) + 1;
        if (op === 'control_stop' || op === 'control_delete_this_clone') cats.end = (cats.end || 0) + 1;
        if (op.indexOf('motion_') === 0) cats.motion = (cats.motion || 0) + 1;
        if (op.indexOf('looks_') === 0) cats.looks = (cats.looks || 0) + 1;
        if (op.indexOf('sound_') === 0) cats.sound = (cats.sound || 0) + 1;
        if (op.indexOf('control_') === 0 && !cats.c && !cats.end) cats.control = (cats.control || 0) + 1;
        if (op.indexOf('sensing_') === 0) cats.sensing = (cats.sensing || 0) + 1;
        if (op.indexOf('operator_') === 0) cats.operators = (cats.operators || 0) + 1;
        if (op.indexOf('data_') === 0) cats.data = (cats.data || 0) + 1;
    }
    return cats;
}

function descriptorToStructure(descriptor) {
    if (!descriptor || descriptor === '(sin estructura @bloques)') return '';
    var lines = descriptor.split('\n');
    var parts = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || line.charAt(0) === '#') continue;
        var simplified = line.replace(/"([^"]*)"/g, function(m, c) { return c.length > 8 ? '"..."' : m; });
        simplified = simplified.replace(/\b(\d+)\b/g, 'N');
        parts.push(simplified);
    }
    return parts.join(' | ');
}

function jaccardSimilarity(aOpcodes, bOpcodes) {
    if (aOpcodes.length === 0 && bOpcodes.length === 0) return 1;
    var union = {};
    var inter = 0;
    for (var i = 0; i < aOpcodes.length; i++) union[aOpcodes[i]] = 1;
    for (var j = 0; j < bOpcodes.length; j++) {
        if (union[bOpcodes[j]]) inter++;
        else union[bOpcodes[j]] = 1;
    }
    return inter / Object.keys(union).length;
}

function scoreExample(example, allOpcodesList) {
    var opcodes = extractOpcodes(example.desc || '');
    var score = 0;

    score += Math.min(opcodes.length / 20, 1) * 3;

    var maxSim = 0;
    for (var i = 0; i < allOpcodesList.length; i++) {
        if (allOpcodesList[i] === opcodes) continue;
        var sim = jaccardSimilarity(opcodes, allOpcodesList[i]);
        if (sim > maxSim) maxSim = sim;
    }
    score += (1 - maxSim) * 4;

    if (example.desc && example.desc !== '(sin estructura @bloques)') score += 2;

    if (example.verified) score += 2;

    if (example.date) {
        var age = Date.now() - new Date(example.date).getTime();
        var days = age / 86400000;
        score += Math.max(0, 1 - days / 14) * 1;
    }

    return score;
}

function selectDiverse(examples, maxCount) {
    if (!examples || examples.length === 0) return [];
    if (examples.length <= maxCount) return examples;

    var opcodesList = examples.map(function(e) { return extractOpcodes(e.desc || ''); });

    var scored = examples.map(function(ex, idx) {
        return {ex: ex, score: scoreExample(ex, opcodesList), idx: idx};
    });
    scored.sort(function(a, b) { return b.score - a.score; });

    return scored.slice(0, maxCount).map(function(s) { return s.ex; });
}

function generateOptimizedPrompt(examples) {
    if (!examples || examples.length === 0) return '';

    var diverse = selectDiverse(examples, 5);
    var allOpcodes = [];
    var catCounts = {};
    var opFreq = {};

    for (var i = 0; i < diverse.length; i++) {
        var opcodes = extractOpcodes(diverse[i].desc || '');
        allOpcodes = allOpcodes.concat(opcodes);
        var cats = categorizeOpcodes(opcodes);
        for (var cat in cats) {
            catCounts[cat] = (catCounts[cat] || 0) + cats[cat];
        }
        for (var j = 0; j < opcodes.length; j++) {
            opFreq[opcodes[j]] = (opFreq[opcodes[j]] || 0) + 1;
        }
    }

    var lines = [];
    lines.push('=== ENTRENAMIENTO (' + diverse.length + '/' + examples.length + ' ejemplos) ===');

    var activeCats = [];
    for (var cat in CAT_NAMES) {
        if (catCounts[cat]) activeCats.push(CAT_NAMES[cat] + ': ' + catCounts[cat]);
    }
    if (activeCats.length > 0) {
        lines.push('Categorías usadas: ' + activeCats.join(', '));
    }

    var topOpcodes = Object.keys(opFreq).sort(function(a, b) { return opFreq[b] - opFreq[a]; }).slice(0, 8);
    if (topOpcodes.length > 0) {
        lines.push('Opcodes frecuentes: ' + topOpcodes.join(', '));
    }

    for (var k = 0; k < diverse.length; k++) {
        var ex = diverse[k];
        var structure = descriptorToStructure(ex.desc || '');
        if (structure) {
            lines.push('• "' + ex.user.substring(0, 50) + '" → ' + structure);
        } else {
            lines.push('• "' + ex.user.substring(0, 50) + '" (sin estructura)');
        }
    }

    lines.push('');
    return lines.join('\n');
}

function compressExamples(examples, maxCount) {
    if (!examples || examples.length <= maxCount) return examples;
    return selectDiverse(examples, maxCount);
}

function TrainingEngine() {
    this.examples = [];
    this.opFreq = {};
    this.catCounts = {};
}

TrainingEngine.prototype.addExample = function(userMsg, descriptor, isVerified) {
    var entry = {
        user: userMsg,
        desc: descriptor || '(sin estructura @bloques)',
        date: new Date().toISOString(),
        verified: !!isVerified
    };
    this.examples.push(entry);

    var opcodes = extractOpcodes(descriptor || '');
    for (var i = 0; i < opcodes.length; i++) {
        this.opFreq[opcodes[i]] = (this.opFreq[opcodes[i]] || 0) + 1;
    }
    var cats = categorizeOpcodes(opcodes);
    for (var cat in cats) {
        this.catCounts[cat] = (this.catCounts[cat] || 0) + cats[cat];
    }

    return entry;
};

TrainingEngine.prototype.getPrompt = function() {
    return generateOptimizedPrompt(this.examples);
};

TrainingEngine.prototype.getCompressed = function(maxCount) {
    return compressExamples(this.examples, maxCount || 10);
};

TrainingEngine.prototype.getAll = function() {
    return this.examples;
};

TrainingEngine.prototype.loadFromStorage = function(entries) {
    if (!entries || !Array.isArray(entries)) return;
    this.examples = entries.slice();
    for (var i = 0; i < entries.length; i++) {
        var opcodes = extractOpcodes(entries[i].desc || '');
        for (var j = 0; j < opcodes.length; j++) {
            this.opFreq[opcodes[j]] = (this.opFreq[opcodes[j]] || 0) + 1;
        }
        var cats = categorizeOpcodes(opcodes);
        for (var cat in cats) {
            this.catCounts[cat] = (this.catCounts[cat] || 0) + cats[cat];
        }
    }
};

export {
    TrainingEngine,
    extractOpcodes, categorizeOpcodes, descriptorToStructure,
    generateOptimizedPrompt, selectDiverse, compressExamples
};
