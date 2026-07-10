/**
 * STBoard Extension
 *
 * Dispositivo personalizado basado en Arduino Uno para el ecosistema STB.
 * Hereda todos los bloques estándar de Arduino Uno y agrega categorías
 * exclusivas de la placa STBoard Extension.
 */
const ArduinoUnoDevice = require('./arduinoUno');

const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');
const dispatch = require('../dispatch/central-dispatch');

/* Serial/USB configuration will be added in FASE 6 */

/**
 * OpenBlock blocks to interact with a STBoard Extension peripheral.
 * Extends Arduino Uno and adds STB-specific block categories.
 */
class STBoardExtensionDevice extends ArduinoUnoDevice {
    get STB_HIDE_DC_BLOCKS () {
        return false;
    }

    get STB_HIDE_SERVO_BLOCKS () {
        return false;
    }

    get STB_MOTOR_TYPE_MENU () {
        return [
            {
                text: 'motor DC',
                value: 'DC'
            },
            {
                text: 'servo 360',
                value: 'SERVO_360'
            }
        ];
    }

    get STB_DISTANCE_UNIT_MENU () {
        return [
            {
                text: 'cm',
                value: 'CM'
            },
            {
                text: 'rotaciones',
                value: 'ROTATIONS'
            },
            {
                text: 'grados',
                value: 'DEGREES'
            }
        ];
    }

    get STB_TURN_UNIT_MENU () {
        return [
            {
                text: 'grados',
                value: 'DEGREES'
            },
            {
                text: 'rotaciones',
                value: 'ROTATIONS'
            }
        ];
    }

    get STB_TRIGGER_PIN_MENU () {
        return [
            {
                text: 'A0',
                value: '0'
            },
            {
                text: 'A1',
                value: '1'
            }
        ];
    }

    get STB_TRIGGER_CONDITION_MENU () {
        return [
            {
                text: '>',
                value: 'GT'
            },
            {
                text: '<',
                value: 'LT'
            }
        ];
    }

    get STB_TIME_UNIT_MENU () {
        return [
            {
                text: 'segundos',
                value: 'SECONDS'
            },
            {
                text: 'milisegundos',
                value: 'MILLISECONDS'
            }
        ];
    }

    get STB_DIRECTION_MENU () {
        return [
            {
                text: 'Normal',
                value: 'NORMAL'
            },
            {
                text: 'Invertida',
                value: 'INVERTED'
            }
        ];
    }

    get STB_TURN_SIDE_MENU () {
        return [
            {
                text: 'Derecha',
                value: 'RIGHT'
            },
            {
                text: 'Izquierda',
                value: 'LEFT'
            }
        ];
    }

    get STB_MOTOR_MENU () {
        return [
            {
                text: 'A1',
                value: 'A1'
            },
            {
                text: 'A2',
                value: 'A2'
            },
            {
                text: 'Ambos',
                value: 'BOTH'
            }
        ];
    }

    /**
     * @return {string} - the ID of this device.
     */
    get DEVICE_ID () {
        return 'stBoardExtension';
    }

    /**
     * Construct a set of STBoard Extension blocks.
     * @param {Runtime} runtime - the OpenBlock runtime.
     * @param {string} originalDeviceId - the original id of the peripheral
     */
    constructor (runtime, originalDeviceId) {
        super(runtime, originalDeviceId);
        this._motorType = 'DC';
    }

    /**
     * @returns {Array.<object>} metadata for this device and its blocks.
     * Returns all standard Arduino Uno categories PLUS STBoard-specific ones.
     */
    getInfo () {
        const unoCategories = super.getInfo();

        const stbCategories = [
            {
                // ─── Categoría: Motores ───────────────────────────────────
                id: 'motores',
                name: 'Motores',
                color1: '#1f7a4b',
                color2: '#114f32',
                color3: '#114f32',
                // La runtime suprime categorías con blocks[] vacío.
                // Este bloque placeholder mantiene la categoría visible.
                // Reemplazar con bloques reales cuando estén definidos.
                blocks: [
                    {
                        opcode: 'seleccionarTipoMotores',
                        blockType: BlockType.COMMAND,
                        text: 'usar motores [MOTOR_TYPE]',
                        arguments: {
                            MOTOR_TYPE: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_TYPE_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'configurarMotores',
                        blockType: BlockType.COMMAND,
                        text: 'configurar motores tamaño de rueda [WHEEL_DIAMETER] cm rpm max [MAX_RPM] ancho entre ruedas [TRACK_WIDTH] cm',
                        arguments: {
                            WHEEL_DIAMETER: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '6.5'
                            },
                            MAX_RPM: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '120'
                            },
                            TRACK_WIDTH: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '14'
                            }
                        }
                    },
                    {
                        opcode: 'calibrarServos360',
                        blockType: BlockType.COMMAND,
                        text: 'calibrar servos 360 neutro A1 [STOP_A1_US] us neutro A2 [STOP_A2_US] us minimo [MIN_US] us maximo [MAX_US] us correccion distancia [DISTANCE_CORRECTION] giro [TURN_CORRECTION]',
                        hideFromPalette: this.STB_HIDE_SERVO_BLOCKS,
                        arguments: {
                            STOP_A1_US: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1500'
                            },
                            STOP_A2_US: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1500'
                            },
                            MIN_US: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1000'
                            },
                            MAX_US: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '2000'
                            },
                            DISTANCE_CORRECTION: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            TURN_CORRECTION: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'probarPulsoServo360',
                        blockType: BlockType.COMMAND,
                        text: 'probar servo 360 [MOTOR] con pulso [PULSE_US] us',
                        hideFromPalette: this.STB_HIDE_SERVO_BLOCKS,
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            PULSE_US: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1472'
                            }
                        }
                    },
                    {
                        opcode: 'definirDireccionMotorA1',
                        blockType: BlockType.COMMAND,
                        text: 'definir direccion motor A1 [DIRECTION]',
                        arguments: {
                            DIRECTION: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DIRECTION_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'definirDireccionMotorA2',
                        blockType: BlockType.COMMAND,
                        text: 'definir direccion motor A2 [DIRECTION]',
                        arguments: {
                            DIRECTION: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DIRECTION_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'definirVelocidadMotor',
                        blockType: BlockType.COMMAND,
                        text: 'definir velocidad motor [MOTOR] al [SPEED] %',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            SPEED: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '100'
                            }
                        }
                    },
                    {
                        opcode: 'avanzarMotor',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'retrocederMotor',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorTiempo',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [TIME_UNIT] a velocidad [SPEED] %',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '2'
                            },
                            TIME_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TIME_UNIT_MENU'
                            },
                            SPEED: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '80'
                            }
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [DISTANCE_UNIT] a velocidad [SPEED] %',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '10'
                            },
                            DISTANCE_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DISTANCE_UNIT_MENU'
                            },
                            SPEED: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '80'
                            }
                        }
                    },
                    {
                        opcode: 'avanzarMotorPorDistanciaGuardada',
                        blockType: BlockType.COMMAND,
                        text: 'avanzar motor [MOTOR] por [VALUE] [DISTANCE_UNIT]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '10'
                            },
                            DISTANCE_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DISTANCE_UNIT_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorDistancia',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [DISTANCE_UNIT] a velocidad [SPEED] %',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '10'
                            },
                            DISTANCE_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DISTANCE_UNIT_MENU'
                            },
                            SPEED: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '80'
                            }
                        }
                    },
                    {
                        opcode: 'retrocederMotorPorDistanciaGuardada',
                        blockType: BlockType.COMMAND,
                        text: 'retroceder motor [MOTOR] por [VALUE] [DISTANCE_UNIT]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '10'
                            },
                            DISTANCE_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_DISTANCE_UNIT_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'girarMotor',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE]',
                        arguments: {
                            SIDE: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_SIDE_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'girarMotorPorValor',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE] por [VALUE] [TURN_UNIT] a velocidad [SPEED] %',
                        arguments: {
                            SIDE: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_SIDE_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '90'
                            },
                            TURN_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_UNIT_MENU'
                            },
                            SPEED: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '80'
                            }
                        }
                    },
                    {
                        opcode: 'girarMotorPorValorGuardado',
                        blockType: BlockType.COMMAND,
                        text: 'girar a la [SIDE] por [VALUE] [TURN_UNIT]',
                        arguments: {
                            SIDE: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_SIDE_MENU'
                            },
                            VALUE: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '90'
                            },
                            TURN_UNIT: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_UNIT_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'detenerMotor',
                        blockType: BlockType.COMMAND,
                        text: 'detener motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'avanzarHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'avanzar motor [MOTOR] hasta que [CONDITION]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            CONDITION: {
                                type: ArgumentType.BOOLEAN
                            }
                        }
                    },
                    {
                        opcode: 'retrocederHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'retroceder motor [MOTOR] hasta que [CONDITION]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            CONDITION: {
                                type: ArgumentType.BOOLEAN
                            }
                        }
                    },
                    {
                        opcode: 'girarHastaQue',
                        blockType: BlockType.LOOP,
                        branchCount: 1,
                        text: 'girar a la [SIDE] hasta que [CONDITION]',
                        arguments: {
                            SIDE: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TURN_SIDE_MENU'
                            },
                            CONDITION: {
                                type: ArgumentType.BOOLEAN
                            }
                        }
                    },
                    {
                        opcode: 'detenerSi',
                        blockType: BlockType.CONDITIONAL,
                        branchCount: 1,
                        text: 'si [CONDITION] entonces detener motor [MOTOR] y',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            },
                            CONDITION: {
                                type: ArgumentType.BOOLEAN
                            }
                        }
                    },
                    {
                        opcode: 'configurarTrigger',
                        blockType: BlockType.COMMAND,
                        text: 'configurar trigger [PIN] cuando sea [CONDITION] [THRESHOLD] detener [TARGET_MOTORS]',
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TRIGGER_PIN_MENU'
                            },
                            CONDITION: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TRIGGER_CONDITION_MENU'
                            },
                            THRESHOLD: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '500'
                            },
                            TARGET_MOTORS: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'desactivarTrigger',
                        blockType: BlockType.COMMAND,
                        text: 'desactivar trigger [PIN]',
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TRIGGER_PIN_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'desactivarTodosLosTriggers',
                        blockType: BlockType.COMMAND,
                        text: 'desactivar todos los triggers'
                    },
                    {
                        opcode: 'velocidadActualMotor',
                        blockType: BlockType.REPORTER,
                        text: 'velocidad actual de motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'velocidadAplicadaMotor',
                        blockType: BlockType.REPORTER,
                        text: 'velocidad aplicada motor [MOTOR] %',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'tipoMotoresSeleccionado',
                        blockType: BlockType.REPORTER,
                        text: 'tipo de motores seleccionado'
                    },
                    {
                        opcode: 'motoresConfigurados',
                        blockType: BlockType.BOOLEAN,
                        text: 'motores configurados?'
                    },
                    {
                        opcode: 'velocidadGuardadaMotor',
                        blockType: BlockType.REPORTER,
                        text: 'velocidad guardada de motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'motorEnMovimiento',
                        blockType: BlockType.BOOLEAN,
                        text: 'motor [MOTOR] esta en movimiento?',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'encoderMotor',
                        blockType: BlockType.REPORTER,
                        text: 'encoder de motor [MOTOR]',
                        hideFromPalette: this.STB_HIDE_DC_BLOCKS,
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'distanciaRecorridaMotor',
                        blockType: BlockType.REPORTER,
                        text: 'distancia recorrida motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'reiniciarDistanciaMotor',
                        blockType: BlockType.COMMAND,
                        text: 'reiniciar distancia de motor [MOTOR]',
                        arguments: {
                            MOTOR: {
                                type: ArgumentType.STRING,
                                menu: 'STB_MOTOR_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'leerTrigger',
                        blockType: BlockType.REPORTER,
                        text: 'leer valor de trigger [PIN]',
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'STB_TRIGGER_PIN_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'diametroRuedaConfigurado',
                        blockType: BlockType.REPORTER,
                        text: 'diametro de rueda configurado'
                    },
                    {
                        opcode: 'rpmMaxConfigurado',
                        blockType: BlockType.REPORTER,
                        text: 'RPM maximo configurado'
                    },
                    {
                        opcode: 'anchoEntreRuedasConfigurado',
                        blockType: BlockType.REPORTER,
                        text: 'ancho entre ruedas configurado'
                    }
                ],
                menus: {
                    STB_MOTOR_TYPE_MENU: this.STB_MOTOR_TYPE_MENU,
                    STB_DISTANCE_UNIT_MENU: this.STB_DISTANCE_UNIT_MENU,
                    STB_TIME_UNIT_MENU: this.STB_TIME_UNIT_MENU,
                    STB_DIRECTION_MENU: this.STB_DIRECTION_MENU,
                    STB_MOTOR_MENU: this.STB_MOTOR_MENU,
                    STB_TURN_SIDE_MENU: this.STB_TURN_SIDE_MENU,
                    STB_TURN_UNIT_MENU: this.STB_TURN_UNIT_MENU,
                    STB_TRIGGER_PIN_MENU: this.STB_TRIGGER_PIN_MENU,
                    STB_TRIGGER_CONDITION_MENU: this.STB_TRIGGER_CONDITION_MENU
                }
            }
        ];

        return [...unoCategories, ...stbCategories];
    }

    // Los bloques de C++ son procesados en el lado del generador (openblock-blocks)
    seleccionarTipoMotores (args) {
        this._motorType = args.MOTOR_TYPE === 'SERVO_360' ? 'SERVO_360' : 'DC';
        return dispatch.call('extensions', 'refreshBlocks').catch(() => Promise.resolve());
    }

    configurarMotores () {
        return Promise.resolve();
    }

    calibrarServos360 () {
        return Promise.resolve();
    }

    probarPulsoServo360 () {
        return Promise.resolve();
    }

    definirDireccionMotorA1 () {
        return Promise.resolve();
    }

    definirDireccionMotorA2 () {
        return Promise.resolve();
    }

    definirVelocidadMotor () {
        return Promise.resolve();
    }

    avanzarMotor () {
        return Promise.resolve();
    }

    retrocederMotor () {
        return Promise.resolve();
    }

    avanzarMotorPorTiempo () {
        return Promise.resolve();
    }

    avanzarMotorPorDistancia () {
        return Promise.resolve();
    }

    avanzarMotorPorDistanciaGuardada () {
        return Promise.resolve();
    }

    retrocederMotorPorDistancia () {
        return Promise.resolve();
    }

    retrocederMotorPorDistanciaGuardada () {
        return Promise.resolve();
    }

    girarMotor () {
        return Promise.resolve();
    }

    girarMotorPorValor () {
        return Promise.resolve();
    }

    girarMotorPorValorGuardado () {
        return Promise.resolve();
    }

    detenerMotor () {
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

    configurarTrigger () {
        return Promise.resolve();
    }

    desactivarTrigger () {
        return Promise.resolve();
    }

    desactivarTodosLosTriggers () {
        return Promise.resolve();
    }

    velocidadActualMotor () {
        return Promise.resolve(0);
    }

    velocidadAplicadaMotor () {
        return Promise.resolve(0);
    }

    tipoMotoresSeleccionado () {
        return Promise.resolve(this._motorType);
    }

    motoresConfigurados () {
        return Promise.resolve(false);
    }

    velocidadGuardadaMotor () {
        return Promise.resolve(0);
    }

    motorEnMovimiento () {
        return Promise.resolve(false);
    }

    encoderMotor () {
        return Promise.resolve(0);
    }

    distanciaRecorridaMotor () {
        return Promise.resolve(0);
    }

    reiniciarDistanciaMotor () {
        return Promise.resolve();
    }

    leerTrigger () {
        return Promise.resolve(0);
    }

    diametroRuedaConfigurado () {
        return Promise.resolve(6.5);
    }

    rpmMaxConfigurado () {
        return Promise.resolve(120);
    }

    anchoEntreRuedasConfigurado () {
        return Promise.resolve(14);
    }
}

module.exports = STBoardExtensionDevice;
