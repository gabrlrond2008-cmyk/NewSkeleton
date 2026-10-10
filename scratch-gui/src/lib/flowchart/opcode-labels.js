/*
 * Human readable labels for Scratch opcodes, used to render project flowcharts.
 */
var LABELS = {
    event_whenflagclicked: {es: 'al presionar bandera', en: 'when flag clicked'},
    event_whenkeypressed: {es: 'al presionar tecla', en: 'when key pressed'},
    event_whenthisspriteclicked: {es: 'al hacer clic en este objeto', en: 'when this sprite clicked'},
    event_whenbackdropswitchesto: {es: 'cuando el escenario cambie a', en: 'when backdrop switches to'},
    event_whenbroadcastreceived: {es: 'al recibir mensaje', en: 'when I receive'},
    event_whenstageclicked: {es: 'al hacer clic en el escenario', en: 'when stage clicked'},
    event_whenclonecreated: {es: 'al crear un clon', en: 'when I start as a clone'},
    event_broadcast: {es: 'enviar mensaje', en: 'broadcast'},
    event_broadcastandwait: {es: 'enviar mensaje y esperar', en: 'broadcast and wait'},
    control_start_as_clone: {es: 'al iniciar como clon', en: 'when I start as a clone'},

    motion_movesteps: {es: 'mover', en: 'move'},
    motion_turnright: {es: 'girar a la derecha', en: 'turn right'},
    motion_turnleft: {es: 'girar a la izquierda', en: 'turn left'},
    motion_gotoxy: {es: 'ir a x y', en: 'go to x y'},
    motion_goto: {es: 'ir a', en: 'go to'},
    motion_glideto: {es: 'deslizar a x y', en: 'glide to x y'},
    motion_glidesecstoxy: {es: 'deslizar en segundos a', en: 'glide secs to'},
    motion_pointindirection: {es: 'apuntar en dirección', en: 'point in direction'},
    motion_pointtowards: {es: 'apuntar hacia', en: 'point towards'},
    motion_changexby: {es: 'cambiar x por', en: 'change x by'},
    motion_changeyby: {es: 'cambiar y por', en: 'change y by'},
    motion_setx: {es: 'fijar x', en: 'set x'},
    motion_sety: {es: 'fijar y', en: 'set y'},
    motion_ifonedgebounce: {es: 'rebotar si toca un borde', en: 'if on edge, bounce'},
    motion_setrotationstyle: {es: 'fijar estilo de rotación', en: 'set rotation style'},

    looks_say: {es: 'decir', en: 'say'},
    looks_sayforsecs: {es: 'decir por segundos', en: 'say for secs'},
    looks_think: {es: 'pensar', en: 'think'},
    looks_thinkforsecs: {es: 'pensar por segundos', en: 'think for secs'},
    looks_show: {es: 'mostrar', en: 'show'},
    looks_hide: {es: 'esconder', en: 'hide'},
    looks_switchcostumeto: {es: 'cambiar disfraz a', en: 'switch costume to'},
    looks_switchbackdropto: {es: 'cambiar fondo a', en: 'switch backdrop to'},
    looks_nextcostume: {es: 'siguiente disfraz', en: 'next costume'},
    looks_nextbackdrop: {es: 'siguiente fondo', en: 'next backdrop'},
    looks_changeeffectby: {es: 'cambiar efecto por', en: 'change effect by'},
    looks_seteffectto: {es: 'fijar efecto a', en: 'set effect to'},
    looks_cleargraphiceffects: {es: 'quitar efectos gráficos', en: 'clear graphic effects'},
    looks_changesizeby: {es: 'cambiar tamaño por', en: 'change size by'},
    looks_setsizeto: {es: 'fijar tamaño a', en: 'set size to'},
    looks_gotofrontback: {es: 'ir a frente/atrás', en: 'go to front/back'},

    sound_play: {es: 'reproducir sonido', en: 'play sound'},
    sound_playuntildone: {es: 'reproducir sonido hasta terminar', en: 'play sound until done'},
    sound_stopallsounds: {es: 'detener todos los sonidos', en: 'stop all sounds'},
    sound_changevolumeby: {es: 'cambiar volumen por', en: 'change volume by'},
    sound_setvolumeto: {es: 'fijar volumen a', en: 'set volume to'},

    control_wait: {es: 'esperar', en: 'wait'},
    control_repeat: {es: 'repetir', en: 'repeat'},
    control_forever: {es: 'por siempre', en: 'forever'},
    control_if: {es: 'si', en: 'if'},
    control_if_else: {es: 'si / si no', en: 'if / else'},
    control_repeat_until: {es: 'repetir hasta que', en: 'repeat until'},
    control_while: {es: 'mientras', en: 'while'},
    control_stop: {es: 'detener', en: 'stop'},
    control_create_clone_of: {es: 'crear clon de', en: 'create clone of'},
    control_delete_this_clone: {es: 'eliminar este clon', en: 'delete this clone'},
    control_forever2: {es: 'por siempre (2)', en: 'forever (2)'},

    sensing_touchingobject: {es: '¿tocando?', en: 'touching?'},
    sensing_touchingcolor: {es: '¿tocando color?', en: 'touching color?'},
    sensing_keypressed: {es: '¿tecla presionada?', en: 'key pressed?'},
    sensing_mousedown: {es: '¿ratón presionado?', en: 'mouse down?'},
    sensing_current: {es: 'fecha actual', en: 'current'},
    sensing_loudness: {es: 'volumen del sonido', en: 'loudness'},
    sensing_of: {es: 'de', en: 'of'},

    operators_add: {es: '+', en: '+'},
    operators_subtract: {es: '-', en: '-'},
    operators_multiply: {es: '×', en: '×'},
    operators_divide: {es: '÷', en: '÷'},
    operators_lt: {es: '<', en: '<'},
    operators_gt: {es: '>', en: '>'},
    operators_equals: {es: '=', en: '='},
    operators_and: {es: 'y', en: 'and'},
    operators_or: {es: 'o', en: 'or'},
    operators_not: {es: 'no', en: 'not'},
    operators_random: {es: 'número aleatorio', en: 'random'},
    operators_join: {es: 'unir', en: 'join'},
    operators_letter_of: {es: 'letra de', en: 'letter of'},
    operators_length: {es: 'longitud de', en: 'length of'},
    operators_mod: {es: 'mod', en: 'mod'},

    data_setvariableto: {es: 'fijar variable a', en: 'set variable to'},
    data_changevariableby: {es: 'cambiar variable por', en: 'change variable by'},
    data_showvariable: {es: 'mostrar variable', en: 'show variable'},
    data_hidevariable: {es: 'esconder variable', en: 'hide variable'},
    data_addtolist: {es: 'añadir a lista', en: 'add to list'},
    data_deleteoflist: {es: 'borrar de lista', en: 'delete of list'},
    data_insertatlist: {es: 'insertar en lista', en: 'insert at list'},
    data_replaceitemoflist: {es: 'reemplazar de lista', en: 'replace item of list'},
    data_showlist: {es: 'mostrar lista', en: 'show list'},
    data_hidelist: {es: 'esconder lista', en: 'hide list'},

    music_playdrumforbeats: {es: 'tocar tambor', en: 'play drum'},
    pen_clear: {es: 'borrar lápiz', en: 'clear'},
    pen_pendown: {es: 'bajar lápiz', en: 'pen down'},
    pen_penup: {es: 'subir lápiz', en: 'pen up'},
    pen_setpencolortocolor: {es: 'fijar color de lápiz', en: 'set pen color'},
    pen_setpensizeto: {es: 'fijar grosor de lápiz', en: 'set pen size'}
};

function prettify(opcode) {
    var parts = String(opcode || '').split('_').slice(1);
    return parts.join(' ') || opcode;
}

function opcodeLabel(opcode, locale) {
    var entry = LABELS[opcode];
    if (entry) return entry[locale === 'en' ? 'en' : 'es'];
    return prettify(opcode);
}

export {opcodeLabel};