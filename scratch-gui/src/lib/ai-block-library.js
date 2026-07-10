import {defineMessages} from 'react-intl';

var TYPES = {h:'hat',s:'stack',c:'c-block',r:'reporter',b:'boolean',e:'end'};

var BLOCKS = {
    // === EVENTS (hats + broadcast) ===
    event_whenflagclicked:         {c:'event',t:'h',d:'When green flag clicked'},
    event_whenkeypressed:          {c:'event',t:'h',d:'When key pressed',f:['KEY_OPTION']},
    event_whenthisspriteclicked:   {c:'event',t:'h',d:'When this sprite clicked'},
    event_whenstageclicked:        {c:'event',t:'h',d:'When stage clicked'},
    event_whenbroadcastreceived:   {c:'event',t:'h',d:'When I receive',f:['CHOICE']},
    event_whenbackdropswitchesto:  {c:'event',t:'h',d:'When backdrop switches to',f:['BACKDROP']},
    event_whengreaterthan:         {c:'event',t:'h',d:'When >',f:['WHENGREATERTHANMENU'],i:['VALUE']},
    control_start_as_clone:        {c:'control',t:'h',d:'When I start as a clone'},
    event_broadcast:               {c:'event',t:'s',d:'Broadcast',i:['BROADCAST_INPUT'],f:['CHOICE']},
    event_broadcastandwait:        {c:'event',t:'s',d:'Broadcast and wait',i:['BROADCAST_INPUT'],f:['CHOICE']},

    // === MOTION ===
    motion_movesteps:              {c:'motion',t:'s',d:'Move N steps',i:['STEPS']},
    motion_turnright:              {c:'motion',t:'s',d:'Turn right º',i:['DEGREES']},
    motion_turnleft:               {c:'motion',t:'s',d:'Turn left º',i:['DEGREES']},
    motion_goto:                   {c:'motion',t:'s',d:'Go to',i:['TO']},
    motion_gotoxy:                 {c:'motion',t:'s',d:'Go to X,Y',i:['X','Y']},
    motion_glideto:                {c:'motion',t:'s',d:'Glide to',i:['TO']},
    motion_glidesecstoxy:          {c:'motion',t:'s',d:'Glide X,Y in N secs',i:['SECS','X','Y']},
    motion_pointindirection:       {c:'motion',t:'s',d:'Point in direction º',i:['DIRECTION']},
    motion_pointtowards:           {c:'motion',t:'s',d:'Point towards',i:['TOWARDS']},
    motion_changexby:              {c:'motion',t:'s',d:'Change X by',i:['DX']},
    motion_setx:                   {c:'motion',t:'s',d:'Set X',i:['X']},
    motion_changeyby:              {c:'motion',t:'s',d:'Change Y by',i:['DY']},
    motion_sety:                   {c:'motion',t:'s',d:'Set Y',i:['Y']},
    motion_ifonedgebounce:         {c:'motion',t:'s',d:'If on edge, bounce'},
    motion_setrotationstyle:       {c:'motion',t:'s',d:'Set rotation style',f:['STYLE']},
    motion_xposition:              {c:'motion',t:'r',d:'X position'},
    motion_yposition:              {c:'motion',t:'r',d:'Y position'},
    motion_direction:              {c:'motion',t:'r',d:'Direction'},

    // === LOOKS ===
    looks_sayforsecs:              {c:'looks',t:'s',d:'Say N secs',i:['MESSAGE','SECS']},
    looks_say:                     {c:'looks',t:'s',d:'Say',i:['MESSAGE']},
    looks_thinkforsecs:            {c:'looks',t:'s',d:'Think N secs',i:['MESSAGE','SECS']},
    looks_think:                   {c:'looks',t:'s',d:'Think',i:['MESSAGE']},
    looks_switchcostumeto:         {c:'looks',t:'s',d:'Switch costume to',f:['COSTUME']},
    looks_nextcostume:             {c:'looks',t:'s',d:'Next costume'},
    looks_switchbackdropto:        {c:'looks',t:'s',d:'Switch backdrop to',f:['BACKDROP']},
    looks_switchbackdroptoandwait: {c:'looks',t:'s',d:'Switch backdrop and wait',f:['BACKDROP']},
    looks_nextbackdrop:            {c:'looks',t:'s',d:'Next backdrop'},
    looks_changesizeby:            {c:'looks',t:'s',d:'Change size by',i:['CHANGE']},
    looks_setsizeto:               {c:'looks',t:'s',d:'Set size %',i:['SIZE']},
    looks_changeeffectby:          {c:'looks',t:'s',d:'Change effect by',i:['CHANGE'],f:['EFFECT']},
    looks_seteffectto:             {c:'looks',t:'s',d:'Set effect to',i:['VALUE'],f:['EFFECT']},
    looks_cleargraphiceffects:     {c:'looks',t:'s',d:'Clear graphic effects'},
    looks_show:                    {c:'looks',t:'s',d:'Show'},
    looks_hide:                    {c:'looks',t:'s',d:'Hide'},
    looks_gotofrontback:           {c:'looks',t:'s',d:'Go to front/back',f:['FRONT_BACK']},
    looks_goforwardbackwardlayers: {c:'looks',t:'s',d:'Go forward/backward layers',i:['NUM'],f:['FORWARD_BACKWARD']},
    looks_costumenumbername:       {c:'looks',t:'r',d:'Costume # or name',f:['NUMBER_NAME']},
    looks_backdropnumbername:      {c:'looks',t:'r',d:'Backdrop # or name',f:['NUMBER_NAME']},
    looks_size:                    {c:'looks',t:'r',d:'Size'},

    // === SOUND ===
    sound_playuntildone:           {c:'sound',t:'s',d:'Play sound until done',f:['SOUND_MENU']},
    sound_play:                    {c:'sound',t:'s',d:'Play sound',f:['SOUND_MENU']},
    sound_stopallsounds:           {c:'sound',t:'s',d:'Stop all sounds'},
    sound_changeeffectby:          {c:'sound',t:'s',d:'Change effect by',i:['VALUE'],f:['EFFECT']},
    sound_seteffectto:             {c:'sound',t:'s',d:'Set effect to',i:['VALUE'],f:['EFFECT']},
    sound_cleareffects:            {c:'sound',t:'s',d:'Clear effects'},
    sound_changevolumeby:          {c:'sound',t:'s',d:'Change volume by',i:['VOLUME']},
    sound_setvolumeto:             {c:'sound',t:'s',d:'Set volume %',i:['VOLUME']},
    sound_volume:                  {c:'sound',t:'r',d:'Volume'},

    // === CONTROL ===
    control_wait:                  {c:'control',t:'s',d:'Wait N secs',i:['DURATION']},
    control_repeat:                {c:'control',t:'c',d:'Repeat N times',i:['TIMES'],st:['SUBSTACK']},
    control_forever:               {c:'control',t:'c',d:'Forever',st:['SUBSTACK']},
    control_if:                    {c:'control',t:'c',d:'If COND then',i:['CONDITION'],st:['SUBSTACK']},
    control_if_else:               {c:'control',t:'c',d:'If COND else',i:['CONDITION'],st:['SUBSTACK','SUBSTACK2']},
    control_wait_until:            {c:'control',t:'s',d:'Wait until COND',i:['CONDITION']},
    control_repeat_until:          {c:'control',t:'c',d:'Repeat until COND',i:['CONDITION'],st:['SUBSTACK']},
    control_stop:                  {c:'control',t:'e',d:'Stop script'},
    control_create_clone_of:       {c:'control',t:'s',d:'Create clone of',f:['CLONE_OPTION']},
    control_delete_this_clone:     {c:'control',t:'e',d:'Delete this clone'},
    control_start_as_clone:        {c:'control',t:'h',d:'When I start as a clone'},

    // === SENSING ===
    sensing_touchingobject:        {c:'sensing',t:'b',d:'Touching object?',i:['TOUCHINGOBJECTMENU']},
    sensing_touchingcolor:         {c:'sensing',t:'b',d:'Touching color?',i:['COLOR']},
    sensing_coloristouchingcolor:  {c:'sensing',t:'b',d:'Color touching color?',i:['COLOR','COLOR2']},
    sensing_distanceto:            {c:'sensing',t:'r',d:'Distance to',i:['DISTANCETOMENU']},
    sensing_askandwait:            {c:'sensing',t:'s',d:'Ask and wait',i:['QUESTION']},
    sensing_answer:                {c:'sensing',t:'r',d:'Answer'},
    sensing_keypressed:            {c:'sensing',t:'b',d:'Key pressed?',i:['KEY_OPTION']},
    sensing_mousedown:             {c:'sensing',t:'b',d:'Mouse down?'},
    sensing_mousex:                {c:'sensing',t:'r',d:'Mouse X'},
    sensing_mousey:                {c:'sensing',t:'r',d:'Mouse Y'},
    sensing_setdragmode:           {c:'sensing',t:'s',d:'Set drag mode',f:['DRAG_MODE']},
    sensing_loudness:              {c:'sensing',t:'r',d:'Loudness'},
    sensing_timer:                 {c:'sensing',t:'r',d:'Timer'},
    sensing_resettimer:            {c:'sensing',t:'s',d:'Reset timer'},
    sensing_of:                    {c:'sensing',t:'r',d:'Property of object',f:['PROPERTY']},
    sensing_current:               {c:'sensing',t:'r',d:'Current date/time',f:['CURRENTMENU']},
    sensing_dayssince2000:         {c:'sensing',t:'r',d:'Days since 2000'},
    sensing_username:              {c:'sensing',t:'r',d:'Username'},

    // === OPERATORS ===
    operator_add:                  {c:'operator',t:'r',d:'Add NUM1+NUM2',i:['NUM1','NUM2']},
    operator_subtract:             {c:'operator',t:'r',d:'Subtract NUM1-NUM2',i:['NUM1','NUM2']},
    operator_multiply:             {c:'operator',t:'r',d:'Multiply NUM1*NUM2',i:['NUM1','NUM2']},
    operator_divide:               {c:'operator',t:'r',d:'Divide NUM1/NUM2',i:['NUM1','NUM2']},
    operator_random:               {c:'operator',t:'r',d:'Random FROM-TO',i:['FROM','TO']},
    operator_gt:                   {c:'operator',t:'b',d:'NUM1 > NUM2?',i:['OPERAND1','OPERAND2']},
    operator_lt:                   {c:'operator',t:'b',d:'NUM1 < NUM2?',i:['OPERAND1','OPERAND2']},
    operator_equals:               {c:'operator',t:'b',d:'OPERAND1 = OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_and:                  {c:'operator',t:'b',d:'OPERAND1 AND OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_or:                   {c:'operator',t:'b',d:'OPERAND1 OR OPERAND2?',i:['OPERAND1','OPERAND2']},
    operator_not:                  {c:'operator',t:'b',d:'NOT OPERAND',i:['OPERAND']},
    operator_join:                 {c:'operator',t:'r',d:'Join STRING1+STRING2',i:['STRING1','STRING2']},
    operator_letter_of:            {c:'operator',t:'r',d:'Letter LETTER of STRING',i:['LETTER','STRING']},
    operator_length:               {c:'operator',t:'r',d:'Length of STRING',i:['STRING']},
    operator_contains:             {c:'operator',t:'b',d:'STRING1 contains STRING2?',i:['STRING1','STRING2']},
    operator_mod:                  {c:'operator',t:'r',d:'Mod NUM1/NUM2',i:['NUM1','NUM2']},
    operator_round:                {c:'operator',t:'r',d:'Round NUM',i:['NUM']},
    operator_mathop:               {c:'operator',t:'r',d:'Math operation',i:['NUM']},

    // === VARIABLES AND LISTS ===
    data_setvariableto:            {c:'data',t:'s',d:'Set VARIABLE=VALUE',f:['VARIABLE'],i:['VALUE']},
    data_changevariableby:         {c:'data',t:'s',d:'Change VARIABLE by VALUE',f:['VARIABLE'],i:['VALUE']},
    data_variable:                 {c:'data',t:'r',d:'VARIABLE value',f:['VARIABLE']},
    data_showvariable:             {c:'data',t:'s',d:'Show variable',f:['VARIABLE']},
    data_hidevariable:             {c:'data',t:'s',d:'Hide variable',f:['VARIABLE']},
    data_addtolist:                {c:'data',t:'s',d:'Add ITEM to LIST',f:['LIST'],i:['ITEM']},
    data_deleteoflist:             {c:'data',t:'s',d:'Delete INDEX from LIST',f:['LIST'],i:['INDEX']},
    data_deletealloflist:          {c:'data',t:'s',d:'Clear LIST',f:['LIST']},
    data_insertatlist:             {c:'data',t:'s',d:'Insert ITEM at INDEX',f:['LIST'],i:['INDEX','ITEM']},
    data_replaceitemoflist:        {c:'data',t:'s',d:'Replace INDEX with ITEM',f:['LIST'],i:['INDEX','ITEM']},
    data_itemoflist:               {c:'data',t:'r',d:'ITEM at INDEX of LIST',f:['LIST'],i:['INDEX']},
    data_itemnumoflist:            {c:'data',t:'r',d:'Position of ITEM in LIST',f:['LIST']},
    data_lengthoflist:             {c:'data',t:'r',d:'Length of LIST',f:['LIST']},
    data_listcontainsitem:         {c:'data',t:'b',d:'LIST contains ITEM?',f:['LIST'],i:['ITEM']},
    data_showlist:                 {c:'data',t:'s',d:'Show list',f:['LIST']},
    data_hidelist:                 {c:'data',t:'s',d:'Hide list',f:['LIST']},

    // === PEN ===
    pen_clear:                     {c:'pen',t:'s',d:'Clear drawings'},
    pen_stamp:                     {c:'pen',t:'s',d:'Stamp sprite'},
    pen_penDown:                   {c:'pen',t:'s',d:'Pen down'},
    pen_penUp:                     {c:'pen',t:'s',d:'Pen up'},
    pen_setPenColorToColor:        {c:'pen',t:'s',d:'Set pen color',i:['COLOR']},
    pen_changePenColorParamBy:     {c:'pen',t:'s',d:'Change color param by',i:['VALUE']},
    pen_setPenColorParamTo:        {c:'pen',t:'s',d:'Set color param to',i:['VALUE']},
    pen_changePenSizeBy:           {c:'pen',t:'s',d:'Change pen size by',i:['SIZE']},
    pen_setPenSizeTo:              {c:'pen',t:'s',d:'Set pen size to',i:['SIZE']},

    // === MUSIC ===
    music_playDrumForBeats:        {c:'music',t:'s',d:'Play drum N beats',i:['DRUM','BEATS']},
    music_restForBeats:            {c:'music',t:'s',d:'Rest N beats',i:['BEATS']},
    music_playNoteForBeats:        {c:'music',t:'s',d:'Play note N beats',i:['NOTE','BEATS']},
    music_setInstrument:           {c:'music',t:'s',d:'Set instrument'},
    music_setTempo:                {c:'music',t:'s',d:'Set tempo',i:['TEMPO']},
    music_changeTempo:             {c:'music',t:'s',d:'Change tempo',i:['TEMPO']},
    music_getTempo:                {c:'music',t:'r',d:'Tempo'},

    // === SHADOW / INTERNAL (DO NOT USE DIRECTLY) ===
    math_number:                   {c:'internal',t:'r',d:'[shadow] number'},
    text:                          {c:'internal',t:'r',d:'[shadow] text'},
    boolean:                       {c:'internal',t:'b',d:'[shadow] boolean'},
    colour_picker:                 {c:'internal',t:'r',d:'[shadow] color'},
    sensing_touchingobjectmenu:    {c:'internal',t:'r',d:'[shadow] menu object'},
    sensing_distancetomenu:        {c:'internal',t:'r',d:'[shadow] menu distance'},
    sensing_keyoptions:            {c:'internal',t:'r',d:'[shadow] menu keys'},
    sensing_of_object_menu:        {c:'internal',t:'r',d:'[shadow] menu object-prop'},
    event_broadcast_menu:          {c:'internal',t:'r',d:'[shadow] menu messages'},
    motion_goto_menu:              {c:'internal',t:'r',d:'[shadow] menu destination'},
    motion_glideto_menu:           {c:'internal',t:'r',d:'[shadow] menu destination'},
    motion_pointtowards_menu:      {c:'internal',t:'r',d:'[shadow] menu towards'},
    looks_costume:                 {c:'internal',t:'r',d:'[shadow] menu costumes'},
    looks_backdrops:               {c:'internal',t:'r',d:'[shadow] menu backdrops'},
    sound_sounds_menu:             {c:'internal',t:'r',d:'[shadow] menu sounds'},
    control_create_clone_of_menu:  {c:'internal',t:'r',d:'[shadow] menu clones'}
};

var blockMessages = defineMessages({
    eventWhenflagclicked: {id:'gui.blockLibrary.eventWhenflagclicked.desc',defaultMessage:'When green flag clicked'},
    eventWhenkeypressed: {id:'gui.blockLibrary.eventWhenkeypressed.desc',defaultMessage:'When key pressed'},
    eventWhenthisspriteclicked: {id:'gui.blockLibrary.eventWhenthisspriteclicked.desc',defaultMessage:'When this sprite clicked'},
    eventWhenstageclicked: {id:'gui.blockLibrary.eventWhenstageclicked.desc',defaultMessage:'When stage clicked'},
    eventWhenbroadcastreceived: {id:'gui.blockLibrary.eventWhenbroadcastreceived.desc',defaultMessage:'When I receive'},
    eventWhenbackdropswitchesto: {id:'gui.blockLibrary.eventWhenbackdropswitchesto.desc',defaultMessage:'When backdrop switches to'},
    eventWhengreaterthan: {id:'gui.blockLibrary.eventWhengreaterthan.desc',defaultMessage:'When >'},
    controlStartAsClone: {id:'gui.blockLibrary.controlStartAsClone.desc',defaultMessage:'When I start as a clone'},
    eventBroadcast: {id:'gui.blockLibrary.eventBroadcast.desc',defaultMessage:'Broadcast'},
    eventBroadcastandwait: {id:'gui.blockLibrary.eventBroadcastandwait.desc',defaultMessage:'Broadcast and wait'},
    motionMovesteps: {id:'gui.blockLibrary.motionMovesteps.desc',defaultMessage:'Move N steps'},
    motionTurnright: {id:'gui.blockLibrary.motionTurnright.desc',defaultMessage:'Turn right º'},
    motionTurnleft: {id:'gui.blockLibrary.motionTurnleft.desc',defaultMessage:'Turn left º'},
    motionGoto: {id:'gui.blockLibrary.motionGoto.desc',defaultMessage:'Go to'},
    motionGotoxy: {id:'gui.blockLibrary.motionGotoxy.desc',defaultMessage:'Go to X,Y'},
    motionGlideto: {id:'gui.blockLibrary.motionGlideto.desc',defaultMessage:'Glide to'},
    motionGlidesecstoxy: {id:'gui.blockLibrary.motionGlidesecstoxy.desc',defaultMessage:'Glide X,Y in N secs'},
    motionPointindirection: {id:'gui.blockLibrary.motionPointindirection.desc',defaultMessage:'Point in direction º'},
    motionPointtowards: {id:'gui.blockLibrary.motionPointtowards.desc',defaultMessage:'Point towards'},
    motionChangexby: {id:'gui.blockLibrary.motionChangexby.desc',defaultMessage:'Change X by'},
    motionSetx: {id:'gui.blockLibrary.motionSetx.desc',defaultMessage:'Set X'},
    motionChangeyby: {id:'gui.blockLibrary.motionChangeyby.desc',defaultMessage:'Change Y by'},
    motionSety: {id:'gui.blockLibrary.motionSety.desc',defaultMessage:'Set Y'},
    motionIfonedgebounce: {id:'gui.blockLibrary.motionIfonedgebounce.desc',defaultMessage:'If on edge, bounce'},
    motionSetrotationstyle: {id:'gui.blockLibrary.motionSetrotationstyle.desc',defaultMessage:'Set rotation style'},
    motionXposition: {id:'gui.blockLibrary.motionXposition.desc',defaultMessage:'X position'},
    motionYposition: {id:'gui.blockLibrary.motionYposition.desc',defaultMessage:'Y position'},
    motionDirection: {id:'gui.blockLibrary.motionDirection.desc',defaultMessage:'Direction'},
    looksSayforsecs: {id:'gui.blockLibrary.looksSayforsecs.desc',defaultMessage:'Say N secs'},
    looksSay: {id:'gui.blockLibrary.looksSay.desc',defaultMessage:'Say'},
    looksThinkforsecs: {id:'gui.blockLibrary.looksThinkforsecs.desc',defaultMessage:'Think N secs'},
    looksThink: {id:'gui.blockLibrary.looksThink.desc',defaultMessage:'Think'},
    looksSwitchcostumeto: {id:'gui.blockLibrary.looksSwitchcostumeto.desc',defaultMessage:'Switch costume to'},
    looksNextcostume: {id:'gui.blockLibrary.looksNextcostume.desc',defaultMessage:'Next costume'},
    looksSwitchbackdropto: {id:'gui.blockLibrary.looksSwitchbackdropto.desc',defaultMessage:'Switch backdrop to'},
    looksSwitchbackdroptoandwait: {id:'gui.blockLibrary.looksSwitchbackdroptoandwait.desc',defaultMessage:'Switch backdrop and wait'},
    looksNextbackdrop: {id:'gui.blockLibrary.looksNextbackdrop.desc',defaultMessage:'Next backdrop'},
    looksChangesizeby: {id:'gui.blockLibrary.looksChangesizeby.desc',defaultMessage:'Change size by'},
    looksSetsizeto: {id:'gui.blockLibrary.looksSetsizeto.desc',defaultMessage:'Set size %'},
    looksChangeeffectby: {id:'gui.blockLibrary.looksChangeeffectby.desc',defaultMessage:'Change effect'},
    looksSeteffectto: {id:'gui.blockLibrary.looksSeteffectto.desc',defaultMessage:'Set effect'},
    looksCleargraphiceffects: {id:'gui.blockLibrary.looksCleargraphiceffects.desc',defaultMessage:'Clear graphic effects'},
    looksShow: {id:'gui.blockLibrary.looksShow.desc',defaultMessage:'Show'},
    looksHide: {id:'gui.blockLibrary.looksHide.desc',defaultMessage:'Hide'},
    looksGotofrontback: {id:'gui.blockLibrary.looksGotofrontback.desc',defaultMessage:'Go to front/back'},
    looksGoforwardbackwardlayers: {id:'gui.blockLibrary.looksGoforwardbackwardlayers.desc',defaultMessage:'Go forward/backward layers'},
    looksCostumenumbername: {id:'gui.blockLibrary.looksCostumenumbername.desc',defaultMessage:'Costume # or name'},
    looksBackdropnumbername: {id:'gui.blockLibrary.looksBackdropnumbername.desc',defaultMessage:'Backdrop # or name'},
    looksSize: {id:'gui.blockLibrary.looksSize.desc',defaultMessage:'Size'},
    soundPlayuntildone: {id:'gui.blockLibrary.soundPlayuntildone.desc',defaultMessage:'Play sound until done'},
    soundPlay: {id:'gui.blockLibrary.soundPlay.desc',defaultMessage:'Play sound'},
    soundStopallsounds: {id:'gui.blockLibrary.soundStopallsounds.desc',defaultMessage:'Stop all sounds'},
    soundChangeeffectby: {id:'gui.blockLibrary.soundChangeeffectby.desc',defaultMessage:'Change effect'},
    soundSeteffectto: {id:'gui.blockLibrary.soundSeteffectto.desc',defaultMessage:'Set effect'},
    soundCleareffects: {id:'gui.blockLibrary.soundCleareffects.desc',defaultMessage:'Clear effects'},
    soundChangevolumeby: {id:'gui.blockLibrary.soundChangevolumeby.desc',defaultMessage:'Change volume by'},
    soundSetvolumeto: {id:'gui.blockLibrary.soundSetvolumeto.desc',defaultMessage:'Set volume %'},
    soundVolume: {id:'gui.blockLibrary.soundVolume.desc',defaultMessage:'Volume'},
    controlWait: {id:'gui.blockLibrary.controlWait.desc',defaultMessage:'Wait N secs'},
    controlRepeat: {id:'gui.blockLibrary.controlRepeat.desc',defaultMessage:'Repeat N times'},
    controlForever: {id:'gui.blockLibrary.controlForever.desc',defaultMessage:'Forever'},
    controlIf: {id:'gui.blockLibrary.controlIf.desc',defaultMessage:'If COND then'},
    controlIfElse: {id:'gui.blockLibrary.controlIfElse.desc',defaultMessage:'If COND else'},
    controlWaitUntil: {id:'gui.blockLibrary.controlWaitUntil.desc',defaultMessage:'Wait until COND'},
    controlRepeatUntil: {id:'gui.blockLibrary.controlRepeatUntil.desc',defaultMessage:'Repeat until COND'},
    controlStop: {id:'gui.blockLibrary.controlStop.desc',defaultMessage:'Stop script'},
    controlCreateCloneOf: {id:'gui.blockLibrary.controlCreateCloneOf.desc',defaultMessage:'Create clone of'},
    controlDeleteThisClone: {id:'gui.blockLibrary.controlDeleteThisClone.desc',defaultMessage:'Delete this clone'},
    sensingTouchingobject: {id:'gui.blockLibrary.sensingTouchingobject.desc',defaultMessage:'Touching object?'},
    sensingTouchingcolor: {id:'gui.blockLibrary.sensingTouchingcolor.desc',defaultMessage:'Touching color?'},
    sensingColoristouchingcolor: {id:'gui.blockLibrary.sensingColoristouchingcolor.desc',defaultMessage:'Color touching color?'},
    sensingDistanceto: {id:'gui.blockLibrary.sensingDistanceto.desc',defaultMessage:'Distance to'},
    sensingAskandwait: {id:'gui.blockLibrary.sensingAskandwait.desc',defaultMessage:'Ask and wait'},
    sensingAnswer: {id:'gui.blockLibrary.sensingAnswer.desc',defaultMessage:'Answer'},
    sensingKeypressed: {id:'gui.blockLibrary.sensingKeypressed.desc',defaultMessage:'Key pressed?'},
    sensingMousedown: {id:'gui.blockLibrary.sensingMousedown.desc',defaultMessage:'Mouse down?'},
    sensingMousex: {id:'gui.blockLibrary.sensingMousex.desc',defaultMessage:'Mouse X'},
    sensingMousey: {id:'gui.blockLibrary.sensingMousey.desc',defaultMessage:'Mouse Y'},
    sensingSetdragmode: {id:'gui.blockLibrary.sensingSetdragmode.desc',defaultMessage:'Set drag mode'},
    sensingLoudness: {id:'gui.blockLibrary.sensingLoudness.desc',defaultMessage:'Loudness'},
    sensingTimer: {id:'gui.blockLibrary.sensingTimer.desc',defaultMessage:'Timer'},
    sensingResettimer: {id:'gui.blockLibrary.sensingResettimer.desc',defaultMessage:'Reset timer'},
    sensingOf: {id:'gui.blockLibrary.sensingOf.desc',defaultMessage:'Property of object'},
    sensingCurrent: {id:'gui.blockLibrary.sensingCurrent.desc',defaultMessage:'Current date/time'},
    sensingDayssince2000: {id:'gui.blockLibrary.sensingDayssince2000.desc',defaultMessage:'Days since 2000'},
    sensingUsername: {id:'gui.blockLibrary.sensingUsername.desc',defaultMessage:'Username'},
    operatorAdd: {id:'gui.blockLibrary.operatorAdd.desc',defaultMessage:'Add NUM1+NUM2'},
    operatorSubtract: {id:'gui.blockLibrary.operatorSubtract.desc',defaultMessage:'Subtract NUM1-NUM2'},
    operatorMultiply: {id:'gui.blockLibrary.operatorMultiply.desc',defaultMessage:'Multiply NUM1*NUM2'},
    operatorDivide: {id:'gui.blockLibrary.operatorDivide.desc',defaultMessage:'Divide NUM1/NUM2'},
    operatorRandom: {id:'gui.blockLibrary.operatorRandom.desc',defaultMessage:'Random FROM-TO'},
    operatorGt: {id:'gui.blockLibrary.operatorGt.desc',defaultMessage:'NUM1 > NUM2?'},
    operatorLt: {id:'gui.blockLibrary.operatorLt.desc',defaultMessage:'NUM1 < NUM2?'},
    operatorEquals: {id:'gui.blockLibrary.operatorEquals.desc',defaultMessage:'OPERAND1 = OPERAND2?'},
    operatorAnd: {id:'gui.blockLibrary.operatorAnd.desc',defaultMessage:'OPERAND1 AND OPERAND2?'},
    operatorOr: {id:'gui.blockLibrary.operatorOr.desc',defaultMessage:'OPERAND1 OR OPERAND2?'},
    operatorNot: {id:'gui.blockLibrary.operatorNot.desc',defaultMessage:'NOT OPERAND'},
    operatorJoin: {id:'gui.blockLibrary.operatorJoin.desc',defaultMessage:'Join STRING1+STRING2'},
    operatorLetterOf: {id:'gui.blockLibrary.operatorLetterOf.desc',defaultMessage:'Letter LETTER of STRING'},
    operatorLength: {id:'gui.blockLibrary.operatorLength.desc',defaultMessage:'Length of STRING'},
    operatorContains: {id:'gui.blockLibrary.operatorContains.desc',defaultMessage:'STRING1 contains STRING2?'},
    operatorMod: {id:'gui.blockLibrary.operatorMod.desc',defaultMessage:'Mod NUM1/NUM2'},
    operatorRound: {id:'gui.blockLibrary.operatorRound.desc',defaultMessage:'Round NUM'},
    operatorMathop: {id:'gui.blockLibrary.operatorMathop.desc',defaultMessage:'Math operation'},
    dataSetvariableto: {id:'gui.blockLibrary.dataSetvariableto.desc',defaultMessage:'Set VARIABLE=VALUE'},
    dataChangevariableby: {id:'gui.blockLibrary.dataChangevariableby.desc',defaultMessage:'Change VARIABLE by VALUE'},
    dataVariable: {id:'gui.blockLibrary.dataVariable.desc',defaultMessage:'VARIABLE value'},
    dataShowvariable: {id:'gui.blockLibrary.dataShowvariable.desc',defaultMessage:'Show variable'},
    dataHidevariable: {id:'gui.blockLibrary.dataHidevariable.desc',defaultMessage:'Hide variable'},
    dataAddtolist: {id:'gui.blockLibrary.dataAddtolist.desc',defaultMessage:'Add ITEM to LIST'},
    dataDeleteoflist: {id:'gui.blockLibrary.dataDeleteoflist.desc',defaultMessage:'Delete INDEX from LIST'},
    dataDeletealloflist: {id:'gui.blockLibrary.dataDeletealloflist.desc',defaultMessage:'Clear LIST'},
    dataInsertatlist: {id:'gui.blockLibrary.dataInsertatlist.desc',defaultMessage:'Insert ITEM at INDEX'},
    dataReplaceitemoflist: {id:'gui.blockLibrary.dataReplaceitemoflist.desc',defaultMessage:'Replace INDEX with ITEM'},
    dataItemoflist: {id:'gui.blockLibrary.dataItemoflist.desc',defaultMessage:'ITEM at INDEX of LIST'},
    dataItemnumoflist: {id:'gui.blockLibrary.dataItemnumoflist.desc',defaultMessage:'Position of ITEM in LIST'},
    dataLengthoflist: {id:'gui.blockLibrary.dataLengthoflist.desc',defaultMessage:'Length of LIST'},
    dataListcontainsitem: {id:'gui.blockLibrary.dataListcontainsitem.desc',defaultMessage:'LIST contains ITEM?'},
    dataShowlist: {id:'gui.blockLibrary.dataShowlist.desc',defaultMessage:'Show list'},
    dataHidelist: {id:'gui.blockLibrary.dataHidelist.desc',defaultMessage:'Hide list'},
    penClear: {id:'gui.blockLibrary.penClear.desc',defaultMessage:'Clear drawings'},
    penStamp: {id:'gui.blockLibrary.penStamp.desc',defaultMessage:'Stamp sprite'},
    penPenDown: {id:'gui.blockLibrary.penPenDown.desc',defaultMessage:'Pen down'},
    penPenUp: {id:'gui.blockLibrary.penPenUp.desc',defaultMessage:'Pen up'},
    penSetPenColorToColor: {id:'gui.blockLibrary.penSetPenColorToColor.desc',defaultMessage:'Set pen color'},
    penChangePenColorParamBy: {id:'gui.blockLibrary.penChangePenColorParamBy.desc',defaultMessage:'Change color param'},
    penSetPenColorParamTo: {id:'gui.blockLibrary.penSetPenColorParamTo.desc',defaultMessage:'Set color param'},
    penChangePenSizeBy: {id:'gui.blockLibrary.penChangePenSizeBy.desc',defaultMessage:'Change pen size'},
    penSetPenSizeTo: {id:'gui.blockLibrary.penSetPenSizeTo.desc',defaultMessage:'Set pen size'},
    musicPlayDrumForBeats: {id:'gui.blockLibrary.musicPlayDrumForBeats.desc',defaultMessage:'Play drum N beats'},
    musicRestForBeats: {id:'gui.blockLibrary.musicRestForBeats.desc',defaultMessage:'Rest N beats'},
    musicPlayNoteForBeats: {id:'gui.blockLibrary.musicPlayNoteForBeats.desc',defaultMessage:'Play note N beats'},
    musicSetInstrument: {id:'gui.blockLibrary.musicSetInstrument.desc',defaultMessage:'Set instrument'},
    musicSetTempo: {id:'gui.blockLibrary.musicSetTempo.desc',defaultMessage:'Set tempo'},
    musicChangeTempo: {id:'gui.blockLibrary.musicChangeTempo.desc',defaultMessage:'Change tempo'},
    musicGetTempo: {id:'gui.blockLibrary.musicGetTempo.desc',defaultMessage:'Tempo'},
    mathNumber: {id:'gui.blockLibrary.mathNumber.desc',defaultMessage:'[shadow] number'},
    text: {id:'gui.blockLibrary.text.desc',defaultMessage:'[shadow] text'},
    boolean: {id:'gui.blockLibrary.boolean.desc',defaultMessage:'[shadow] boolean'},
    colourPicker: {id:'gui.blockLibrary.colourPicker.desc',defaultMessage:'[shadow] color'},
    sensingTouchingobjectmenu: {id:'gui.blockLibrary.sensingTouchingobjectmenu.desc',defaultMessage:'[shadow] menu object'},
    sensingDistancetomenu: {id:'gui.blockLibrary.sensingDistancetomenu.desc',defaultMessage:'[shadow] menu distance'},
    sensingKeyoptions: {id:'gui.blockLibrary.sensingKeyoptions.desc',defaultMessage:'[shadow] menu keys'},
    sensingOfObjectMenu: {id:'gui.blockLibrary.sensingOfObjectMenu.desc',defaultMessage:'[shadow] menu object-prop'},
    eventBroadcastMenu: {id:'gui.blockLibrary.eventBroadcastMenu.desc',defaultMessage:'[shadow] menu messages'},
    motionGotoMenu: {id:'gui.blockLibrary.motionGotoMenu.desc',defaultMessage:'[shadow] menu destination'},
    motionGlidetoMenu: {id:'gui.blockLibrary.motionGlidetoMenu.desc',defaultMessage:'[shadow] menu destination'},
    motionPointtowardsMenu: {id:'gui.blockLibrary.motionPointtowardsMenu.desc',defaultMessage:'[shadow] menu towards'},
    looksCostume: {id:'gui.blockLibrary.looksCostume.desc',defaultMessage:'[shadow] menu costumes'},
    looksBackdrops: {id:'gui.blockLibrary.looksBackdrops.desc',defaultMessage:'[shadow] menu backdrops'},
    soundSoundsMenu: {id:'gui.blockLibrary.soundSoundsMenu.desc',defaultMessage:'[shadow] menu sounds'},
    controlCreateCloneOfMenu: {id:'gui.blockLibrary.controlCreateCloneOfMenu.desc',defaultMessage:'[shadow] menu clones'}
});

var TYPE_NAMES = {h:'hat',s:'stack',c:'c-block',r:'reporter',b:'boolean',e:'end'};

var detailLabels = defineMessages({
    block: {id:'gui.blockLibrary.detail.block',defaultMessage:'BLOCK: '},
    type: {id:'gui.blockLibrary.detail.type',defaultMessage:'TYPE: '},
    description: {id:'gui.blockLibrary.detail.description',defaultMessage:'DESCRIPTION: '},
    category: {id:'gui.blockLibrary.detail.category',defaultMessage:'CATEGORY: '},
    fields: {id:'gui.blockLibrary.detail.fields',defaultMessage:'FIELDS: '},
    inputs: {id:'gui.blockLibrary.detail.inputs',defaultMessage:'INPUTS: '},
    substacks: {id:'gui.blockLibrary.detail.substacks',defaultMessage:'SUBSTACKS: '},
    none: {id:'gui.blockLibrary.detail.none',defaultMessage:'none'},
    noneF: {id:'gui.blockLibrary.detail.noneF',defaultMessage:'none'}
});

var categoryLabels = defineMessages({
    event: {id:'gui.blockLibrary.category.event',defaultMessage:'EVENTS (hats + broadcast)'},
    motion: {id:'gui.blockLibrary.category.motion',defaultMessage:'MOTION'},
    looks: {id:'gui.blockLibrary.category.looks',defaultMessage:'LOOKS'},
    sound: {id:'gui.blockLibrary.category.sound',defaultMessage:'SOUND'},
    control: {id:'gui.blockLibrary.category.control',defaultMessage:'CONTROL'},
    sensing: {id:'gui.blockLibrary.category.sensing',defaultMessage:'SENSING'},
    operator: {id:'gui.blockLibrary.category.operator',defaultMessage:'OPERATORS'},
    data: {id:'gui.blockLibrary.category.data',defaultMessage:'VARIABLES AND LISTS'},
    pen: {id:'gui.blockLibrary.category.pen',defaultMessage:'PEN'},
    music: {id:'gui.blockLibrary.category.music',defaultMessage:'MUSIC'}
});

var _formatDetail = function (msg) {
    return msg.defaultMessage;
};

function setDetailTranslator(translator) {
    _formatDetail = translator;
}

function getBlockInfo(opcode) {
    return BLOCKS[opcode] || null;
}

function getCompactPromptLines() {
    var lines = [];
    var cats = [
        ['EVENTS (hats + broadcast)',['event']],
        ['MOTION',['motion']],
        ['LOOKS',['looks']],
        ['SOUND',['sound']],
        ['CONTROL',['control']],
        ['SENSING',['sensing']],
        ['OPERATORS',['operator']],
        ['VARIABLES AND LISTS',['data']],
        ['PEN',['pen']],
        ['MUSIC',['music']]
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
    var info = _formatDetail(detailLabels.block) + opcode + '\n';
    info += _formatDetail(detailLabels.type) + (TYPE_NAMES[b.t] || b.t) + '\n';
    info += _formatDetail(detailLabels.description) + b.d + '\n';
    info += _formatDetail(detailLabels.category) + b.c + '\n';
    info += _formatDetail(detailLabels.fields) + (b.f && b.f.length > 0 ? b.f.join(', ') : _formatDetail(detailLabels.none)) + '\n';
    info += _formatDetail(detailLabels.inputs) + (b.i && b.i.length > 0 ? b.i.join(', ') : _formatDetail(detailLabels.noneF)) + '\n';
    if (b.st) info += _formatDetail(detailLabels.substacks) + b.st.join(', ') + '\n';
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

export {BLOCKS, getBlockInfo, getCompactPromptLines, getCompactPromptText, getDetailedBlockInfo, searchBlocks, TYPE_NAMES, blockMessages, detailLabels, categoryLabels, setDetailTranslator};
