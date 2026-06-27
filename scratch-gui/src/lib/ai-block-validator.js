var OPCODES = {
    event_whenflagclicked: 'hat', event_whenkeypressed: 'hat', event_whenstageclicked: 'hat',
    event_whenthisspriteclicked: 'hat', event_whenbackdropswitchesto: 'hat',
    event_whengreaterthan: 'hat', event_whenbroadcastreceived: 'hat', control_start_as_clone: 'hat',
    event_broadcast: 'stack', event_broadcastandwait: 'stack',
    motion_movesteps: 'stack', motion_turnright: 'stack', motion_turnleft: 'stack',
    motion_goto: 'stack', motion_gotoxy: 'stack', motion_glideto: 'stack',
    motion_glidesecstoxy: 'stack', motion_pointindirection: 'stack', motion_pointtowards: 'stack',
    motion_changexby: 'stack', motion_setx: 'stack', motion_changeyby: 'stack', motion_sety: 'stack',
    motion_ifonedgebounce: 'stack', motion_setrotationstyle: 'stack',
    motion_xposition: 'reporter', motion_yposition: 'reporter', motion_direction: 'reporter',
    looks_sayforsecs: 'stack', looks_say: 'stack', looks_thinkforsecs: 'stack', looks_think: 'stack',
    looks_switchcostumeto: 'stack', looks_nextcostume: 'stack',
    looks_switchbackdropto: 'stack', looks_switchbackdroptoandwait: 'stack', looks_nextbackdrop: 'stack',
    looks_changesizeby: 'stack', looks_setsizeto: 'stack',
    looks_changeeffectby: 'stack', looks_seteffectto: 'stack', looks_cleargraphiceffects: 'stack',
    looks_show: 'stack', looks_hide: 'stack', looks_gotofrontback: 'stack',
    looks_goforwardbackwardlayers: 'stack',
    looks_costumenumbername: 'reporter', looks_backdropnumbername: 'reporter', looks_size: 'reporter',
    sound_playuntildone: 'stack', sound_play: 'stack', sound_stopallsounds: 'stack',
    sound_changeeffectby: 'stack', sound_seteffectto: 'stack', sound_cleareffects: 'stack',
    sound_changevolumeby: 'stack', sound_setvolumeto: 'stack', sound_volume: 'reporter',
    control_wait: 'stack', control_repeat: 'c', control_forever: 'c',
    control_if: 'c', control_if_else: 'c', control_wait_until: 'stack',
    control_repeat_until: 'c', control_stop: 'end', control_create_clone_of: 'stack',
    control_delete_this_clone: 'end',
    sensing_touchingobject: 'boolean', sensing_touchingcolor: 'boolean',
    sensing_coloristouchingcolor: 'boolean', sensing_distanceto: 'reporter',
    sensing_askandwait: 'stack', sensing_answer: 'reporter', sensing_keypressed: 'boolean',
    sensing_mousedown: 'boolean', sensing_mousex: 'reporter', sensing_mousey: 'reporter',
    sensing_setdragmode: 'stack', sensing_loudness: 'reporter', sensing_timer: 'reporter',
    sensing_resettimer: 'stack', sensing_of: 'reporter', sensing_current: 'reporter',
    sensing_dayssince2000: 'reporter', sensing_username: 'reporter',
    operator_add: 'reporter', operator_subtract: 'reporter', operator_multiply: 'reporter',
    operator_divide: 'reporter', operator_random: 'reporter',
    operator_gt: 'boolean', operator_lt: 'boolean', operator_equals: 'boolean',
    operator_and: 'boolean', operator_or: 'boolean', operator_not: 'boolean',
    operator_join: 'reporter', operator_letter_of: 'reporter', operator_length: 'reporter',
    operator_contains: 'boolean', operator_mod: 'reporter', operator_round: 'reporter',
    operator_mathop: 'reporter',
    data_variable: 'reporter', data_setvariableto: 'stack', data_changevariableby: 'stack',
    data_showvariable: 'stack', data_hidevariable: 'stack',
    data_addtolist: 'stack', data_deleteoflist: 'stack', data_deletealloflist: 'stack',
    data_insertatlist: 'stack', data_replaceitemoflist: 'stack',
    data_itemoflist: 'reporter', data_itemnumoflist: 'reporter',
    data_lengthoflist: 'reporter', data_listcontainsitem: 'boolean',
    data_showlist: 'stack', data_hidelist: 'stack',
    pen_clear: 'stack', pen_stamp: 'stack', pen_penDown: 'stack', pen_penUp: 'stack',
    pen_setPenColorToColor: 'stack', pen_changePenColorParamBy: 'stack',
    pen_setPenColorParamTo: 'stack', pen_changePenSizeBy: 'stack', pen_setPenSizeTo: 'stack',
    music_playDrumForBeats: 'stack', music_restForBeats: 'stack',
    music_playNoteForBeats: 'stack', music_setInstrument: 'stack',
    music_setTempo: 'stack', music_changeTempo: 'stack', music_getTempo: 'reporter',
    math_number: 'reporter', text: 'reporter', boolean: 'boolean', colour_picker: 'reporter',
    looks_backdrops: 'reporter', event_broadcast_menu: 'reporter', motion_goto_menu: 'reporter',
    motion_glideto_menu: 'reporter', motion_pointtowards_menu: 'reporter', looks_costume: 'reporter',
    sound_sounds_menu: 'reporter', control_create_clone_of_menu: 'reporter',
    sensing_touchingobjectmenu: 'reporter', sensing_distancetomenu: 'reporter',
    sensing_keyoptions: 'reporter', sensing_of_object_menu: 'reporter'
};

function validate(blockData) {
    var errors = [];
    var blockMap = blockData.blockMap;
    if (!blockMap) return {valid: true, errors: []};

    var nonShadow = 0;
    for (var id in blockMap) {
        if (!Object.prototype.hasOwnProperty.call(blockMap, id)) continue;
        var b = blockMap[id];
        if (b.shadow) continue;
        nonShadow++;

        var shape = OPCODES[b.opcode];
        if (!shape) {
            errors.push('Bloque desconocido: "' + b.opcode + '" — no existe en Scratch');
            continue;
        }

        if (shape === 'hat' && !b.topLevel) {
            errors.push('Hat "' + b.opcode + '" debe ser top-level (no puede ir después de otro bloque)');
        }

        if (shape === 'end' && b.next) {
            errors.push('End "' + b.opcode + '" no puede tener next (es bloque terminal)');
        }

        if ((shape === 'reporter' || shape === 'boolean') && b.topLevel) {
            errors.push('Reporter/Boolean "' + b.opcode + '" no puede ser top-level (debe ir dentro de otro bloque)');
        }

        if (shape === 'c') {
            var hasStatementChild = false;
            for (var iname in b.inputs) {
                if (b.inputs[iname].block) {
                    hasStatementChild = true;
                    break;
                }
            }
            if (!hasStatementChild) {
                errors.push('C-block "' + b.opcode + '" está vacío (necesita bloques dentro)');
            }
        }
    }

    console.log('[AI Blocks] Validation: ' + nonShadow + ' non-shadow blocks, ' + errors.length + ' errors');
    if (errors.length > 0) console.warn('[AI Blocks] Validation errors:', errors);

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

export {validate, OPCODES};
