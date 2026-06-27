var BLOCK_STRUCTURES = {
    version: 2,
    description: 'Guía detallada de cada bloque de Scratch: shapes, inputs, anidación, lógica',
    categories: [
        {
            name: 'Eventos',
            id: 'events',
            color: 'Amarillo',
            blocks: [
                {
                    opcode: 'event_whenflagclicked',
                    shape: 'hat',
                    description: 'Arranca el programa cuando se hace clic en la bandera verde.',
                    logic: 'Es el punto de entrada principal. Solo puede estar al inicio de un script. No tiene inputs ni puede tener parent.',
                    inputs: [],
                    fields: [],
                    nesting: 'Siempre top-level. Le siguen stacks con next.',
                    example: 'event_whenflagclicked\n  motion_movesteps\n    STEPS: 10'
                },
                {
                    opcode: 'event_whenkeypressed',
                    shape: 'hat',
                    description: 'Ejecuta el script cuando se presiona una tecla específica.',
                    logic: 'Se activa al presionar la tecla indicada en KEY_OPTION.',
                    inputs: [],
                    fields: [{name: 'KEY_OPTION', type: 'dropdown', description: 'Tecla: "espacio", "flecha arriba", "a", "b", etc.'}],
                    nesting: 'Top-level. No puede tener parent.'
                },
                {
                    opcode: 'event_whenstageclicked',
                    shape: 'hat',
                    description: 'Ejecuta el script cuando se hace clic en el escenario.',
                    logic: 'Se dispara al hacer clic en cualquier parte del escenario.',
                    inputs: [],
                    fields: [],
                    nesting: 'Top-level.'
                },
                {
                    opcode: 'event_whenthisspriteclicked',
                    shape: 'hat',
                    description: 'Ejecuta el script cuando se hace clic en el objeto (sprite).',
                    logic: 'Se dispara al hacer clic sobre el sprite.',
                    inputs: [],
                    fields: [],
                    nesting: 'Top-level.'
                },
                {
                    opcode: 'event_whenbackdropswitchesto',
                    shape: 'hat',
                    description: 'Arranca cuando el fondo cambia al fondo indicado.',
                    logic: 'Compara el nombre del fondo actual. Si coincide, ejecuta.',
                    inputs: [
                        {name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops', description: 'Nombre del fondo'}
                    ],
                    fields: [],
                    nesting: 'Top-level.'
                },
                {
                    opcode: 'event_whengreaterthan',
                    shape: 'hat',
                    description: 'Arranca cuando un valor (volumen, cronómetro) supera un número.',
                    logic: 'Monitorea el valor seleccionado en el menú. Cuando supera el límite, ejecuta.',
                    inputs: [
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Límite numérico'}
                    ],
                    fields: [],
                    nesting: 'Top-level.'
                },
                {
                    opcode: 'event_whenbroadcastreceived',
                    shape: 'hat',
                    description: 'Arranca cuando se recibe un mensaje específico.',
                    logic: 'Espera a que otro script envíe el mensaje con "enviar mensaje".',
                    inputs: [],
                    fields: [{name: 'CHOICE', type: 'dropdown', description: 'Nombre del mensaje a escuchar'}],
                    nesting: 'Top-level.'
                },
                {
                    opcode: 'event_broadcast',
                    shape: 'stack',
                    description: 'Envía un mensaje a todos los objetos y continúa.',
                    logic: 'Dispara todos los hats "al recibir mensaje" con ese nombre. No espera respuestas.',
                    inputs: [
                        {name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu', description: 'Nombre del mensaje'}
                    ],
                    fields: [],
                    nesting: 'Puede ir en next chain o dentro de un C-block body.'
                },
                {
                    opcode: 'event_broadcastandwait',
                    shape: 'stack',
                    description: 'Envía un mensaje y espera a que todos terminen.',
                    logic: 'Dispara los hats correspondientes y espera a que TODOS los scripts que respondieron terminen antes de continuar.',
                    inputs: [
                        {name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu', description: 'Nombre del mensaje'}
                    ],
                    fields: [],
                    nesting: 'Stack normal.'
                }
            ]
        },
        {
            name: 'Movimiento',
            id: 'motion',
            color: 'Azul',
            blocks: [
                {
                    opcode: 'motion_movesteps',
                    shape: 'stack',
                    description: 'Mueve el sprite N pasos hacia adelante (en su dirección actual).',
                    logic: 'Avanza en la dirección actual. Valor positivo = adelante, negativo = atrás.',
                    inputs: [
                        {name: 'STEPS', type: 'value', shadow: 'math_number', description: 'Número de pasos. Puede ser un reporter como operator_add.'}
                    ],
                    fields: [],
                    nesting: 'Dentro de STEPS puede ir un reporter numérico (suma, posición x, etc.).'
                },
                {
                    opcode: 'motion_turnright',
                    shape: 'stack',
                    description: 'Rota el sprite N grados en sentido horario.',
                    logic: 'Suma grados a la dirección actual. 15 = giro pequeño, 90 = cuarto de vuelta.',
                    inputs: [
                        {name: 'DEGREES', type: 'value', shadow: 'math_number', description: 'Grados a girar'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_turnleft',
                    shape: 'stack',
                    description: 'Rota el sprite N grados en sentido antihorario.',
                    logic: 'Resta grados a la dirección actual.',
                    inputs: [
                        {name: 'DEGREES', type: 'value', shadow: 'math_number', description: 'Grados a girar'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_goto',
                    shape: 'stack',
                    description: 'Va a una posición: puntero del mouse, un objeto, o posición aleatoria.',
                    logic: 'Teletransporta el sprite a la posición del destino elegido.',
                    inputs: [
                        {name: 'TO', type: 'value', shadow: 'motion_goto_menu', description: 'Destino: "puntero del ratón", "posición aleatoria", o nombre de objeto'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_gotoxy',
                    shape: 'stack',
                    description: 'Va a la posición (X, Y) específica.',
                    logic: 'Mueve el sprite a las coordenadas exactas. Centro del escenario = (0, 0). X va de -240 a 240, Y de -180 a 180.',
                    inputs: [
                        {name: 'X', type: 'value', shadow: 'math_number', description: 'Coordenada X. Puede ser reporter.'},
                        {name: 'Y', type: 'value', shadow: 'math_number', description: 'Coordenada Y. Puede ser reporter.'}
                    ],
                    fields: [],
                    nesting: 'Dentro de X e Y pueden ir reporters numéricos (motion_xposition, operator_add, etc.).'
                },
                {
                    opcode: 'motion_glideto',
                    shape: 'stack',
                    description: 'Se desliza suavemente a un destino en N segundos.',
                    logic: 'Movimiento animado. No instantáneo como ir a.',
                    inputs: [
                        {name: 'SECS', type: 'value', shadow: 'math_number', description: 'Segundos que dura el deslizamiento'},
                        {name: 'TO', type: 'value', shadow: 'motion_glideto_menu', description: 'Destino del deslizamiento'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_glidesecstoxy',
                    shape: 'stack',
                    description: 'Se desliza a una coordenada (X, Y) en N segundos.',
                    logic: 'Como deslizar pero con destino numérico exacto.',
                    inputs: [
                        {name: 'SECS', type: 'value', shadow: 'math_number', description: 'Duración en segundos'},
                        {name: 'X', type: 'value', shadow: 'math_number', description: 'X destino'},
                        {name: 'Y', type: 'value', shadow: 'math_number', description: 'Y destino'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_pointindirection',
                    shape: 'stack',
                    description: 'Apunta el sprite en una dirección (0 = arriba, 90 = derecha).',
                    logic: 'Cambia la dirección de rotación. 0 arriba, 90 derecha, 180 abajo, -90 izquierda.',
                    inputs: [
                        {name: 'DIRECTION', type: 'value', shadow: 'math_number', description: 'Dirección en grados'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_pointtowards',
                    shape: 'stack',
                    description: 'Apunta hacia el puntero del mouse u otro objeto.',
                    logic: 'Calcula el ángulo hacia el destino y rotación.',
                    inputs: [
                        {name: 'TOWARDS', type: 'value', shadow: 'motion_pointtowards_menu', description: 'Hacia qué apuntar: "puntero del ratón" o nombre del sprite'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_changexby',
                    shape: 'stack',
                    description: 'Cambia la posición X en N (negativo = izquierda).',
                    logic: 'Suma N a la X actual. No afecta Y.',
                    inputs: [
                        {name: 'DX', type: 'value', shadow: 'math_number', description: 'Cuánto cambiar X'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_setx',
                    shape: 'stack',
                    description: 'Establece la posición X a un valor exacto.',
                    logic: 'Fija X al valor dado. No afecta Y.',
                    inputs: [
                        {name: 'X', type: 'value', shadow: 'math_number', description: 'Nuevo valor de X'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_changeyby',
                    shape: 'stack',
                    description: 'Cambia la posición Y en N (negativo = abajo).',
                    logic: 'Suma N a la Y actual. No afecta X.',
                    inputs: [
                        {name: 'DY', type: 'value', shadow: 'math_number', description: 'Cuánto cambiar Y'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_sety',
                    shape: 'stack',
                    description: 'Establece la posición Y a un valor exacto.',
                    logic: 'Fija Y al valor dado. No afecta X.',
                    inputs: [
                        {name: 'Y', type: 'value', shadow: 'math_number', description: 'Nuevo valor de Y'}
                    ],
                    fields: []
                },
                {
                    opcode: 'motion_ifonedgebounce',
                    shape: 'stack',
                    description: 'Rebota si el sprite está tocando el borde del escenario.',
                    logic: 'Detecta si toca el borde y cambia la dirección como un rebote (ángulo de reflexión).',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'motion_setrotationstyle',
                    shape: 'stack',
                    description: 'Fija cómo rota el sprite: alrededor, izquierda/derecha, o no rotar.',
                    logic: 'Controla la apariencia visual al rotar.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'motion_xposition',
                    shape: 'reporter',
                    description: 'Devuelve la posición X actual del sprite.',
                    logic: 'Valor numérico. Se usa dentro de inputs de otros bloques como valor.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va DENTRO de un input value de otro bloque. Nunca solo.'
                },
                {
                    opcode: 'motion_yposition',
                    shape: 'reporter',
                    description: 'Devuelve la posición Y actual del sprite.',
                    logic: 'Valor numérico.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value.'
                },
                {
                    opcode: 'motion_direction',
                    shape: 'reporter',
                    description: 'Devuelve la dirección actual del sprite (0 = arriba).',
                    logic: 'Valor numérico entre -180 y 180.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value.'
                }
            ]
        },
        {
            name: 'Apariencia',
            id: 'looks',
            color: 'Lila',
            blocks: [
                {
                    opcode: 'looks_sayforsecs',
                    shape: 'stack',
                    description: 'Muestra un globo de diálogo con texto por N segundos.',
                    logic: 'Aparece un globo encima del sprite con el texto. Se borra después de los segundos.',
                    inputs: [
                        {name: 'MESSAGE', type: 'value', shadow: 'text', description: 'Texto a decir. Puede ser reporter de texto como operator_join.'},
                        {name: 'SECS', type: 'value', shadow: 'math_number', description: 'Segundos que dura el globo'}
                    ],
                    fields: [],
                    nesting: 'En MESSAGE puede ir un reporter que devuelva texto (operator_join, sensing_answer, etc.).'
                },
                {
                    opcode: 'looks_say',
                    shape: 'stack',
                    description: 'Muestra un globo de diálogo con texto (permanente hasta otro decir).',
                    logic: 'Globo permanente hasta que otro "decir" lo cambie o "esconder" lo quite.',
                    inputs: [
                        {name: 'MESSAGE', type: 'value', shadow: 'text', description: 'Texto a mostrar'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_thinkforsecs',
                    shape: 'stack',
                    description: 'Muestra un globo de pensamiento con texto por N segundos.',
                    logic: 'Como "decir" pero con burbuja de pensamiento (nubes).',
                    inputs: [
                        {name: 'MESSAGE', type: 'value', shadow: 'text', description: 'Texto a pensar'},
                        {name: 'SECS', type: 'value', shadow: 'math_number', description: 'Segundos'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_think',
                    shape: 'stack',
                    description: 'Muestra un globo de pensamiento permanente.',
                    logic: 'Burbuja de pensamiento hasta que otro bloque la cambie.',
                    inputs: [
                        {name: 'MESSAGE', type: 'value', shadow: 'text', description: 'Texto a pensar'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_switchcostumeto',
                    shape: 'stack',
                    description: 'Cambia al disfraz indicado por nombre.',
                    logic: 'Cambia la apariencia visual del sprite al disfraz elegido.',
                    inputs: [
                        {name: 'COSTUME', type: 'value', shadow: 'looks_costume', description: 'Nombre del disfraz'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_nextcostume',
                    shape: 'stack',
                    description: 'Cambia al siguiente disfraz en la lista.',
                    logic: 'Avanza al siguiente disfraz. Si es el último, vuelve al primero.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_switchbackdropto',
                    shape: 'stack',
                    description: 'Cambia el fondo del escenario al indicado.',
                    logic: 'Cambia el fondo inmediatamente.',
                    inputs: [
                        {name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops', description: 'Nombre del fondo'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_switchbackdroptoandwait',
                    shape: 'stack',
                    description: 'Cambia el fondo Y espera a que termine la transición.',
                    logic: 'Como cambiar fondo pero espera a que la animación de transición termine.',
                    inputs: [
                        {name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops', description: 'Nombre del fondo'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_nextbackdrop',
                    shape: 'stack',
                    description: 'Cambia al siguiente fondo.',
                    logic: 'Avanza al siguiente fondo en la lista.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_changesizeby',
                    shape: 'stack',
                    description: 'Cambia el tamaño del sprite en N por ciento.',
                    logic: 'Suma N al tamaño actual. 100% = tamaño original.',
                    inputs: [
                        {name: 'CHANGE', type: 'value', shadow: 'math_number', description: 'Cuánto cambiar el tamaño'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_setsizeto',
                    shape: 'stack',
                    description: 'Establece el tamaño al N por ciento.',
                    logic: 'Fija el tamaño exacto. 100 = original, 200 = doble, 50 = mitad.',
                    inputs: [
                        {name: 'SIZE', type: 'value', shadow: 'math_number', description: 'Tamaño en porcentaje'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_changeeffectby',
                    shape: 'stack',
                    description: 'Cambia un efecto gráfico (color, ojo de pez, etc.) por N.',
                    logic: 'Aplica efecto visual. El menú EFFECT elige el tipo. VALOR = intensidad.',
                    inputs: [
                        {name: 'EFFECT', type: 'value', shadow: 'text', description: 'Tipo de efecto: "color", "ojo de pez", "torbellino", "pixelar", "mosaico", "brillo", "transparencia"'},
                        {name: 'CHANGE', type: 'value', shadow: 'math_number', description: 'Intensidad del cambio'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_seteffectto',
                    shape: 'stack',
                    description: 'Establece un efecto gráfico a un valor exacto.',
                    logic: 'Fija el efecto al valor dado (0 = sin efecto).',
                    inputs: [
                        {name: 'EFFECT', type: 'value', shadow: 'text', description: 'Tipo de efecto'},
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Valor del efecto'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_cleargraphiceffects',
                    shape: 'stack',
                    description: 'Quita todos los efectos gráficos.',
                    logic: 'Restaura la apariencia normal del sprite.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_show',
                    shape: 'stack',
                    description: 'Muestra el sprite en el escenario.',
                    logic: 'Hace visible al sprite si estaba oculto.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_hide',
                    shape: 'stack',
                    description: 'Esconde el sprite del escenario.',
                    logic: 'Invisible pero sigue existiendo y ejecutando código.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_gotofrontback',
                    shape: 'stack',
                    description: 'Envía el sprite al frente o al fondo.',
                    logic: 'Cambia el orden de capas del sprite.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'looks_goforwardbackwardlayers',
                    shape: 'stack',
                    description: 'Avanza o retrocede N capas.',
                    logic: 'Cambia la posición en la pila de capas.',
                    inputs: [
                        {name: 'NUM', type: 'value', shadow: 'math_number', description: 'Número de capas a mover'}
                    ],
                    fields: []
                },
                {
                    opcode: 'looks_costumenumbername',
                    shape: 'reporter',
                    description: 'Devuelve el número o nombre del disfraz actual.',
                    logic: 'Según el menú, devuelve el índice (1, 2, 3) o el nombre.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value de otro bloque.'
                },
                {
                    opcode: 'looks_backdropnumbername',
                    shape: 'reporter',
                    description: 'Devuelve el número o nombre del fondo actual.',
                    logic: 'Como el de disfraz pero para el escenario.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value.'
                },
                {
                    opcode: 'looks_size',
                    shape: 'reporter',
                    description: 'Devuelve el tamaño actual del sprite.',
                    logic: 'Valor numérico (porcentaje).',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value.'
                }
            ]
        },
        {
            name: 'Sonido',
            id: 'sound',
            color: 'Rosa',
            blocks: [
                {
                    opcode: 'sound_playuntildone',
                    shape: 'stack',
                    description: 'Reproduce un sonido y espera a que termine.',
                    logic: 'Inicia el sonido y bloquea el script hasta que termine.',
                    inputs: [
                        {name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu', description: 'Nombre del sonido'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_play',
                    shape: 'stack',
                    description: 'Reproduce un sonido (no espera, continúa).',
                    logic: 'Inicia el sonido y sigue inmediatamente. Pueden solaparse sonidos.',
                    inputs: [
                        {name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu', description: 'Nombre del sonido'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_stopallsounds',
                    shape: 'stack',
                    description: 'Detiene todos los sonidos.',
                    logic: 'Silencia todo el audio del proyecto.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'sound_changeeffectby',
                    shape: 'stack',
                    description: 'Cambia un efecto de sonido (volumen, tono, etc.) por N.',
                    logic: 'Aplica efecto de audio.',
                    inputs: [
                        {name: 'EFFECT', type: 'value', shadow: 'text', description: 'Efecto: "volumen", "tono"'},
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Valor del cambio'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_seteffectto',
                    shape: 'stack',
                    description: 'Establece un efecto de sonido a un valor.',
                    logic: 'Fija el valor exacto del efecto.',
                    inputs: [
                        {name: 'EFFECT', type: 'value', shadow: 'text', description: 'Efecto'},
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Valor'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_cleareffects',
                    shape: 'stack',
                    description: 'Quita todos los efectos de sonido.',
                    logic: 'Restaura el sonido original.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'sound_changevolumeby',
                    shape: 'stack',
                    description: 'Cambia el volumen en N.',
                    logic: 'Sube o baja el volumen general.',
                    inputs: [
                        {name: 'VOLUME', type: 'value', shadow: 'math_number', description: 'Cambio de volumen'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_setvolumeto',
                    shape: 'stack',
                    description: 'Establece el volumen a N por ciento.',
                    logic: 'Fija el volumen exacto (0 = silencio, 100 = máximo).',
                    inputs: [
                        {name: 'VOLUME', type: 'value', shadow: 'math_number', description: 'Volumen (0-100)'}
                    ],
                    fields: []
                },
                {
                    opcode: 'sound_volume',
                    shape: 'reporter',
                    description: 'Devuelve el volumen actual.',
                    logic: 'Valor entre 0 y 100.',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value.'
                }
            ]
        },
        {
            name: 'Control',
            id: 'control',
            color: 'Naranja',
            blocks: [
                {
                    opcode: 'control_wait',
                    shape: 'stack',
                    description: 'Espera N segundos antes de continuar.',
                    logic: 'Pausa el script. N puede ser decimal (0.5 = medio segundo).',
                    inputs: [
                        {name: 'DURATION', type: 'value', shadow: 'math_number', description: 'Segundos a esperar. Puede ser reporter.'}
                    ],
                    fields: [],
                    nesting: 'Stack normal en next chain.'
                },
                {
                    opcode: 'control_repeat',
                    shape: 'c',
                    description: 'Repite el cuerpo N veces.',
                    logic: 'Ejecuta SUBSTACK N veces. N se evalúa una vez al empezar.',
                    inputs: [
                        {name: 'TIMES', type: 'value', shadow: 'math_number', description: 'Número de repeticiones. Puede ser reporter.'},
                        {name: 'SUBSTACK', type: 'statement', description: 'Cuerpo del bucle: bloques que se repiten'}
                    ],
                    fields: [],
                    nesting: 'DENTRO de SUBSTACK van stacks, reporters dentro de sus inputs, y C-blocks pueden anidarse.'
                },
                {
                    opcode: 'control_forever',
                    shape: 'c',
                    description: 'Repite el cuerpo para siempre.',
                    logic: 'Bucle infinito. Solo se detiene con el botón rojo o "detener todo".',
                    inputs: [
                        {name: 'SUBSTACK', type: 'statement', description: 'Cuerpo del bucle infinito'}
                    ],
                    fields: [],
                    nesting: 'Dentro de SUBSTACK puede ir cualquier cosa, incluyendo otros C-blocks.'
                },
                {
                    opcode: 'control_if',
                    shape: 'c',
                    description: 'Si CONDITION es verdadera, ejecuta SUBSTACK.',
                    logic: 'Evalúa CONDITION (boolean). Si es true, ejecuta el cuerpo. Sino, salta.',
                    inputs: [
                        {name: 'CONDITION', type: 'value', shadow: 'boolean', description: 'Condición booleana: operator_gt, operator_and, sensing_touchingobject, etc.'},
                        {name: 'SUBSTACK', type: 'statement', description: 'Cuerpo si la condición es verdadera'}
                    ],
                    fields: [],
                    nesting: 'DENTRO de CONDITION va un bloque boolean. DENTRO de SUBSTACK van stacks. Puede haber C-blocks anidados dentro de SUBSTACK.'
                },
                {
                    opcode: 'control_if_else',
                    shape: 'c',
                    description: 'Si CONDITION es verdadera, ejecuta SUBSTACK. Sino, ejecuta SUBSTACK2.',
                    logic: 'Bifurcación completa: un camino si true, otro si false.',
                    inputs: [
                        {name: 'CONDITION', type: 'value', shadow: 'boolean', description: 'Condición booleana'},
                        {name: 'SUBSTACK', type: 'statement', description: 'Cuerpo si verdadero'},
                        {name: 'SUBSTACK2', type: 'statement', description: 'Cuerpo si falso (sino)'}
                    ],
                    fields: [],
                    nesting: 'CONDITION = boolean. SUBSTACK y SUBSTACK2 pueden tener bloques adentro, incluyendo otros if/else.'
                },
                {
                    opcode: 'control_wait_until',
                    shape: 'stack',
                    description: 'Espera hasta que CONDITION sea verdadera.',
                    logic: 'Bloquea el script hasta que la condición se cumpla.',
                    inputs: [
                        {name: 'CONDITION', type: 'value', shadow: 'boolean', description: 'Condición a esperar'}
                    ],
                    fields: [],
                    nesting: 'CONDITION lleva un boolean adentro.'
                },
                {
                    opcode: 'control_repeat_until',
                    shape: 'c',
                    description: 'Repite SUBSTACK hasta que CONDITION sea verdadera.',
                    logic: 'Evalúa la condición después de cada iteración. Si es false, repite. Si true, sale.',
                    inputs: [
                        {name: 'CONDITION', type: 'value', shadow: 'boolean', description: 'Condición de salida'},
                        {name: 'SUBSTACK', type: 'statement', description: 'Cuerpo a repetir'}
                    ],
                    fields: [],
                    nesting: 'CONDITION = boolean. SUBSTACK = bloques.'
                },
                {
                    opcode: 'control_stop',
                    shape: 'end',
                    description: 'Detiene: "todo", "este script", u "otros scripts del objeto".',
                    logic: 'Termina la ejecución según la opción elegida. No puede tener next.',
                    inputs: [],
                    fields: [],
                    nesting: 'Es un bloque END. No tiene next. Es el último de su cadena.'
                },
                {
                    opcode: 'control_create_clone_of',
                    shape: 'stack',
                    description: 'Crea un clon del objeto indicado.',
                    logic: 'Duplica el sprite. Los clones empiezan con el hat "al comenzar como clon".',
                    inputs: [
                        {name: 'CLONE_OPTION', type: 'value', shadow: 'control_create_clone_of_menu', description: 'Objeto a clonar: "mí mismo" u otro sprite'}
                    ],
                    fields: []
                },
                {
                    opcode: 'control_start_as_clone',
                    shape: 'hat',
                    description: 'Se ejecuta cuando se crea un clon.',
                    logic: 'Punto de entrada para clones. Se dispara automáticamente al crear un clon.',
                    inputs: [],
                    fields: [],
                    nesting: 'Top-level. No tiene parent.'
                },
                {
                    opcode: 'control_delete_this_clone',
                    shape: 'end',
                    description: 'Elimina este clon.',
                    logic: 'Termina la vida del clon actual. No puede tener next.',
                    inputs: [],
                    fields: [],
                    nesting: 'Bloque END. Es terminal en su cadena.'
                }
            ]
        },
        {
            name: 'Sensores',
            id: 'sensing',
            color: 'Celeste',
            blocks: [
                {
                    opcode: 'sensing_touchingobject',
                    shape: 'boolean',
                    description: '¿Está tocando al objeto indicado?',
                    logic: 'Detecta colisión con el borde, puntero del mouse, u otro sprite.',
                    inputs: [
                        {name: 'TOUCHINGOBJECTMENU', type: 'value', shadow: 'sensing_touchingobjectmenu', description: 'Objeto: "borde", "puntero del ratón", o nombre de sprite'}
                    ],
                    fields: [],
                    nesting: 'Va DENTRO de CONDITION de control_if, control_repeat_until, control_wait_until. También dentro de operator_and/or/not.'
                },
                {
                    opcode: 'sensing_touchingcolor',
                    shape: 'boolean',
                    description: '¿Está tocando el color indicado?',
                    logic: 'Detecta si el sprite toca un color específico en el escenario.',
                    inputs: [
                        {name: 'COLOR', type: 'value', shadow: 'colour_picker', description: 'Color a detectar'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'sensing_coloristouchingcolor',
                    shape: 'boolean',
                    description: '¿El color A está tocando al color B?',
                    logic: 'Detecta si un color del sprite toca otro color.',
                    inputs: [
                        {name: 'COLOR', type: 'value', shadow: 'colour_picker', description: 'Color del sprite'},
                        {name: 'COLOR2', type: 'value', shadow: 'colour_picker', description: 'Color destino'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'sensing_distanceto',
                    shape: 'reporter',
                    description: 'Devuelve la distancia al objeto o puntero.',
                    logic: 'Calcula píxeles de distancia.',
                    inputs: [
                        {name: 'DISTANCETOMENU', type: 'value', shadow: 'sensing_distancetomenu', description: 'Destino: "puntero del ratón" o nombre de sprite'}
                    ],
                    fields: [],
                    nesting: 'Va dentro de input value numérico.'
                },
                {
                    opcode: 'sensing_askandwait',
                    shape: 'stack',
                    description: 'Muestra una pregunta y espera respuesta del usuario.',
                    logic: 'Aparece un cuadro de texto. El usuario escribe. La respuesta queda en "respuesta".',
                    inputs: [
                        {name: 'QUESTION', type: 'value', shadow: 'text', description: 'Texto de la pregunta'}
                    ],
                    fields: [],
                    nesting: 'Stack normal. Después se usa sensing_answer para obtener lo que escribió.'
                },
                {
                    opcode: 'sensing_answer',
                    shape: 'reporter',
                    description: 'Devuelve la última respuesta ingresada.',
                    logic: 'Texto que el usuario escribió en el último "preguntar".',
                    inputs: [],
                    fields: [],
                    nesting: 'Va dentro de input value, especialmente en operator_join, looks_say, etc.'
                },
                {
                    opcode: 'sensing_keypressed',
                    shape: 'boolean',
                    description: '¿La tecla indicada está presionada?',
                    logic: 'Detecta si una tecla está siendo presionada en ese momento.',
                    inputs: [
                        {name: 'KEY_OPTION', type: 'value', shadow: 'sensing_keyoptions', description: 'Tecla: "espacio", "flecha arriba", "a", etc.'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'sensing_mousedown',
                    shape: 'boolean',
                    description: '¿El ratón está presionado?',
                    logic: 'True si hay clic sostenido.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'sensing_mousex',
                    shape: 'reporter',
                    description: 'Devuelve la posición X del ratón.',
                    logic: 'Coordenada X del puntero en el escenario.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_mousey',
                    shape: 'reporter',
                    description: 'Devuelve la posición Y del ratón.',
                    logic: 'Coordenada Y del puntero.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_setdragmode',
                    shape: 'stack',
                    description: 'Fija si el sprite puede arrastrarse o no.',
                    logic: 'Controla si el usuario puede mover el sprite con el mouse.',
                    inputs: [],
                    fields: [],
                    nesting: 'Stack normal.'
                },
                {
                    opcode: 'sensing_loudness',
                    shape: 'reporter',
                    description: 'Devuelve el volumen del micrófono.',
                    logic: 'Nivel de sonido ambiental (0-100).',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_timer',
                    shape: 'reporter',
                    description: 'Devuelve el valor del cronómetro.',
                    logic: 'Segundos desde que se reinició el cronómetro o empezó el proyecto.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_resettimer',
                    shape: 'stack',
                    description: 'Reinicia el cronómetro a 0.',
                    logic: 'Pone el timer en cero.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'sensing_of',
                    shape: 'reporter',
                    description: 'Devuelve una propiedad de un objeto: posición x, y, dirección, etc.',
                    logic: 'Accede a datos de cualquier sprite. Requiere menú de propiedad y objeto.',
                    inputs: [
                        {name: 'OBJECT', type: 'value', shadow: 'sensing_of_object_menu', description: 'Propiedad: "posición x", "posición y", "dirección", "disfraz #", "tamaño", "volumen"' +
                            ' y objeto: "Stage" o nombre del sprite'}
                    ],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_current',
                    shape: 'reporter',
                    description: 'Devuelve la fecha/hora actual: año, mes, día, hora, minuto, segundo.',
                    logic: 'Reloj del sistema.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_dayssince2000',
                    shape: 'reporter',
                    description: 'Devuelve los días desde el 2000.',
                    logic: 'Útil para medir tiempo transcurrido.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                },
                {
                    opcode: 'sensing_username',
                    shape: 'reporter',
                    description: 'Devuelve el nombre del usuario (en la versión web).',
                    logic: 'Solo funciona en la versión web de Scratch.',
                    inputs: [],
                    fields: [],
                    nesting: 'Dentro de input value.'
                }
            ]
        },
        {
            name: 'Operadores',
            id: 'operators',
            color: 'Verde claro',
            blocks: [
                {
                    opcode: 'operator_add',
                    shape: 'reporter',
                    description: 'Suma NUM1 + NUM2.',
                    logic: 'Operación aritmética básica. Devuelve número.',
                    inputs: [
                        {name: 'NUM1', type: 'value', shadow: 'math_number', description: 'Primer número. Puede ser otro reporter u operador.'},
                        {name: 'NUM2', type: 'value', shadow: 'math_number', description: 'Segundo número. Puede ser reporter.'}
                    ],
                    fields: [],
                    nesting: 'Va DENTRO de input value de cualquier bloque que acepte número. NUM1 y NUM2 pueden tener otros reporters adentro (anidación).'
                },
                {
                    opcode: 'operator_subtract',
                    shape: 'reporter',
                    description: 'Resta NUM1 - NUM2.',
                    logic: 'Resta aritmética.',
                    inputs: [
                        {name: 'NUM1', type: 'value', shadow: 'math_number', description: 'Minuendo'},
                        {name: 'NUM2', type: 'value', shadow: 'math_number', description: 'Sustraendo'}
                    ],
                    fields: [],
                    nesting: 'Reporter anidable.'
                },
                {
                    opcode: 'operator_multiply',
                    shape: 'reporter',
                    description: 'Multiplica NUM1 × NUM2.',
                    logic: 'Producto aritmético.',
                    inputs: [
                        {name: 'NUM1', type: 'value', shadow: 'math_number', description: 'Factor 1'},
                        {name: 'NUM2', type: 'value', shadow: 'math_number', description: 'Factor 2'}
                    ],
                    fields: [],
                    nesting: 'Reporter anidable.'
                },
                {
                    opcode: 'operator_divide',
                    shape: 'reporter',
                    description: 'Divide NUM1 ÷ NUM2.',
                    logic: 'División. Si NUM2 = 0, da infinito.',
                    inputs: [
                        {name: 'NUM1', type: 'value', shadow: 'math_number', description: 'Dividendo'},
                        {name: 'NUM2', type: 'value', shadow: 'math_number', description: 'Divisor'}
                    ],
                    fields: [],
                    nesting: 'Reporter anidable.'
                },
                {
                    opcode: 'operator_random',
                    shape: 'reporter',
                    description: 'Número aleatorio entre FROM y TO.',
                    logic: 'Incluye extremos. Si FROM y TO son enteros, devuelve entero.',
                    inputs: [
                        {name: 'FROM', type: 'value', shadow: 'math_number', description: 'Valor mínimo'},
                        {name: 'TO', type: 'value', shadow: 'math_number', description: 'Valor máximo'}
                    ],
                    fields: [],
                    nesting: 'Reporter anidable.'
                },
                {
                    opcode: 'operator_gt',
                    shape: 'boolean',
                    description: '¿OPERAND1 > OPERAND2?',
                    logic: 'Compara dos números. Devuelve true/false.',
                    inputs: [
                        {name: 'OPERAND1', type: 'value', shadow: 'math_number', description: 'Primer valor. Puede ser reporter numérico.'},
                        {name: 'OPERAND2', type: 'value', shadow: 'math_number', description: 'Segundo valor.'}
                    ],
                    fields: [],
                    nesting: 'Va DENTRO de CONDITION. OPERAND1 y OPERAND2 pueden tener reporters numéricos adentro (motion_xposition, operator_add, etc.).'
                },
                {
                    opcode: 'operator_lt',
                    shape: 'boolean',
                    description: '¿OPERAND1 < OPERAND2?',
                    logic: 'Compara dos números.',
                    inputs: [
                        {name: 'OPERAND1', type: 'value', shadow: 'math_number', description: 'Primer valor'},
                        {name: 'OPERAND2', type: 'value', shadow: 'math_number', description: 'Segundo valor'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION. Puede tener reporters adentro.'
                },
                {
                    opcode: 'operator_equals',
                    shape: 'boolean',
                    description: '¿OPERAND1 = OPERAND2?',
                    logic: 'Compara igualdad. Funciona con números y textos.',
                    inputs: [
                        {name: 'OPERAND1', type: 'value', shadow: 'text', description: 'Primer valor'},
                        {name: 'OPERAND2', type: 'value', shadow: 'text', description: 'Segundo valor'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'operator_and',
                    shape: 'boolean',
                    description: '¿OPERAND1 Y OPERAND2 son verdaderos? (AND lógico)',
                    logic: 'Solo true si AMBAS condiciones son verdaderas.',
                    inputs: [
                        {name: 'OPERAND1', type: 'value', shadow: 'boolean', description: 'Primera condición booleana'},
                        {name: 'OPERAND2', type: 'value', shadow: 'boolean', description: 'Segunda condición booleana'}
                    ],
                    fields: [],
                    nesting: 'Va DENTRO de CONDITION. OPERAND1 y OPERAND2 pueden ser otros booleans (operator_gt, operator_lt, sensing_touchingobject, etc.).'
                },
                {
                    opcode: 'operator_or',
                    shape: 'boolean',
                    description: '¿OPERAND1 U OPERAND2 es verdadero? (OR lógico)',
                    logic: 'True si al menos UNA condición es verdadera.',
                    inputs: [
                        {name: 'OPERAND1', type: 'value', shadow: 'boolean', description: 'Primera condición'},
                        {name: 'OPERAND2', type: 'value', shadow: 'boolean', description: 'Segunda condición'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION. Puede contener otros booleans.'
                },
                {
                    opcode: 'operator_not',
                    shape: 'boolean',
                    description: 'Invierte la condición: true → false, false → true. (NOT lógico)',
                    logic: 'Niega la condición booleana.',
                    inputs: [
                        {name: 'OPERAND', type: 'value', shadow: 'boolean', description: 'Condición a negar'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION. OPERAND es otro boolean.'
                },
                {
                    opcode: 'operator_join',
                    shape: 'reporter',
                    description: 'Une STRING1 + STRING2 en un solo texto.',
                    logic: 'Concatenación de textos. Puede unir texto con números.',
                    inputs: [
                        {name: 'STRING1', type: 'value', shadow: 'text', description: 'Primer texto. Puede ser reporter de texto (sensing_answer, etc.).'},
                        {name: 'STRING2', type: 'value', shadow: 'text', description: 'Segundo texto.'}
                    ],
                    fields: [],
                    nesting: 'Reporter de texto. Va dentro de input value que espera texto (decir, unir, preguntar, etc.).'
                },
                {
                    opcode: 'operator_letter_of',
                    shape: 'reporter',
                    description: 'Devuelve la letra en la posición LETTER de STRING.',
                    logic: 'LETTER = 1 da la primera letra.',
                    inputs: [
                        {name: 'LETTER', type: 'value', shadow: 'math_number', description: 'Posición de la letra (1 = primera)'},
                        {name: 'STRING', type: 'value', shadow: 'text', description: 'Texto de donde extraer'}
                    ],
                    fields: [],
                    nesting: 'Reporter.'
                },
                {
                    opcode: 'operator_length',
                    shape: 'reporter',
                    description: 'Devuelve la cantidad de caracteres de STRING.',
                    logic: 'Cuenta caracteres (incluye espacios).',
                    inputs: [
                        {name: 'STRING', type: 'value', shadow: 'text', description: 'Texto a medir'}
                    ],
                    fields: [],
                    nesting: 'Reporter numérico.'
                },
                {
                    opcode: 'operator_contains',
                    shape: 'boolean',
                    description: '¿STRING1 contiene a STRING2?',
                    logic: 'Búsqueda de subtexto. Distingue mayúsculas? Depende de versión.',
                    inputs: [
                        {name: 'STRING1', type: 'value', shadow: 'text', description: 'Texto donde buscar'},
                        {name: 'STRING2', type: 'value', shadow: 'text', description: 'Texto a buscar'}
                    ],
                    fields: [],
                    nesting: 'Dentro de CONDITION.'
                },
                {
                    opcode: 'operator_mod',
                    shape: 'reporter',
                    description: 'Devuelve el resto de NUM1 ÷ NUM2 (módulo).',
                    logic: 'Resto de la división. Ej: 10 mod 3 = 1.',
                    inputs: [
                        {name: 'NUM1', type: 'value', shadow: 'math_number', description: 'Dividendo'},
                        {name: 'NUM2', type: 'value', shadow: 'math_number', description: 'Divisor'}
                    ],
                    fields: [],
                    nesting: 'Reporter.'
                },
                {
                    opcode: 'operator_round',
                    shape: 'reporter',
                    description: 'Redondea NUM al entero más cercano.',
                    logic: '.5 redondea hacia arriba.',
                    inputs: [
                        {name: 'NUM', type: 'value', shadow: 'math_number', description: 'Número a redondear'}
                    ],
                    fields: [],
                    nesting: 'Reporter.'
                },
                {
                    opcode: 'operator_mathop',
                    shape: 'reporter',
                    description: 'Aplica función matemática a NUM: raíz, seno, coseno, etc.',
                    logic: 'Funciones: "raíz cuadrada", "absoluto", "seno", "coseno", "tangente", "arcoseno", "arcocoseno", "arctangente", "logaritmo natural", "logaritmo", "e^", "10^".',
                    inputs: [
                        {name: 'NUM', type: 'value', shadow: 'math_number', description: 'Número a transformar'}
                    ],
                    fields: [],
                    nesting: 'Reporter.'
                }
            ]
        },
        {
            name: 'Variables',
            id: 'data',
            color: 'Naranja oscuro',
            blocks: [
                {
                    opcode: 'data_setvariableto',
                    shape: 'stack',
                    description: 'Asigna un valor a una variable.',
                    logic: 'Guarda VALUE en la variable. Si la variable no existe, se crea automáticamente.',
                    inputs: [
                        {name: 'VALUE', type: 'value', shadow: 'text', description: 'Valor a asignar. Puede ser número, texto, o reporter.'}
                    ],
                    fields: [{name: 'VARIABLE', type: 'variable', description: 'Nombre de la variable'}],
                    nesting: 'Stack normal. VALUE puede tener cualquier reporter adentro.'
                },
                {
                    opcode: 'data_changevariableby',
                    shape: 'stack',
                    description: 'Cambia la variable sumando N.',
                    logic: 'Suma VALUE al valor actual de la variable.',
                    inputs: [
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Cantidad a sumar'}
                    ],
                    fields: [{name: 'VARIABLE', type: 'variable', description: 'Nombre de la variable'}],
                    nesting: 'Stack normal.'
                },
                {
                    opcode: 'data_showvariable',
                    shape: 'stack',
                    description: 'Muestra el monitor de la variable en el escenario.',
                    logic: 'Hace visible el monitor de la variable.',
                    inputs: [],
                    fields: [{name: 'VARIABLE', type: 'variable', description: 'Nombre de la variable'}]
                },
                {
                    opcode: 'data_hidevariable',
                    shape: 'stack',
                    description: 'Esconde el monitor de la variable.',
                    logic: 'Oculta el monitor.',
                    inputs: [],
                    fields: [{name: 'VARIABLE', type: 'variable', description: 'Nombre de la variable'}]
                },
                {
                    opcode: 'data_addtolist',
                    shape: 'stack',
                    description: 'Agrega ITEM al final de la lista.',
                    logic: 'Añade un elemento al final de la lista.',
                    inputs: [
                        {name: 'ITEM', type: 'value', shadow: 'text', description: 'Elemento a agregar'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'data_deleteoflist',
                    shape: 'stack',
                    description: 'Elimina el elemento en la posición INDEX de la lista.',
                    logic: 'Borra un elemento por su índice (1 = primero).',
                    inputs: [
                        {name: 'INDEX', type: 'value', shadow: 'math_number', description: 'Posición a eliminar'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'data_deletealloflist',
                    shape: 'stack',
                    description: 'Borra todos los elementos de la lista.',
                    logic: 'Limpia la lista completa.',
                    inputs: [],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'data_insertatlist',
                    shape: 'stack',
                    description: 'Inserta ITEM en la posición INDEX de la lista.',
                    logic: 'Inserta sin borrar el elemento existente (corre los demás).',
                    inputs: [
                        {name: 'ITEM', type: 'value', shadow: 'text', description: 'Elemento a insertar'},
                        {name: 'INDEX', type: 'value', shadow: 'math_number', description: 'Posición de inserción'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'data_replaceitemoflist',
                    shape: 'stack',
                    description: 'Reemplaza el elemento en INDEX con ITEM.',
                    logic: 'Cambia el valor en esa posición.',
                    inputs: [
                        {name: 'INDEX', type: 'value', shadow: 'math_number', description: 'Posición a reemplazar'},
                        {name: 'ITEM', type: 'value', shadow: 'text', description: 'Nuevo valor'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'data_itemoflist',
                    shape: 'reporter',
                    description: 'Devuelve el elemento en posición INDEX.',
                    logic: 'Acceso a elemento por índice.',
                    inputs: [
                        {name: 'INDEX', type: 'value', shadow: 'math_number', description: 'Posición del elemento'}
                    ],
                    fields: [],
                    nesting: 'Reporter. Va dentro de input value.'
                },
                {
                    opcode: 'data_itemnumoflist',
                    shape: 'reporter',
                    description: 'Devuelve el índice del primer ITEM encontrado en la lista.',
                    logic: 'Busca el elemento y devuelve su posición. 0 si no existe.',
                    inputs: [
                        {name: 'ITEM', type: 'value', shadow: 'text', description: 'Elemento a buscar'}
                    ],
                    fields: [],
                    nesting: 'Reporter.'
                },
                {
                    opcode: 'data_lengthoflist',
                    shape: 'reporter',
                    description: 'Devuelve la cantidad de elementos de la lista.',
                    logic: 'Cantidad de items. 0 si está vacía.',
                    inputs: [],
                    fields: [],
                    nesting: 'Reporter.'
                },
                {
                    opcode: 'data_listcontainsitem',
                    shape: 'boolean',
                    description: '¿La lista contiene a ITEM?',
                    logic: 'Devuelve true si el elemento está en la lista.',
                    inputs: [
                        {name: 'ITEM', type: 'value', shadow: 'text', description: 'Elemento a buscar'}
                    ],
                    fields: [],
                    nesting: 'Boolean. Va dentro de CONDITION.'
                },
                {
                    opcode: 'data_showlist',
                    shape: 'stack',
                    description: 'Muestra el monitor de la lista.',
                    logic: 'Hace visible la lista en el escenario.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'data_hidelist',
                    shape: 'stack',
                    description: 'Esconde el monitor de la lista.',
                    logic: 'Oculta la lista del escenario.',
                    inputs: [],
                    fields: []
                }
            ]
        },
        {
            name: 'Lápiz',
            id: 'pen',
            color: 'Verde oscuro',
            blocks: [
                {
                    opcode: 'pen_clear',
                    shape: 'stack',
                    description: 'Borra todo lo dibujado con el lápiz.',
                    logic: 'Limpia el escenario de todas las marcas de lápiz.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'pen_stamp',
                    shape: 'stack',
                    description: 'Sella una copia del sprite en el escenario.',
                    logic: 'Deja una imagen estática del sprite en el escenario.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'pen_penDown',
                    shape: 'stack',
                    description: 'Baja el lápiz (empieza a dibujar al moverse).',
                    logic: 'Al moverse con "mover pasos", deja un trazo.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'pen_penUp',
                    shape: 'stack',
                    description: 'Sube el lápiz (deja de dibujar).',
                    logic: 'Los movimientos ya no dejan trazo.',
                    inputs: [],
                    fields: []
                },
                {
                    opcode: 'pen_setPenColorToColor',
                    shape: 'stack',
                    description: 'Establece el color del lápiz.',
                    logic: 'Cambia el color del trazo.',
                    inputs: [
                        {name: 'COLOR', type: 'value', shadow: 'colour_picker', description: 'Color del lápiz'}
                    ],
                    fields: []
                },
                {
                    opcode: 'pen_changePenColorParamBy',
                    shape: 'stack',
                    description: 'Cambia un parámetro del color: tono, saturación, brillo.',
                    logic: 'Ajusta fino del color.',
                    inputs: [
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Valor del cambio'}
                    ],
                    fields: []
                },
                {
                    opcode: 'pen_setPenColorParamTo',
                    shape: 'stack',
                    description: 'Establece un parámetro del color a un valor.',
                    logic: 'Fija tono, saturación o brillo exacto.',
                    inputs: [
                        {name: 'VALUE', type: 'value', shadow: 'math_number', description: 'Valor a fijar'}
                    ],
                    fields: []
                },
                {
                    opcode: 'pen_changePenSizeBy',
                    shape: 'stack',
                    description: 'Cambia el tamaño del lápiz en N.',
                    logic: 'Grosor del trazo.',
                    inputs: [
                        {name: 'SIZE', type: 'value', shadow: 'math_number', description: 'Cambio de tamaño'}
                    ],
                    fields: []
                },
                {
                    opcode: 'pen_setPenSizeTo',
                    shape: 'stack',
                    description: 'Establece el tamaño del lápiz a N.',
                    logic: 'Grosor del trazo en píxeles.',
                    inputs: [
                        {name: 'SIZE', type: 'value', shadow: 'math_number', description: 'Tamaño del lápiz'}
                    ],
                    fields: []
                }
            ]
        },
        {
            name: 'Música',
            id: 'music',
            color: 'Violeta',
            blocks: [
                {
                    opcode: 'music_playDrumForBeats',
                    shape: 'stack',
                    description: 'Toca un tambor por N pulsos.',
                    logic: 'Reproduce sonido de percusión. N define duración.',
                    inputs: [
                        {name: 'BEATS', type: 'value', shadow: 'math_number', description: 'Duración en pulsos'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_restForBeats',
                    shape: 'stack',
                    description: 'Silencio por N pulsos.',
                    logic: 'Pausa musical de N pulsos.',
                    inputs: [
                        {name: 'BEATS', type: 'value', shadow: 'math_number', description: 'Pulsos de silencio'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_playNoteForBeats',
                    shape: 'stack',
                    description: 'Toca una nota musical por N pulsos.',
                    logic: 'Reproduce una nota (60 = Do central). Duración en pulsos según tempo.',
                    inputs: [
                        {name: 'NOTE', type: 'value', shadow: 'math_number', description: 'Nota (60 = Do central, 72 = Do 5)'},
                        {name: 'BEATS', type: 'value', shadow: 'math_number', description: 'Duración en pulsos'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_setInstrument',
                    shape: 'stack',
                    description: 'Selecciona un instrumento musical.',
                    logic: 'Cambia el instrumento (1 = Piano, 2 = Órgano, etc.).',
                    inputs: [],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_setTempo',
                    shape: 'stack',
                    description: 'Establece el tempo a N bpm.',
                    logic: 'Velocidad de la música en pulsos por minuto.',
                    inputs: [
                        {name: 'TEMPO', type: 'value', shadow: 'math_number', description: 'Tempo en bpm'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_changeTempo',
                    shape: 'stack',
                    description: 'Cambia el tempo en N bpm.',
                    logic: 'Acelera o desacelera el tempo.',
                    inputs: [
                        {name: 'TEMPO', type: 'value', shadow: 'math_number', description: 'Cambio de tempo'}
                    ],
                    fields: [],
                    nesting: 'Stack.'
                },
                {
                    opcode: 'music_getTempo',
                    shape: 'reporter',
                    description: 'Devuelve el tempo actual.',
                    logic: 'Valor numérico del tempo en bpm.',
                    inputs: [],
                    fields: [],
                    nesting: 'Reporter dentro de input value.'
                }
            ]
        }
    ]
};

export default BLOCK_STRUCTURES;
