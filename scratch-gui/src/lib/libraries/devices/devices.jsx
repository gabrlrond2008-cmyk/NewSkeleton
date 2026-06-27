import unselectDeviceIconURL from './unselectDevice/unselectDevice.png';
import arduinoUnoIconURL from './arduinoUno/arduinoUno.png';
import arduinoNanoIconURL from './arduinoNano/arduinoNano.png';
import arduinoLeonardoIconURL from './arduinoLeonardo/arduinoLeonardo.png';
import arduinoMega2560IconURL from './arduinoMega2560/arduinoMega2560.png';
import arduinoUnoR4MinimaIconURL from './arduinoUnoR4Minima/arduinoUnoR4Minima.png';
import arduinoUnoR4WifiIconURL from './arduinoUnoR4Wifi/arduinoUnoR4Wifi.png';
import microbitIconURL from './microbit/microbit.png';
import microbitV2IconURL from './microbitV2/microbitV2.png';
import esp32IconURL from './esp32/esp32.png';
import esp32S3IconURL from './esp32S3/esp32S3.png';
import esp8266NodeMCUIconURL from './esp8266NodeMCU/esp8266NodeMCU.png';
import k210MaixDockIconURL from './k210MaixDock/k210MaixDock.png';
import k210MaixduinoIconURL from './k210Maixduino/k210Maixduino.png';
import raspberryPiPicoIconURL from './raspberryPiPico/raspberryPiPico.png';
import raspberryPiPicoWIconURL from './raspberryPiPicoW/raspberryPiPicoW.png';
import raspberryPiPico2IconURL from './raspberryPiPico2/raspberryPiPico2.png';
import raspberryPiPico2WIconURL from './raspberryPiPico2W/raspberryPiPico2W.png';
import stBoardExtensionIconURL from './stBoardExtension/stboard-extension.jpg';
import stbBoardV2IconURL from './stbBoardV2/stbboard-v2.png';

const DEVICE_TYPES = {
    arduino: 'arduino',
    microbit: 'microbit',
    microPython: 'microPython'
};

const deviceData = [
    {
        name: 'Unselect device',
        deviceId: 'null',
        iconURL: unselectDeviceIconURL,
        description: 'Return to pure Scratch mode.',
        type: null,
        featured: true
    },
    {
        name: 'Arduino Uno',
        deviceId: 'arduinoUno',
        manufactor: 'arduino.cc',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoUnoIconURL,
        description: 'A great board to get started with electronics and coding.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['realtime', 'upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'STBoard Extension',
        deviceId: 'stBoardExtension',
        manufactor: 'STB',
        type: DEVICE_TYPES.arduino,
        iconURL: stBoardExtensionIconURL,
        description: 'STBoard extension based on Arduino Uno.',
        featured: false,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['realtime', 'upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Arduino Nano',
        deviceId: 'arduinoNano',
        manufactor: 'arduino.cc',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoNanoIconURL,
        description: 'Classic small board for your projects.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['realtime', 'upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Arduino Leonardo',
        deviceId: 'arduinoLeonardo',
        manufactor: 'arduino.cc',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoLeonardoIconURL,
        description: 'Can act as a mouse or keyboard.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Arduino Mega 2560',
        deviceId: 'arduinoMega2560',
        manufactor: 'arduino.cc',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoMega2560IconURL,
        description: '54 digital pins, 16 analog inputs, 4 serial ports.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['realtime', 'upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'STBoard V2',
        deviceId: 'stbBoardV2',
        manufactor: 'STB',
        type: DEVICE_TYPES.arduino,
        iconURL: stbBoardV2IconURL,
        description: 'STBoard V2 based on Arduino Mega 2560.',
        featured: false,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['realtime', 'upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Arduino Uno R4 Minima',
        deviceId: 'arduinoUnoR4Minima',
        manufactor: 'arduino',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoUnoR4MinimaIconURL,
        description: 'Enhanced performance, expanded memory.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Arduino Uno R4 WiFi',
        deviceId: 'arduinoUnoR4Wifi',
        manufactor: 'arduino',
        type: DEVICE_TYPES.arduino,
        iconURL: arduinoUnoR4WifiIconURL,
        description: 'Wi-Fi, Bluetooth, onboard 12x8 LED matrix.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'ESP32',
        deviceId: 'arduinoEsp32',
        manufactor: 'espressif',
        type: DEVICE_TYPES.arduino,
        iconURL: esp32IconURL,
        description: 'Wi-Fi & Bluetooth control board.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'ESP32-S3',
        deviceId: 'arduinoEsp32S3',
        manufactor: 'espressif',
        type: DEVICE_TYPES.arduino,
        iconURL: esp32S3IconURL,
        description: 'AI accelerator, rich peripherals, low-power IoT.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'NodeMCU',
        deviceId: 'arduinoEsp8266NodeMCU',
        manufactor: 'espressif',
        type: DEVICE_TYPES.arduino,
        iconURL: esp8266NodeMCUIconURL,
        description: 'Low-cost Wi-Fi SoC control board.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '76800',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'MaixDock',
        deviceId: 'arduinoK210MaixDock',
        manufactor: 'sipeed',
        type: DEVICE_TYPES.arduino,
        iconURL: k210MaixDockIconURL,
        description: 'K210 RISC-V chip basic board.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Maixduino',
        deviceId: 'arduinoK210Maixduino',
        manufactor: 'sipeed',
        type: DEVICE_TYPES.arduino,
        iconURL: k210MaixduinoIconURL,
        description: 'K210 RISC-V board with ESP32 inside.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Raspberry Pi Pico',
        deviceId: 'arduinoRaspberryPiPico',
        manufactor: 'Raspberry Pi Foundation',
        type: DEVICE_TYPES.arduino,
        iconURL: raspberryPiPicoIconURL,
        description: 'Friendly, easy-to-use microcontroller board.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Raspberry Pi Pico W',
        deviceId: 'arduinoRaspberryPiPicoW',
        manufactor: 'Raspberry Pi Foundation',
        type: DEVICE_TYPES.arduino,
        iconURL: raspberryPiPicoWIconURL,
        description: 'Pico with built-in Wi-Fi & Bluetooth 5.2.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Raspberry Pi Pico 2',
        deviceId: 'arduinoRaspberryPiPico2',
        manufactor: 'Raspberry Pi Foundation',
        type: DEVICE_TYPES.arduino,
        iconURL: raspberryPiPico2IconURL,
        description: 'High-performance dual-core MCU.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Raspberry Pi Pico 2 W',
        deviceId: 'arduinoRaspberryPiPico2W',
        manufactor: 'Raspberry Pi Foundation',
        type: DEVICE_TYPES.arduino,
        iconURL: raspberryPiPico2WIconURL,
        description: 'Built-in Wi-Fi & Bluetooth for IoT.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['arduino']
    },
    {
        name: 'Micro:bit',
        deviceId: 'microbit',
        manufactor: 'microbit.org',
        type: DEVICE_TYPES.microbit,
        iconURL: microbitIconURL,
        description: 'The pocket-sized computer transforming digital skills.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['microPython']
    },
    {
        name: 'Micro:bit V2',
        deviceId: 'microbitV2',
        manufactor: 'microbit.org',
        type: DEVICE_TYPES.microbit,
        iconURL: microbitV2IconURL,
        description: 'Upgraded processor, speaker, microphone, touch logo.',
        featured: true,
        serialportRequired: true,
        defaultBaudRate: '115200',
        programMode: ['upload'],
        defaultProgramMode: 'upload',
        tags: ['microPython']
    }
];

export {
    deviceData as default,
    DEVICE_TYPES
};
