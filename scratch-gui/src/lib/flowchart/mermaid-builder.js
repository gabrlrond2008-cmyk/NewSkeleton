/*
 * Builds a mermaid flowchart string from a parsed blockMap/topBlocks structure,
 * or directly from the raw AI message content.
 */
import {parse} from '../ai-block-descriptor';
import {opcodeLabel} from './opcode-labels';

var DECISION = {
    control_if: 1,
    control_if_else: 1,
    control_repeat: 2,
    control_forever: 2,
    control_forever2: 2,
    control_repeat_until: 2,
    control_while: 2
};

var LABEL_FIELDS = {
    motion_movesteps: ['STEPS'],
    motion_turnright: ['DEGREES'],
    motion_turnleft: ['DEGREES'],
    motion_gotoxy: ['X', 'Y'],
    motion_glideto: ['X', 'Y'],
    motion_glidesecstoxy: ['SECS', 'X', 'Y'],
    motion_pointindirection: ['DIRECTION'],
    motion_changexby: ['DX'],
    motion_changeyby: ['DY'],
    motion_setx: ['X'],
    motion_sety: ['Y'],
    looks_say: ['SEEMS'],
    looks_sayforsecs: ['SEEMS', 'SECS'],
    looks_think: ['THINK'],
    looks_thinkforsecs: ['THINK', 'SECS'],
    looks_changeeffectby: ['EFFECT'],
    looks_seteffectto: ['EFFECT'],
    looks_changesizeby: ['CHANGE'],
    looks_setsizeto: ['SIZE'],
    control_wait: ['DURATION'],
    control_repeat: ['TIMES'],
    event_whenkeypressed: ['KEY_OPTION'],
    event_whenbroadcastreceived: ['CHOICE'],
    event_broadcast: ['BROADCAST_INPUT'],
    event_broadcastandwait: ['BROADCAST_INPUT'],
    data_setvariableto: ['VARIABLE', 'VALUE'],
    data_changevariableby: ['VARIABLE', 'VALUE'],
    data_showvariable: ['VARIABLE'],
    data_hidevariable: ['VARIABLE'],
    motion_setrotationstyle: ['STYLE'],
    looks_gotofrontback: ['FRONT_BACK'],
    sensing_setdragmode: ['DRAG_MODE'],
    control_create_clone_of: ['CLONE_OPTION'],
    sound_play: ['SOUND_MENU'],
    sound_playuntildone: ['SOUND_MENU']
};

function esc(text) {
    return String(text === undefined || text === null ? '' : text)
        .replace(/"/g, "'")
        .replace(/[\r\n\t]+/g, ' ')
        .trim();
}

function shadowValue(blockMap, block, inputName) {
    var inp = block.inputs[inputName];
    if (!inp) return null;
    if (inp.block && blockMap[inp.block]) {
        var real = blockMap[inp.block];
        if (!real.shadow) return null;
    }
    var shId = inp.shadow || inp.block;
    var sh = blockMap[shId];
    if (!sh) return null;
    var keys = Object.keys(sh.fields || {});
    return keys.length ? sh.fields[keys[0]].value : null;
}

function formatCondition(blockMap, condId) {
    if (!condId || !blockMap[condId]) return '';
    var b = blockMap[condId];
    if (b.opcode === 'operator_equals') {
        return getVal(blockMap, b, 'OPERAND1') + ' = ' + getVal(blockMap, b, 'OPERAND2');
    }
    if (b.opcode === 'operator_gt') {
        return getVal(blockMap, b, 'OPERAND1') + ' > ' + getVal(blockMap, b, 'OPERAND2');
    }
    if (b.opcode === 'operator_lt') {
        return getVal(blockMap, b, 'OPERAND1') + ' < ' + getVal(blockMap, b, 'OPERAND2');
    }
    if (b.opcode === 'operator_and') {
        return formatCondition(blockMap, b.inputs.OPERAND1 && b.inputs.OPERAND1.block) + ' Y ' + formatCondition(blockMap, b.inputs.OPERAND2 && b.inputs.OPERAND2.block);
    }
    if (b.opcode === 'operator_or') {
        return formatCondition(blockMap, b.inputs.OPERAND1 && b.inputs.OPERAND1.block) + ' O ' + formatCondition(blockMap, b.inputs.OPERAND2 && b.inputs.OPERAND2.block);
    }
    if (b.opcode === 'operator_not') {
        return 'NO (' + formatCondition(blockMap, b.inputs.OPERAND && b.inputs.OPERAND.block) + ')';
    }
    if (b.opcode === 'sensing_keypressed') {
        return 'tecla ' + (b.fields.KEY_OPTION ? b.fields.KEY_OPTION.value : shadowValue(blockMap, b, 'KEY_OPTION')) + ' presionada';
    }
    if (b.opcode === 'sensing_touchingobject') {
        return 'tocando ' + shadowValue(blockMap, b, 'TOUCHINGOBJECTMENU');
    }
    return opcodeLabel(b.opcode);
}

function getVal(blockMap, block, inputName) {
    if (!block || !block.inputs[inputName]) return '?';
    var inp = block.inputs[inputName];
    if (inp.block && blockMap[inp.block]) {
        var child = blockMap[inp.block];
        if (!child.shadow) {
            if (child.opcode === 'sensing_answer') return 'respuesta';
            if (child.opcode === 'data_variable') return child.fields.VARIABLE ? child.fields.VARIABLE.value : 'variable';
            return formatCondition(blockMap, child.id) || opcodeLabel(child.opcode);
        }
    }
    var val = shadowValue(blockMap, block, inputName);
    return val !== null && val !== undefined ? String(val) : '?';
}

function labelFor(blockMap, block, locale) {
    var base = opcodeLabel(block.opcode, locale);

    // Extract condition text for decision blocks
    if (DECISION[block.opcode]) {
        var condId = block.inputs.CONDITION && block.inputs.CONDITION.block;
        var condText = condId ? formatCondition(blockMap, condId) : '';
        if (condText) return base + ' (' + esc(condText) + ')';
    }

    var fieldKeys = LABEL_FIELDS[block.opcode];
    if (!fieldKeys) return base;
    var parts = [];
    for (var i = 0; i < fieldKeys.length; i++) {
        var key = fieldKeys[i];
        var val = null;
        if (block.fields[key]) {
            val = block.fields[key].value;
        } else {
            val = shadowValue(blockMap, block, key);
        }
        if (val !== null && val !== undefined && val !== '') {
            parts.push(esc(val));
        }
    }
    return parts.length ? base + ' (' + parts.join(', ') + ')' : base;
}

function buildMermaid(parsed, locale) {
    if (!parsed || !parsed.blockMap || !parsed.topBlocks || parsed.topBlocks.length === 0) return null;
    var blockMap = parsed.blockMap;
    var topBlocks = parsed.topBlocks;
    var lines = ['flowchart TD'];
    var nodeIds = {};
    var edges = [];
    var createdNodes = {};

    function nodeId(blockId) {
        if (!nodeIds[blockId]) {
            nodeIds[blockId] = 'n' + (Object.keys(nodeIds).length + 1);
        }
        return nodeIds[blockId];
    }

    function addNode(blockId) {
        var id = nodeId(blockId);
        if (!createdNodes[id]) {
            var label = labelFor(blockMap, blockMap[blockId], locale);
            lines.push('  ' + id + '["' + label + '"]');
            createdNodes[id] = true;
        }
        return id;
    }

    function addEdge(from, to, label) {
        if (!from || !to || from === to) return;
        edges.push({from: from, to: to, label: label || null});
    }

    // Returns {first, last}: first node id of the chain starting at blockId,
    // last node id reached at the end of that chain.
    function walkChain(blockId, prevId, labelOnEdge) {
        var block = blockMap[blockId];
        if (!block) return {first: prevId, last: prevId};
        var myId = addNode(blockId);
        if (prevId) addEdge(prevId, myId, labelOnEdge);
        var first = myId;
        var last = myId;
        var dec = DECISION[block.opcode];

        if (dec === 1) {
            var yesId = block.inputs.SUBSTACK && block.inputs.SUBSTACK.block;
            var noId = block.inputs.SUBSTACK2 && block.inputs.SUBSTACK2.block;
            var yesRes = yesId ? walkChain(yesId, myId, 'Sí') : {first: myId, last: myId};
            var noRes = noId ? walkChain(noId, myId, 'No') : null;
            var nextRes = block.next ? walkChain(block.next, null, null) : null;
            var nextFirst = nextRes ? nextRes.first : null;
            if (nextFirst) {
                if (yesRes.last && yesRes.last !== nextFirst) addEdge(yesRes.last, nextFirst, null);
                if (noRes && noRes.last && noRes.last !== nextFirst) addEdge(noRes.last, nextFirst, null);
                if (!noRes) addEdge(myId, nextFirst, 'No');
            }
            return {first: first, last: nextRes ? nextRes.last : (noRes ? noRes.last : yesRes.last)};
        }

        if (dec === 2) {
            var bodyId = block.inputs.SUBSTACK && block.inputs.SUBSTACK.block;
            var bodyRes = bodyId ? walkChain(bodyId, myId, 'Repetir') : {first: myId, last: myId};
            if (bodyRes.last && bodyRes.last !== myId) addEdge(bodyRes.last, myId, null);
            if (block.opcode === 'control_forever' || block.opcode === 'control_forever2') {
                return {first: first, last: myId};
            }
            var nextRes2 = block.next ? walkChain(block.next, null, null) : null;
            if (nextRes2 && nextRes2.first && nextRes2.first !== myId) {
                addEdge(myId, nextRes2.first, 'Fin bucle');
            }
            return {first: first, last: nextRes2 ? nextRes2.last : myId};
        }

        if (block.next) {
            var res = walkChain(block.next, myId, null);
            return {first: first, last: res.last};
        }
        return {first: first, last: myId};
    }

    for (var t = 0; t < topBlocks.length; t++) {
        walkChain(topBlocks[t].id, null, null);
    }

    for (var e = 0; e < edges.length; e++) {
        var ed = edges[e];
        if (ed.label) {
            lines.push('  ' + ed.from + ' -->|' + ed.label + '| ' + ed.to);
        } else {
            lines.push('  ' + ed.from + ' --> ' + ed.to);
        }
    }
    return lines.join('\n');
}

function buildMermaidFromContent(content, locale) {
    var text = String(content || '');
    if (!text) return null;
    var parsed = null;
    try {
        parsed = parse(text);
    } catch (e) {
        parsed = null;
    }
    if (!parsed || parsed.topBlocks.length === 0) return null;
    return buildMermaid(parsed, locale);
}

export {buildMermaid, buildMermaidFromContent};