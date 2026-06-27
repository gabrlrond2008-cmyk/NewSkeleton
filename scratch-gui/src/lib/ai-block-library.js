var TYPES = {h:'hat',s:'stack',c:'c-block',r:'reporter',b:'boolean',e:'end'};

var BLOCKS = {
    // === EVENTOS (hats + broadcast) ===
    event_whenflagclicked:         {c:'event',t:'h',d:'Bandera verde pulsada'},
    event_whenkeypressed:          {c:'event',t:'h',d:'Tecla presionada',f:['KEY_OPTION']},
    event_whenthisspriteclicked:   {c:'event',t:'h',d:'Clic en este sprite'},
    event_whenstageclicked:        {c:'event',t:'h',d:'Clic en escenario'},
    event_whenbroadcastreceived:   {c:'event',t:'h',d:'Al recibir mensaje',f:['CHOICE']},
    event_whenbackdropswitchesto:  {c:'event',t:'h',d:'Fondo cambia a',f:['BACKDROP']},
    event_whengreaterthan:         {c:'event',t:'h',d:'Sensor > valor',f:['WHENGREATERTHANMENU'],i:['VALUE']},
    control_start_as_clone:        {c:'control',t:'h',d:'Al clonarse'},
    event_broadcast:               {c:'event',t:'s',d:'Enviar mensaje',i:['BROADCAST_INPUT'],f:['CHOICE']},
    event_broadcastandwait:        {c:'event',t:'s',d:'Enviar y esperar',i:['BROADCAST_INPUT'],f:['CHOICE']},

    // === MOVIMIENTO ===
    motion_movesteps:              {c:'motion',t:'s',d:'Mover N pasos',i:['STEPS']},
    motion_turnright:              {c:'motion',t:'s',d:'Girar derecha º',i:['DEGREES']},
    motion_turnleft:               {c:'motion',t:'s',d:'Girar izquierda º',i:['DEGREES']},
    motion_goto:                   {c:'motion',t:'s',d:'Ir a destino',i:['TO']},
    motion_gotoxy:                 {c:'motion',t:'s',d:'Ir a X,Y',i:['X','Y']},
    motion_glideto:                {c:'motion',t:'s',d:'Deslizar a destino',i:['TO']},
    motion_glidesecstoxy:          {c:'motion',t:'s',d:'Deslizar X,Y en N segs',i:['SECS','X','Y']},
    motion_pointindirection:       {c:'motion',t:'s',d:'Apunta dirección º',i:['DIRECTION']},
    motion_pointtowards:           {c:'motion',t:'s',d:'Apunta hacia',i:['TOWARDS']},
    motion_changexby:              {c:'motion',t:'s',d:'Cambiar X por',i:['DX']},
    motion_setx:                   {c:'motion',t:'s',d:'Fijar X',i:['X']},
    motion_changeyby:              {c:'motion',t:'s',d:'Cambiar Y por',i:['DY']},
    motion_sety:                   {c:'motion',t:'s',d:'Fijar Y',i:['Y']},
    motion_ifonedgebounce:         {c:'motion',t:'s',d:'Rebotar si toca borde'},
    motion_setrotationstyle:       {c:'motion',t:'s',d:'Estilo rotación',f:['STYLE']},
    motion_xposition:              {c:'motion',t:'r',d:'Posición X'},
    motion_yposition:              {c:'motion',t:'r',d:'Posición Y'},
    motion_direction:              {c:'motion',t:'r',d:'Dirección actual'},

    // === APARIENCIA ===
    looks_sayforsecs:              {c:'looks',t:'s',d:'Decir N segs',i:['MESSAGE','SECS']},
    looks_say:                     {c:'looks',t:'s',d:'Decir',i:['MESSAGE']},
    looks_thinkforsecs:            {c:'looks',t:'s',d:'Pensar N segs',i:['MESSAGE','SECS']},
    looks_think:                   {c:'looks',t:'s',d:'Pensar',i:['MESSAGE']},
    looks_switchcostumeto:         {c:'looks',t:'s',d:'Cambiar disfraz a',f:['COSTUME']},
    looks_nextcostume:             {c:'looks',t:'s',d:'Siguiente disfraz'},
    looks_switchbackdropto:        {c:'looks',t:'s',d:'Cambiar fondo a',f:['BACKDROP']},
    looks_switchbackdroptoandwait: {c:'looks',t:'s',d:'Cambiar fondo y esperar',f:['BACKDROP']},
    looks_nextbackdrop:            {c:'looks',t:'s',d:'Siguiente fondo'},
    looks_changesizeby:            {c:'looks',t:'s',d:'Cambiar tamaño por',i:['CHANGE']},
    looks_setsizeto:               {c:'looks',t:'s',d:'Fijar tamaño %',i:['SIZE']},
    looks_changeeffectby:          {c:'looks',t:'s',d:'Cambiar efecto',i:['CHANGE'],f:['EFFECT']},
    looks_seteffectto:             {c:'looks',t:'s',d:'Fijar efecto',i:['VALUE'],f:['EFFECT']},
    looks_cleargraphiceffects:     {c:'looks',t:'s',d:'Quitar efectos'},
    looks_show:                    {c:'looks',t:'s',d:'Mostrar'},
    looks_hide:                    {c:'looks',t:'s',d:'Ocultar'},
    looks_gotofrontback:           {c:'looks',t:'s',d:'Ir al frente/fondo',f:['FRONT_BACK']},
    looks_goforwardbackwardlayers: {c:'looks',t:'s',d:'Avanzar/retroceder capas',i:['NUM'],f:['FORWARD_BACKWARD']},
    looks_costumenumbername:       {c:'looks',t:'r',d:'Nº o nombre disfraz',f:['NUMBER_NAME']},
    looks_backdropnumbername:      {c:'looks',t:'r',d:'Nº o nombre fondo',f:['NUMBER_NAME']},
    looks_size:                    {c:'looks',t:'r',d:'Tamaño actual'},

    // === SONIDO ===
    sound_playuntildone:           {c:'sound',t:'s',d:'Reproducir y esperar',f:['SOUND_MENU']},
    sound_play:                    {c:'sound',t:'s',d:'Reproducir sonido',f:['SOUND_MENU']},
    sound_stopallsounds:           {c:'sound',t:'s',d:'Detener todos'},
    sound_changeeffectby:          {c:'sound',t:'s',d:'Cambiar efecto',i:['VALUE'],f:['EFFECT']},
    sound_seteffectto:             {c:'sound',t:'s',d:'Fijar efecto',i:['VALUE'],f:['EFFECT']},
    sound_cleareffects:            {c:'sound',t:'s',d:'Quitar efectos'},
    sound_changevolumeby:          {c:'sound',t:'s',d:'Subir/bajar volumen',i:['VOLUME']},
    sound_setvolumeto:             {c:'sound',t:'s',d:'Fijar volumen %',i:['VOLUME']},
    sound_volume:                  {c:'sound',t:'r',d:'Volumen actual'},

    // === CONTROL ===
    control_wait:                  {c:'control',t:'s',d:'Esperar N segs',i:['DURATION']},
    control_repeat:                {c:'control',t:'c',d:'Repetir N veces',i:['TIMES'],st:['SUBSTACK']},
    control_forever:               {c:'control',t:'c',d:'Por siempre',st:['SUBSTACK']},
    control_if:                    {c:'control',t:'c',d:'Si COND entonces',i:['CONDITION'],st:['SUBSTACK']},
    control_if_else:               {c:'control',t:'c',d:'Si COND si-no',i:['CONDITION'],st:['SUBSTACK','SUBSTACK2']},
    control_wait_until:            {c:'control',t:'s',d:'Esperar hasta COND',i:['CONDITION']},
    control_repeat_until:          {c:'control',t:'c',d:'Repetir hasta COND',i:['CONDITION'],st:['SUBSTACK']},
    control_stop:                  {c:'control',t:'e',d:'Detener script'},
    control_create_clone_of:       {c:'control',t:'s',d:'Crear clon de',f:['CLONE_OPTION']},
    control_delete_this_clone:     {c:'control',t:'e',d:'Borrar este clon'},
    control_start_as_clone:        {c:'control',t:'h',d:'Al clonarse'},

    // === SENSORES ===
    sensing_touchingobject:        {c:'sensing',t:'b',d:'¿Toca objeto?',i:['TOUCHINGOBJECTMENU']},
    sensing_touchingcolor:         {c:'sensing',t:'b',d:'¿Toca color?',i:['COLOR']},
    sensing_coloristouchingcolor:  {c:'sensing',t:'b',d:'¿Color toca color?',i:['COLOR','COLOR2']},
    sensing_distanceto:            {c:'sensing',t:'r',d:'Distancia hasta',i:['DISTANCETOMENU']},
    sensing_askandwait:            {c:'sensing',t:'s',d:'Preguntar y esperar',i:['QUESTION']},
    sensing_answer:                {c:'sensing',t:'r',d:'Respuesta dada'},
    sensing_keypressed:            {c:'sensing',t:'b',d:'¿Tecla presionada?',i:['KEY_OPTION']},
    sensing_mousedown:             {c:'sensing',t:'b',d:'¿Mouse presionado?'},
    sensing_mousex:                {c:'sensing',t:'r',d:'Mouse X'},
    sensing_mousey:                {c:'sensing',t:'r',d:'Mouse Y'},
    sensing_setdragmode:           {c:'sensing',t:'s',d:'Modo arrastre',f:['DRAG_MODE']},
    sensing_loudness:              {c:'sensing',t:'r',d:'Volumen sonido'},
    sensing_timer:                 {c:'sensing',t:'r',d:'Temporizador'},
    sensing_resettimer:            {c:'sensing',t:'s',d:'Reiniciar temporizador'},
    sensing_of:                    {c:'sensing',t:'r',d:'Propiedad de objeto',f:['PROPERTY']},
    sensing_current:               {c:'sensing',t:'r',d:'Fecha/hora actual',f:['CURRENTMENU']},
    sensing_dayssince2000:         {c:'sensing',t:'r',d:'Días desde 2000'},
    sensing_username:              {c:'sensing',t:'r',d:'Nombre de usuario'},

    // === OPERADORES ===
    operator_add:                  {c:'operator',t:'r',d:'Suma NUM1+NUM2',i:['NUM1','NUM2']},
    operator_subtract:             {c:'operator',t:'r',d:'Resta NUM1-NUM2',i:['NUM1','NUM2']},
    operator_multiply:             {c:'operator',t:'r',d:'Multiplica NUM1*NUM2',i:['NUM1','NUM2']},
    operator_divide:               {c:'operator',t:'r',d:'Divide NUM1/NUM2',i:['NUM1','NUM2']},
    operator_random:               {c:'operator',t:'r',d:'Aleatorio FROM-TO',i:['FROM','TO']},
    operator_gt:                   {c:'operator',t:'b',d:'¿NUM1 > NUM2?',i:['OPERAND1','OPERAND2']},
    operator_lt:                   {c:'operator',t:'b',d:'¿NUM1 < NUM2?',i:['OPERAND1','OPERAND2']},
    operator_equals:               {c:'operator',t:'b',d:'¿OPERAND1 = OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_and:                  {c:'operator',t:'b',d:'¿OPERAND1 Y OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_or:                   {c:'operator',t:'b',d:'¿OPERAND1 O OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_not:                  {c:'operator',t:'b',d:'NO OPERAND',i:['OPERAND']},
    operator_join:                 {c:'operator',t:'r',d:'Une STRING1+STRING2',i:['STRING1','STRING2']},
    operator_letter_of:            {c:'operator',t:'r',d:'Letra LETTER de STRING',i:['LETTER','STRING']},
    operator_length:               {c:'operator',t:'r',d:'Largo de STRING',i:['STRING']},
    operator_contains:             {c:'operator',t:'b',d:'¿STRING1 contiene STRING2?',i:['STRING1','STRING2']},
    operator_mod:                  {c:'operator',t:'r',d:'Resto NUM1/NUM2',i:['NUM1','NUM2']},
    operator_round:                {c:'operator',t:'r',d:'Redondear NUM',i:['NUM']},
    operator_mathop:               {c:'operator',t:'r',d:'Operación matemática',i:['NUM']},

    // === VARIABLES Y LISTAS ===
    data_setvariableto:            {c:'data',t:'s',d:'Asignar VARIABLE=VALUE',f:['VARIABLE'],i:['VALUE']},
    data_changevariableby:         {c:'data',t:'s',d:'Cambiar VARIABLE en VALUE',f:['VARIABLE'],i:['VALUE']},
    data_variable:                 {c:'data',t:'r',d:'Valor de VARIABLE',f:['VARIABLE']},
    data_showvariable:             {c:'data',t:'s',d:'Mostrar variable',f:['VARIABLE']},
    data_hidevariable:             {c:'data',t:'s',d:'Ocultar variable',f:['VARIABLE']},
    data_addtolist:                {c:'data',t:'s',d:'Agregar ITEM a LISTA',f:['LIST'],i:['ITEM']},
    data_deleteoflist:             {c:'data',t:'s',d:'Borrar INDEX de LISTA',f:['LIST'],i:['INDEX']},
    data_deletealloflist:          {c:'data',t:'s',d:'Vaciar LISTA',f:['LIST']},
    data_insertatlist:             {c:'data',t:'s',d:'Insertar ITEM en INDEX',f:['LIST'],i:['INDEX','ITEM']},
    data_replaceitemoflist:        {c:'data',t:'s',d:'Reemplazar INDEX con ITEM',f:['LIST'],i:['INDEX','ITEM']},
    data_itemoflist:               {c:'data',t:'r',d:'ITEM en INDEX de LISTA',f:['LIST'],i:['INDEX']},
    data_itemnumoflist:            {c:'data',t:'r',d:'Posición de ITEM en LISTA',f:['LIST']},
    data_lengthoflist:             {c:'data',t:'r',d:'Largo de LISTA',f:['LIST']},
    data_listcontainsitem:         {c:'data',t:'b',d:'¿LISTA contiene ITEM?',f:['LIST'],i:['ITEM']},
    data_showlist:                 {c:'data',t:'s',d:'Mostrar lista',f:['LIST']},
    data_hidelist:                 {c:'data',t:'s',d:'Ocultar lista',f:['LIST']},

    // === LÁPIZ ===
    pen_clear:                     {c:'pen',t:'s',d:'Borrar dibujos'},
    pen_stamp:                     {c:'pen',t:'s',d:'Sellar sprite'},
    pen_penDown:                   {c:'pen',t:'s',d:'Bajar lápiz'},
    pen_penUp:                     {c:'pen',t:'s',d:'Subir lápiz'},
    pen_setPenColorToColor:        {c:'pen',t:'s',d:'Fijar color lápiz',i:['COLOR']},
    pen_changePenColorParamBy:     {c:'pen',t:'s',d:'Cambiar parámetro color',i:['VALUE']},
    pen_setPenColorParamTo:        {c:'pen',t:'s',d:'Fijar parámetro color',i:['VALUE']},
    pen_changePenSizeBy:           {c:'pen',t:'s',d:'Cambiar tamaño lápiz',i:['SIZE']},
    pen_setPenSizeTo:              {c:'pen',t:'s',d:'Fijar tamaño lápiz',i:['SIZE']},

    // === MÚSICA ===
    music_playDrumForBeats:        {c:'music',t:'s',d:'Tocar tambor N pulsos',i:['DRUM','BEATS']},
    music_restForBeats:            {c:'music',t:'s',d:'Silencio N pulsos',i:['BEATS']},
    music_playNoteForBeats:        {c:'music',t:'s',d:'Tocar nota N pulsos',i:['NOTE','BEATS']},
    music_setInstrument:           {c:'music',t:'s',d:'Elegir instrumento'},
    music_setTempo:                {c:'music',t:'s',d:'Fijar tempo',i:['TEMPO']},
    music_changeTempo:             {c:'music',t:'s',d:'Cambiar tempo',i:['TEMPO']},
    music_getTempo:                {c:'music',t:'r',d:'Tempo actual'},

    // === SHADOW / INTERNOS (NO USAR DIRECTAMENTE) ===
    math_number:                   {c:'internal',t:'r',d:'[shadow] número'},
    text:                          {c:'internal',t:'r',d:'[shadow] texto'},
    boolean:                       {c:'internal',t:'b',d:'[shadow] booleano'},
    colour_picker:                 {c:'internal',t:'r',d:'[shadow] color'},
    sensing_touchingobjectmenu:    {c:'internal',t:'r',d:'[shadow] menú objeto'},
    sensing_distancetomenu:        {c:'internal',t:'r',d:'[shadow] menú distancia'},
    sensing_keyoptions:            {c:'internal',t:'r',d:'[shadow] menú teclas'},
    sensing_of_object_menu:        {c:'internal',t:'r',d:'[shadow] menú objeto-prop'},
    event_broadcast_menu:          {c:'internal',t:'r',d:'[shadow] menú mensajes'},
    motion_goto_menu:              {c:'internal',t:'r',d:'[shadow] menú destino'},
    motion_glideto_menu:           {c:'internal',t:'r',d:'[shadow] menú destino'},
    motion_pointtowards_menu:      {c:'internal',t:'r',d:'[shadow] menú hacia'},
    looks_costume:                 {c:'internal',t:'r',d:'[shadow] menú disfraces'},
    looks_backdrops:               {c:'internal',t:'r',d:'[shadow] menú fondos'},
    sound_sounds_menu:             {c:'internal',t:'r',d:'[shadow] menú sonidos'},
    control_create_clone_of_menu:  {c:'internal',t:'r',d:'[shadow] menú clones'}
};

var TYPE_NAMES = {h:'hat',s:'stack',c:'c-block',r:'reporter',b:'boolean',e:'end'};

function getBlockInfo(opcode) {
    return BLOCKS[opcode] || null;
}

function getCompactPromptLines() {
    var lines = [];
    var cats = [
        ['EVENTOS (hats + broadcast)',['event']],
        ['MOVIMIENTO',['motion']],
        ['APARIENCIA',['looks']],
        ['SONIDO',['sound']],
        ['CONTROL',['control']],
        ['SENSORES',['sensing']],
        ['OPERADORES',['operator']],
        ['VARIABLES Y LISTAS',['data']],
        ['LÁPIZ',['pen']],
        ['MÚSICA',['music']]
    ];
    for (var ci = 0; ci < cats.length; ci++) {
        var catName = cats[ci][0];
        var catKeys = cats[ci][1];
        lines.push('');
        lines.push('--- ' + catName + ' ---');
        var seen = {};
        for (var op in BLOCKS) {
            if (!Object.prototype.hasOwnProperty.call(BLOCKS, op)) continue;
            var b = BLOCKS[op];
            if (b.c === 'internal') continue;
            if (catKeys.indexOf(b.c) === -1) continue;
            if (seen[op]) continue;
            seen[op] = true;
            var typeChar = b.t;
            var parts = [op + '[' + typeChar + ']'];
            parts.push(b.d);
            if (b.f && b.f.length > 0) parts.push('(f:' + b.f.join(',') + ')');
            if (b.i && b.i.length > 0) parts.push('(v:' + b.i.join(',') + ')');
            if (b.st && b.st.length > 0) parts.push('{st:' + b.st.join(',') + '}');
            lines.push(' ' + parts.join(' | '));
        }
    }
    return lines;
}

function getCompactPromptText() {
    var lines = getCompactPromptLines();
    return lines.join('\n');
}

function getDetailedBlockInfo(opcode) {
    var b = BLOCKS[opcode];
    if (!b) return null;
    var info = 'BLOQUE: ' + opcode + '\n';
    info += 'TIPO: ' + (TYPE_NAMES[b.t] || b.t) + '\n';
    info += 'DESCRIPCIÓN: ' + b.d + '\n';
    info += 'CATEGORÍA: ' + b.c + '\n';
    info += 'CAMPOS: ' + (b.f && b.f.length > 0 ? b.f.join(', ') : 'ninguno') + '\n';
    info += 'ENTRADAS: ' + (b.i && b.i.length > 0 ? b.i.join(', ') : 'ninguna') + '\n';
    if (b.st) info += 'SUBSTACKS: ' + b.st.join(', ') + '\n';
    return info;
}

function searchBlocks(query) {
    var q = query.toLowerCase();
    var results = [];
    for (var op in BLOCKS) {
        if (!Object.prototype.hasOwnProperty.call(BLOCKS, op)) continue;
        if (BLOCKS[op].c === 'internal') continue;
        if (op.toLowerCase().indexOf(q) !== -1 || BLOCKS[op].d.toLowerCase().indexOf(q) !== -1) {
            results.push(op + ' [' + BLOCKS[op].t + '] ' + BLOCKS[op].d);
        }
    }
    return results;
}

export {BLOCKS, getBlockInfo, getCompactPromptLines, getCompactPromptText, getDetailedBlockInfo, searchBlocks, TYPE_NAMES};
