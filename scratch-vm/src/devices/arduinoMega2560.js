const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');
const ProgramModeType = require('../extension-support/program-mode-type');
const ArduinoUnoDevice = require('./arduinoUno');
/* Serial/USB configuration will be added in FASE 6 */

const Pins = {
    D0: '0',
    D1: '1',
    D2: '2',
    D3: '3',
    D4: '4',
    D5: '5',
    D6: '6',
    D7: '7',
    D8: '8',
    D9: '9',
    D10: '10',
    D11: '11',
    D12: '12',
    D13: '13',
    D14: '14',
    D15: '15',
    D16: '16',
    D17: '17',
    D18: '18',
    D19: '19',
    D20: '20',
    D21: '21',
    D22: '22',
    D23: '23',
    D24: '24',
    D25: '25',
    D26: '26',
    D27: '27',
    D28: '28',
    D29: '29',
    D30: '30',
    D31: '31',
    D32: '32',
    D33: '33',
    D34: '34',
    D35: '35',
    D36: '36',
    D37: '37',
    D38: '38',
    D39: '39',
    D40: '40',
    D41: '41',
    D42: '42',
    D43: '43',
    D44: '44',
    D45: '45',
    D46: '46',
    D47: '47',
    D48: '48',
    D49: '49',
    D50: '50',
    D51: '51',
    D52: '52',
    D53: '53',
    A0: 'A0',
    A1: 'A1',
    A2: 'A2',
    A3: 'A3',
    A4: 'A4',
    A5: 'A5',
    A6: 'A6',
    A7: 'A7',
    A8: 'A8',
    A9: 'A9',
    A10: 'A10',
    A11: 'A11',
    A12: 'A12',
    A13: 'A13',
    A14: 'A14',
    A15: 'A15'
};


const Level = {
    High: 'HIGH',
    Low: 'LOW'
};

const Buadrate = {
    B4800: '4800',
    B9600: '9600',
    B19200: '19200',
    B38400: '38400',
    B57600: '57600',
    B76800: '76800',
    B115200: '115200'
};

const Eol = {
    Warp: 'warp',
    NoWarp: 'noWarp'
};

const SerialNo = {
    Serial0: '0',
    Serial1: '1',
    Serial2: '2',
    Serial3: '3'
};

const Mode = {
    Input: 'INPUT',
    Output: 'OUTPUT',
    InputPullup: 'INPUT_PULLUP'
};

const InterrupMode = {
    Rising: 'RISING',
    Falling: 'FALLING',
    Change: 'CHANGE',
    Low: 'LOW'
};

const DataType = {
    Integer: 'INTEGER',
    Decimal: 'DECIMAL',
    String: 'STRING'
};

/**
 * OpenBlock blocks to interact with a Arduino Mega2560 peripheral.
 */
class ArduinoMega2560Device extends ArduinoUnoDevice {
    get DEVICE_ID () {
        return 'arduinoMega2560';
    }

    get PINS_MENU () {
        return [
            {
                text: '0',
                value: Pins.D0
            },
            {
                text: '1',
                value: Pins.D1
            },
            {
                text: '2',
                value: Pins.D2
            },
            {
                text: '3',
                value: Pins.D3
            },
            {
                text: '4',
                value: Pins.D4
            },
            {
                text: '5',
                value: Pins.D5
            },
            {
                text: '6',
                value: Pins.D6
            },
            {
                text: '7',
                value: Pins.D7
            },
            {
                text: '8',
                value: Pins.D8
            },
            {
                text: '9',
                value: Pins.D9
            },
            {
                text: '10',
                value: Pins.D10
            },
            {
                text: '11',
                value: Pins.D11
            },
            {
                text: '12',
                value: Pins.D12
            },
            {
                text: '13',
                value: Pins.D13
            },
            {
                text: '14',
                value: Pins.D14
            },
            {
                text: '15',
                value: Pins.D15
            },
            {
                text: '16',
                value: Pins.D16
            },
            {
                text: '17',
                value: Pins.D17
            },
            {
                text: '18',
                value: Pins.D18
            },
            {
                text: '19',
                value: Pins.D19
            },
            {
                text: '20',
                value: Pins.D20
            },
            {
                text: '21',
                value: Pins.D21
            },
            {
                text: '22',
                value: Pins.D22
            },
            {
                text: '23',
                value: Pins.D23
            },
            {
                text: '24',
                value: Pins.D24
            },
            {
                text: '25',
                value: Pins.D25
            },
            {
                text: '26',
                value: Pins.D26
            },
            {
                text: '27',
                value: Pins.D27
            },
            {
                text: '28',
                value: Pins.D28
            },
            {
                text: '29',
                value: Pins.D29
            },
            {
                text: '30',
                value: Pins.D30
            },
            {
                text: '31',
                value: Pins.D31
            },
            {
                text: '32',
                value: Pins.D32
            },
            {
                text: '33',
                value: Pins.D33
            },
            {
                text: '34',
                value: Pins.D34
            },
            {
                text: '35',
                value: Pins.D35
            },
            {
                text: '36',
                value: Pins.D36
            },
            {
                text: '37',
                value: Pins.D37
            },
            {
                text: '38',
                value: Pins.D38
            },
            {
                text: '39',
                value: Pins.D39
            },
            {
                text: '40',
                value: Pins.D40
            },
            {
                text: '41',
                value: Pins.D41
            },
            {
                text: '42',
                value: Pins.D42
            },
            {
                text: '43',
                value: Pins.D43
            },
            {
                text: '44',
                value: Pins.D44
            },
            {
                text: '45',
                value: Pins.D45
            },
            {
                text: '46',
                value: Pins.D46
            },
            {
                text: '47',
                value: Pins.D47
            },
            {
                text: '48',
                value: Pins.D48
            },
            {
                text: '49',
                value: Pins.D49
            },
            {
                text: '50',
                value: Pins.D50
            },
            {
                text: '51',
                value: Pins.D51
            },
            {
                text: '52',
                value: Pins.D52
            },
            {
                text: '53',
                value: Pins.D53
            },
            {
                text: 'A0',
                value: Pins.A0
            },
            {
                text: 'A1',
                value: Pins.A1
            },
            {
                text: 'A2',
                value: Pins.A2
            },
            {
                text: 'A3',
                value: Pins.A3
            },
            {
                text: 'A4',
                value: Pins.A4
            },
            {
                text: 'A5',
                value: Pins.A5
            },
            {
                text: 'A6',
                value: Pins.A6
            },
            {
                text: 'A7',
                value: Pins.A7
            },
            {
                text: 'A8',
                value: Pins.A8
            },
            {
                text: 'A9',
                value: Pins.A9
            },
            {
                text: 'A10',
                value: Pins.A10
            },
            {
                text: 'A11',
                value: Pins.A11
            },
            {
                text: 'A12',
                value: Pins.A12
            },
            {
                text: 'A13',
                value: Pins.A13
            },
            {
                text: 'A14',
                value: Pins.A14
            },
            {
                text: 'A15',
                value: Pins.A15
            }
        ];
    }

    get MODE_MENU () {
        return [
            {
                text: 'input',
                value: Mode.Input
            },
            {
                text: 'output',
                value: Mode.Output
            },
            {
                text: 'input-pullup',
                value: Mode.InputPullup
            }
        ];
    }

    get ANALOG_PINS_MENU () {
        return [
            {
                text: 'A0',
                value: Pins.A0
            },
            {
                text: 'A1',
                value: Pins.A1
            },
            {
                text: 'A2',
                value: Pins.A2
            },
            {
                text: 'A3',
                value: Pins.A3
            },
            {
                text: 'A4',
                value: Pins.A4
            },
            {
                text: 'A5',
                value: Pins.A5
            },
            {
                text: 'A6',
                value: Pins.A6
            },
            {
                text: 'A7',
                value: Pins.A7
            },
            {
                text: 'A8',
                value: Pins.A8
            },
            {
                text: 'A9',
                value: Pins.A9
            },
            {
                text: 'A10',
                value: Pins.A10
            },
            {
                text: 'A11',
                value: Pins.A11
            },
            {
                text: 'A12',
                value: Pins.A12
            },
            {
                text: 'A13',
                value: Pins.A13
            },
            {
                text: 'A14',
                value: Pins.A14
            },
            {
                text: 'A15',
                value: Pins.A15
            }
        ];
    }

    get LEVEL_MENU () {
        return [
            {
                text: 'high',
                value: Level.High
            },
            {
                text: 'low',
                value: Level.Low
            }
        ];
    }

    get PWM_PINS_MENU () {
        return [
            {
                text: '2',
                value: Pins.D2
            },
            {
                text: '3',
                value: Pins.D3
            },
            {
                text: '4',
                value: Pins.D4
            },
            {
                text: '5',
                value: Pins.D5
            },
            {
                text: '6',
                value: Pins.D6
            },
            {
                text: '7',
                value: Pins.D7
            },
            {
                text: '8',
                value: Pins.D8
            },
            {
                text: '9',
                value: Pins.D9
            },
            {
                text: '10',
                value: Pins.D10
            },
            {
                text: '11',
                value: Pins.D11
            },
            {
                text: '12',
                value: Pins.D12
            },
            {
                text: '13',
                value: Pins.D13
            },
            {
                text: '44',
                value: Pins.D44
            },
            {
                text: '45',
                value: Pins.D45
            },
            {
                text: '46',
                value: Pins.D46
            }
        ];
    }

    get INTERRUPT_PINS_MENU () {
        return [
            {
                text: '2',
                value: Pins.D2
            },
            {
                text: '3',
                value: Pins.D3
            },
            {
                text: '18',
                value: Pins.D18
            },
            {
                text: '19',
                value: Pins.D19
            },
            {
                text: '20',
                value: Pins.D20
            },
            {
                text: '21',
                value: Pins.D21
            }
        ];
    }

    get INTERRUP_MODE_MENU () {
        return [
            {
                text: 'rising edge',
                value: InterrupMode.Rising
            },
            {
                text: 'falling edge',
                value: InterrupMode.Falling
            },
            {
                text: 'change edge',
                value: InterrupMode.Change
            },
            {
                text: 'low',
                value: InterrupMode.Low
            }
        ];
    }

    get BAUDTATE_MENU () {
        return [
            {
                text: '4800',
                value: Buadrate.B4800
            },
            {
                text: '9600',
                value: Buadrate.B9600
            },
            {
                text: '19200',
                value: Buadrate.B19200
            },
            {
                text: '38400',
                value: Buadrate.B38400
            },
            {
                text: '57600',
                value: Buadrate.B57600
            },
            {
                text: '76800',
                value: Buadrate.B76800
            },
            {
                text: '115200',
                value: Buadrate.B115200
            }
        ];
    }

    get SERIAL_NO_MENU () {
        return [
            {
                text: '0',
                value: SerialNo.Serial0
            },
            {
                text: '1',
                value: SerialNo.Serial1
            },
            {
                text: '2',
                value: SerialNo.Serial2
            },
            {
                text: '3',
                value: SerialNo.Serial3
            }
        ];
    }

    get EOL_MENU () {
        return [
            {
                text: 'warp',
                value: Eol.Warp
            },
            {
                text: 'no-warp',
                value: Eol.NoWarp
            }
        ];
    }

    get DATA_TYPE_MENU () {
        return [
            {
                text: 'integer',
                value: DataType.Integer
            },
            {
                text: 'decimal',
                value: DataType.Decimal
            },
            {
                text: 'string',
                value: DataType.String
            }
        ];
    }

    /**
     * Construct a set of Arduino blocks.
     * @param {Runtime} runtime - the OpenBlock runtime.
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, originalDeviceId) {
        super(runtime, originalDeviceId);
    }

    /**
     * @returns {Array.<object>} metadata for this extension and its blocks.
     */
    getInfo () {
        return [
            {
                id: 'pin',
                name: 'Pins',
                color1: '#4C97FF',
                color2: '#3373CC',
                color3: '#3373CC',

                blocks: [
                    {
                        opcode: 'setPinMode',
                        text: 'set pin [PIN] mode [MODE]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'pins',
                                defaultValue: Pins.D0
                            },
                            MODE: {
                                type: ArgumentType.STRING,
                                menu: 'mode',
                                defaultValue: Mode.Input
                            }
                        }
                    },
                    {
                        opcode: 'setDigitalOutput',
                        text: 'set digital pin [PIN] out [LEVEL]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'pins',
                                defaultValue: Pins.D0
                            },
                            LEVEL: {
                                type: ArgumentType.STRING,
                                menu: 'level',
                                defaultValue: Level.High
                            }
                        }
                    },
                    {

                        opcode: 'setPwmOutput',
                        text: 'set pwm pin [PIN] out [OUT]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'pwmPins',
                                defaultValue: Pins.D3
                            },
                            OUT: {
                                type: ArgumentType.UINT8_NUMBER,
                                defaultValue: '255'
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'readDigitalPin',
                        text: 'read digital pin [PIN]',
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'pins',
                                defaultValue: Pins.D0
                            }
                        }
                    },
                    {
                        opcode: 'readAnalogPin',
                        text: 'read analog pin [PIN]',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'analogPins',
                                defaultValue: Pins.A0
                            }
                        }
                    },
                    '---',
                    {

                        opcode: 'setServoOutput',
                        text: 'set servo pin [PIN] out [OUT]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'pwmPins',
                                defaultValue: Pins.D3
                            },
                            OUT: {
                                type: ArgumentType.HALF_ANGLE,
                                defaultValue: '90'
                            }
                        }
                    },
                    '---',
                    {

                        opcode: 'attachInterrupt',
                        text: 'attach interrupt pin [PIN] mode [MODE] executes',
                        blockType: BlockType.CONDITIONAL,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'interruptPins',
                                defaultValue: Pins.D3
                            },
                            MODE: {
                                type: ArgumentType.STRING,
                                menu: 'interruptMode',
                                defaultValue: InterrupMode.Rising
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {

                        opcode: 'detachInterrupt',
                        text: 'detach interrupt pin [PIN]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'interruptPins',
                                defaultValue: Pins.D3
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    }
                ],
                menus: {
                    pins: {
                        items: this.PINS_MENU
                    },
                    mode: {
                        items: this.MODE_MENU
                    },
                    analogPins: {
                        items: this.ANALOG_PINS_MENU
                    },
                    level: {
                        acceptReporters: true,
                        items: this.LEVEL_MENU
                    },
                    pwmPins: {
                        items: this.PWM_PINS_MENU
                    },
                    interruptPins: {
                        items: this.INTERRUPT_PINS_MENU
                    },
                    interruptMode: {
                        items: this.INTERRUP_MODE_MENU
                    }
                }
            },
            {
                id: 'serial',
                name: 'Serial',
                color1: '#9966FF',
                color2: '#774DCB',
                color3: '#774DCB',

                blocks: [
                    {
                        opcode: 'multiSerialBegin',
                        text: 'serial [NO] begin baudrate [VALUE]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            },
                            VALUE: {
                                type: ArgumentType.STRING,
                                menu: 'baudrate',
                                defaultValue: Buadrate.B9600
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialPrint',
                        text: 'serial [NO] print [VALUE] [EOL]',
                        blockType: BlockType.COMMAND,
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            },
                            VALUE: {
                                type: ArgumentType.STRING,
                                defaultValue: 'Hello OpenBlock'
                            },
                            EOL: {
                                type: ArgumentType.STRING,
                                menu: 'eol',
                                defaultValue: Eol.Warp
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialAvailable',
                        text: 'serial [NO] available data length',
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            }
                        },
                        blockType: BlockType.REPORTER,
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialReadAByte',
                        text: 'serial [NO] read a byte',
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            }
                        },
                        blockType: BlockType.REPORTER,
                        programMode: [ProgramModeType.UPLOAD]
                    }
                ],
                menus: {
                    baudrate: {
                        items: this.BAUDTATE_MENU
                    },
                    serialNo: {
                        items: this.SERIAL_NO_MENU
                    },
                    eol: {
                        items: this.EOL_MENU
                    }
                }
            },
            {
                id: 'data',
                name: 'Data',
                color1: '#CF63CF',
                color2: '#C94FC9',
                color3: '#BD42BD',
                blocks: [
                    {
                        opcode: 'dataMap',
                        text: 'map [DATA] from ([ARG0], [ARG1]) to ([ARG2], [ARG3])',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '50'
                            },
                            ARG0: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG1: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '100'
                            },
                            ARG2: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG3: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1000'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConstrain',
                        text: 'constrain [DATA] between ([ARG0], [ARG1])',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '50'
                            },
                            ARG0: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG1: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '100'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    '---',
                    {
                        opcode: 'dataConvert',
                        text: 'convert [DATA] to [TYPE]',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.STRING,
                                defaultValue: '123'
                            },
                            TYPE: {
                                type: ArgumentType.STRING,
                                menu: 'dataType',
                                defaultValue: DataType.Integer
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConvertASCIICharacter',
                        text: 'convert [DATA] to ASCII character',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '97'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConvertASCIINumber',
                        text: 'convert [DATA] to ASCII nubmer',
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.STRING,
                                defaultValue: 'a'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    }
                ],
                menus: {
                    dataType: {
                        items: this.DATA_TYPE_MENU
                    }
                }
            }
        ];
    }

    /**
     * Set pin mode.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after the set pin mode is done.
     */
    setPinMode () { return Promise.resolve(); }
    setDigitalOutput () { return Promise.resolve(); }
    setPwmOutput () { return Promise.resolve(); }
    readDigitalPin () { return Promise.resolve(0); }
    readAnalogPin () { return Promise.resolve(0); }
    setServoOutput () { return Promise.resolve(); }
}

module.exports = ArduinoMega2560Device;
