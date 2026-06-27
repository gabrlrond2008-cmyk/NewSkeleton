var TEMPLATES = {
    calculator: {
        name: 'Calculadora básica',
        description: 'Suma dos números ingresados por el usuario y muestra el resultado.',
        params: [{name: 'numero1', default: '10'}, {name: 'numero2', default: '5'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'sensing_askandwait', inputs: {QUESTION: {type: 'value', val: '"¿Primer número?"'}}},
            {opcode: 'data_setvariableto', fields: {VARIABLE: 'numero1'}, inputs: {VALUE: {type: 'reporter', opcode: 'sensing_answer'}}},
            {opcode: 'sensing_askandwait', inputs: {QUESTION: {type: 'value', val: '"¿Segundo número?"'}}},
            {opcode: 'data_setvariableto', fields: {VARIABLE: 'numero2'}, inputs: {VALUE: {type: 'reporter', opcode: 'sensing_answer'}}},
            {opcode: 'looks_say', inputs: {MESSAGE: {type: 'reporter', opcode: 'operator_join', inputs: {
                STRING1: {type: 'value', val: '"La suma es "'},
                STRING2: {type: 'reporter', opcode: 'operator_add', inputs: {
                    NUM1: {type: 'reporter', opcode: 'data_variable', fields: {VARIABLE: 'numero1'}},
                    NUM2: {type: 'reporter', opcode: 'data_variable', fields: {VARIABLE: 'numero2'}}
                }}
            }}}}
        ]
    },
    moverse: {
        name: 'Moverse y rebotar',
        description: 'El sprite se mueve y rebota en los bordes.',
        params: [{name: 'pasos', default: '10'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'motion_movesteps', inputs: {STEPS: {type: 'value', val: '{{pasos}}'}}},
                {opcode: 'motion_ifonedgebounce'}
            ]}}
        ]
    },
    juego_rebote: {
        name: 'Juego de rebote con mouse',
        description: 'El sprite se mueve, rebota y reacciona al tocar el mouse.',
        params: [{name: 'velocidad', default: '5'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'motion_movesteps', inputs: {STEPS: {type: 'value', val: '{{velocidad}}'}}},
                {opcode: 'motion_ifonedgebounce'},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_touchingobject', inputs: {
                    TOUCHINGOBJECTMENU: {type: 'value', val: 'mouse-pointer'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'looks_say', inputs: {MESSAGE: {type: 'value', val: '"¡Tocaste!"'}}}
                ]}}
            ]}}
        ]
    },
    preguntar_saludar: {
        name: 'Preguntar y saludar',
        description: 'Pregunta el nombre y saluda personalizadamente.',
        params: [],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'sensing_askandwait', inputs: {QUESTION: {type: 'value', val: '"¿Cómo te llamas?"'}}},
            {opcode: 'looks_say', inputs: {MESSAGE: {type: 'reporter', opcode: 'operator_join', inputs: {
                STRING1: {type: 'value', val: '"Hola "'},
                STRING2: {type: 'reporter', opcode: 'sensing_answer'}
            }}}}
        ]
    },
    cambiar_disfraz: {
        name: 'Cambiar disfraz al hacer clic',
        description: 'Cambia entre disfraces al hacer clic en el sprite.',
        params: [],
        blocks: [
            {opcode: 'event_whenthisspriteclicked'},
            {opcode: 'looks_nextcostume'},
            {opcode: 'looks_say', inputs: {MESSAGE: {type: 'value', val: '"¡Nuevo look!"'}}}
        ]
    },
    dibujar_cuadrado: {
        name: 'Dibujar un cuadrado',
        description: 'Dibuja un cuadrado con el lápiz.',
        params: [{name: 'lado', default: '50'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'pen_clear'},
            {opcode: 'pen_penDown'},
            {opcode: 'control_repeat', inputs: {TIMES: {type: 'value', val: '4'}}, statements: {SUBSTACK: [
                {opcode: 'motion_movesteps', inputs: {STEPS: {type: 'value', val: '{{lado}}'}}},
                {opcode: 'motion_turnright', inputs: {DEGREES: {type: 'value', val: '90'}}}
            ]}},
            {opcode: 'pen_penUp'}
        ]
    },
    disparo_nave: {
        name: 'Nave que dispara',
        description: 'Una nave que se mueve con flechas y dispara con espacio.',
        params: [{name: 'velocidad', default: '10'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'flecha izquierda'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'motion_changexby', inputs: {DX: {type: 'value', val: '-{{velocidad}}'}}}
                ]}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'flecha derecha'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'motion_changexby', inputs: {DX: {type: 'value', val: '{{velocidad}}'}}}
                ]}}
            ]}}
        ]
    },
    juego_puntaje: {
        name: 'Juego con puntaje',
        description: 'Gana puntos al tocar un objeto con el mouse.',
        params: [{name: 'puntos_ganar', default: '1'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'data_setvariableto', fields: {VARIABLE: 'puntaje'}, inputs: {VALUE: {type: 'value', val: '0'}}},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_touchingobject', inputs: {
                    TOUCHINGOBJECTMENU: {type: 'value', val: 'mouse-pointer'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'data_changevariableby', fields: {VARIABLE: 'puntaje'}, inputs: {VALUE: {type: 'value', val: '{{puntos_ganar}}'}}},
                    {opcode: 'motion_goto', inputs: {TO: {type: 'value', val: 'posición aleatoria'}}}
                ]}}
            ]}}
        ]
    },
    cronometro: {
        name: 'Cronómetro con reinicio',
        description: 'Muestra el tiempo transcurrido y permite reiniciarlo con espacio.',
        params: [],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'sensing_resettimer'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'looks_say', inputs: {MESSAGE: {type: 'reporter', opcode: 'operator_join', inputs: {
                    STRING1: {type: 'value', val: '"Tiempo: "'},
                    STRING2: {type: 'reporter', opcode: 'sensing_timer'}
                }}}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'espacio'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'sensing_resettimer'}
                ]}}
            ]}}
        ]
    },
    piano: {
        name: 'Piano con teclado',
        description: 'Toca notas musicales al presionar teclas.',
        params: [],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'music_setInstrument'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'a'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'music_playNoteForBeats', inputs: {NOTE: {type: 'value', val: '60'}, BEATS: {type: 'value', val: '0.5'}}}
                ]}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 's'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'music_playNoteForBeats', inputs: {NOTE: {type: 'value', val: '62'}, BEATS: {type: 'value', val: '0.5'}}}
                ]}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'd'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'music_playNoteForBeats', inputs: {NOTE: {type: 'value', val: '64'}, BEATS: {type: 'value', val: '0.5'}}}
                ]}}
            ]}}
        ]
    },
    teclado: {
        name: 'Movimiento con teclado',
        description: 'Mueve el sprite con flechas izquierda/derecha.',
        params: [{name: 'velocidad', default: '10'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'flecha izquierda'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'motion_changexby', inputs: {DX: {type: 'value', val: '-{{velocidad}}'}}}
                ]}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_keypressed', inputs: {
                    KEY_OPTION: {type: 'value', val: 'flecha derecha'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'motion_changexby', inputs: {DX: {type: 'value', val: '{{velocidad}}'}}}
                ]}}
            ]}}
        ]
    },
    variable_contador: {
        name: 'Contador automático',
        description: 'Incrementa una variable cada segundo.',
        params: [{name: 'incremento', default: '1'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'data_setvariableto', fields: {VARIABLE: 'contador'}, inputs: {VALUE: {type: 'value', val: '0'}}},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'control_wait', inputs: {DURATION: {type: 'value', val: '1'}}},
                {opcode: 'data_changevariableby', fields: {VARIABLE: 'contador'}, inputs: {VALUE: {type: 'value', val: '{{incremento}}'}}}
            ]}}
        ]
    },
    sonido_click: {
        name: 'Sonido al hacer clic',
        description: 'Reproduce un sonido al hacer clic en el sprite.',
        params: [],
        blocks: [
            {opcode: 'event_whenthisspriteclicked'},
            {opcode: 'sound_play'}
        ]
    },
    colision: {
        name: 'Detección de colisión',
        description: 'Rebota al tocar un color o borde.',
        params: [{name: 'color', default: '#ff0000'}],
        blocks: [
            {opcode: 'event_whenflagclicked'},
            {opcode: 'control_forever', statements: {SUBSTACK: [
                {opcode: 'motion_movesteps', inputs: {STEPS: {type: 'value', val: '5'}}},
                {opcode: 'control_if', inputs: {CONDITION: {type: 'reporter', opcode: 'sensing_touchingcolor', inputs: {
                    COLOR: {type: 'value', val: '{{color}}'}
                }}}, statements: {SUBSTACK: [
                    {opcode: 'motion_ifonedgebounce'}
                ]}}
            ]}}
        ]
    }
};

function expandTemplate(templateName, params, blockMap) {
    if (!blockMap) blockMap = {};

    function uid() {
        var soup = '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var id = [];
        for (var i = 0; i < 20; i++) {
            id.push(soup.charAt(Math.random() * soup.length));
        }
        return id.join('');
    }

    function resolveVal(val) {
        if (typeof val === 'string' && val.indexOf('{{') !== -1) {
            var key = val.replace('{{', '').replace('}}', '').trim();
            if (params && params[key] !== undefined) return params[key];
            var tmpl = TEMPLATES[templateName];
            if (tmpl && tmpl.params) {
                for (var i = 0; i < tmpl.params.length; i++) {
                    if (tmpl.params[i].name === key) return tmpl.params[i].default;
                }
            }
            return '0';
        }
        return val;
    }

    function buildInputValue(inputDef, parentId) {
        if (inputDef.type === 'value') {
            var shadowId = uid();
            var val = resolveVal(inputDef.val);
            var shadowType = 'math_number';
            var shadowFields = {NUM: {name: 'NUM', value: '0'}};
            if (typeof val === 'string' && val.charAt(0) === '"') {
                shadowType = 'text';
                shadowFields = {TEXT: {name: 'TEXT', value: val.replace(/"/g, '')}};
            } else {
                shadowFields.NUM.value = String(val);
            }
            blockMap[shadowId] = {
                id: shadowId, opcode: shadowType, fields: shadowFields,
                inputs: {}, next: null, parent: parentId, topLevel: false, shadow: true, mutation: null
            };
            return {shadow: shadowId, block: null};
        }
        if (inputDef.type === 'reporter') {
            var reporterId = uid();
            var reporterInputs = {};
            var reporterFields = {};
            if (inputDef.inputs) {
                for (var iname in inputDef.inputs) {
                    var child = buildInputValue(inputDef.inputs[iname], reporterId);
                    reporterInputs[iname] = {name: iname, block: child.block, shadow: child.shadow};
                }
            }
            if (inputDef.fields) {
                for (var fname in inputDef.fields) {
                    reporterFields[fname] = {name: fname, value: inputDef.fields[fname]};
                }
            }
            blockMap[reporterId] = {
                id: reporterId, opcode: inputDef.opcode, fields: reporterFields,
                inputs: reporterInputs, next: null, parent: parentId, topLevel: false,
                shadow: false, mutation: null
            };
            var shadowId = uid();
            blockMap[shadowId] = {
                id: shadowId, opcode: 'math_number', fields: {NUM: {name: 'NUM', value: '0'}},
                inputs: {}, next: null, parent: parentId, topLevel: false, shadow: true, mutation: null
            };
            return {shadow: shadowId, block: reporterId};
        }
        return null;
    }

    function expandBlock(def, parentId, prevSiblingId) {
        var id = uid();
        var inputs = {};
        var fields = {};

        if (def.inputs) {
            for (var iname in def.inputs) {
                var result = buildInputValue(def.inputs[iname], id);
                if (result) {
                    inputs[iname] = {name: iname, block: result.block, shadow: result.shadow};
                }
            }
        }

        if (def.fields) {
            for (var fname in def.fields) {
                fields[fname] = {name: fname, value: def.fields[fname]};
            }
        }

        if (def.statements) {
            for (var sname in def.statements) {
                var childDefs = def.statements[sname];
                var sFirst = null;
                var sPrev = null;
                for (var ci = 0; ci < childDefs.length; ci++) {
                    var childId = expandBlock(childDefs[ci], id, sPrev);
                    if (ci === 0) sFirst = childId;
                    sPrev = childId;
                }
                if (sFirst) {
                    inputs[sname] = {name: sname, block: sFirst};
                }
            }
        }

        if (prevSiblingId && blockMap[prevSiblingId]) {
            blockMap[prevSiblingId].next = id;
        }

        var block = {
            id: id, opcode: def.opcode, inputs: inputs, fields: fields,
            next: null, parent: parentId || null,
            topLevel: !parentId,
            shadow: false, mutation: null
        };

        blockMap[id] = block;
        return id;
    }

    var topBlocks = [];
    var prevId = null;

    for (var i = 0; i < TEMPLATES[templateName].blocks.length; i++) {
        var def = TEMPLATES[templateName].blocks[i];
        var id = expandBlock(def, null, prevId);
        var block = blockMap[id];
        if (block) {
            if (prevId) block.topLevel = false;
            if (!prevId) topBlocks.push(block);
        }
        prevId = id;
    }

    return {blockMap: blockMap, topBlocks: topBlocks, errors: [], valid: true};
}

function getTemplateNames() {
    return Object.keys(TEMPLATES);
}

function getTemplateInfo(name) {
    var t = TEMPLATES[name];
    if (!t) return null;
    return {
        name: name,
        label: t.name,
        description: t.description,
        params: t.params.map(function (p) { return p.name; })
    };
}

export {TEMPLATES, expandTemplate, getTemplateNames, getTemplateInfo};
