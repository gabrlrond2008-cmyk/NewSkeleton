/**
 * STBoard V2
 *
 * Dispositivo personalizado basado en ATmega2560 + 2x ATmega328.
 * Usa el flujo de carga del Mega2560, pero expone bloques propios
 * orientados a un runtime serial Mega -> nodos 328.
 */
const ArduinoMega2560Device = require('./arduinoMega2560');

const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');

/* Serial/USB configuration will be added in FASE 6 */

class STBoardV2Device extends ArduinoMega2560Device {
    get STBV2_DISTANCE_UNIT_MENU () {
        return [
            {text: 'cm', value: 'CM'},
            {text: 'rotaciones', value: 'ROTATIONS'},
            {text: 'grados', value: 'DEGREES'}
        ];
    }

    get STBV2_TURN_UNIT_MENU () {
        return [
            {text: 'grados', value: 'DEGREES'},
            {text: 'rotaciones', value: 'ROTATIONS'}
        ];
    }

    get STBV2_TIME_UNIT_MENU () {
        return [
            {text: 'segundos', value: 'SECONDS'},
            {text: 'milisegundos', value: 'MILLISECONDS'}
        ];
    }

    get STBV2_COMPARE_MENU () {
        return [
            {text: '>', value: 'GT'},
            {text: '<', value: 'LT'},
            {text: '>=', value: 'GTE'},
            {text: '<=', value: 'LTE'},
            {text: '=', value: 'EQ'},
            {text: '!=', value: 'NEQ'}
        ];
    }

    get STBV2_NODE_MENU () {
        return [
            {text: 'Nodo A', value: '0'},
            {text: 'Nodo B', value: '1'}
        ];
    }

    get STBV2_GYRO_AXIS_MENU () {
        return [
            {text: 'X', value: 'X'},
            {text: 'Y', value: 'Y'},
            {text: 'Z', value: 'Z'}
        ];
    }

    get STBV2_BUTTON_MENU () {
        return [
            {text: 'B1', value: 'B1'},
            {text: 'B2', value: 'B2'},
            {text: 'B3', value: 'B3'},
            {text: 'B4', value: 'B4'},
            {text: 'B5', value: 'B5'},
            {text: 'B6', value: 'B6'}
        ];
    }

    get STBV2_ON_OFF_MENU () {
        return [
            {text: 'encendido', value: 'ON'},
            {text: 'apagado', value: 'OFF'}
        ];
    }

    get STBV2_NOTE_MENU () {
        return [
            {text: 'Do', value: 'C4'},
            {text: 'Re', value: 'D4'},
            {text: 'Mi', value: 'E4'},
            {text: 'Fa', value: 'F4'},
            {text: 'Sol', value: 'G4'},
            {text: 'La', value: 'A4'},
            {text: 'Si', value: 'B4'},
            {text: 'Do agudo', value: 'C5'}
        ];
    }

    get STBV2_SINGLE_MOTOR_MENU () {
        return [
            {text: 'A1', value: 'A1'},
            {text: 'A2', value: 'A2'},
            {text: 'B3', value: 'B3'},
            {text: 'B4', value: 'B4'}
        ];
    }

    get STBV2_MOTOR_MENU () {
        return [
            {text: 'motores de movimiento', value: 'MOTION'},
            {text: 'A1', value: 'A1'},
            {text: 'A2', value: 'A2'},
            {text: 'B3', value: 'B3'},
            {text: 'B4', value: 'B4'}
        ];
    }

    get STBV2_STOP_MENU () {
        return [
            {text: 'motores de movimiento', value: 'MOTION'},
            {text: 'todos los motores', value: 'ALL'},
            {text: 'A1', value: 'A1'},
            {text: 'A2', value: 'A2'},
            {text: 'B3', value: 'B3'},
            {text: 'B4', value: 'B4'}
        ];
    }

    get STBV2_SIDE_MENU () {
        return [
            {text: 'movimiento izquierda', value: 'LEFT'},
            {text: 'movimiento derecha', value: 'RIGHT'},
            {text: 'no usar en movimiento', value: 'NONE'}
        ];
    }

    get STBV2_DIRECTION_MENU () {
        return [
            {text: 'Normal', value: 'NORMAL'},
            {text: 'Invertida', value: 'INVERTED'}
        ];
    }

    get STBV2_TURN_SIDE_MENU () {
        return [
            {text: 'Derecha', value: 'RIGHT'},
            {text: 'Izquierda', value: 'LEFT'}
        ];
    }

    get STBV2_PORT_MENU () {
        return [
            {text: 'puerto 2', value: '2'},
            {text: 'puerto 3', value: '3'},
            {text: 'puerto 4', value: '4'},
            {text: 'puerto 5', value: '5'},
            {text: 'puerto 7', value: '7'},
            {text: 'puerto 8', value: '8'},
            {text: 'puerto 9', value: '9'},
            {text: 'puerto 10', value: '10'}
        ];
    }

    get STBV2_MATRIX_SHIFT_MENU () {
        return [
            {text: 'izquierda', value: 'LEFT'},
            {text: 'derecha', value: 'RIGHT'},
            {text: 'arriba', value: 'UP'},
            {text: 'abajo', value: 'DOWN'}
        ];
    }

    get STBV2_OLED_ADDR_MENU () {
        return [
            {text: '0x3C', value: '0x3C'},
            {text: '0x3D', value: '0x3D'}
        ];
    }

    get STBV2_OLED_COLOR_MENU () {
        return [
            {text: 'blanco', value: 'SSD1306_WHITE'},
            {text: 'negro', value: 'SSD1306_BLACK'},
            {text: 'invertido', value: 'SSD1306_INVERSE'}
        ];
    }

    get STBV2_OLED_TEXT_COLOR_MENU () {
        return [
            {text: 'blanco', value: 'SSD1306_WHITE'},
            {text: 'negro', value: 'SSD1306_BLACK'}
        ];
    }

    get STBV2_OLED_EOL_MENU () {
        return [
            {text: 'sin salto', value: 'PRINT'},
            {text: 'con salto', value: 'PRINTLN'}
        ];
    }

    get DEVICE_ID () {
        return 'stbBoardV2';
    }

    constructor (runtime, originalDeviceId) {
        super(runtime, originalDeviceId);
    }

    getInfo () {
        const megaCategories = super.getInfo();
        const stbCategories = [
            {
                id: 'stbv2inicio',
                name: 'Inicio',
                color1: '#FFBF00',
                color2: '#E6AC00',
                color3: '#CC9900',
                hide: false,
                blocks: [
                    {
                        opcode: 'stbBoardV2_whenArduinoBegin',
                        blockType: BlockType.HAT,
                        text: 'cuando Arduino inicie',
                        isTerminal: false,
                        isEdgeActivated: false,
                        shouldRestartExistingThreads: true
                    },
                    {
                        opcode: 'stbBoardV2_initBootScreen',
                        blockType: BlockType.HAT,
                        text: 'cuando STBoard V2 inicie',
                        isTerminal: false,
                        isEdgeActivated: false,
                        shouldRestartExistingThreads: true
                    }
                ]
            },
            {
                id: 'stbv2motores',
                name: 'Motores',
                color1: '#1f7a4b',
                color2: '#114f32',
                color3: '#114f32',
                blocks: [
                    {
                        opcode: 'configurarMotores',
                        blockType: BlockType.COMMAND,
                        text: 'configurar motores tamaño de rueda [WHEEL_DIAMETER] cm rpm max [MAX_RPM] ancho entre ruedas [TRACK_WIDTH] cm',
                        arguments: {
                            WHEEL_DIAMETER: {type: ArgumentType.NUMBER, defaultValue: '6.5'},
                            MAX_RPM: {type: ArgumentType.NUMBER, defaultValue: '120'},
                            TRACK_WIDTH: {type: ArgumentType.NUMBER, defaultValue: '14'}
                        }
                    },
                    {
                        opcode: 'configurarMotorLado',
                        blockType: BlockType.COMMAND,
                        text: 'configurar motor [MOTOR] como [SIDE]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_SINGLE_MOTOR_MENU'},
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_SIDE_MENU'}
                        }
                    },
                    {
                        opcode: 'definirVelocidadMotor',
                        blockType: BlockType.COMMAND,
                        text: 'definir velocidad motor [MOTOR] al [SPEED] %',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            SPEED: {type: ArgumentType.NUMBER, defaultValue: '100'}
                        }
                    },
                    {
                        opcode: 'definirDireccionMotor',
                        blockType: BlockType.COMMAND,
                        text: 'definir direccion motor [MOTOR] [DIRECTION]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_SINGLE_MOTOR_MENU'},
                            DIRECTION: {type: ArgumentType.STRING, menu: 'STBV2_DIRECTION_MENU'}
                        }
                    },
                    {
                        opcode: 'definirModoAvance',
                        blockType: BlockType.COMMAND,
                        text: 'usar avance con giroscopio'
                    },
                    {
                        opcode: 'activarRetrasoArranque',
                        blockType: BlockType.COMMAND,
                        text: 'retrasar arranque lado [SIDE] por [DELAY_MS] ms',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'},
                            DELAY_MS: {type: ArgumentType.NUMBER, defaultValue: '10'}
                        }
                    },
                    {
                        opcode: 'desactivarRetrasoArranque',
                        blockType: BlockType.COMMAND,
                        text: 'apagar retraso de arranque'
                    },
                    {
                        opcode: 'avanzarMotor',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'girarMotor',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE]',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'}
                        }
                    },
                    {
                        opcode: 'retrocederMotor',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'detenerMotor',
                        blockType: BlockType.COMMAND,
                        text: 'detener motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_STOP_MENU'}
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [DISTANCE_UNIT]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            DISTANCE_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_DISTANCE_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'girarMotorPorValor',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE] por [VALUE] [TURN_UNIT]',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '90'},
                            TURN_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TURN_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [DISTANCE_UNIT]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            DISTANCE_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_DISTANCE_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorTiempo',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [TIME_UNIT]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '2'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorTiempo',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [TIME_UNIT]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '2'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorDistanciaSinEsperar',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [DISTANCE_UNIT] sin esperar',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            DISTANCE_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_DISTANCE_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'girarMotorPorValorSinEsperar',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE] por [VALUE] [TURN_UNIT] sin esperar',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '90'},
                            TURN_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TURN_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorDistanciaSinEsperar',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [DISTANCE_UNIT] sin esperar',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            DISTANCE_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_DISTANCE_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorTiempoSinEsperar',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [TIME_UNIT] sin esperar',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '2'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorTiempoSinEsperar',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [TIME_UNIT] sin esperar',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '2'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'},
                        }
                    },
                    {
                        opcode: 'avanzarHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'avanzar motor [MOTOR] hasta que [CONDITION]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            CONDITION: {type: ArgumentType.BOOLEAN}
                        }
                    },
                    {
                        opcode: 'girarHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'girar a la [SIDE] hasta que [CONDITION]',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'},
                            CONDITION: {type: ArgumentType.BOOLEAN}
                        }
                    },
                    {
                        opcode: 'retrocederHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'retroceder motor [MOTOR] hasta que [CONDITION]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'},
                            CONDITION: {type: ArgumentType.BOOLEAN}
                        }
                    },
                    {
                        opcode: 'detenerSi',
                        blockType: BlockType.CONDITIONAL,
                        text: 'detener motor [MOTOR] si [CONDITION]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_STOP_MENU'},
                            CONDITION: {type: ArgumentType.BOOLEAN}
                        }
                    },
                    {
                        opcode: 'velocidadActualMotor',
                        blockType: BlockType.REPORTER,
                        text: 'velocidad actual de motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'motoresConfigurados',
                        blockType: BlockType.BOOLEAN,
                        text: 'motores configurados?'
                    },
                    {
                        opcode: 'motorEnMovimiento',
                        blockType: BlockType.BOOLEAN,
                        text: 'motor [MOTOR] esta en movimiento?',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'encoderMotor',
                        blockType: BlockType.REPORTER,
                        text: 'encoder de motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'distanciaRecorridaMotor',
                        blockType: BlockType.REPORTER,
                        text: 'distancia recorrida motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'reiniciarDistanciaMotor',
                        blockType: BlockType.COMMAND,
                        text: 'reiniciar distancia de motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_STOP_MENU'}
                        }
                    },
                    {
                        opcode: 'motivoParadaMotor',
                        blockType: BlockType.REPORTER,
                        text: 'motivo de parada de motor [MOTOR]',
                        arguments: {
                            MOTOR: {type: ArgumentType.STRING, menu: 'STBV2_MOTOR_MENU'}
                        }
                    },
                    {
                        opcode: 'codigoErrorNodo',
                        blockType: BlockType.REPORTER,
                        text: 'codigo de error [NODE]',
                        arguments: {
                            NODE: {type: ArgumentType.STRING, menu: 'STBV2_NODE_MENU'}
                        }
                    },
                    '---',
                    {
                        opcode: 'esperarSeguro',
                        blockType: BlockType.COMMAND,
                        text: 'esperar [VALUE] [TIME_UNIT] (mantiene motores)',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: 1},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU', defaultValue: 'SECONDS'}
                        }
                    }
                ],
                menus: {
                    STBV2_DISTANCE_UNIT_MENU: this.STBV2_DISTANCE_UNIT_MENU,
                    STBV2_TURN_UNIT_MENU: this.STBV2_TURN_UNIT_MENU,
                    STBV2_TIME_UNIT_MENU: this.STBV2_TIME_UNIT_MENU,
                    STBV2_NODE_MENU: this.STBV2_NODE_MENU,
                    STBV2_SINGLE_MOTOR_MENU: this.STBV2_SINGLE_MOTOR_MENU,
                    STBV2_MOTOR_MENU: this.STBV2_MOTOR_MENU,
                    STBV2_STOP_MENU: this.STBV2_STOP_MENU,
                    STBV2_SIDE_MENU: this.STBV2_SIDE_MENU,
                    STBV2_DIRECTION_MENU: this.STBV2_DIRECTION_MENU,
                    STBV2_TURN_SIDE_MENU: this.STBV2_TURN_SIDE_MENU,
                }
            },
            {
                id: 'stbv2precision',
                name: 'Motor precisión',
                color1: '#7A3FB0',
                color2: '#5B2D85',
                color3: '#452164',
                blocks: [
                    {
                        opcode: 'ajustarMotoresPrecision',
                        blockType: BlockType.COMMAND,
                        text: 'ajustar precisión izquierda [LEFT_SCALE] % derecha [RIGHT_SCALE] % velocidad mínima [MIN_SPEED] % arranque [LAUNCH_MS] ms',
                        arguments: {
                            LEFT_SCALE: {type: ArgumentType.NUMBER, defaultValue: '100'},
                            RIGHT_SCALE: {type: ArgumentType.NUMBER, defaultValue: '100'},
                            MIN_SPEED: {type: ArgumentType.NUMBER, defaultValue: '25'},
                            LAUNCH_MS: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'ajustarControlPrecision',
                        blockType: BlockType.COMMAND,
                        text: 'ajustar control precisión gyro P [GYRO_KP] gyro D [GYRO_KD] encoder P [ENCODER_KP] corrección máx [MAX_CORRECTION] % zona muerta [DEADBAND] grados polaridad [POLARITY]',
                        arguments: {
                            GYRO_KP: {type: ArgumentType.NUMBER, defaultValue: '3.0'},
                            GYRO_KD: {type: ArgumentType.NUMBER, defaultValue: '0.5'},
                            ENCODER_KP: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            MAX_CORRECTION: {type: ArgumentType.NUMBER, defaultValue: '20'},
                            DEADBAND: {type: ArgumentType.NUMBER, defaultValue: '0.30'},
                            POLARITY: {type: ArgumentType.NUMBER, defaultValue: '-1'}
                        }
                    },
                    {
                        opcode: 'avanzarPrecisionPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar precisión [DISTANCE] cm a velocidad [SPEED] %',
                        arguments: {
                            DISTANCE: {type: ArgumentType.NUMBER, defaultValue: '5'},
                            SPEED: {type: ArgumentType.NUMBER, defaultValue: '45'}
                        }
                    },
                    {
                        opcode: 'retrocederPrecisionPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder precisión [DISTANCE] cm a velocidad [SPEED] %',
                        arguments: {
                            DISTANCE: {type: ArgumentType.NUMBER, defaultValue: '5'},
                            SPEED: {type: ArgumentType.NUMBER, defaultValue: '45'}
                        }
                    },
                    {
                        opcode: 'avanzarPrecisionContinuo',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar precisión continuo a velocidad [SPEED] %',
                        arguments: {
                            SPEED: {type: ArgumentType.NUMBER, defaultValue: '45'}
                        }
                    },
                    {
                        opcode: 'retrocederPrecisionContinuo',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder precisión continuo a velocidad [SPEED] %',
                        arguments: {
                            SPEED: {type: ArgumentType.NUMBER, defaultValue: '45'}
                        }
                    },
                    {
                        opcode: 'detenerPrecision',
                        blockType: BlockType.COMMAND,
                        text: 'detener avance precisión'
                    }
                ]
            },
            {
                id: 'stbv2gyro',
                name: 'Giroscopio',
                color1: '#0b6b78',
                color2: '#08545e',
                color3: '#08545e',
                blocks: [
                    {
                        opcode: 'configurarGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'configurar giroscopio eje de giro [AXIS] direccion [DIRECTION]',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'},
                            DIRECTION: {type: ArgumentType.STRING, menu: 'STBV2_DIRECTION_MENU'}
                        }
                    },
                    {
                        opcode: 'calibrarGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'calibrar giroscopio'
                    },
                    {
                        opcode: 'calibrarPosturaGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'calibrar postura actual de la tarjeta'
                    },
                    {
                        opcode: 'reiniciarAnguloGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'reiniciar angulo giroscopio'
                    },
                    {
                        opcode: 'leerGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'leer giroscopio'
                    },
                    {
                        opcode: 'girarConGiroscopio',
                        blockType: BlockType.COMMAND,
                        text: 'girar con giroscopio a la [SIDE] por [VALUE] grados',
                        arguments: {
                            SIDE: {type: ArgumentType.STRING, menu: 'STBV2_TURN_SIDE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '90'},
                        }
                    },
                    {
                        opcode: 'giroscopioListo',
                        blockType: BlockType.BOOLEAN,
                        text: 'giroscopio listo?'
                    },
                    {
                        opcode: 'tarjetaAgitada',
                        blockType: BlockType.BOOLEAN,
                        text: 'tarjeta agitada?'
                    },
                    {
                        opcode: 'tarjetaInclinada',
                        blockType: BlockType.BOOLEAN,
                        text: 'tarjeta inclinada?'
                    },
                    {
                        opcode: 'tarjetaInclinadaMasDe',
                        blockType: BlockType.BOOLEAN,
                        text: 'tarjeta inclinada mas de [VALUE] grados?',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '20'}
                        }
                    },
                    {
                        opcode: 'esperarHastaTarjetaAgitada',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que la tarjeta se agite'
                    },
                    {
                        opcode: 'esperarHastaTarjetaInclinada',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que la tarjeta se incline mas de [VALUE] grados',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '20'}
                        }
                    },
                    {
                        opcode: 'anguloGiroscopio',
                        blockType: BlockType.REPORTER,
                        text: 'angulo giroscopio'
                    },
                    {
                        opcode: 'anguloInclinacionTarjeta',
                        blockType: BlockType.REPORTER,
                        text: 'angulo de inclinacion de la tarjeta'
                    },
                    {
                        opcode: 'aceleracionGiroscopio',
                        blockType: BlockType.REPORTER,
                        text: 'aceleracion [AXIS] giroscopio',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'}
                        }
                    },
                    {
                        opcode: 'velocidadAngularGiroscopio',
                        blockType: BlockType.REPORTER,
                        text: 'velocidad angular [AXIS] giroscopio',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'}
                        }
                    },
                    {
                        opcode: 'mientrasVelocidadAngularGiroscopio',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras velocidad angular [AXIS] giroscopio sea [CONDITION] [VALUE]',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'},
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'mientrasAceleracionGiroscopio',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras aceleracion [AXIS] giroscopio sea [CONDITION] [VALUE]',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'},
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'mientrasAnguloGiroscopio',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras angulo giroscopio sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '90'}
                        }
                    },
                    {
                        opcode: 'velocidadAngularGiroscopioCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'velocidad angular [AXIS] giroscopio es [CONDITION] [VALUE]',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'},
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'aceleracionGiroscopioCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'aceleracion [AXIS] giroscopio es [CONDITION] [VALUE]',
                        arguments: {
                            AXIS: {type: ArgumentType.STRING, menu: 'STBV2_GYRO_AXIS_MENU'},
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'anguloGiroscopioCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'angulo giroscopio es [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '90'}
                        }
                    }
                ],
                menus: {
                    STBV2_GYRO_AXIS_MENU: this.STBV2_GYRO_AXIS_MENU,
                    STBV2_COMPARE_MENU: this.STBV2_COMPARE_MENU,
                    STBV2_DIRECTION_MENU: this.STBV2_DIRECTION_MENU,
                    STBV2_TURN_SIDE_MENU: this.STBV2_TURN_SIDE_MENU
                }
            },
            {
                id: 'stbv2puertos',
                name: 'Puertos',
                color1: '#4C97FF',
                color2: '#4280D7',
                color3: '#3373CC',
                blocks: [
                    {
                        opcode: 'moverServoPuerto',
                        blockType: BlockType.COMMAND,
                        text: 'mover servo en [PORT] a [ANGLE] grados',
                        arguments: {
                            PORT: {type: ArgumentType.STRING, menu: 'STBV2_PORT_MENU'},
                            ANGLE: {type: ArgumentType.NUMBER, defaultValue: '90'}
                        }
                    },
                    {
                        opcode: 'moverServoPuertoPorPulsos',
                        blockType: BlockType.COMMAND,
                        text: 'mover servo en [PORT] por [PULSE] pulsos',
                        arguments: {
                            PORT: {type: ArgumentType.STRING, menu: 'STBV2_PORT_MENU'},
                            PULSE: {type: ArgumentType.NUMBER, defaultValue: '1500'}
                        }
                    },
                    {
                        opcode: 'desconectarServoPuerto',
                        blockType: BlockType.COMMAND,
                        text: 'desconectar servo en [PORT]',
                        arguments: {
                            PORT: {type: ArgumentType.STRING, menu: 'STBV2_PORT_MENU'}
                        }
                    },
                    {
                        opcode: 'moverServoPuertoSuavemente',
                        blockType: BlockType.COMMAND,
                        text: 'mover servo en [PORT] suavemente a [ANGLE] en [TIME] ms',
                        arguments: {
                            PORT: {type: ArgumentType.STRING, menu: 'STBV2_PORT_MENU'},
                            ANGLE: {type: ArgumentType.NUMBER, defaultValue: '90'},
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '1000'}
                        }
                    }
                ],
                menus: {
                    STBV2_PORT_MENU: this.STBV2_PORT_MENU
                }
            },
            {
                id: 'stbv2buttons',
                name: 'Botones',
                color1: '#b85c00',
                color2: '#934700',
                color3: '#934700',
                blocks: [
                    {
                        opcode: 'leerBoton',
                        blockType: BlockType.REPORTER,
                        text: 'leer boton [BUTTON]',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    },
                    {
                        opcode: 'botonPresionado',
                        blockType: BlockType.BOOLEAN,
                        text: 'boton [BUTTON] presionado?',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    },
                    {
                        opcode: 'esperarHastaBotonPresionado',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que boton [BUTTON] sea presionado',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    },
                    {
                        opcode: 'mientrasBotonPresionado',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras boton [BUTTON] este presionado',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    },
                    {
                        opcode: 'contadorBoton',
                        blockType: BlockType.REPORTER,
                        text: 'contador de boton [BUTTON]',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    },
                    {
                        opcode: 'reiniciarContadorBoton',
                        blockType: BlockType.COMMAND,
                        text: 'reiniciar contador de boton [BUTTON]',
                        arguments: {
                            BUTTON: {type: ArgumentType.STRING, menu: 'STBV2_BUTTON_MENU'}
                        }
                    }
                ],
                menus: {
                    STBV2_BUTTON_MENU: this.STBV2_BUTTON_MENU
                }
            },
            {
                id: 'stbv2infrared',
                name: 'Infrarrojo',
                color1: '#8b2f6b',
                color2: '#6a214f',
                color3: '#6a214f',
                blocks: [
                    {
                        opcode: 'leerReceptorInfrarrojo',
                        blockType: BlockType.REPORTER,
                        text: 'leer receptor infrarrojo'
                    },
                    {
                        opcode: 'senalInfrarrojaDetectada',
                        blockType: BlockType.BOOLEAN,
                        text: 'senal infrarroja detectada?'
                    },
                    {
                        opcode: 'esperarHastaSenalInfrarroja',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que se detecte senal infrarroja'
                    },
                    {
                        opcode: 'mientrasSenalInfrarroja',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras se detecte senal infrarroja'
                    },
                    {
                        opcode: 'contadorSenalInfrarroja',
                        blockType: BlockType.REPORTER,
                        text: 'contador de senales infrarrojas'
                    },
                    {
                        opcode: 'pulsosInfrarrojosEnTiempo',
                        blockType: BlockType.REPORTER,
                        text: 'pulsos infrarrojos detectados en [TIME] [TIME_UNIT]',
                        arguments: {
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '1'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'reiniciarContadorSenalInfrarroja',
                        blockType: BlockType.COMMAND,
                        text: 'reiniciar contador de senales infrarrojas'
                    },
                    {
                        opcode: 'encenderEmisorInfrarrojo',
                        blockType: BlockType.COMMAND,
                        text: 'encender emisor infrarrojo'
                    },
                    {
                        opcode: 'apagarEmisorInfrarrojo',
                        blockType: BlockType.COMMAND,
                        text: 'apagar emisor infrarrojo'
                    },
                    {
                        opcode: 'ponerEmisorInfrarrojo',
                        blockType: BlockType.COMMAND,
                        text: 'poner emisor infrarrojo en [STATE]',
                        arguments: {
                            STATE: {type: ArgumentType.STRING, menu: 'STBV2_ON_OFF_MENU'}
                        }
                    },
                    {
                        opcode: 'emitirInfrarrojoPorTiempo',
                        blockType: BlockType.COMMAND,
                        text: 'emitir infrarrojo por [TIME] [TIME_UNIT]',
                        arguments: {
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '500'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'emitirPulsosInfrarrojos',
                        blockType: BlockType.COMMAND,
                        text: 'emitir [COUNT] pulsos infrarrojos en [TIME] [TIME_UNIT]',
                        arguments: {
                            COUNT: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '1'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'emisorInfrarrojoActivo',
                        blockType: BlockType.BOOLEAN,
                        text: 'emisor infrarrojo activo?'
                    }
                ],
                menus: {
                    STBV2_TIME_UNIT_MENU: this.STBV2_TIME_UNIT_MENU,
                    STBV2_ON_OFF_MENU: this.STBV2_ON_OFF_MENU
                }
            },
            {
                id: 'stbv2buzzer',
                name: 'Buzzer',
                color1: '#c53b2a',
                color2: '#992c20',
                color3: '#992c20',
                blocks: [
                    {
                        opcode: 'encenderBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'encender buzzer'
                    },
                    {
                        opcode: 'apagarBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'apagar buzzer'
                    },
                    {
                        opcode: 'tocarTonoBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'tocar tono [FREQ] hz por [TIME] [TIME_UNIT]',
                        arguments: {
                            FREQ: {type: ArgumentType.NUMBER, defaultValue: '440'},
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '500'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'tocarNotaBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'tocar nota [NOTE] por [TIME] [TIME_UNIT]',
                        arguments: {
                            NOTE: {type: ArgumentType.STRING, menu: 'STBV2_NOTE_MENU'},
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '500'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'tocarTonoContinuoBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'tocar tono continuo [FREQ] hz',
                        arguments: {
                            FREQ: {type: ArgumentType.NUMBER, defaultValue: '440'}
                        }
                    },
                    {
                        opcode: 'tocarNotaContinuaBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'tocar nota continua [NOTE]',
                        arguments: {
                            NOTE: {type: ArgumentType.STRING, menu: 'STBV2_NOTE_MENU'}
                        }
                    },
                    {
                        opcode: 'silencioBuzzer',
                        blockType: BlockType.COMMAND,
                        text: 'silencio por [TIME] [TIME_UNIT]',
                        arguments: {
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '250'},
                            TIME_UNIT: {type: ArgumentType.STRING, menu: 'STBV2_TIME_UNIT_MENU'}
                        }
                    },
                    {
                        opcode: 'buzzerActivo',
                        blockType: BlockType.BOOLEAN,
                        text: 'buzzer activo?'
                    },
                    {
                        opcode: 'frecuenciaBuzzer',
                        blockType: BlockType.REPORTER,
                        text: 'frecuencia del buzzer'
                    }
                ],
                menus: {
                    STBV2_TIME_UNIT_MENU: this.STBV2_TIME_UNIT_MENU,
                    STBV2_NOTE_MENU: this.STBV2_NOTE_MENU
                }
            },
            {
                id: 'stbv2light',
                name: 'Luz',
                color1: '#d09a16',
                color2: '#a67810',
                color3: '#a67810',
                blocks: [
                    {
                        opcode: 'leerLuzRaw',
                        blockType: BlockType.REPORTER,
                        text: 'leer sensor de luz'
                    },
                    {
                        opcode: 'porcentajeLuz',
                        blockType: BlockType.REPORTER,
                        text: 'porcentaje de luz'
                    },
                    {
                        opcode: 'hayMuchaLuz',
                        blockType: BlockType.BOOLEAN,
                        text: 'hay mucha luz?'
                    },
                    {
                        opcode: 'hayPocaLuz',
                        blockType: BlockType.BOOLEAN,
                        text: 'hay poca luz?'
                    },
                    {
                        opcode: 'luzCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'porcentaje de luz es [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    },
                    {
                        opcode: 'esperarHastaLuz',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que porcentaje de luz sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    },
                    {
                        opcode: 'mientrasLuz',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras porcentaje de luz sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    }
                ],
                menus: {
                    STBV2_COMPARE_MENU: this.STBV2_COMPARE_MENU
                }
            },
            {
                id: 'stbv2temperature',
                name: 'Temperatura',
                color1: '#c04a1a',
                color2: '#953814',
                color3: '#953814',
                blocks: [
                    {
                        opcode: 'leerTemperaturaRaw',
                        blockType: BlockType.REPORTER,
                        text: 'leer sensor de temperatura'
                    },
                    {
                        opcode: 'temperaturaCelsius',
                        blockType: BlockType.REPORTER,
                        text: 'temperatura en celsius'
                    },
                    {
                        opcode: 'temperaturaKelvin',
                        blockType: BlockType.REPORTER,
                        text: 'temperatura en kelvin'
                    },
                    {
                        opcode: 'haceCalor',
                        blockType: BlockType.BOOLEAN,
                        text: 'hace calor?'
                    },
                    {
                        opcode: 'haceFrio',
                        blockType: BlockType.BOOLEAN,
                        text: 'hace frio?'
                    },
                    {
                        opcode: 'temperaturaCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'temperatura en celsius es [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '25'}
                        }
                    },
                    {
                        opcode: 'esperarHastaTemperatura',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que temperatura en celsius sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '25'}
                        }
                    },
                    {
                        opcode: 'mientrasTemperatura',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras temperatura en celsius sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '25'}
                        }
                    }
                ],
                menus: {
                    STBV2_COMPARE_MENU: this.STBV2_COMPARE_MENU
                }
            },
            {
                id: 'stbv2microphone',
                name: 'Microfono',
                color1: '#5b5fc7',
                color2: '#44489a',
                color3: '#44489a',
                blocks: [
                    {
                        opcode: 'calibrarMicrofono',
                        blockType: BlockType.COMMAND,
                        text: 'calibrar microfono'
                    },
                    {
                        opcode: 'leerMicrofonoRaw',
                        blockType: BlockType.REPORTER,
                        text: 'leer microfono'
                    },
                    {
                        opcode: 'nivelSonido',
                        blockType: BlockType.REPORTER,
                        text: 'nivel de sonido'
                    },
                    {
                        opcode: 'microfonoCalibrado',
                        blockType: BlockType.BOOLEAN,
                        text: 'microfono calibrado?'
                    },
                    {
                        opcode: 'haySonidoFuerte',
                        blockType: BlockType.BOOLEAN,
                        text: 'hay sonido fuerte?'
                    },
                    {
                        opcode: 'hayPocoSonido',
                        blockType: BlockType.BOOLEAN,
                        text: 'hay poco sonido?'
                    },
                    {
                        opcode: 'sonidoCumple',
                        blockType: BlockType.BOOLEAN,
                        text: 'nivel de sonido es [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    },
                    {
                        opcode: 'esperarHastaSonido',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta que nivel de sonido sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    },
                    {
                        opcode: 'mientrasSonido',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras nivel de sonido sea [CONDITION] [VALUE]',
                        arguments: {
                            CONDITION: {type: ArgumentType.STRING, menu: 'STBV2_COMPARE_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '50'}
                        }
                    }
                ],
                menus: {
                    STBV2_COMPARE_MENU: this.STBV2_COMPARE_MENU
                }
            },
            {
                id: 'stbv2bluetooth',
                name: 'Bluetooth',
                color1: '#1c6fd6',
                color2: '#1557a8',
                color3: '#1557a8',
                blocks: [
                    {
                        opcode: 'iniciarBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'iniciar bluetooth a [BAUD] baudios',
                        arguments: {
                            BAUD: {type: ArgumentType.NUMBER, defaultValue: '9600'}
                        }
                    },
                    {
                        opcode: 'cerrarBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'cerrar bluetooth'
                    },
                    {
                        opcode: 'bluetoothIniciado',
                        blockType: BlockType.BOOLEAN,
                        text: 'bluetooth iniciado?'
                    },
                    {
                        opcode: 'hayDatosBluetooth',
                        blockType: BlockType.BOOLEAN,
                        text: 'hay datos bluetooth?'
                    },
                    {
                        opcode: 'bytesBluetoothDisponibles',
                        blockType: BlockType.REPORTER,
                        text: 'bytes bluetooth disponibles'
                    },
                    {
                        opcode: 'enviarTextoBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'enviar texto bluetooth [TEXT]',
                        arguments: {
                            TEXT: {type: ArgumentType.STRING, defaultValue: 'hola'}
                        }
                    },
                    {
                        opcode: 'enviarLineaBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'enviar linea bluetooth [TEXT]',
                        arguments: {
                            TEXT: {type: ArgumentType.STRING, defaultValue: 'hola'}
                        }
                    },
                    {
                        opcode: 'enviarNumeroBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'enviar numero bluetooth [VALUE]',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '123'}
                        }
                    },
                    {
                        opcode: 'enviarByteBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'enviar byte bluetooth [VALUE]',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '65'}
                        }
                    },
                    {
                        opcode: 'leerByteBluetooth',
                        blockType: BlockType.REPORTER,
                        text: 'leer byte bluetooth'
                    },
                    {
                        opcode: 'leerTextoBluetooth',
                        blockType: BlockType.REPORTER,
                        text: 'leer texto bluetooth'
                    },
                    {
                        opcode: 'leerLineaBluetooth',
                        blockType: BlockType.REPORTER,
                        text: 'leer linea bluetooth'
                    },
                    {
                        opcode: 'limpiarBufferBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'limpiar buffer bluetooth'
                    },
                    {
                        opcode: 'esperarHastaDatoBluetooth',
                        blockType: BlockType.COMMAND,
                        text: 'esperar hasta recibir dato bluetooth'
                    },
                    {
                        opcode: 'mientrasHayaDatosBluetooth',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'mientras haya datos bluetooth'
                    }
                ]
            },
            {
                id: 'stbv2matrix',
                name: 'Matriz LED',
                color1: '#2f8f4e',
                color2: '#236c3a',
                color3: '#236c3a',
                blocks: [
                    {
                        opcode: 'iniciarMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'iniciar matriz led'
                    },
                    {
                        opcode: 'encenderMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'encender matriz led'
                    },
                    {
                        opcode: 'apagarMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'apagar matriz led'
                    },
                    {
                        opcode: 'brilloMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'brillo matriz led [VALUE]',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '8'}
                        }
                    },
                    {
                        opcode: 'limpiarMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'limpiar matriz led'
                    },
                    {
                        opcode: 'llenarMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'poner toda la matriz led en [STATE]',
                        arguments: {
                            STATE: {type: ArgumentType.STRING, menu: 'STBV2_ON_OFF_MENU'}
                        }
                    },
                    {
                        opcode: 'ponerPixelMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'poner pixel x [X] y [Y] en [STATE]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            STATE: {type: ArgumentType.STRING, menu: 'STBV2_ON_OFF_MENU'}
                        }
                    },
                    {
                        opcode: 'alternarPixelMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'alternar pixel x [X] y [Y]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'pixelMatrizLedEncendido',
                        blockType: BlockType.BOOLEAN,
                        text: 'pixel x [X] y [Y] encendido?',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'dibujarFilaMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar fila [ROW] valor [VALUE]',
                        arguments: {
                            ROW: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '255'}
                        }
                    },
                    {
                        opcode: 'dibujarColumnaMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar columna [COL] valor [VALUE]',
                        arguments: {
                            COL: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '255'}
                        }
                    },
                    {
                        opcode: 'mostrarPatronMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar patron filas [R0] [R1] [R2] [R3] [R4] [R5] [R6] [R7]',
                        arguments: {
                            R0: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R1: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R2: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R3: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R4: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R5: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R6: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            R7: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'desplazarMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'desplazar matriz led hacia [DIR]',
                        arguments: {
                            DIR: {type: ArgumentType.STRING, menu: 'STBV2_MATRIX_SHIFT_MENU'}
                        }
                    },
                    {
                        opcode: 'mostrarCaracterMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar caracter [TEXT] en matriz led',
                        arguments: {
                            TEXT: {type: ArgumentType.STRING, defaultValue: 'A'}
                        }
                    },
                    {
                        opcode: 'mostrarLetraMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar letra [TEXT] en matriz led',
                        arguments: {
                            TEXT: {type: ArgumentType.STRING, defaultValue: 'A'}
                        }
                    },
                    {
                        opcode: 'mostrarNumeroMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar numero [VALUE] en matriz led',
                        arguments: {
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'mostrarTextoMatrizLed',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar texto [TEXT] letra a letra cada [TIME] ms',
                        arguments: {
                            TEXT: {type: ArgumentType.STRING, defaultValue: 'HOLA'},
                            TIME: {type: ArgumentType.NUMBER, defaultValue: '300'}
                        }
                    }
                ],
                menus: {
                    STBV2_ON_OFF_MENU: this.STBV2_ON_OFF_MENU,
                    STBV2_MATRIX_SHIFT_MENU: this.STBV2_MATRIX_SHIFT_MENU
                }
            },
            {
                id: 'stbv2oled',
                name: 'OLED',
                color1: '#3a6ea5',
                color2: '#274d73',
                color3: '#274d73',
                blocks: [
                    {
                        opcode: 'iniciarPantallaOled',
                        blockType: BlockType.COMMAND,
                        text: 'iniciar pantalla oled direccion [ADDR]',
                        arguments: {
                            ADDR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_ADDR_MENU'}
                        }
                    },
                    {
                        opcode: 'limpiarPantallaOled',
                        blockType: BlockType.COMMAND,
                        text: 'limpiar pantalla oled'
                    },
                    {
                        opcode: 'actualizarPantallaOled',
                        blockType: BlockType.COMMAND,
                        text: 'actualizar pantalla oled'
                    },
                    {
                        opcode: 'establecerCursorOled',
                        blockType: BlockType.COMMAND,
                        text: 'poner cursor oled x [X] y [Y]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'configurarTextoOled',
                        blockType: BlockType.COMMAND,
                        text: 'texto oled tamano [SIZE] color [COLOR] fondo [BGCOLOR]',
                        arguments: {
                            SIZE: {type: ArgumentType.NUMBER, defaultValue: '1'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_TEXT_COLOR_MENU'},
                            BGCOLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_TEXT_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'imprimirOled',
                        blockType: BlockType.COMMAND,
                        text: 'imprimir en oled [DATA] [EOL]',
                        arguments: {
                            DATA: {type: ArgumentType.STRING, defaultValue: 'Hola'},
                            EOL: {type: ArgumentType.STRING, menu: 'STBV2_OLED_EOL_MENU'}
                        }
                    },
                    {
                        opcode: 'mostrarTextoOled',
                        blockType: BlockType.COMMAND,
                        text: 'mostrar en oled [DATA] x [X] y [Y]',
                        arguments: {
                            DATA: {type: ArgumentType.STRING, defaultValue: 'Hola'},
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'dibujarPixelOled',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar pixel oled x [X] y [Y] color [COLOR]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'dibujarLineaOled',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar linea oled x1 [X0] y1 [Y0] x2 [X1] y2 [Y1] color [COLOR]',
                        arguments: {
                            X0: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y0: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            X1: {type: ArgumentType.NUMBER, defaultValue: '127'},
                            Y1: {type: ArgumentType.NUMBER, defaultValue: '63'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'dibujarRectanguloOled',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar rectangulo oled x [X] y [Y] ancho [W] alto [H] color [COLOR]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            W: {type: ArgumentType.NUMBER, defaultValue: '20'},
                            H: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'rellenarRectanguloOled',
                        blockType: BlockType.COMMAND,
                        text: 'rellenar rectangulo oled x [X] y [Y] ancho [W] alto [H] color [COLOR]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '0'},
                            W: {type: ArgumentType.NUMBER, defaultValue: '20'},
                            H: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'dibujarCirculoOled',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar circulo oled x [X] y [Y] radio [R] color [COLOR]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '64'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '32'},
                            R: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'rellenarCirculoOled',
                        blockType: BlockType.COMMAND,
                        text: 'rellenar circulo oled x [X] y [Y] radio [R] color [COLOR]',
                        arguments: {
                            X: {type: ArgumentType.NUMBER, defaultValue: '64'},
                            Y: {type: ArgumentType.NUMBER, defaultValue: '32'},
                            R: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'dibujarTrianguloOled',
                        blockType: BlockType.COMMAND,
                        text: 'dibujar triangulo oled [X0] [Y0] [X1] [Y1] [X2] [Y2] color [COLOR]',
                        arguments: {
                            X0: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            Y0: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            X1: {type: ArgumentType.NUMBER, defaultValue: '30'},
                            Y1: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            X2: {type: ArgumentType.NUMBER, defaultValue: '20'},
                            Y2: {type: ArgumentType.NUMBER, defaultValue: '30'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    },
                    {
                        opcode: 'rellenarTrianguloOled',
                        blockType: BlockType.COMMAND,
                        text: 'rellenar triangulo oled [X0] [Y0] [X1] [Y1] [X2] [Y2] color [COLOR]',
                        arguments: {
                            X0: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            Y0: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            X1: {type: ArgumentType.NUMBER, defaultValue: '30'},
                            Y1: {type: ArgumentType.NUMBER, defaultValue: '10'},
                            X2: {type: ArgumentType.NUMBER, defaultValue: '20'},
                            Y2: {type: ArgumentType.NUMBER, defaultValue: '30'},
                            COLOR: {type: ArgumentType.STRING, menu: 'STBV2_OLED_COLOR_MENU'}
                        }
                    }
                ],
                menus: {
                    STBV2_OLED_ADDR_MENU: this.STBV2_OLED_ADDR_MENU,
                    STBV2_OLED_COLOR_MENU: this.STBV2_OLED_COLOR_MENU,
                    STBV2_OLED_TEXT_COLOR_MENU: this.STBV2_OLED_TEXT_COLOR_MENU,
                    STBV2_OLED_EOL_MENU: this.STBV2_OLED_EOL_MENU
                }
            }
        ];
        return [...megaCategories, ...stbCategories];
    }

    configurarMotores () {
        return Promise.resolve();
    }

    configurarMotorLado () {
        return Promise.resolve();
    }

    definirDireccionMotor () {
        return Promise.resolve();
    }

    definirVelocidadMotor () {
        return Promise.resolve();
    }

    definirModoAvance () {
        return Promise.resolve();
    }

    activarRetrasoArranque () {
        return Promise.resolve();
    }

    desactivarRetrasoArranque () {
        return Promise.resolve();
    }

    moverServoPuerto () {
        return Promise.resolve();
    }

    moverServoPuertoPorPulsos () {
        return Promise.resolve();
    }

    desconectarServoPuerto () {
        return Promise.resolve();
    }

    moverServoPuertoSuavemente () {
        return Promise.resolve();
    }

    avanzarMotor () {
        return Promise.resolve();
    }
    retrocederMotor () {
        return Promise.resolve();
    }

    retrocederMotor () {
        return Promise.resolve();
    }

    detenerMotor () {
        return Promise.resolve();
    }

    avanzarMotorPorTiempo () {
        return Promise.resolve();
    }
    retrocederMotorPorTiempo () {
        return Promise.resolve();
    }

    avanzarMotorPorTiempoSinEsperar () {
        return Promise.resolve();
    }
    retrocederMotorPorTiempoSinEsperar () {
        return Promise.resolve();
    }

    avanzarMotorPorDistancia () {
        return Promise.resolve();
    }
    retrocederMotorPorDistancia () {
        return Promise.resolve();
    }

    avanzarMotorPorDistanciaSinEsperar () {
        return Promise.resolve();
    }
    retrocederMotorPorDistanciaSinEsperar () {
        return Promise.resolve();
    }

    girarMotor () {
        return Promise.resolve();
    }

    girarMotorPorValor () {
        return Promise.resolve();
    }

    girarMotorPorValorSinEsperar () {
        return Promise.resolve();
    }

    avanzarHastaQue () {
        return Promise.resolve();
    }

    retrocederHastaQue () {
        return Promise.resolve();
    }

    girarHastaQue () {
        return Promise.resolve();
    }

    detenerSi () {
        return Promise.resolve();
    }

    velocidadActualMotor () {
        return Promise.resolve();
    }

    motoresConfigurados () {
        return Promise.resolve();
    }

    motorEnMovimiento () {
        return Promise.resolve();
    }

    encoderMotor () {
        return Promise.resolve();
    }

    distanciaRecorridaMotor () {
        return Promise.resolve();
    }

    reiniciarDistanciaMotor () {
        return Promise.resolve();
    }

    motivoParadaMotor () {
        return Promise.resolve();
    }

    codigoErrorNodo () {
        return Promise.resolve();
    }

    esperarSeguro () {
        return Promise.resolve();
    }

    ajustarMotoresPrecision () {
        return Promise.resolve();
    }

    ajustarControlPrecision () {
        return Promise.resolve();
    }

    avanzarPrecisionPorDistancia () {
        return Promise.resolve();
    }

    retrocederPrecisionPorDistancia () {
        return Promise.resolve();
    }

    avanzarPrecisionContinuo () {
        return Promise.resolve();
    }

    retrocederPrecisionContinuo () {
        return Promise.resolve();
    }

    detenerPrecision () {
        return Promise.resolve();
    }

    configurarGiroscopio () {
        return Promise.resolve();
    }

    calibrarGiroscopio () {
        return Promise.resolve();
    }

    calibrarPosturaGiroscopio () {
        return Promise.resolve();
    }

    reiniciarAnguloGiroscopio () {
        return Promise.resolve();
    }

    leerGiroscopio () {
        return Promise.resolve();
    }

    girarConGiroscopio () {
        return Promise.resolve();
    }

    giroscopioListo () {
        return Promise.resolve();
    }

    anguloGiroscopio () {
        return Promise.resolve();
    }

    anguloInclinacionTarjeta () {
        return Promise.resolve();
    }

    aceleracionGiroscopio () {
        return Promise.resolve();
    }

    velocidadAngularGiroscopio () {
        return Promise.resolve();
    }

    mientrasVelocidadAngularGiroscopio () {
        return Promise.resolve();
    }

    mientrasAceleracionGiroscopio () {
        return Promise.resolve();
    }

    mientrasAnguloGiroscopio () {
        return Promise.resolve();
    }

    velocidadAngularGiroscopioCumple () {
        return Promise.resolve();
    }

    aceleracionGiroscopioCumple () {
        return Promise.resolve();
    }

    anguloGiroscopioCumple () {
        return Promise.resolve();
    }

    tarjetaAgitada () {
        return Promise.resolve();
    }

    tarjetaInclinada () {
        return Promise.resolve();
    }

    tarjetaInclinadaMasDe () {
        return Promise.resolve();
    }

    esperarHastaTarjetaAgitada () {
        return Promise.resolve();
    }

    esperarHastaTarjetaInclinada () {
        return Promise.resolve();
    }

    leerBoton () {
        return Promise.resolve();
    }

    botonPresionado () {
        return Promise.resolve();
    }

    esperarHastaBotonPresionado () {
        return Promise.resolve();
    }

    mientrasBotonPresionado () {
        return Promise.resolve();
    }

    contadorBoton () {
        return Promise.resolve();
    }

    reiniciarContadorBoton () {
        return Promise.resolve();
    }

    leerReceptorInfrarrojo () {
        return Promise.resolve();
    }

    senalInfrarrojaDetectada () {
        return Promise.resolve();
    }

    esperarHastaSenalInfrarroja () {
        return Promise.resolve();
    }

    mientrasSenalInfrarroja () {
        return Promise.resolve();
    }

    contadorSenalInfrarroja () {
        return Promise.resolve();
    }

    pulsosInfrarrojosEnTiempo () {
        return Promise.resolve();
    }

    reiniciarContadorSenalInfrarroja () {
        return Promise.resolve();
    }

    encenderEmisorInfrarrojo () {
        return Promise.resolve();
    }

    apagarEmisorInfrarrojo () {
        return Promise.resolve();
    }

    ponerEmisorInfrarrojo () {
        return Promise.resolve();
    }

    emitirInfrarrojoPorTiempo () {
        return Promise.resolve();
    }

    emitirPulsosInfrarrojos () {
        return Promise.resolve();
    }

    emisorInfrarrojoActivo () {
        return Promise.resolve();
    }

    encenderBuzzer () {
        return Promise.resolve();
    }

    apagarBuzzer () {
        return Promise.resolve();
    }

    tocarTonoBuzzer () {
        return Promise.resolve();
    }

    tocarNotaBuzzer () {
        return Promise.resolve();
    }

    tocarTonoContinuoBuzzer () {
        return Promise.resolve();
    }

    tocarNotaContinuaBuzzer () {
        return Promise.resolve();
    }

    silencioBuzzer () {
        return Promise.resolve();
    }

    buzzerActivo () {
        return Promise.resolve();
    }

    frecuenciaBuzzer () {
        return Promise.resolve();
    }

    leerLuzRaw () {
        return Promise.resolve();
    }

    porcentajeLuz () {
        return Promise.resolve();
    }

    hayMuchaLuz () {
        return Promise.resolve();
    }

    hayPocaLuz () {
        return Promise.resolve();
    }

    luzCumple () {
        return Promise.resolve();
    }

    esperarHastaLuz () {
        return Promise.resolve();
    }

    mientrasLuz () {
        return Promise.resolve();
    }

    leerTemperaturaRaw () {
        return Promise.resolve();
    }

    temperaturaCelsius () {
        return Promise.resolve();
    }

    temperaturaKelvin () {
        return Promise.resolve();
    }

    haceCalor () {
        return Promise.resolve();
    }

    haceFrio () {
        return Promise.resolve();
    }

    temperaturaCumple () {
        return Promise.resolve();
    }

    esperarHastaTemperatura () {
        return Promise.resolve();
    }

    mientrasTemperatura () {
        return Promise.resolve();
    }

    calibrarMicrofono () {
        return Promise.resolve();
    }

    leerMicrofonoRaw () {
        return Promise.resolve();
    }

    nivelSonido () {
        return Promise.resolve();
    }

    microfonoCalibrado () {
        return Promise.resolve();
    }

    haySonidoFuerte () {
        return Promise.resolve();
    }

    hayPocoSonido () {
        return Promise.resolve();
    }

    sonidoCumple () {
        return Promise.resolve();
    }

    esperarHastaSonido () {
        return Promise.resolve();
    }

    mientrasSonido () {
        return Promise.resolve();
    }

    iniciarBluetooth () {
        return Promise.resolve();
    }

    cerrarBluetooth () {
        return Promise.resolve();
    }

    bluetoothIniciado () {
        return Promise.resolve();
    }

    hayDatosBluetooth () {
        return Promise.resolve();
    }

    bytesBluetoothDisponibles () {
        return Promise.resolve();
    }

    enviarTextoBluetooth () {
        return Promise.resolve();
    }

    enviarLineaBluetooth () {
        return Promise.resolve();
    }

    enviarNumeroBluetooth () {
        return Promise.resolve();
    }

    enviarByteBluetooth () {
        return Promise.resolve();
    }

    leerByteBluetooth () {
        return Promise.resolve();
    }

    leerTextoBluetooth () {
        return Promise.resolve();
    }

    leerLineaBluetooth () {
        return Promise.resolve();
    }

    limpiarBufferBluetooth () {
        return Promise.resolve();
    }

    esperarHastaDatoBluetooth () {
        return Promise.resolve();
    }

    mientrasHayaDatosBluetooth () {
        return Promise.resolve();
    }

    stbBoardV2_initBootScreen () {
        return Promise.resolve();
    }

    arduino_stbv2inicio_stbBoardV2_initBootScreen () {
        return Promise.resolve();
    }

    whenarduinobegin () {
        return Promise.resolve();
    }

    stbBoardV2_whenArduinoBegin () {
        return Promise.resolve();
    }

    arduino_stbv2inicio_stbBoardV2_whenArduinoBegin () {
        return Promise.resolve();
    }

    iniciarMatrizLed () {
        return Promise.resolve();
    }

    encenderMatrizLed () {
        return Promise.resolve();
    }

    apagarMatrizLed () {
        return Promise.resolve();
    }

    brilloMatrizLed () {
        return Promise.resolve();
    }

    limpiarMatrizLed () {
        return Promise.resolve();
    }

    llenarMatrizLed () {
        return Promise.resolve();
    }

    ponerPixelMatrizLed () {
        return Promise.resolve();
    }

    alternarPixelMatrizLed () {
        return Promise.resolve();
    }

    pixelMatrizLedEncendido () {
        return Promise.resolve();
    }

    dibujarFilaMatrizLed () {
        return Promise.resolve();
    }

    dibujarColumnaMatrizLed () {
        return Promise.resolve();
    }

    mostrarPatronMatrizLed () {
        return Promise.resolve();
    }

    desplazarMatrizLed () {
        return Promise.resolve();
    }

    mostrarCaracterMatrizLed () {
        return Promise.resolve();
    }

    mostrarLetraMatrizLed () {
        return Promise.resolve();
    }

    mostrarNumeroMatrizLed () {
        return Promise.resolve();
    }

    mostrarTextoMatrizLed () {
        return Promise.resolve();
    }

    iniciarPantallaOled () {
        return Promise.resolve();
    }

    limpiarPantallaOled () {
        return Promise.resolve();
    }

    actualizarPantallaOled () {
        return Promise.resolve();
    }

    establecerCursorOled () {
        return Promise.resolve();
    }

    configurarTextoOled () {
        return Promise.resolve();
    }

    imprimirOled () {
        return Promise.resolve();
    }

    mostrarTextoOled () {
        return Promise.resolve();
    }

    dibujarPixelOled () {
        return Promise.resolve();
    }

    dibujarLineaOled () {
        return Promise.resolve();
    }

    dibujarRectanguloOled () {
        return Promise.resolve();
    }

    rellenarRectanguloOled () {
        return Promise.resolve();
    }

    dibujarCirculoOled () {
        return Promise.resolve();
    }

    rellenarCirculoOled () {
        return Promise.resolve();
    }

    dibujarTrianguloOled () {
        return Promise.resolve();
    }

    rellenarTrianguloOled () {
        return Promise.resolve();
    }
}

module.exports = STBoardV2Device;
