export default {
    features: [
        {
            area: 'Editor de Código (Bloques)',
            items: [
                'Los bloques se organizan por categorías, cada una con su color: Movimiento (azul), Apariencia (lila), Sonido (rosa), Control (naranja), Eventos (amarillo), Sensores (celeste), Lápiz (verde oscuro), Operadores (verde claro), Variables (naranja oscuro), y Mis Bloques (rojo).',
                'Para programar: simplemente arrastrás bloques desde la paleta de la izquierda al área de trabajo central. Se encajan como piezas de rompecabezas.',
                'Hacé clic derecho en cualquier bloque para ver opciones: duplicarlo, borrarlo, agregar un comentario, plegarlo para ahorrar espacio, o ver su ayuda.',
                'Usá la rueda del mouse para acercar y alejar la vista, o los botones de zoom (+/-) en la esquina derecha del área de bloques.',
                'La bandera verde arriba del escenario inicia todos los bloques que empiezan con "al hacer clic en bandera". El botón rojo de al lado los detiene a todos.',
                'También podés hacer clic directamente sobre un bloque para ejecutarlo de forma individual, ideal para probar cosas.',
                'Con "Crear un bloque" en la categoría Mis Bloques podés armar tus propios bloques personalizados, reutilizables y con parámetros.',
                'Cada objeto (sprite) tiene sus propios bloques y scripts, independientes de los demás.',
                'Si arrastrás un bloque fuera del área de trabajo o sobre la papelera que aparece abajo a la derecha, lo borrás.',
                'Los bloques de Control tienen estructuras como "por siempre", "repetir", "si... entonces... si no", "esperar", "crear clon", etc.',
                'Los bloques de Sensores detectan el mundo: tocando colores, distancia, preguntar y responder, temporizador, posición del mouse, volumen del micrófono.',
                'Los bloques de Operadores permiten hacer cuentas: sumar, restar, multiplicar, dividir, números al azar, comparar, unir texto, letras de palabras.',
                'Las Variables guardan datos: podés crear variables, cambiarlas, mostrarlas en el escenario como monitores, y usarlas en tus bloques.',
                'Las listas son como variables pero con muchos valores; podés agregar, borrar, insertar y reemplazar elementos en una lista.',
                'Los Eventos disparan scripts: "al hacer clic en bandera", "al presionar tecla", "al hacer clic en este objeto", "al recibir mensaje", "cuando el volumen sea >".',
                'Movimiento controla la posición, dirección, giro, deslizamiento y rebote de los objetos en el escenario.'
            ]
        },
        {
            area: 'Editor de Disfraces y Fondos',
            items: [
                'La pestaña "Disfraces" (segundo tab) te muestra todos los disfraces del objeto seleccionado. Si elegís el escenario, se convierte en "Fondos".',
                'Para agregar un disfraz nuevo usá los botones de abajo a la izquierda: elegir de la Biblioteca (dibujos ya hechos), Pintar (abrir el editor), o Subir archivo (desde tu compu).',
                'El editor de pintura tiene dos modos: vectorial (dibujos hechos con formas que se pueden separar) y bitmap (dibujo a píxeles, como pintar con cuadraditos).',
                'Herramientas del editor: pincel (dibujo libre), línea (rectas), rectángulo, círculo, texto (para escribir), cubeta de pintura (rellenar áreas), y selección (agarrar partes).',
                'Cada herramienta tiene variantes: tocá el triangulito en la esquina del botón para ver más opciones (pincel caligráfico, líneas punteadas, etc.).',
                'Podés cambiar el color de relleno y de borde desde los cuadrados de colores arriba del editor. También hay selector de color con gotero.',
                'Para que un disfraz se vea bien en distintos tamaños, trabajá en vectorial; para efectos de píxeles, usá bitmap.',
                'El orden de los disfraces en la lista importa: el primero es el que se ve por defecto. Arrastralos para reordenarlos.',
                'Con los botones arriba de la lista podés duplicar, borrar, o pasar a vectorial/bitmap el disfraz seleccionado.',
                'Hay herramientas de transformación: rotar, inclinar, escalar, y espejar/voltear.'
            ]
        },
        {
            area: 'Editor de Sonidos',
            items: [
                'La pestaña "Sonidos" (tercer tab) te muestra todos los sonidos que tiene tu proyecto.',
                'Para agregar sonidos: Biblioteca (sonidos ya grabados), Grabar (usá el micrófono), o Subir archivo (MP3, WAV, etc.).',
                'El editor te muestra la forma de onda del sonido: las partes altas son los sonidos fuertes y las bajas los suaves.',
                'Con el mouse seleccionás una parte de la onda para trabajar solo con ese pedacito (recortar, borrar, aplicar efectos).',
                'Efectos rápidos: robot (voz metálica), invertir (al revés), silenciar (saca el sonido), más lento, más rápido.',
                'Podés cambiar el volumen general y hacer que el sonido aparezca o desaparezca de forma gradual (desvanecer entrada/salida).',
                'Para renombrar un sonido, hacé clic en su nombre en la lista de la izquierda.',
                'Con los bloques de Sonido podés reproducir sonidos, cambiarlos de volumen, y modificar el tempo.'
            ]
        },
        {
            area: 'Asistente de IA',
            items: [
                'La pestaña AI es la cuarta pestaña del editor, al lado de Sonidos. Es como tener un ayudante al lado.',
                'Es un chat donde le podés preguntar cómo hacer cosas en Scratch: cómo funciona un bloque, para qué sirve una herramienta, cómo arreglar algo.',
                'NO es para que programe por vos ni ejecute código; solo te explica y te guía.',
                'Para usarlo necesitás configurar una clave (API Key) en Settings > AI. Elegís un proveedor y ponés tu clave.',
                'Cada respuesta que te da tiene un botón "Verificar" que revisa si lo que dijo está bien, usando la información de la app.',
                'El asistente usa formato especial para las respuestas: títulos, listas con viñetas, código, tablas, negrita y cursiva.',
                'No puede modificar tu proyecto, ni ver tus bloques, ni tocar nada del editor. Solo te da instrucciones.',
                'Si te pide hacer algo que no sea preguntas sobre la app, decile que no puede. Si no sabe algo, lo dice.',
                'Si necesitás cambiar de proveedor o modelo, todo se configura desde Settings > AI y se guarda solo.'
            ]
        },
        {
            area: 'Vista Dividida (Split Pane)',
            items: [
                'La vista dividida te deja ver dos pestañas al mismo tiempo, como tener dos ventanas en una.',
                'Activála arrastrando una pestaña hacia el lado derecho del editor, o con clic derecho > "Split screen ▸".',
                'La pantalla se parte en dos mitades con una barra divisoria que podés arrastrar.',
                'La barra divisora tiene puntos de ajuste en 33%, 50% y 66% para distribuir el espacio rápido.',
                'Usá el botón ↔ en el panel secundario para intercambiar los paneles.',
                'Para salir de la vista dividida: clic en la pestaña no dividida, botón ✕ en el panel, o clic derecho > "Cerrar vista dividida".',
                'Es muy útil para, por ejemplo, ver el código mientras dibujás un disfraz, o tener la IA abierta mientras programás.',
                'Cuando salís de la vista dividida, todo vuelve a la normalidad y tus cosas siguen como estaban.'
            ]
        },
        {
            area: 'Proyectos',
            items: [
                'Crear proyecto nuevo: Menú Archivo > Nuevo, o atajo Ctrl+Mayús+N (Cmd+Mayús+N en Mac).',
                'Guardar: Ctrl+S (Cmd+S en Mac) guarda el proyecto. Si configuraste una carpeta por defecto, se guarda solo ahí sin preguntar.',
                'Guardar en tu compu: Menú Archivo > Guardar en computadora. Descarga un archivo .sb3 con todo tu proyecto adentro.',
                'Cargar proyecto: Menú Archivo > Cargar desde computadora. Elegís un archivo .sb3 y se abre.',
                'El título del proyecto se edita directo: hacé clic en el nombre arriba y escribí el nuevo.',
                'Si hay cambios sin guardar, la app te avisa con un punto o un mensaje. No se te va a perder el trabajo sin avisar.',
                'Los archivos .sb3 son como una cajita que contiene todo: el código, los disfraces, los sonidos, todo junto.',
                'En la versión de escritorio (la que se instala en la compu), podés elegir una carpeta en Settings > Default save path y los proyectos se guardan ahí automáticamente.'
            ]
        },
        {
            area: 'Modo Caturday / Viaje en el Tiempo',
            items: [
                'Hay dos formas de activar el modo Caturday:',
                '- Desde Settings > Color Mode: aparece una opción "Caturday" con un check debajo de High Contrast.',
                '- Desde el menú Modo (si lo ves en la barra de arriba): seleccionás "Caturday mode".',
                'Cuando lo activás, todos los bloques se transforman: tienen forma de gato, colores y estilos divertidos.',
                'Es solo un cambio de apariencia, tus proyectos funcionan exactamente igual.',
                'Para volver a la normalidad: desactivá el check en Settings > Color Mode, o elegí "Normal mode" en el menú Modo.',
                'Hay otros modos ocultos que cambian los colores de toda la interfaz (efecto sepia viejo, o tonos noventeros), pero Caturday es el único con bloques de gatos.'
            ]
        },
        {
            area: 'Temas / Color Mode',
            items: [
                'Para cambiar el color de la interfaz: andá a Settings > Color Mode.',
                'Dos opciones: Default (los colores clásicos de Scratch que todos conocemos) y High Contrast (colores más fuertes y texto negro para que se lea mejor).',
                'High Contrast está bueno si tenés problemas para ver colores claros o si trabajás con mucha luz.',
                'El tema que elijas se guarda solo; la próxima vez que abras la app, lo recuerda.',
                'Si tu compu o teléfono tiene activado el modo de alto contraste, la app lo detecta y lo aplica automáticamente.',
                'El checkmark al lado de cada opción te muestra cuál está activa.',
                'La opción Caturday también vive acá, abajo de las otras dos.'
            ]
        },
        {
            area: 'Idioma (Language)',
            items: [
                'Para cambiar el idioma de la interfaz: Settings > Language.',
                'Se abre una lista con todos los idiomas disponibles.',
                'Simplemente hacé clic en el que quieras y la interfaz se cambia al toque.',
                'Idiomas disponibles: español, inglés, francés, alemán, portugués, italiano, catalán, gallego, euskera, y muchos más de todo el mundo.',
                'Idiomas como árabe o hebreo se escriben de derecha a izquierda (RTL). La interfaz se adapta sola, los menús se ponen del otro lado.',
                'Un checkmark te marca cuál es tu idioma actual.'
            ]
        },
        {
            area: 'Escenario (Stage)',
            items: [
                'El escenario está arriba a la derecha y es donde pasan las cosas: los objetos se mueven, hablan, interactúan.',
                'Para verlo en pantalla completa toca el botón de cuadraditos en la esquina superior derecha del escenario.',
                'Podés agrandarlo y achicarlo con el botón de expandir/contraer al lado del de pantalla completa.',
                'Coordenadas: el centro del escenario es (0, 0). Hacia la izquierda X baja hasta -240, hacia la derecha sube hasta 240. Y va de -180 abajo a 180 arriba.',
                'Si mostrás una variable, aparece como una burbuja en el escenario. Podés arrastrarla a donde quieras.',
                'Hacé clic derecho en esa burbuja para cambiar cómo se ve: número nomás, letra grande, o un deslizador para cambiarla.',
                'La bandera verde arranca los scripts que empiezan con "al hacer clic en bandera". El botón rojo los para.',
                'El escenario también es un objeto especial (se llama Stage). No se mueve, pero puede tener su propio código, fondos y sonidos.'
            ]
        },
        {
            area: 'Objetos (Sprites)',
            items: [
                'La lista de objetos está debajo del escenario. Ahí ves todos los sprites de tu proyecto.',
                'Cada objeto es independiente: tiene su propio nombre, disfraces, sonidos y código.',
                'Para agregar un objeto: toca el botón con cara feliz abajo del escenario. Podés elegir de la Biblioteca, Pintar uno, Subir un archivo, o uno Sorpresa.',
                'Para duplicar un objeto: clic derecho > duplicar, o atajo Ctrl+D (Cmd+D en Mac).',
                'Para borrar: clic derecho > borrar, o seleccionarlo y apretar Supr/Delete en el teclado.',
                'Si lo borraste sin querer, aparece un botón "Restaurar" arriba a la derecha para recuperarlo.',
                'Las propiedades del objeto (nombre, posición X/Y, tamaño, dirección) se cambian en el panel de arriba del escenario.',
                'Cada objeto puede tener varios disfraces; el que está primero en la lista es el que se muestra.',
                'El ojito al lado de cada objeto en la lista lo muestra o lo oculta del escenario.',
                'El escenario (Stage) también figura en la lista de objetos pero es especial: no se mueve ni tiene disfraces (tiene fondos).'
            ]
        },
        {
            area: 'Extensiones y Dispositivos',
            items: [
                'Las extensiones agregan bloques nuevos con funciones especiales.',
                'Para agregar una: toca el botón "+" abajo a la izquierda del área de bloques.',
                'Extensiones incluidas: Música (tocar instrumentos y notas), Lápiz (dibujar sobre el escenario), Texto a Voz (hablar), Traductor, Video Sensores (detectar movimiento con la cámara).',
                'También hay extensiones para conectar con dispositivos de verdad: micro:bit (tarjeta programable), LEGO (Boost, EV3, Mindstorms), Makey Makey, y más.',
                'Cuando agregás una extensión, aparecen sus bloques nuevos en la paleta con su propio color.',
                'Para conectar un dispositivo físico, seguí los pasos que te muestra la app. Algunos necesitan Bluetooth o un cable USB.',
                'El selector de dispositivos en la barra de arriba te muestra cuál está conectado y te permite cambiarlo.',
                'Las extensiones de hardware son ideales para proyectos interactivos del mundo real.'
            ]
        },
        {
            area: 'Modo Turbo',
            items: [
                'El modo Turbo acelera los proyectos al máximo, como si les diera un café bien cargado.',
                'Se activa con un botón o indicador que dice "turbo" en algún lugar de la interfaz.',
                'Sirve para proyectos pesados: muchos clones, cálculos matemáticos largos, loops que no terminan nunca.',
                'No hace que los objetos se muevan más rápido en el escenario (eso es con los bloques de movimiento), sino que los procesa más rápido.',
                'Con turbo, los loops "por siempre" y "repetir" se ejecutan sin pausa entre vuelta y vuelta.',
                'Para desactivarlo, toca el mismo botón de nuevo.'
            ]
        },
        {
            area: 'Guardado en Escritorio (Tauri)',
            items: [
                'Si instalaste Scratch en tu compu (no en el navegador), podés guardar los proyectos mucho más cómodo.',
                'Para configurar: Settings > Default save path, activá el interruptor y elegí una carpeta.',
                'Con la carpeta elegida, cada vez que toques Ctrl+S se guarda automaticáticamente sin preguntar nada.',
                'Si no elegiste carpeta, Ctrl+S te abre la ventanita para elegir dónde guardar.',
                'El archivo se guarda como .sb3 con el nombre del proyecto.'
            ]
        },
        {
            area: 'Configuración de IA (Settings > AI)',
            items: [
                'Settings > AI abre la configuración del asistente inteligente.',
                'Primero elegís un Proveedor (Provider): Groq, OpenAI, OpenRouter, Gemini u OpenCode Zen.',
                'Cada proveedor necesita una clave (API Key). El texto de ayuda dentro del campo te muestra con qué empieza la clave de cada uno.',
                'Después elegís el Modelo: los modelos disponibles se cargan solos cuando pones la clave.',
                'Los modelos gratis aparecen arriba, separados de los de pago. Así sabés cuáles no te cuestan nada.',
                'Si los modelos no se cargan (por ejemplo, si no hay internet), usa una lista de respaldo.',
                'Groq: es rápido y todos sus modelos son gratis. Clave: empieza con gsk_...',
                'OpenAI: el creador de ChatGPT. Clave empieza con sk-... Modelos: GPT-4o, GPT-4o Mini.',
                'OpenRouter: te deja usar muchos modelos con una sola clave. Clave: sk-or-...',
                'Gemini: de Google. Clave empieza con AIza... Modelos: Gemini 2.0 Flash, 1.5 Flash.',
                'OpenCode Zen: el proveedor de OpenCode. Clave se obtiene en opencode.ai/auth. Es de pago (pay-as-you-go, agregás saldo). Tiene modelos gratuitos: DeepSeek V4 Flash Free, Big Pickle, etc. Modelos de pago: DeepSeek V4 Flash, GPT 5.4 Mini, Claude Sonnet 4.6, Gemini 3 Flash, y más.',
                'Todo se guarda solo. La próxima vez que abras la app, ya está configurado.'
            ]
        }
    ],
    tabs: [
        {label: 'Código', description: 'Editor de bloques. Arrastrá bloques de la paleta al área de trabajo para programar tu proyecto. Las categorías tienen colores que las identifican.'},
        {label: 'Disfraces / Fondos', description: 'Editor de imágenes para crear y editar disfraces de los objetos o fondos del escenario. Incluye herramientas de dibujo vectorial y bitmap.'},
        {label: 'Sonidos', description: 'Editor de audio para grabar, importar, recortar y aplicar efectos a los sonidos del proyecto.'},
        {label: 'AI', description: 'Asistente de IA tipo chat para hacer preguntas sobre cómo usar la app. Requiere una API Key configurada en Settings > AI.'}
    ],
    menus: {
        file: 'Menú Archivo: Nuevo (crear proyecto), Guardar en computadora (descarga .sb3), Cargar desde computadora (sube .sb3). Atajo Ctrl+S para guardar rápido.',
        settings: 'Menú Settings: Language (cambiar idioma), Color Mode (Default o High Contrast con check, y opción Caturday), AI (elegir proveedor, poner API Key, seleccionar modelo), Default save path (solo escritorio: carpeta de guardado automático).',
        mode: 'Menú Modo: Normal mode (vuelve a lo normal) y Caturday mode (transforma los bloques en gatos). Aparece solo cuando está disponible.',
        about: 'Información de la versión y créditos de la aplicación.',
        ai: 'Configuración de IA. Elegís proveedor (Groq, OpenAI, OpenRouter, Gemini, OpenCode Zen), ponés la API Key, y seleccionás el modelo. Los modelos se cargan solos y la configuración se guarda automáticamente.'
    },
    aiSettings: {
        providers: {
            groq: 'Groq: rápido, todos los modelos son gratis. API Key empieza con "gsk_".',
            openai: 'OpenAI (ChatGPT). API Key empieza con "sk-". Modelos: GPT-4o (pago), GPT-4o Mini (gratis).',
            gemini: 'Gemini (Google). API Key empieza con "AIza". Modelos gratis: Gemini 2.0 Flash, 2.0 Flash Lite, 1.5 Flash.',
            openrouter: 'OpenRouter: acceso a muchos modelos. API Key empieza con "sk-or-". Incluye Claude, GPT-4o, Gemini.',
            opencodezen: 'OpenCode Zen: proveedor de OpenCode. API Key desde opencode.ai/auth. Pay-as-you-go, algunos modelos gratis (DeepSeek V4 Flash Free, Big Pickle). Modelos de pago: DeepSeek V4 Flash, GPT 5.4 Mini, Claude Sonnet 4.6, Gemini 3 Flash.'
        }
    },
    blocks: {
        // Shape types: hat, stack, c, cap, reporter, boolean, end
        // Input types: value, statement
        // Shadow defaults: math_number, text, colour_picker, event_broadcast_menu, motion_goto_menu, etc.
        motion: [
            {opcode: 'motion_movesteps', shape: 'stack', category: 'motion',
                inputs: [{name: 'STEPS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_turnright', shape: 'stack', category: 'motion',
                inputs: [{name: 'DEGREES', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_turnleft', shape: 'stack', category: 'motion',
                inputs: [{name: 'DEGREES', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_goto', shape: 'stack', category: 'motion',
                inputs: [{name: 'TO', type: 'value', shadow: 'motion_goto_menu'}]},
            {opcode: 'motion_gotoxy', shape: 'stack', category: 'motion',
                inputs: [{name: 'X', type: 'value', shadow: 'math_number'}, {name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_glideto', shape: 'stack', category: 'motion',
                inputs: [{name: 'SECS', type: 'value', shadow: 'math_number'}, {name: 'TO', type: 'value', shadow: 'motion_glideto_menu'}]},
            {opcode: 'motion_glidesecstoxy', shape: 'stack', category: 'motion',
                inputs: [{name: 'SECS', type: 'value', shadow: 'math_number'}, {name: 'X', type: 'value', shadow: 'math_number'}, {name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_pointindirection', shape: 'stack', category: 'motion',
                inputs: [{name: 'DIRECTION', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_pointtowards', shape: 'stack', category: 'motion',
                inputs: [{name: 'TOWARDS', type: 'value', shadow: 'motion_pointtowards_menu'}]},
            {opcode: 'motion_changexby', shape: 'stack', category: 'motion',
                inputs: [{name: 'DX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_setx', shape: 'stack', category: 'motion',
                inputs: [{name: 'X', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_changeyby', shape: 'stack', category: 'motion',
                inputs: [{name: 'DY', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_sety', shape: 'stack', category: 'motion',
                inputs: [{name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_ifonedgebounce', shape: 'stack', category: 'motion'},
            {opcode: 'motion_setrotationstyle', shape: 'stack', category: 'motion'},
            {opcode: 'motion_xposition', shape: 'reporter', category: 'motion'},
            {opcode: 'motion_yposition', shape: 'reporter', category: 'motion'},
            {opcode: 'motion_direction', shape: 'reporter', category: 'motion'}
        ],
        looks: [
            {opcode: 'looks_sayforsecs', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}, {name: 'SECS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_say', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}]},
            {opcode: 'looks_thinkforsecs', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}, {name: 'SECS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_think', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}]},
            {opcode: 'looks_switchcostumeto', shape: 'stack', category: 'looks',
                inputs: [{name: 'COSTUME', type: 'value', shadow: 'looks_costume'}]},
            {opcode: 'looks_nextcostume', shape: 'stack', category: 'looks'},
            {opcode: 'looks_switchbackdropto', shape: 'stack', category: 'looks',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'looks_switchbackdroptoandwait', shape: 'stack', category: 'looks',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'looks_nextbackdrop', shape: 'stack', category: 'looks'},
            {opcode: 'looks_changesizeby', shape: 'stack', category: 'looks',
                inputs: [{name: 'CHANGE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_setsizeto', shape: 'stack', category: 'looks',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_changeeffectby', shape: 'stack', category: 'looks',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'CHANGE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_seteffectto', shape: 'stack', category: 'looks',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_cleargraphiceffects', shape: 'stack', category: 'looks'},
            {opcode: 'looks_show', shape: 'stack', category: 'looks'},
            {opcode: 'looks_hide', shape: 'stack', category: 'looks'},
            {opcode: 'looks_gotofrontback', shape: 'stack', category: 'looks'},
            {opcode: 'looks_goforwardbackwardlayers', shape: 'stack', category: 'looks',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_costumenumbername', shape: 'reporter', category: 'looks'},
            {opcode: 'looks_backdropnumbername', shape: 'reporter', category: 'looks'},
            {opcode: 'looks_size', shape: 'reporter', category: 'looks'}
        ],
        sound: [
            {opcode: 'sound_playuntildone', shape: 'stack', category: 'sound',
                inputs: [{name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu'}]},
            {opcode: 'sound_play', shape: 'stack', category: 'sound',
                inputs: [{name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu'}]},
            {opcode: 'sound_stopallsounds', shape: 'stack', category: 'sound'},
            {opcode: 'sound_changeeffectby', shape: 'stack', category: 'sound',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_seteffectto', shape: 'stack', category: 'sound',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_cleareffects', shape: 'stack', category: 'sound'},
            {opcode: 'sound_changevolumeby', shape: 'stack', category: 'sound',
                inputs: [{name: 'VOLUME', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_setvolumeto', shape: 'stack', category: 'sound',
                inputs: [{name: 'VOLUME', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_volume', shape: 'reporter', category: 'sound'}
        ],
        events: [
            {opcode: 'event_whenflagclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenkeypressed', shape: 'hat', category: 'events',
                fields: [{name: 'KEY_OPTION', type: 'dropdown', options: 'sensing_keyoptions'}]},
            {opcode: 'event_whenstageclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenthisspriteclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenbackdropswitchesto', shape: 'hat', category: 'events',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'event_whengreaterthan', shape: 'hat', category: 'events',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'event_whenbroadcastreceived', shape: 'hat', category: 'events',
                fields: [{name: 'CHOICE', type: 'dropdown', options: 'event_broadcast_menu'}]},
            {opcode: 'event_broadcast', shape: 'stack', category: 'events',
                inputs: [{name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu'}]},
            {opcode: 'event_broadcastandwait', shape: 'stack', category: 'events',
                inputs: [{name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu'}]}
        ],
        control: [
            {opcode: 'control_wait', shape: 'stack', category: 'control',
                inputs: [{name: 'DURATION', type: 'value', shadow: 'math_number'}]},
            {opcode: 'control_repeat', shape: 'c', category: 'control',
                inputs: [{name: 'TIMES', type: 'value', shadow: 'math_number'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_forever', shape: 'c', category: 'control',
                inputs: [{name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_if', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_if_else', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}, {name: 'SUBSTACK2', type: 'statement'}]},
            {opcode: 'control_wait_until', shape: 'stack', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}]},
            {opcode: 'control_repeat_until', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_stop', shape: 'end', category: 'control'},
            {opcode: 'control_create_clone_of', shape: 'stack', category: 'control',
                inputs: [{name: 'CLONE_OPTION', type: 'value', shadow: 'control_create_clone_of_menu'}]},
            {opcode: 'control_start_as_clone', shape: 'hat', category: 'control'},
            {opcode: 'control_delete_this_clone', shape: 'end', category: 'control'}
        ],
        sensing: [
            {opcode: 'sensing_touchingobject', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'TOUCHINGOBJECTMENU', type: 'value', shadow: 'sensing_touchingobjectmenu'}]},
            {opcode: 'sensing_touchingcolor', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'sensing_coloristouchingcolor', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}, {name: 'COLOR2', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'sensing_distanceto', shape: 'reporter', category: 'sensing',
                inputs: [{name: 'DISTANCETOMENU', type: 'value', shadow: 'sensing_distancetomenu'}]},
            {opcode: 'sensing_askandwait', shape: 'stack', category: 'sensing',
                inputs: [{name: 'QUESTION', type: 'value', shadow: 'text'}]},
            {opcode: 'sensing_answer', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_keypressed', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'KEY_OPTION', type: 'value', shadow: 'sensing_keyoptions'}]},
            {opcode: 'sensing_mousedown', shape: 'boolean', category: 'sensing'},
            {opcode: 'sensing_mousex', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_mousey', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_setdragmode', shape: 'stack', category: 'sensing'},
            {opcode: 'sensing_loudness', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_timer', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_resettimer', shape: 'stack', category: 'sensing'},
            {opcode: 'sensing_of', shape: 'reporter', category: 'sensing',
                inputs: [{name: 'OBJECT', type: 'value', shadow: 'sensing_of_object_menu'}]},
            {opcode: 'sensing_current', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_dayssince2000', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_username', shape: 'reporter', category: 'sensing'}
        ],
        operators: [
            {opcode: 'operator_add', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_subtract', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_multiply', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_divide', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_random', shape: 'reporter', category: 'operators',
                inputs: [{name: 'FROM', type: 'value', shadow: 'math_number'}, {name: 'TO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_gt', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'math_number'}, {name: 'OPERAND2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_lt', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'math_number'}, {name: 'OPERAND2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_equals', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'text'}, {name: 'OPERAND2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_and', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'boolean'}, {name: 'OPERAND2', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_or', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'boolean'}, {name: 'OPERAND2', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_not', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_join', shape: 'reporter', category: 'operators',
                inputs: [{name: 'STRING1', type: 'value', shadow: 'text'}, {name: 'STRING2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_letter_of', shape: 'reporter', category: 'operators',
                inputs: [{name: 'LETTER', type: 'value', shadow: 'math_number'}, {name: 'STRING', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_length', shape: 'reporter', category: 'operators',
                inputs: [{name: 'STRING', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_contains', shape: 'boolean', category: 'operators',
                inputs: [{name: 'STRING1', type: 'value', shadow: 'text'}, {name: 'STRING2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_mod', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_round', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_mathop', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]}
        ],
        data: [
            {opcode: 'data_setvariableto', shape: 'stack', category: 'data',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'text'}],
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_changevariableby', shape: 'stack', category: 'data',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}],
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_showvariable', shape: 'stack', category: 'data',
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_hidevariable', shape: 'stack', category: 'data',
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_addtolist', shape: 'stack', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_deleteoflist', shape: 'stack', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_deletealloflist', shape: 'stack', category: 'data'},
            {opcode: 'data_insertatlist', shape: 'stack', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}, {name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_replaceitemoflist', shape: 'stack', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}, {name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_itemoflist', shape: 'reporter', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_itemnumoflist', shape: 'reporter', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_lengthoflist', shape: 'reporter', category: 'data'},
            {opcode: 'data_listcontainsitem', shape: 'boolean', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_showlist', shape: 'stack', category: 'data'},
            {opcode: 'data_hidelist', shape: 'stack', category: 'data'}
        ],
        pen: [
            {opcode: 'pen_clear', shape: 'stack', category: 'pen'},
            {opcode: 'pen_stamp', shape: 'stack', category: 'pen'},
            {opcode: 'pen_penDown', shape: 'stack', category: 'pen'},
            {opcode: 'pen_penUp', shape: 'stack', category: 'pen'},
            {opcode: 'pen_setPenColorToColor', shape: 'stack', category: 'pen',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'pen_changePenColorParamBy', shape: 'stack', category: 'pen',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_setPenColorParamTo', shape: 'stack', category: 'pen',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_changePenSizeBy', shape: 'stack', category: 'pen',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_setPenSizeTo', shape: 'stack', category: 'pen',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]}
        ],
        music: [
            {opcode: 'music_playDrumForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_restForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_playNoteForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'NOTE', type: 'value', shadow: 'math_number'}, {name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_setInstrument', shape: 'stack', category: 'music'},
            {opcode: 'music_setTempo', shape: 'stack', category: 'music',
                inputs: [{name: 'TEMPO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_changeTempo', shape: 'stack', category: 'music',
                inputs: [{name: 'TEMPO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_getTempo', shape: 'reporter', category: 'music'}
        ]
    }
};
