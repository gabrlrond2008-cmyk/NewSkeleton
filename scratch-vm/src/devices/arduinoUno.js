const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');

const Pins = {D0:'0',D1:'1',D2:'2',D3:'3',D4:'4',D5:'5',D6:'6',D7:'7',
    D8:'8',D9:'9',D10:'10',D11:'11',D12:'12',D13:'13',
    A0:'A0',A1:'A1',A2:'A2',A3:'A3',A4:'A4',A5:'A5'};
const Level = {High:'HIGH',Low:'LOW'};
const Baudrate = {B4800:'4800',B9600:'9600',B19200:'19200',
    B38400:'38400',B57600:'57600',B76800:'76800',B115200:'115200'};
const Mode = {Input:'INPUT',Output:'OUTPUT',InputPullup:'INPUT_PULLUP'};

class ArduinoUnoDevice {
    get DEVICE_ID () { return 'arduinoUno'; }

    get PINS_MENU () {
        return Object.keys(Pins).map(k => ({text: k.replace('D',''), value: Pins[k]}));
    }
    get MODE_MENU () {
        return [
            {text: 'input', value: Mode.Input},
            {text: 'output', value: Mode.Output},
            {text: 'input-pullup', value: Mode.InputPullup}
        ];
    }
    get ANALOG_PINS_MENU () {
        return Object.keys(Pins).filter(k => k.startsWith('A')).map(k => ({text: k, value: Pins[k]}));
    }
    get LEVEL_MENU () {
        return [
            {text: 'high', value: Level.High},
            {text: 'low', value: Level.Low}
        ];
    }
    get PWM_PINS_MENU () {
        return ['3','5','6','9','10','11'].map(p => ({text: p, value: p}));
    }
    get BAUDRATE_MENU () {
        return Object.keys(Baudrate).map(k => ({text: k.replace('B',''), value: Baudrate[k]}));
    }

    constructor (runtime, originalDeviceId) {
        this.runtime = runtime;
        this.originalDeviceId = originalDeviceId;
    }

    getInfo () {
        return [
            {
                id: 'pines',
                name: 'Pins',
                color1: '#4C97FF',
                color2: '#4280D7',
                color3: '#3373CC',
                blocks: [
                    {
                        opcode: 'setPinMode',
                        blockType: BlockType.COMMAND,
                        text: 'set pin [PIN] mode [MODE]',
                        arguments: {
                            PIN: {type: ArgumentType.STRING, menu: 'PINS_MENU'},
                            MODE: {type: ArgumentType.STRING, menu: 'MODE_MENU'}
                        }
                    },
                    {
                        opcode: 'digitalWrite',
                        blockType: BlockType.COMMAND,
                        text: 'digital write pin [PIN] [LEVEL]',
                        arguments: {
                            PIN: {type: ArgumentType.STRING, menu: 'PINS_MENU'},
                            LEVEL: {type: ArgumentType.STRING, menu: 'LEVEL_MENU'}
                        }
                    },
                    {
                        opcode: 'digitalRead',
                        blockType: BlockType.REPORTER,
                        text: 'digital read pin [PIN]',
                        arguments: {
                            PIN: {type: ArgumentType.STRING, menu: 'PINS_MENU'}
                        }
                    },
                    {
                        opcode: 'analogWrite',
                        blockType: BlockType.COMMAND,
                        text: 'PWM pin [PIN] value [VALUE]',
                        arguments: {
                            PIN: {type: ArgumentType.STRING, menu: 'PWM_PINS_MENU'},
                            VALUE: {type: ArgumentType.NUMBER, defaultValue: '0'}
                        }
                    },
                    {
                        opcode: 'analogRead',
                        blockType: BlockType.REPORTER,
                        text: 'analog read pin [PIN]',
                        arguments: {
                            PIN: {type: ArgumentType.STRING, menu: 'ANALOG_PINS_MENU'}
                        }
                    }
                ],
                menus: {
                    PINS_MENU: this.PINS_MENU,
                    MODE_MENU: this.MODE_MENU,
                    LEVEL_MENU: this.LEVEL_MENU,
                    ANALOG_PINS_MENU: this.ANALOG_PINS_MENU,
                    PWM_PINS_MENU: this.PWM_PINS_MENU
                }
            },
            {
                id: 'serial',
                name: 'Serial',
                color1: '#CF63CF',
                color2: '#C94CC9',
                color3: '#BD42BD',
                blocks: [
                    {
                        opcode: 'beginSerial',
                        blockType: BlockType.COMMAND,
                        text: 'Serial begin [BAUDRATE]',
                        arguments: {
                            BAUDRATE: {type: ArgumentType.STRING, menu: 'BAUDRATE_MENU'}
                        }
                    },
                    {
                        opcode: 'serialPrint',
                        blockType: BlockType.COMMAND,
                        text: 'Serial print [DATA]',
                        arguments: {
                            DATA: {type: ArgumentType.STRING, defaultValue: 'hello'}
                        }
                    },
                    {
                        opcode: 'serialPrintln',
                        blockType: BlockType.COMMAND,
                        text: 'Serial println [DATA]',
                        arguments: {
                            DATA: {type: ArgumentType.STRING, defaultValue: 'hello'}
                        }
                    },
                    {
                        opcode: 'serialAvailable',
                        blockType: BlockType.REPORTER,
                        text: 'Serial available'
                    },
                    {
                        opcode: 'serialRead',
                        blockType: BlockType.REPORTER,
                        text: 'Serial read'
                    }
                ],
                menus: {
                    BAUDRATE_MENU: this.BAUDRATE_MENU
                }
            },
            {
                id: 'control',
                name: 'Control',
                color1: '#FFAB19',
                color2: '#EC9CB3',
                color3: '#CF8B17',
                blocks: [
                    {
                        opcode: 'delay',
                        blockType: BlockType.COMMAND,
                        text: 'delay [MS] ms',
                        arguments: {
                            MS: {type: ArgumentType.NUMBER, defaultValue: '1000'}
                        }
                    },
                    {
                        opcode: 'delayMicroseconds',
                        blockType: BlockType.COMMAND,
                        text: 'delay [US] us',
                        arguments: {
                            US: {type: ArgumentType.NUMBER, defaultValue: '1000'}
                        }
                    },
                    {
                        opcode: 'millis',
                        blockType: BlockType.REPORTER,
                        text: 'millis'
                    }
                ]
            }
        ];
    }

    // Block implementations (stubs - real work is in code generators)
    setPinMode () { return Promise.resolve(); }
    digitalWrite () { return Promise.resolve(); }
    digitalRead () { return Promise.resolve(0); }
    analogWrite () { return Promise.resolve(); }
    analogRead () { return Promise.resolve(0); }
    beginSerial () { return Promise.resolve(); }
    serialPrint () { return Promise.resolve(); }
    serialPrintln () { return Promise.resolve(); }
    serialAvailable () { return Promise.resolve(0); }
    serialRead () { return Promise.resolve(0); }
    delay () { return Promise.resolve(); }
    delayMicroseconds () { return Promise.resolve(); }
    millis () { return Promise.resolve(0); }
}

module.exports = ArduinoUnoDevice;
